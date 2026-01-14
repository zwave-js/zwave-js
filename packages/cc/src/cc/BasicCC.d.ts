import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import type { GetDeviceConfig } from "@zwave-js/config";
import { CommandClasses, type ControlsCC, Duration, type EndpointId, type GetEndpoint, type GetNode, type GetSupportedCCVersion, type GetValueDB, type MaybeNotKnown, type MaybeUnknown, type MessageOrCCLogEntry, type NodeId, type SupervisionResult, type SupportsCC, type ValueID, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { CCAPI, POLL_VALUE, type PollValueImplementation, SET_VALUE, SET_VALUE_HOOKS, type SetValueImplementation, type SetValueImplementationHooksFactory } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext, type PersistValuesContext, type RefreshValuesContext } from "../lib/CommandClass.js";
import { BasicCommand } from "../lib/_Types.js";
export declare const BasicCCValues: Readonly<{
    currentValue: {
        id: {
            readonly commandClass: CommandClasses.Basic;
            readonly property: "currentValue";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Basic;
            readonly endpoint: number;
            readonly property: "currentValue";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Current value";
            readonly writeable: false;
            readonly max: 99;
            readonly min: 0;
            readonly type: "number";
            readonly readable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    targetValue: {
        id: {
            readonly commandClass: CommandClasses.Basic;
            readonly property: "targetValue";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Basic;
            readonly endpoint: number;
            readonly property: "targetValue";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Target value";
            readonly min: 0;
            readonly max: 255;
            readonly type: "number";
            readonly readable: true;
            readonly writeable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    duration: {
        id: {
            readonly commandClass: CommandClasses.Basic;
            readonly property: "duration";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Basic;
            readonly endpoint: number;
            readonly property: "duration";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Remaining duration";
            readonly writeable: false;
            readonly type: "duration";
            readonly readable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 2;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    restorePrevious: {
        id: {
            readonly commandClass: CommandClasses.Basic;
            readonly property: "restorePrevious";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Basic;
            readonly endpoint: number;
            readonly property: "restorePrevious";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Restore previous value";
            readonly states: {
                readonly true: "Restore";
            };
            readonly readable: false;
            readonly type: "boolean";
            readonly writeable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    compatEvent: {
        id: {
            readonly commandClass: CommandClasses.Basic;
            readonly property: "event";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Basic;
            readonly endpoint: number;
            readonly property: "event";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Event value";
            readonly writeable: false;
            readonly min: 0;
            readonly max: 255;
            readonly type: "number";
            readonly readable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: false;
            readonly supportsEndpoints: true;
            readonly autoCreate: false;
        };
    };
}>;
export declare class BasicCCAPI extends CCAPI {
    supportsCommand(cmd: BasicCommand): MaybeNotKnown<boolean>;
    protected get [SET_VALUE](): SetValueImplementation;
    protected [SET_VALUE_HOOKS]: SetValueImplementationHooksFactory;
    protected get [POLL_VALUE](): PollValueImplementation;
    get(): Promise<Pick<BasicCCReport, "duration" | "currentValue" | "targetValue"> | undefined>;
    set(targetValue: number): Promise<SupervisionResult | undefined>;
}
export declare class BasicCC extends CommandClass {
    ccCommand: BasicCommand;
    interview(ctx: InterviewContext): Promise<void>;
    refreshValues(ctx: RefreshValuesContext): Promise<void>;
    getDefinedValueIDs(ctx: GetValueDB & GetSupportedCCVersion & GetDeviceConfig & GetNode<NodeId & GetEndpoint<EndpointId & SupportsCC & ControlsCC>>): ValueID[];
}
export interface BasicCCSetOptions {
    targetValue: number;
}
export declare class BasicCCSet extends BasicCC {
    constructor(options: WithAddress<BasicCCSetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): BasicCCSet;
    targetValue: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface BasicCCReportOptions {
    currentValue?: MaybeUnknown<number>;
    targetValue?: MaybeUnknown<number>;
    duration?: Duration;
}
export declare class BasicCCReport extends BasicCC {
    constructor(options: WithAddress<BasicCCReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): BasicCCReport;
    currentValue: MaybeUnknown<number> | undefined;
    readonly targetValue: MaybeUnknown<number> | undefined;
    readonly duration: Duration | undefined;
    persistValues(ctx: PersistValuesContext): boolean;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class BasicCCGet extends BasicCC {
}
//# sourceMappingURL=BasicCC.d.ts.map