import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { CommandClasses, Duration, EncapsulationFlags, type EndpointId, type GetEndpoint, type GetNode, type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type NodeId, type SinglecastCC, type SupervisionResult, SupervisionStatus, type SupportsCC, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { PhysicalCCAPI } from "../lib/API.js";
import { type CCRaw, CommandClass } from "../lib/CommandClass.js";
import { SupervisionCommand } from "../lib/_Types.js";
export declare const SupervisionCCValues: Readonly<{
    ccSupported: ((ccId: CommandClasses) => {
        id: {
            readonly commandClass: CommandClasses.Supervision;
            readonly property: "ccSupported";
            readonly propertyKey: CommandClasses;
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: CommandClasses.Supervision;
            readonly endpoint: 0;
            readonly property: "ccSupported";
            readonly propertyKey: CommandClasses;
        };
        readonly meta: Readonly<{
            readonly type: "any";
            readonly readable: true;
            readonly writeable: true;
        }>;
    }) & {
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        options: {
            readonly internal: true;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: false;
            readonly autoCreate: true;
        };
    };
}>;
export declare class SupervisionCCAPI extends PhysicalCCAPI {
    supportsCommand(cmd: SupervisionCommand): MaybeNotKnown<boolean>;
    sendReport(options: SupervisionCCReportOptions & {
        encapsulationFlags?: EncapsulationFlags;
        lowPriority?: boolean;
    }): Promise<void>;
}
export declare class SupervisionCC extends CommandClass {
    ccCommand: SupervisionCommand;
    nodeId: number;
    /** Tests if a command should be supervised and thus requires encapsulation */
    static requiresEncapsulation(cc: CommandClass): boolean;
    /** Encapsulates a command that targets a specific endpoint */
    static encapsulate(cc: CommandClass, sessionId: number, requestStatusUpdates?: boolean): SupervisionCCGet;
    /**
     * Given a CC instance, this returns the Supervision session ID which is used for this command.
     * Returns `undefined` when there is no session ID or the command was sent as multicast.
     */
    static getSessionId(command: CommandClass): number | undefined;
    /**
     * Returns whether a node supports the given CC with Supervision encapsulation.
     */
    static getCCSupportedWithSupervision(ctx: GetValueDB, endpoint: EndpointId, ccId: CommandClasses): boolean;
    /**
     * Remembers whether a node supports the given CC with Supervision encapsulation.
     */
    static setCCSupportedWithSupervision(ctx: GetValueDB, endpoint: EndpointId, ccId: CommandClasses, supported: boolean): void;
    /** Returns whether this is a valid command to send supervised */
    static mayUseSupervision<T extends CommandClass>(ctx: GetValueDB & GetNode<NodeId & SupportsCC & GetEndpoint<EndpointId>>, command: T): command is SinglecastCC<T>;
}
export type SupervisionCCReportOptions = {
    moreUpdatesFollow: boolean;
    requestWakeUpOnDemand?: boolean;
    sessionId: number;
} & ({
    status: SupervisionStatus.Working;
    duration: Duration;
} | {
    status: SupervisionStatus.NoSupport | SupervisionStatus.Fail | SupervisionStatus.Success;
});
export declare class SupervisionCCReport extends SupervisionCC {
    constructor(options: WithAddress<SupervisionCCReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): SupervisionCCReport;
    readonly moreUpdatesFollow: boolean;
    readonly requestWakeUpOnDemand: boolean;
    readonly sessionId: number;
    readonly status: SupervisionStatus;
    readonly duration: Duration | undefined;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
    toSupervisionResult(): SupervisionResult;
}
export interface SupervisionCCGetOptions {
    requestStatusUpdates: boolean;
    encapsulated: CommandClass;
    sessionId: number;
}
export declare class SupervisionCCGet extends SupervisionCC {
    constructor(options: WithAddress<SupervisionCCGetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): Promise<SupervisionCCGet>;
    requestStatusUpdates: boolean;
    sessionId: number;
    encapsulated: CommandClass;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    protected computeEncapsulationOverhead(): number;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
//# sourceMappingURL=SupervisionCC.d.ts.map