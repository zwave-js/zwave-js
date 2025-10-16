/** Management class and utils for Security S0 */
import { setTimer } from "@zwave-js/shared";
import { encryptAES128ECB, randomBytes } from "../crypto/index.js";
import { ZWaveError, ZWaveErrorCodes } from "../error/ZWaveError.js";
const authKeyBase = new Uint8Array(16).fill(0x55);
const encryptionKeyBase = new Uint8Array(16).fill(0xaa);
export function generateAuthKey(networkKey) {
    return encryptAES128ECB(authKeyBase, networkKey);
}
export function generateEncryptionKey(networkKey) {
    return encryptAES128ECB(encryptionKeyBase, networkKey);
}
export class SecurityManager {
    constructor(options) {
        this.networkKey = options.networkKey;
        this.ownNodeId = options.ownNodeId;
        this.nonceTimeout = options.nonceTimeout;
    }
    ownNodeId;
    nonceTimeout;
    _networkKey;
    get networkKey() {
        return this._networkKey;
    }
    set networkKey(v) {
        if (v.length !== 16) {
            throw new ZWaveError(`The network key must be 16 bytes long!`, ZWaveErrorCodes.Argument_Invalid);
        }
        this._networkKey = v;
        this._authKey = undefined;
        this._encryptionKey = undefined;
    }
    _authKey;
    async getAuthKey() {
        if (!this._authKey) {
            this._authKey = await generateAuthKey(this.networkKey);
        }
        return this._authKey;
    }
    _encryptionKey;
    async getEncryptionKey() {
        if (!this._encryptionKey) {
            this._encryptionKey = await generateEncryptionKey(this.networkKey);
        }
        return this._encryptionKey;
    }
    _nonceStore = new Map();
    _freeNonceIDs = new Set();
    _nonceTimers = new Map();
    normalizeId(id) {
        let ret;
        if (typeof id === "number") {
            ret = {
                issuer: this.ownNodeId,
                nonceId: id,
            };
        }
        else {
            ret = {
                issuer: id.issuer,
                nonceId: id.nonceId,
            };
        }
        return JSON.stringify(ret);
    }
    /** Generates a nonce for the current node */
    generateNonce(receiver, length) {
        let nonce;
        let nonceId;
        do {
            nonce = randomBytes(length);
            nonceId = this.getNonceId(nonce);
        } while (this.hasNonce(nonceId));
        this.setNonce(nonceId, { receiver, nonce }, { free: false });
        return nonce;
    }
    getNonceId(nonce) {
        return nonce[0];
    }
    setNonce(id, entry, { free = true } = {}) {
        const key = this.normalizeId(id);
        this._nonceTimers.get(key)?.clear();
        this._nonceStore.set(key, entry);
        if (free)
            this._freeNonceIDs.add(key);
        this._nonceTimers.set(key, setTimer(() => {
            this.expireNonce(key);
        }, this.nonceTimeout).unref());
    }
    /** Deletes ALL nonces that were issued for a given node */
    deleteAllNoncesForReceiver(receiver) {
        for (const [key, entry] of this._nonceStore) {
            if (entry.receiver === receiver) {
                this.deleteNonceInternal(key);
            }
        }
    }
    deleteNonce(id) {
        const key = this.normalizeId(id);
        const nonceReceiver = this._nonceStore.get(key)?.receiver;
        // Delete the nonce that was requested to be deleted
        this.deleteNonceInternal(key);
        // And all others for the same receiver aswell
        if (nonceReceiver) {
            this.deleteAllNoncesForReceiver(nonceReceiver);
        }
    }
    deleteNonceInternal(key) {
        this._nonceTimers.get(key)?.clear();
        this._nonceStore.delete(key);
        this._nonceTimers.delete(key);
        this._freeNonceIDs.delete(key);
    }
    expireNonce(key) {
        this.deleteNonceInternal(key);
    }
    getNonce(id) {
        return this._nonceStore.get(this.normalizeId(id))?.nonce;
    }
    hasNonce(id) {
        return this._nonceStore.has(this.normalizeId(id));
    }
    getFreeNonce(nodeId) {
        // Iterate through the known free nonce IDs to find one for the given node
        for (const key of this._freeNonceIDs) {
            const nonceKey = JSON.parse(key);
            if (nonceKey.issuer === nodeId) {
                this._freeNonceIDs.delete(key);
                return this._nonceStore.get(key)?.nonce;
            }
        }
    }
}
//# sourceMappingURL=Manager.js.map