import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import type { GetDeviceConfig, LookupManufacturer } from "@zwave-js/config";
import { type BroadcastCC, type CCAddress, type CCId, CommandClasses, type ControlsCC, EncapsulationFlags, type EndpointId, type FrameType, type GetAllEndpoints, type GetCCs, type GetEndpoint, type GetNode, type GetSupportedCCVersion, type GetValueDB, type HostIDs, type ListenBehavior, type LogNode, type MessageOrCCLogEntry, type ModifyCCs, type MulticastCC, type MulticastDestination, type NodeId, type QueryNodeStatus, type QuerySecurityClasses, type SetSecurityClass, type SinglecastCC, type SupportsCC, type ValueDB, type ValueID, type ValueMetadata, ZWaveErrorCodes } from "@zwave-js/core";
import { Bytes, type JSONObject } from "@zwave-js/shared";
import type { CCAPIHost, CCAPINode, ValueIDProperties } from "./API.js";
import { type EncapsulatingCommandClass } from "./EncapsulatingCommandClass.js";
import { type CCValue, type DynamicCCValue, type StaticCCValue } from "./Values.js";
import type { GetInterviewOptions } from "./traits.js";
export interface CommandClassOptions extends CCAddress {
    ccId?: number;
    ccCommand?: number;
    payload?: Uint8Array;
}
export type CCEndpoint = EndpointId & SupportsCC & ControlsCC & GetCCs & ModifyCCs;
export type CCNode = NodeId & SupportsCC & ControlsCC & GetCCs & GetEndpoint<CCEndpoint> & GetAllEndpoints<CCEndpoint> & QuerySecurityClasses & SetSecurityClass & ListenBehavior & QueryNodeStatus;
export type InterviewContext = CCAPIHost<CCAPINode & GetCCs & SupportsCC & ControlsCC & QuerySecurityClasses & SetSecurityClass & GetEndpoint<EndpointId & GetCCs & SupportsCC & ControlsCC & ModifyCCs> & GetAllEndpoints<EndpointId & SupportsCC & ControlsCC>> & GetInterviewOptions & LookupManufacturer;
export type RefreshValuesContext = CCAPIHost<CCAPINode & GetEndpoint<EndpointId & SupportsCC & ControlsCC>>;
export type PersistValuesContext = HostIDs & GetValueDB & GetSupportedCCVersion & GetDeviceConfig & GetNode<NodeId & GetEndpoint<EndpointId & SupportsCC & ControlsCC>> & LogNode;
export declare function getEffectiveCCVersion(ctx: GetSupportedCCVersion, cc: CCId, defaultVersion?: number): number;
export declare class CCRaw {
    ccId: CommandClasses;
    ccCommand: number | undefined;
    payload: Bytes;
    constructor(ccId: CommandClasses, ccCommand: number | undefined, payload: Bytes);
    static parse(data: Uint8Array): CCRaw;
    withPayload(payload: Bytes): CCRaw;
}
export declare class CommandClass implements CCId {
    constructor(options: CommandClassOptions);
    static parse(data: Uint8Array, ctx: CCParsingContext): Promise<CommandClass>;
    static from(raw: CCRaw, ctx: CCParsingContext): CommandClass | Promise<CommandClass>;
    /** This CC's identifier */
    ccId: CommandClasses;
    ccCommand?: number;
    get ccName(): string;
    /** The ID of the target node(s) */
    nodeId: number | MulticastDestination;
    payload: Bytes;
    /** Which endpoint of the node this CC belongs to. 0 for the root device. */
    endpointIndex: number;
    /**
     * Which encapsulation CCs this CC is/was/should be encapsulated with.
     *
     * Don't use this directly, this is used internally.
     */
    encapsulationFlags: EncapsulationFlags;
    /** Activates or deactivates the given encapsulation flag(s) */
    toggleEncapsulationFlag(flag: EncapsulationFlags, active: boolean): void;
    /** Contains a reference to the encapsulating CC if this CC is encapsulated */
    encapsulatingCC?: EncapsulatingCommandClass;
    /** The type of Z-Wave frame this CC was sent with */
    readonly frameType?: FrameType;
    /** Returns true if this CC is an extended CC (0xF100..0xFFFF) */
    isExtended(): boolean;
    /** Whether the interview for this CC was previously completed */
    isInterviewComplete(host: GetValueDB): boolean;
    /** Marks the interview for this CC as complete or not */
    setInterviewComplete(host: GetValueDB, complete: boolean): void;
    /**
     * Serializes this CommandClass to be embedded in a message payload or another CC
     */
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    prepareRetransmission(): void;
    /**
     * Create an instance of the given CC without checking whether it is supported.
     * If the CC is implemented, this returns an instance of the given CC which is linked to the given endpoint.
     *
     * **INTERNAL:** Applications should not use this directly.
     */
    static createInstanceUnchecked<T extends CommandClass>(endpoint: EndpointId, cc: CommandClasses | CCConstructor<T>): T | undefined;
    /** Generates a representation of this CC for the log */
    toLogEntry(_ctx?: GetValueDB): MessageOrCCLogEntry;
    /** Generates the JSON representation of this CC */
    toJSON(): JSONObject;
    private toJSONInternal;
    protected throwMissingCriticalInterviewResponse(): never;
    /**
     * Performs the interview procedure for this CC according to SDS14223
     */
    interview(_ctx: InterviewContext): Promise<void>;
    /**
     * Refreshes all dynamic values of this CC
     */
    refreshValues(_ctx: RefreshValuesContext): Promise<void>;
    /**
     * Checks if the CC values need to be manually refreshed.
     * This should be called regularly and when sleeping nodes wake up
     */
    shouldRefreshValues(this: SinglecastCC<this>, _ctx: GetValueDB & GetSupportedCCVersion & GetDeviceConfig & GetNode<NodeId & GetEndpoint<EndpointId & SupportsCC & ControlsCC>>): boolean;
    /** Determines which CC interviews must be performed before this CC can be interviewed */
    determineRequiredCCInterviews(): readonly CommandClasses[];
    /**
     * Whether the endpoint interview may be skipped by a CC. Can be overwritten by a subclass.
     */
    skipEndpointInterview(): boolean;
    /**
     * Maps a BasicCC value to a more specific CC implementation. Returns true if the value was mapped, false otherwise.
     * @param _value The value of the received BasicCC
     */
    setMappedBasicValue(_ctx: GetValueDB, _value: number): boolean;
    isSinglecast(): this is SinglecastCC<this>;
    isMulticast(): this is MulticastCC<this>;
    isBroadcast(): this is BroadcastCC<this>;
    /**
     * Returns the node this CC is linked to. Throws if the controller is not yet ready.
     */
    getNode<T extends NodeId>(ctx: GetNode<T>): T | undefined;
    getEndpoint<T extends EndpointId>(ctx: GetNode<NodeId & GetEndpoint<T>>): T | undefined;
    /** Returns the value DB for this CC's node */
    protected getValueDB(ctx: GetValueDB): ValueDB;
    /**
     * Ensures that the metadata for the given CC value exists in the Value DB or creates it if it does not.
     * The endpoint index of the current CC instance is automatically taken into account.
     * @param meta Will be used in place of the predefined metadata when given
     */
    protected ensureMetadata(ctx: GetValueDB, ccValue: CCValue, meta?: ValueMetadata): void;
    /**
     * Removes the metadata for the given CC value from the value DB.
     * The endpoint index of the current CC instance is automatically taken into account.
     */
    protected removeMetadata(ctx: GetValueDB, ccValue: CCValue): void;
    /**
     * Writes the metadata for the given CC value into the Value DB.
     * The endpoint index of the current CC instance is automatically taken into account.
     * @param meta Will be used in place of the predefined metadata when given
     */
    protected setMetadata(ctx: GetValueDB, ccValue: CCValue, meta?: ValueMetadata): void;
    /**
     * Reads the metadata for the given CC value from the Value DB.
     * The endpoint index of the current CC instance is automatically taken into account.
     */
    protected getMetadata<T extends ValueMetadata>(ctx: GetValueDB, ccValue: CCValue): T | undefined;
    /**
     * Stores the given value under the value ID for the given CC value in the value DB.
     * The endpoint index of the current CC instance is automatically taken into account.
     */
    protected setValue(ctx: GetValueDB, ccValue: CCValue, value: unknown): void;
    /**
     * Removes the value for the given CC value from the value DB.
     * The endpoint index of the current CC instance is automatically taken into account.
     */
    protected removeValue(ctx: GetValueDB, ccValue: CCValue): void;
    /**
     * Reads the value stored for the value ID of the given CC value from the value DB.
     * The endpoint index of the current CC instance is automatically taken into account.
     */
    protected getValue<T>(ctx: GetValueDB, ccValue: CCValue): T | undefined;
    /**
     * Reads when the value stored for the value ID of the given CC value was last updated in the value DB.
     * The endpoint index of the current CC instance is automatically taken into account.
     */
    protected getValueTimestamp(ctx: GetValueDB, ccValue: CCValue): number | undefined;
    /** Returns the CC value definition for the current CC which matches the given value ID */
    protected getCCValue(valueId: ValueID): StaticCCValue | DynamicCCValue | undefined;
    private getAllCCValues;
    private getCCValueForValueId;
    private shouldAutoCreateValue;
    /** Returns a list of all value names that are defined for this CommandClass */
    getDefinedValueIDs(ctx: GetValueDB & GetSupportedCCVersion & GetDeviceConfig & GetNode<NodeId & GetEndpoint<EndpointId & SupportsCC & ControlsCC>>, includeInternal?: boolean): ValueID[];
    /** Determines if the given value is an internal value */
    isInternalValue(properties: ValueIDProperties): boolean;
    /** Determines if the given value is an secret value */
    isSecretValue(properties: ValueIDProperties): boolean;
    /** Determines if the given value should be persisted or represents an event */
    isStatefulValue(properties: ValueIDProperties): boolean;
    /**
     * Persists all values for this CC instance into the value DB which are annotated with @ccValue.
     * Returns `true` if the process succeeded, `false` if the value DB cannot be accessed.
     */
    persistValues(ctx: PersistValuesContext): boolean;
    /**
     * When a CC supports to be split into multiple partial CCs, this can be used to identify the
     * session the partial CCs belong to.
     * If a CC expects `mergePartialCCs` to be always called, you should return an empty object here.
     */
    getPartialCCSessionId(): Record<string, any> | undefined;
    /**
     * When a CC supports to be split into multiple partial CCs, this indicates that the last report hasn't been received yet.
     * @param _session The previously received set of messages received in this partial CC session
     */
    expectMoreMessages(_session: CommandClass[]): boolean;
    /** Include previously received partial responses into a final CC */
    mergePartialCCs(_partials: CommandClass[], _ctx: CCParsingContext): Promise<void>;
    /** Tests whether this CC expects at least one command in return */
    expectsCCResponse(): boolean;
    isExpectedCCResponse(received: CommandClass): boolean;
    /**
     * Translates a property identifier into a speaking name for use in an external API
     * @param property The property identifier that should be translated
     * @param _propertyKey The (optional) property key the translated name may depend on
     */
    translateProperty(_ctx: GetValueDB, property: string | number, _propertyKey?: string | number): string;
    /**
     * Translates a property key into a speaking name for use in an external API
     * @param _property The property the key in question belongs to
     * @param propertyKey The property key for which the speaking name should be retrieved
     */
    translatePropertyKey(_ctx: GetValueDB, _property: string | number, propertyKey: string | number): string | undefined;
    /** Returns the number of bytes that are added to the payload by this CC */
    protected computeEncapsulationOverhead(): number;
    /** Computes the maximum net payload size that can be transmitted inside this CC */
    getMaxPayloadLength(baseLength: number): number;
    /** Checks whether this CC is encapsulated with one that has the given CC id and (optionally) CC Command */
    isEncapsulatedWith(ccId: CommandClasses, ccCommand?: number): boolean;
    /** Traverses the encapsulation stack of this CC outwards and returns the one that has the given CC id and (optionally) CC Command if that exists. */
    getEncapsulatingCC(ccId: CommandClasses, ccCommand?: number): CommandClass | undefined;
    /** Traverses the encapsulation stack of this CC inwards and returns the one that has the given CC id and (optionally) CC Command if that exists. */
    getEncapsulatedCC(ccId: CommandClasses, ccCommand?: number): CommandClass | undefined;
}
export interface InvalidCCOptions extends CommandClassOptions {
    ccName: string;
    reason?: string | ZWaveErrorCodes;
}
export declare class InvalidCC extends CommandClass {
    constructor(options: InvalidCCOptions);
    private _ccName;
    get ccName(): string;
    readonly reason?: string | ZWaveErrorCodes;
    toLogEntry(_ctx?: GetValueDB): MessageOrCCLogEntry;
}
export type CCConstructor<T extends CommandClass> = typeof CommandClass & {
    new (options: any): T;
};
/**
 * @publicAPI
 * May be used to define different expected CC responses depending on the sent CC
 */
export type DynamicCCResponse<TSent extends CommandClass, TReceived extends CommandClass = CommandClass> = (sentCC: TSent) => CCConstructor<TReceived> | CCConstructor<TReceived>[] | undefined;
/** @publicAPI */
export type CCResponseRole = boolean | "checkEncapsulated";
/**
 * @publicAPI
 * A predicate function to test if a received CC matches the sent CC
 */
export type CCResponsePredicate<TSent extends CommandClass, TReceived extends CommandClass = CommandClass> = (sentCommand: TSent, receivedCommand: TReceived) => CCResponseRole;
//# sourceMappingURL=CommandClass.d.ts.map