/** Management class and utils for Security S2 */
import { Bytes, createWrappingCounter, getEnumMemberName, } from "@zwave-js/shared";
import { computeNoncePRK, deriveMEI, deriveNetworkKeys, encryptAES128ECB, randomBytes, } from "../crypto/index.js";
import { increment } from "../crypto/shared.js";
import { SecurityClass, } from "../definitions/SecurityClass.js";
import { MAX_NODES_LR } from "../definitions/consts.js";
import { ZWaveError, ZWaveErrorCodes } from "../error/ZWaveError.js";
import { deflateSync } from "../util/compression.js";
import { highResTimestamp } from "../util/date.js";
import { encodeBitMask } from "../values/Primitive.js";
import { MPANState, SPANState, } from "./Manager2Types.js";
import { CtrDRBG } from "./ctr_drbg.js";
// How many sequence numbers are remembered for each node when checking for duplicates
const SINGLECAST_MAX_SEQ_NUMS = 1; // more than 1 will confuse the certification test tool :(
// How long a singlecast nonce used for encryption will be kept around to attempt decryption of in-flight messages
const SINGLECAST_NONCE_EXPIRY_NS = 500 * 1000 * 1000; // 500 ms in nanoseconds
export class SecurityManager2 {
    constructor() {
        // Consumers must use the async factory method
    }
    static async create() {
        const ret = new SecurityManager2();
        await ret.rng.init(randomBytes(32));
        return ret;
    }
    /** PRNG used to initialize the others */
    rng = new CtrDRBG();
    /** A map of SPAN states for each node */
    spanTable = new Map();
    /** A map of temporary keys for each node that are used for the key exchange */
    tempKeys = new Map();
    /** A map of sequence numbers that were last used in communication with a node */
    ownSequenceNumbers = new Map();
    peerSequenceNumbers = new Map();
    /** A map of the inner MPAN states for each multicast group we manage */
    mpanStates = new Map();
    /** MPANs used to decrypt multicast messages from other nodes. Peer Node ID -> Multicast Group -> MPAN */
    peerMPANs = new Map();
    /** A map of permanent network keys per security class */
    networkKeys = new Map();
    /** A map of the defined multicast groups */
    multicastGroups = new Map();
    /** Reverse lookup from node IDs (as stringified bitmask) to multicast group ID */
    multicastGroupLookup = new Map();
    getNextMulticastGroupId = createWrappingCounter(255);
    /** Sets the PNK for a given security class and derives the encryption keys from it */
    async setKey(securityClass, key) {
        if (key.length !== 16) {
            throw new ZWaveError(`The network key must consist of 16 bytes!`, ZWaveErrorCodes.Argument_Invalid);
        }
        else if (!(securityClass in SecurityClass)
            || securityClass <= SecurityClass.None) {
            throw new ZWaveError(`Invalid security class!`, ZWaveErrorCodes.Argument_Invalid);
        }
        this.networkKeys.set(securityClass, {
            pnk: key,
            ...(await deriveNetworkKeys(key)),
        });
    }
    /**
     * Creates (or re-uses) a multicast group for the given node IDs and remembers the security class.
     * The returned value is the group ID to be used in multicast commands
     */
    createMulticastGroup(nodeIDs, s2SecurityClass) {
        // Check if we already have a group for these nodes
        const newHash = hashNodeIds(nodeIDs);
        if (this.multicastGroupLookup.has(newHash)) {
            return this.multicastGroupLookup.get(newHash);
        }
        // If not, generate a new group ID
        const groupId = this.getNextMulticastGroupId();
        // The group ID may already be occupied. In that case, forget the old group
        if (this.multicastGroups.has(groupId)) {
            const oldGroup = this.multicastGroups.get(groupId);
            this.multicastGroups.delete(groupId);
            const oldHash = hashNodeIds(oldGroup.nodeIDs);
            this.multicastGroupLookup.delete(oldHash);
        }
        // Remember the new group
        this.multicastGroups.set(groupId, {
            nodeIDs,
            securityClass: s2SecurityClass,
            sequenceNumber: randomBytes(1)[0],
        });
        this.multicastGroupLookup.set(newHash, groupId);
        // And reset the MPAN state
        this.mpanStates.delete(groupId);
        return groupId;
    }
    getMulticastGroup(group) {
        return this.multicastGroups.get(group);
    }
    hasKeysForSecurityClass(securityClass) {
        return this.networkKeys.has(securityClass);
    }
    getKeysForSecurityClass(securityClass) {
        const keys = this.networkKeys.get(securityClass);
        if (!keys) {
            throw new ZWaveError(`The network key for the security class ${getEnumMemberName(SecurityClass, securityClass)} has not been set up yet!`, ZWaveErrorCodes.Security2CC_NotInitialized);
        }
        return { ...keys };
    }
    getKeysForNode(peerNodeID) {
        const spanState = this.getSPANState(peerNodeID);
        // The keys we return must match the actual SPAN state (if we have one)
        // Meaning if an SPAN for the temporary inclusion key is established,
        // we need to return that temporary key
        if (spanState.type === SPANState.SPAN
            && spanState.securityClass === SecurityClass.Temporary) {
            if (this.tempKeys.has(peerNodeID)) {
                return this.tempKeys.get(peerNodeID);
            }
            throw new ZWaveError(`Temporary encryption key for node ${peerNodeID} is not known!`, ZWaveErrorCodes.Security2CC_NotInitialized);
        }
        else if (spanState.type !== SPANState.SPAN) {
            throw new ZWaveError(`Security class for node ${peerNodeID} is not yet known!`, ZWaveErrorCodes.Security2CC_NotInitialized);
        }
        return this.getKeysForSecurityClass(spanState.securityClass);
    }
    getSPANState(peerNodeID) {
        return this.spanTable.get(peerNodeID) ?? { type: SPANState.None };
    }
    /** Tests whether the most recent secure command for a node has used the given security class */
    hasUsedSecurityClass(peerNodeID, securityClass) {
        const spanState = this.spanTable.get(peerNodeID);
        if (!spanState)
            return false;
        if (spanState.type !== SPANState.SPAN)
            return false;
        return spanState.securityClass === securityClass;
    }
    /**
     * Prepares the generation of a new SPAN by creating a random sequence number and (local) entropy input
     * @param receiver The node this nonce is for. If none is given, the nonce is not stored.
     */
    async generateNonce(receiver) {
        const receiverEI = await this.rng.generate(16);
        if (receiver != undefined) {
            this.spanTable.set(receiver, {
                type: SPANState.LocalEI,
                receiverEI,
            });
        }
        return receiverEI;
    }
    /**
     * Stores the given SPAN state in the table. This should NEVER be called by user code.
     */
    setSPANState(peerNodeID, state) {
        if (state.type === SPANState.None) {
            this.spanTable.delete(peerNodeID);
        }
        else {
            this.spanTable.set(peerNodeID, state);
        }
    }
    /** Invalidates the SPAN state for the given receiver */
    deleteNonce(receiver) {
        this.spanTable.delete(receiver);
        this.peerSequenceNumbers.delete(receiver);
        // Keep our own sequence number
    }
    /** Initializes the singlecast PAN generator for a given node based on the given entropy inputs */
    async initializeSPAN(peerNodeId, securityClass, senderEI, receiverEI) {
        if (senderEI.length !== 16 || receiverEI.length !== 16) {
            throw new ZWaveError(`The entropy input must consist of 16 bytes`, ZWaveErrorCodes.Argument_Invalid);
        }
        const keys = this.getKeysForSecurityClass(securityClass);
        const noncePRK = await computeNoncePRK(senderEI, receiverEI);
        const MEI = await deriveMEI(noncePRK);
        const rng = new CtrDRBG();
        await rng.init(MEI, keys.personalizationString);
        this.spanTable.set(peerNodeId, {
            securityClass,
            type: SPANState.SPAN,
            rng,
        });
    }
    /** Initializes the singlecast PAN generator for a given node based on the given entropy inputs */
    async initializeTempSPAN(peerNodeId, senderEI, receiverEI) {
        if (senderEI.length !== 16 || receiverEI.length !== 16) {
            throw new ZWaveError(`The entropy input must consist of 16 bytes`, ZWaveErrorCodes.Argument_Invalid);
        }
        const keys = this.tempKeys.get(peerNodeId);
        const noncePRK = await computeNoncePRK(senderEI, receiverEI);
        const MEI = await deriveMEI(noncePRK);
        const rng = new CtrDRBG();
        await rng.init(MEI, keys.personalizationString);
        this.spanTable.set(peerNodeId, {
            securityClass: SecurityClass.Temporary,
            type: SPANState.SPAN,
            rng,
        });
    }
    /** Tests if the given combination of peer node ID and sequence number is a duplicate */
    isDuplicateSinglecast(peerNodeId, sequenceNumber) {
        return (this.peerSequenceNumbers
            .get(peerNodeId)
            ?.includes(sequenceNumber) ?? false);
    }
    /** Stores the latest sequence number for the given peer node ID and returns the previous one */
    storeSequenceNumber(peerNodeId, sequenceNumber) {
        if (this.peerSequenceNumbers.has(peerNodeId)) {
            // Store the last SINGLECAST_MAX_SEQ_NUMS sequence numbers
            const arr = this.peerSequenceNumbers.get(peerNodeId);
            const prev = arr.at(-1);
            arr.push(sequenceNumber);
            if (arr.length > SINGLECAST_MAX_SEQ_NUMS)
                arr.shift();
            return prev;
        }
        else {
            this.peerSequenceNumbers.set(peerNodeId, [sequenceNumber]);
        }
    }
    storeRemoteEI(peerNodeId, remoteEI) {
        if (remoteEI.length !== 16) {
            throw new ZWaveError(`The entropy input must consist of 16 bytes`, ZWaveErrorCodes.Argument_Invalid);
        }
        this.spanTable.set(peerNodeId, {
            type: SPANState.RemoteEI,
            receiverEI: remoteEI,
        });
    }
    /**
     * Generates the next nonce for the given peer and returns it.
     * @param store - Whether the nonce should be stored/remembered as the current SPAN.
     */
    async nextNonce(peerNodeId, store) {
        const spanState = this.spanTable.get(peerNodeId);
        if (spanState?.type !== SPANState.SPAN) {
            throw new ZWaveError(`The Singlecast PAN has not been initialized for Node ${peerNodeId}`, ZWaveErrorCodes.Security2CC_NotInitialized);
        }
        const nonce = (await spanState.rng.generate(16)).subarray(0, 13);
        spanState.currentSPAN = store
            ? {
                nonce,
                expires: highResTimestamp() + SINGLECAST_NONCE_EXPIRY_NS,
            }
            : undefined;
        return nonce;
    }
    /** Returns the next sequence number to use for outgoing messages to the given node */
    nextSequenceNumber(peerNodeId) {
        let seq = this.ownSequenceNumbers.get(peerNodeId);
        if (seq == undefined) {
            seq = randomBytes(1)[0];
        }
        else {
            seq = (seq + 1) & 0xff;
        }
        this.ownSequenceNumbers.set(peerNodeId, seq);
        return seq;
    }
    /** Returns the next sequence number to use for outgoing messages to the given multicast group */
    nextMulticastSequenceNumber(groupId) {
        const group = this.multicastGroups.get(groupId);
        if (!group) {
            throw new ZWaveError(`Multicast group ${groupId} does not exist!`, ZWaveErrorCodes.Security2CC_NotInitialized);
        }
        let seq = group.sequenceNumber;
        seq = (seq + 1) & 0xff;
        group.sequenceNumber = seq;
        return seq;
    }
    getInnerMPANState(groupId) {
        return this.mpanStates.get(groupId);
    }
    async getMulticastKeyAndIV(groupId) {
        const group = this.getMulticastGroup(groupId);
        if (!group) {
            throw new ZWaveError(`Multicast group ${groupId} does not exist!`, ZWaveErrorCodes.Security2CC_NotInitialized);
        }
        const keys = this.getKeysForSecurityClass(group.securityClass);
        // We may have to initialize the inner MPAN state
        if (!this.mpanStates.has(groupId)) {
            this.mpanStates.set(groupId, await this.rng.generate(16));
        }
        // Compute the next MPAN
        const stateN = this.mpanStates.get(groupId);
        // The specs don't mention this step for multicast, but the IV for AES-CCM is limited to 13 bytes
        const ret = (await encryptAES128ECB(stateN, keys.keyMPAN))
            .subarray(0, 13);
        // Increment the inner state
        increment(stateN);
        return {
            key: keys.keyCCM,
            iv: ret,
        };
    }
    /** As part of MPAN maintenance, this increments our own MPAN for a group */
    tryIncrementMPAN(groupId) {
        const stateN = this.mpanStates.get(groupId);
        if (stateN)
            increment(stateN);
    }
    /**
     * Generates the next nonce for the given peer and returns it.
     */
    async nextPeerMPAN(peerNodeId, groupId) {
        const mpanState = this.getPeerMPAN(peerNodeId, groupId);
        if (mpanState.type !== MPANState.MPAN) {
            throw new ZWaveError(`No peer multicast PAN exists for Node ${peerNodeId}, group ${groupId}`, ZWaveErrorCodes.Security2CC_NotInitialized);
        }
        const keys = this.getKeysForNode(peerNodeId);
        if (!keys || !("keyMPAN" in keys)) {
            throw new ZWaveError(`The network keys for the security class of Node ${peerNodeId} have not been set up yet!`, ZWaveErrorCodes.Security2CC_NotInitialized);
        }
        // Compute the next MPAN
        const stateN = mpanState.currentMPAN;
        // The specs don't mention this step for multicast, but the IV for AES-CCM is limited to 13 bytes
        const ret = (await encryptAES128ECB(stateN, keys.keyMPAN))
            .subarray(0, 13);
        // Increment the inner state
        increment(stateN);
        return ret;
    }
    /** As part of MPAN maintenance, this increments the peer's MPAN if it is known */
    tryIncrementPeerMPAN(peerNodeId, groupId) {
        const mpanState = this.getPeerMPAN(peerNodeId, groupId);
        if (mpanState?.type !== MPANState.MPAN)
            return;
        const stateN = mpanState.currentMPAN;
        increment(stateN);
    }
    /** Returns the stored MPAN used to decrypt messages from `peerNodeId`, MPAN group `groupId` */
    getPeerMPAN(peerNodeId, groupId) {
        return (this.peerMPANs.get(peerNodeId)?.get(groupId) ?? {
            type: MPANState.None,
        });
    }
    /** Reset all out of sync MPANs for the given node */
    resetOutOfSyncMPANs(peerNodeId) {
        const entries = this.peerMPANs.get(peerNodeId);
        if (!entries)
            return;
        for (const [groupId, state] of entries) {
            if (state.type === MPANState.OutOfSync) {
                entries.delete(groupId);
            }
        }
    }
    storePeerMPAN(peerNodeId, groupId, mpanState) {
        if (!this.peerMPANs.has(peerNodeId)) {
            this.peerMPANs.set(peerNodeId, new Map());
        }
        this.peerMPANs.get(peerNodeId).set(groupId, mpanState);
    }
}
/** Creates a unique string that can be used to look up existing node ID arrays */
function hashNodeIds(nodeIds) {
    const raw = encodeBitMask(nodeIds, MAX_NODES_LR);
    // Compress the bitmask to avoid 1000 character strings as keys.
    // This compresses considerably well, usually in the 12-20 byte range
    const compressed = deflateSync(raw);
    return Bytes.view(compressed).toString("hex");
}
//# sourceMappingURL=Manager2.js.map