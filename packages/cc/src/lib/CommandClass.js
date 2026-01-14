import { CommandClasses, EncapsulationFlags, NODE_ID_BROADCAST, NODE_ID_BROADCAST_LR, ZWaveError, ZWaveErrorCodes, getCCName, isZWaveError, parseCCId, valueIdToString, } from "@zwave-js/core";
import { Bytes, buffer2hex, getEnumMemberName, num2hex, staticExtends, } from "@zwave-js/shared";
import { isArray } from "alcalzone-shared/typeguards";
import { getCCCommand, getCCCommandConstructor, getCCConstructor, getCCResponsePredicate, getCCValueProperties, getCCValues, getCommandClass, getExpectedCCResponse, getImplementedVersion, } from "./CommandClassDecorators.js";
import { isEncapsulatingCommandClass, isMultiEncapsulatingCommandClass, } from "./EncapsulatingCommandClass.js";
import { defaultCCValueOptions, } from "./Values.js";
export function getEffectiveCCVersion(ctx, cc, defaultVersion) {
    // For multicast and broadcast CCs, just use the highest implemented version to serialize
    // Older nodes will ignore the additional fields
    if (typeof cc.nodeId !== "number"
        || cc.nodeId === NODE_ID_BROADCAST
        || cc.nodeId === NODE_ID_BROADCAST_LR) {
        return getImplementedVersion(cc.ccId);
    }
    // For singlecast CCs, set the CC version as high as possible
    return ctx.getSupportedCCVersion(cc.ccId, cc.nodeId, cc.endpointIndex)
        || (defaultVersion ?? getImplementedVersion(cc.ccId));
}
export class CCRaw {
    ccId;
    ccCommand;
    payload;
    constructor(ccId, ccCommand, payload) {
        this.ccId = ccId;
        this.ccCommand = ccCommand;
        this.payload = payload;
    }
    static parse(data) {
        const { ccId, bytesRead: ccIdLength } = parseCCId(data);
        // There are so few exceptions that we can handle them here manually
        if (ccId === CommandClasses["No Operation"]) {
            return new CCRaw(ccId, undefined, new Bytes());
        }
        let ccCommand = data[ccIdLength];
        let payload = Bytes.view(data.subarray(ccIdLength + 1));
        if (ccId === CommandClasses["Transport Service"]) {
            // Transport Service only uses the higher 5 bits for the command
            // and re-uses the lower 3 bits of the ccCommand as payload
            payload = Bytes.concat([
                Bytes.from([ccCommand & 0b111]),
                payload,
            ]);
            ccCommand = ccCommand & 0b11111_000;
        }
        else if (ccId === CommandClasses["Manufacturer Proprietary"]) {
            // ManufacturerProprietaryCC has no CC command, so the first
            // payload byte is stored in ccCommand.
            payload = Bytes.concat([
                Bytes.from([ccCommand]),
                payload,
            ]);
            ccCommand = undefined;
        }
        return new CCRaw(ccId, ccCommand, payload);
    }
    withPayload(payload) {
        return new CCRaw(this.ccId, this.ccCommand, payload);
    }
}
// @publicAPI
export class CommandClass {
    // empty constructor to parse messages
    constructor(options) {
        const { nodeId, endpointIndex = 0, ccId = getCommandClass(this), ccCommand = getCCCommand(this), payload = new Uint8Array(), } = options;
        this.nodeId = nodeId;
        this.endpointIndex = endpointIndex;
        this.ccId = ccId;
        this.ccCommand = ccCommand;
        this.payload = Bytes.view(payload);
    }
    static async parse(data, ctx) {
        const raw = CCRaw.parse(data);
        // Find the correct subclass constructor to invoke
        const CCConstructor = getCCConstructor(raw.ccId);
        if (!CCConstructor) {
            // None -> fall back to the default constructor
            return await CommandClass.from(raw, ctx);
        }
        let CommandConstructor;
        if (raw.ccCommand != undefined) {
            CommandConstructor = getCCCommandConstructor(raw.ccId, raw.ccCommand);
        }
        // Not every CC has a constructor for its commands. In that case,
        // call the CC constructor directly
        try {
            return await (CommandConstructor ?? CCConstructor).from(raw, ctx);
        }
        catch (e) {
            // Indicate invalid payloads with a special CC type
            if (isZWaveError(e)
                && e.code === ZWaveErrorCodes.PacketFormat_InvalidPayload) {
                const ccName = CommandConstructor?.name
                    ?? `${getCCName(raw.ccId)} CC`;
                // Preserve why the command was invalid
                let reason;
                if (typeof e.context === "string"
                    || (typeof e.context === "number"
                        && ZWaveErrorCodes[e.context] != undefined)) {
                    reason = e.context;
                }
                const ret = new InvalidCC({
                    nodeId: ctx.sourceNodeId,
                    ccId: raw.ccId,
                    ccCommand: raw.ccCommand,
                    ccName,
                    reason,
                });
                return ret;
            }
            throw e;
        }
    }
    static from(raw, ctx) {
        return new this({
            nodeId: ctx.sourceNodeId,
            ccId: raw.ccId,
            ccCommand: raw.ccCommand,
            payload: raw.payload,
        });
    }
    /** This CC's identifier */
    ccId;
    ccCommand;
    get ccName() {
        return getCCName(this.ccId);
    }
    /** The ID of the target node(s) */
    nodeId;
    payload;
    /** Which endpoint of the node this CC belongs to. 0 for the root device. */
    endpointIndex;
    /**
     * Which encapsulation CCs this CC is/was/should be encapsulated with.
     *
     * Don't use this directly, this is used internally.
     */
    encapsulationFlags = EncapsulationFlags.None;
    /** Activates or deactivates the given encapsulation flag(s) */
    toggleEncapsulationFlag(flag, active) {
        if (active) {
            this.encapsulationFlags |= flag;
        }
        else {
            this.encapsulationFlags &= ~flag;
        }
    }
    /** Contains a reference to the encapsulating CC if this CC is encapsulated */
    encapsulatingCC;
    /** The type of Z-Wave frame this CC was sent with */
    frameType;
    /** Returns true if this CC is an extended CC (0xF100..0xFFFF) */
    isExtended() {
        return this.ccId >= 0xf100;
    }
    /** Whether the interview for this CC was previously completed */
    isInterviewComplete(host) {
        return !!this.getValueDB(host).getValue({
            commandClass: this.ccId,
            endpoint: this.endpointIndex,
            property: "interviewComplete",
        });
    }
    /** Marks the interview for this CC as complete or not */
    setInterviewComplete(host, complete) {
        this.getValueDB(host).setValue({
            commandClass: this.ccId,
            endpoint: this.endpointIndex,
            property: "interviewComplete",
        }, complete);
    }
    /**
     * Serializes this CommandClass to be embedded in a message payload or another CC
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/require-await
    async serialize(ctx) {
        // NoOp CCs have no command and no payload
        if (this.ccId === CommandClasses["No Operation"]) {
            return Bytes.from([this.ccId]);
        }
        else if (this.ccCommand == undefined) {
            throw new ZWaveError("Cannot serialize a Command Class without a command", ZWaveErrorCodes.CC_Invalid);
        }
        const payloadLength = this.payload.length;
        const ccIdLength = this.isExtended() ? 2 : 1;
        const data = new Bytes(ccIdLength + 1 + payloadLength);
        data.writeUIntBE(this.ccId, 0, ccIdLength);
        data[ccIdLength] = this.ccCommand;
        if (payloadLength > 0 /* implies payload != undefined */) {
            data.set(this.payload, 1 + ccIdLength);
        }
        return data;
    }
    prepareRetransmission() {
        // Do nothing by default
    }
    /**
     * Create an instance of the given CC without checking whether it is supported.
     * If the CC is implemented, this returns an instance of the given CC which is linked to the given endpoint.
     *
     * **INTERNAL:** Applications should not use this directly.
     */
    static createInstanceUnchecked(endpoint, cc) {
        const Constructor = typeof cc === "number" ? getCCConstructor(cc) : cc;
        if (Constructor) {
            return new Constructor({
                nodeId: endpoint.nodeId,
                endpointIndex: endpoint.index,
            });
        }
    }
    /** Generates a representation of this CC for the log */
    toLogEntry(_ctx) {
        let tag = this.constructor.name;
        const message = {};
        if (this.constructor === CommandClass) {
            tag = `${getEnumMemberName(CommandClasses, this.ccId)} CC (not implemented)`;
            if (this.ccCommand != undefined) {
                message.command = num2hex(this.ccCommand);
            }
        }
        if (this.payload.length > 0) {
            message.payload = buffer2hex(this.payload);
        }
        return {
            tags: [tag],
            message,
        };
    }
    /** Generates the JSON representation of this CC */
    toJSON() {
        return this.toJSONInternal();
    }
    toJSONInternal() {
        const ret = {
            nodeId: this.nodeId,
            ccId: CommandClasses[this.ccId] || num2hex(this.ccId),
        };
        if (this.ccCommand != undefined) {
            ret.ccCommand = num2hex(this.ccCommand);
        }
        if (this.payload.length > 0) {
            ret.payload = buffer2hex(this.payload);
        }
        return ret;
    }
    throwMissingCriticalInterviewResponse() {
        throw new ZWaveError(`The node did not respond to a critical interview query in time.`, ZWaveErrorCodes.Controller_NodeTimeout);
    }
    /**
     * Performs the interview procedure for this CC according to SDS14223
     */
    async interview(_ctx) {
        // This needs to be overwritten per command class. In the default implementation, don't do anything
    }
    /**
     * Refreshes all dynamic values of this CC
     */
    async refreshValues(_ctx) {
        // This needs to be overwritten per command class. In the default implementation, don't do anything
    }
    /**
     * Checks if the CC values need to be manually refreshed.
     * This should be called regularly and when sleeping nodes wake up
     */
    shouldRefreshValues(_ctx) {
        // This needs to be overwritten per command class.
        // In the default implementation, don't require a refresh
        return false;
    }
    /** Determines which CC interviews must be performed before this CC can be interviewed */
    determineRequiredCCInterviews() {
        // By default, all CCs require the VersionCC interview
        // There are two exceptions to this rule:
        // * ManufacturerSpecific must be interviewed first
        // * VersionCC itself must be done after that
        // These exceptions are defined in the overrides of this method of each corresponding CC
        return [CommandClasses.Version];
    }
    /**
     * Whether the endpoint interview may be skipped by a CC. Can be overwritten by a subclass.
     */
    skipEndpointInterview() {
        // By default no interview may be skipped
        return false;
    }
    /**
     * Maps a BasicCC value to a more specific CC implementation. Returns true if the value was mapped, false otherwise.
     * @param _value The value of the received BasicCC
     */
    setMappedBasicValue(_ctx, _value) {
        // By default, don't map
        return false;
    }
    isSinglecast() {
        return (
        // received
        this.frameType === "singlecast"
            // transmitted
            || (this.frameType == undefined
                && typeof this.nodeId === "number"
                && this.nodeId !== NODE_ID_BROADCAST
                && this.nodeId !== NODE_ID_BROADCAST_LR));
    }
    isMulticast() {
        return (
        // received
        this.frameType === "multicast"
            // transmitted
            || (this.frameType == undefined && isArray(this.nodeId)));
    }
    isBroadcast() {
        return (
        // received
        this.frameType === "broadcast"
            // transmitted
            || (this.frameType == undefined
                && (this.nodeId === NODE_ID_BROADCAST
                    || this.nodeId === NODE_ID_BROADCAST_LR)));
    }
    /**
     * Returns the node this CC is linked to. Throws if the controller is not yet ready.
     */
    getNode(ctx) {
        if (this.isSinglecast()) {
            return ctx.getNode(this.nodeId);
        }
    }
    /**
     * @internal
     * Returns the node this CC is linked to (or undefined if the node doesn't exist)
     */
    tryGetNode(ctx) {
        try {
            return this.getNode(ctx);
        }
        catch (e) {
            // This was expected
            if (isZWaveError(e) && e.code === ZWaveErrorCodes.Driver_NotReady) {
                return undefined;
            }
            // Something else happened
            throw e;
        }
    }
    getEndpoint(ctx) {
        return this.getNode(ctx)?.getEndpoint(this.endpointIndex);
    }
    /** Returns the value DB for this CC's node */
    getValueDB(ctx) {
        if (this.isSinglecast()) {
            try {
                return ctx.getValueDB(this.nodeId);
            }
            catch {
                throw new ZWaveError("The node for this CC does not exist or the driver is not ready yet", ZWaveErrorCodes.Driver_NotReady);
            }
        }
        throw new ZWaveError("Cannot retrieve the value DB for non-singlecast CCs", ZWaveErrorCodes.CC_NoNodeID);
    }
    /**
     * Ensures that the metadata for the given CC value exists in the Value DB or creates it if it does not.
     * The endpoint index of the current CC instance is automatically taken into account.
     * @param meta Will be used in place of the predefined metadata when given
     */
    ensureMetadata(ctx, ccValue, meta) {
        const valueDB = this.getValueDB(ctx);
        const valueId = ccValue.endpoint(this.endpointIndex);
        if (!valueDB.hasMetadata(valueId)) {
            valueDB.setMetadata(valueId, meta ?? ccValue.meta);
        }
    }
    /**
     * Removes the metadata for the given CC value from the value DB.
     * The endpoint index of the current CC instance is automatically taken into account.
     */
    removeMetadata(ctx, ccValue) {
        const valueDB = this.getValueDB(ctx);
        const valueId = ccValue.endpoint(this.endpointIndex);
        valueDB.setMetadata(valueId, undefined);
    }
    /**
     * Writes the metadata for the given CC value into the Value DB.
     * The endpoint index of the current CC instance is automatically taken into account.
     * @param meta Will be used in place of the predefined metadata when given
     */
    setMetadata(ctx, ccValue, meta) {
        const valueDB = this.getValueDB(ctx);
        const valueId = ccValue.endpoint(this.endpointIndex);
        valueDB.setMetadata(valueId, meta ?? ccValue.meta);
    }
    /**
     * Reads the metadata for the given CC value from the Value DB.
     * The endpoint index of the current CC instance is automatically taken into account.
     */
    getMetadata(ctx, ccValue) {
        const valueDB = this.getValueDB(ctx);
        const valueId = ccValue.endpoint(this.endpointIndex);
        return valueDB.getMetadata(valueId);
    }
    /**
     * Stores the given value under the value ID for the given CC value in the value DB.
     * The endpoint index of the current CC instance is automatically taken into account.
     */
    setValue(ctx, ccValue, value) {
        const valueDB = this.getValueDB(ctx);
        const valueId = ccValue.endpoint(this.endpointIndex);
        valueDB.setValue(valueId, value);
    }
    /**
     * Removes the value for the given CC value from the value DB.
     * The endpoint index of the current CC instance is automatically taken into account.
     */
    removeValue(ctx, ccValue) {
        const valueDB = this.getValueDB(ctx);
        const valueId = ccValue.endpoint(this.endpointIndex);
        valueDB.removeValue(valueId);
    }
    /**
     * Reads the value stored for the value ID of the given CC value from the value DB.
     * The endpoint index of the current CC instance is automatically taken into account.
     */
    getValue(ctx, ccValue) {
        const valueDB = this.getValueDB(ctx);
        const valueId = ccValue.endpoint(this.endpointIndex);
        return valueDB.getValue(valueId);
    }
    /**
     * Reads when the value stored for the value ID of the given CC value was last updated in the value DB.
     * The endpoint index of the current CC instance is automatically taken into account.
     */
    getValueTimestamp(ctx, ccValue) {
        const valueDB = this.getValueDB(ctx);
        const valueId = ccValue.endpoint(this.endpointIndex);
        return valueDB.getTimestamp(valueId);
    }
    /** Returns the CC value definition for the current CC which matches the given value ID */
    getCCValue(valueId) {
        const ccValues = getCCValues(this);
        if (!ccValues)
            return;
        for (const value of Object.values(ccValues)) {
            if (value?.is(valueId)) {
                return value;
            }
        }
    }
    getAllCCValues() {
        return Object.values(getCCValues(this) ?? {});
    }
    getCCValueForValueId(properties) {
        return this.getAllCCValues().find((value) => value.is({
            commandClass: this.ccId,
            ...properties,
        }));
    }
    shouldAutoCreateValue(ctx, value) {
        return (value.options.autoCreate === true
            || (typeof value.options.autoCreate === "function"
                && value.options.autoCreate(ctx, {
                    virtual: false,
                    nodeId: this.nodeId,
                    index: this.endpointIndex,
                })));
    }
    /** Returns a list of all value names that are defined for this CommandClass */
    getDefinedValueIDs(ctx, includeInternal = false) {
        // In order to compare value ids, we need them to be strings
        const ret = new Map();
        const addValueId = (property, propertyKey) => {
            const valueId = {
                commandClass: this.ccId,
                endpoint: this.endpointIndex,
                property,
                propertyKey,
            };
            const dbKey = valueIdToString(valueId);
            if (!ret.has(dbKey))
                ret.set(dbKey, valueId);
        };
        // Return all value IDs for this CC...
        const valueDB = this.getValueDB(ctx);
        // ...which either have metadata or a value
        const existingValueIds = [
            ...valueDB.getValues(this.ccId),
            ...valueDB.getAllMetadata(this.ccId),
        ];
        // To determine which value IDs to expose, we need to know the CC version
        // that we're doing this for
        const supportedVersion = typeof this.nodeId === "number"
            && this.nodeId !== NODE_ID_BROADCAST
            && this.nodeId !== NODE_ID_BROADCAST_LR
            // On singlecast CCs, use the version the node reported support for,
            ? ctx.getSupportedCCVersion(this.ccId, this.nodeId, this.endpointIndex)
            // on multicast/broadcast, use the highest version we implement
            : getImplementedVersion(this.ccId);
        // ...or which are statically defined using @ccValues(...)
        for (const value of Object.values(getCCValues(this) ?? {})) {
            // Skip dynamic CC values - they need a specific subclass instance to be evaluated
            if (!value || typeof value === "function")
                continue;
            // Skip those values that are only supported in higher versions of the CC
            if (value.options.minVersion != undefined
                && value.options.minVersion > supportedVersion) {
                continue;
            }
            // Skip internal values
            if (value.options.internal && !includeInternal)
                continue;
            // And determine if this value should be automatically "created"
            if (!this.shouldAutoCreateValue(ctx, value))
                continue;
            existingValueIds.push(value.endpoint(this.endpointIndex));
        }
        // TODO: this is a bit awkward for the statically defined ones
        const ccValues = this.getAllCCValues();
        for (const valueId of existingValueIds) {
            // ...belonging to the current endpoint
            if ((valueId.endpoint ?? 0) !== this.endpointIndex)
                continue;
            // Hard-coded: interviewComplete is always internal
            if (valueId.property === "interviewComplete")
                continue;
            // ... which don't have a CC value definition
            // ... or one that does not mark the value ID as internal
            const ccValue = ccValues.find((value) => value.is(valueId));
            if (!ccValue || !ccValue.options.internal || includeInternal) {
                addValueId(valueId.property, valueId.propertyKey);
            }
        }
        return [...ret.values()];
    }
    /** Determines if the given value is an internal value */
    isInternalValue(properties) {
        // Hard-coded: interviewComplete is always internal
        if (properties.property === "interviewComplete")
            return true;
        const ccValue = this.getCCValueForValueId(properties);
        return ccValue?.options.internal ?? defaultCCValueOptions.internal;
    }
    /** Determines if the given value is an secret value */
    isSecretValue(properties) {
        const ccValue = this.getCCValueForValueId(properties);
        return ccValue?.options.secret ?? defaultCCValueOptions.secret;
    }
    /** Determines if the given value should be persisted or represents an event */
    isStatefulValue(properties) {
        const ccValue = this.getCCValueForValueId(properties);
        return ccValue?.options.stateful ?? defaultCCValueOptions.stateful;
    }
    /**
     * Persists all values for this CC instance into the value DB which are annotated with @ccValue.
     * Returns `true` if the process succeeded, `false` if the value DB cannot be accessed.
     */
    persistValues(ctx) {
        let valueDB;
        try {
            valueDB = this.getValueDB(ctx);
        }
        catch {
            return false;
        }
        // To determine which value IDs to expose, we need to know the CC version
        // that we're doing this for
        const supportedVersion = ctx.getSupportedCCVersion(this.ccId, 
        // Values are only persisted for singlecast, so we know nodeId is a number
        this.nodeId, this.endpointIndex) || 1;
        // Get all properties of this CC which are annotated with a @ccValue decorator and store them.
        for (const [prop, _value] of getCCValueProperties(this)) {
            // Evaluate dynamic CC values first
            const value = typeof _value === "function" ? _value(this) : _value;
            // Skip those values that are only supported in higher versions of the CC
            if (value.options.minVersion != undefined
                && value.options.minVersion > supportedVersion) {
                continue;
            }
            const valueId = value.endpoint(this.endpointIndex);
            const sourceValue = this[prop];
            // Metadata gets created for non-internal values...
            const createMetadata = !value.options.internal
                // ... but only if the value is included in the report we are persisting
                && (sourceValue != undefined
                    // ... or if we know which CC version the node supports
                    // and the value may be automatically created
                    || (supportedVersion >= value.options.minVersion
                        && this.shouldAutoCreateValue(ctx, value)));
            if (createMetadata && !valueDB.hasMetadata(valueId)) {
                valueDB.setMetadata(valueId, value.meta);
            }
            // The value only gets written if it is not undefined. null is a valid value!
            if (sourceValue === undefined)
                continue;
            valueDB.setValue(valueId, sourceValue, {
                stateful: value.options.stateful,
            });
        }
        return true;
    }
    /**
     * When a CC supports to be split into multiple partial CCs, this can be used to identify the
     * session the partial CCs belong to.
     * If a CC expects `mergePartialCCs` to be always called, you should return an empty object here.
     */
    getPartialCCSessionId() {
        return undefined; // Only select CCs support to be split
    }
    /**
     * When a CC supports to be split into multiple partial CCs, this indicates that the last report hasn't been received yet.
     * @param _session The previously received set of messages received in this partial CC session
     */
    expectMoreMessages(_session) {
        return false; // By default, all CCs are monolithic
    }
    /** Include previously received partial responses into a final CC */
    async mergePartialCCs(_partials, _ctx) {
        // This is highly CC dependent
        // Overwrite this in derived classes, by default do nothing
    }
    /** Tests whether this CC expects at least one command in return */
    expectsCCResponse() {
        let expected = getExpectedCCResponse(this);
        // Evaluate dynamic CC responses
        if (typeof expected === "function"
            && !staticExtends(expected, CommandClass)) {
            expected = expected(this);
        }
        if (expected === undefined)
            return false;
        if (isArray(expected)) {
            return expected.every((cc) => staticExtends(cc, CommandClass));
        }
        else {
            return staticExtends(expected, CommandClass);
        }
    }
    isExpectedCCResponse(received) {
        if (received.nodeId !== this.nodeId)
            return false;
        let expected = getExpectedCCResponse(this);
        // Evaluate dynamic CC responses
        if (typeof expected === "function"
            && !staticExtends(expected, CommandClass)) {
            expected = expected(this);
        }
        if (expected == undefined) {
            // Fallback, should not happen if the expected response is defined correctly
            return false;
        }
        else if (isArray(expected)
            && expected.every((cc) => staticExtends(cc, CommandClass))) {
            // The CC always expects a response from the given list, check if the received
            // message is in that list
            if (expected.every((base) => !(received instanceof base))) {
                return false;
            }
        }
        else if (staticExtends(expected, CommandClass)) {
            // The CC always expects the same single response, check if this is the one
            if (!(received instanceof expected))
                return false;
        }
        // If the CC wants to test the response, let it
        const predicate = getCCResponsePredicate(this);
        const ret = predicate?.(this, received) ?? true;
        if (ret === "checkEncapsulated") {
            if (isEncapsulatingCommandClass(this)
                && isEncapsulatingCommandClass(received)) {
                return this.encapsulated.isExpectedCCResponse(received.encapsulated);
            }
            else {
                // Fallback, should not happen if the expected response is defined correctly
                return false;
            }
        }
        return ret;
    }
    /**
     * Translates a property identifier into a speaking name for use in an external API
     * @param property The property identifier that should be translated
     * @param _propertyKey The (optional) property key the translated name may depend on
     */
    translateProperty(_ctx, property, _propertyKey) {
        // Overwrite this in derived classes, by default just return the property key
        return property.toString();
    }
    /**
     * Translates a property key into a speaking name for use in an external API
     * @param _property The property the key in question belongs to
     * @param propertyKey The property key for which the speaking name should be retrieved
     */
    translatePropertyKey(_ctx, _property, propertyKey) {
        // Overwrite this in derived classes, by default just return the property key
        return propertyKey.toString();
    }
    /** Returns the number of bytes that are added to the payload by this CC */
    computeEncapsulationOverhead() {
        // Default is ccId (+ ccCommand):
        return (this.isExtended() ? 2 : 1) + 1;
    }
    /** Computes the maximum net payload size that can be transmitted inside this CC */
    getMaxPayloadLength(baseLength) {
        let ret = baseLength;
        let cur = this;
        while (cur) {
            ret -= cur.computeEncapsulationOverhead();
            cur = isEncapsulatingCommandClass(cur)
                ? cur.encapsulated
                : undefined;
        }
        return ret;
    }
    /** Checks whether this CC is encapsulated with one that has the given CC id and (optionally) CC Command */
    isEncapsulatedWith(ccId, ccCommand) {
        let cc = this;
        // Check whether there was a S0 encapsulation
        while (cc.encapsulatingCC) {
            cc = cc.encapsulatingCC;
            if (cc.ccId === ccId
                && (ccCommand === undefined || cc.ccCommand === ccCommand)) {
                return true;
            }
        }
        return false;
    }
    /** Traverses the encapsulation stack of this CC outwards and returns the one that has the given CC id and (optionally) CC Command if that exists. */
    getEncapsulatingCC(ccId, ccCommand) {
        let cc = this;
        while (cc.encapsulatingCC) {
            cc = cc.encapsulatingCC;
            if (cc.ccId === ccId
                && (ccCommand === undefined || cc.ccCommand === ccCommand)) {
                return cc;
            }
        }
    }
    /** Traverses the encapsulation stack of this CC inwards and returns the one that has the given CC id and (optionally) CC Command if that exists. */
    getEncapsulatedCC(ccId, ccCommand) {
        const predicate = (cc) => cc.ccId === ccId
            && (ccCommand === undefined || cc.ccCommand === ccCommand);
        if (isEncapsulatingCommandClass(this)) {
            if (predicate(this.encapsulated))
                return this.encapsulated;
            return this.encapsulated.getEncapsulatedCC(ccId, ccCommand);
        }
        else if (isMultiEncapsulatingCommandClass(this)) {
            for (const encapsulated of this.encapsulated) {
                if (predicate(encapsulated))
                    return encapsulated;
                const ret = encapsulated.getEncapsulatedCC(ccId, ccCommand);
                if (ret)
                    return ret;
            }
        }
    }
}
export class InvalidCC extends CommandClass {
    constructor(options) {
        super(options);
        this._ccName = options.ccName;
        // Numeric reasons are used internally to communicate problems with a CC
        // without ignoring them entirely
        this.reason = options.reason;
    }
    _ccName;
    get ccName() {
        return this._ccName;
    }
    reason;
    toLogEntry(_ctx) {
        return {
            tags: [this.ccName, "INVALID"],
            message: this.reason != undefined
                ? {
                    error: typeof this.reason === "string"
                        ? this.reason
                        : getEnumMemberName(ZWaveErrorCodes, this.reason),
                }
                : undefined,
        };
    }
}
//# sourceMappingURL=CommandClass.js.map