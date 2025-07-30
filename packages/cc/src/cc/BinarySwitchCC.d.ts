import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { CommandClasses, Duration, type GetValueDB, type MaybeNotKnown, type MaybeUnknown, type MessageOrCCLogEntry, type SupervisionResult, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { CCAPI, POLL_VALUE, type PollValueImplementation, SET_VALUE, SET_VALUE_HOOKS, type SetValueImplementation, type SetValueImplementationHooksFactory } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext, type RefreshValuesContext } from "../lib/CommandClass.js";
import { BinarySwitchCommand } from "../lib/_Types.js";
export declare const BinarySwitchCCValues: Readonly<{
    currentValue: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Binary Switch"];
            readonly property: "currentValue";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Binary Switch"];
            readonly endpoint: number;
            readonly property: "currentValue";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Current value";
            readonly writeable: false;
            readonly type: "boolean";
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
            readonly commandClass: (typeof CommandClasses)["Binary Switch"];
            readonly property: "targetValue";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Binary Switch"];
            readonly endpoint: number;
            readonly property: "targetValue";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Target value";
            readonly valueChangeOptions: readonly ["transitionDuration"];
            readonly type: "boolean";
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
            readonly commandClass: (typeof CommandClasses)["Binary Switch"];
            readonly property: "duration";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Binary Switch"];
            readonly endpoint: number;
            readonly property: "duration";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
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
}>;
export declare class BinarySwitchCCAPI extends CCAPI {
    supportsCommand(cmd: BinarySwitchCommand): MaybeNotKnown<boolean>;
    get(): Promise<{
        currentValue: boolean;
        targetValue: MaybeUnknown<boolean> | undefined;
        duration: Duration | undefined;
    } | undefined>;
    /**
     * Sets the switch to the given value
     * @param targetValue The target value to set
     * @param duration The duration after which the target value should be reached. Can be a Duration instance or a user-friendly duration string like `"1m17s"`. Only supported in V2 and above.
     */
    set(targetValue: boolean, duration?: Duration | string): Promise<SupervisionResult | undefined>;
    protected get [SET_VALUE](): SetValueImplementation;
    protected [SET_VALUE_HOOKS]: SetValueImplementationHooksFactory;
    protected get [POLL_VALUE](): PollValueImplementation;
}
export declare class BinarySwitchCC extends CommandClass {
    ccCommand: BinarySwitchCommand;
    interview(ctx: InterviewContext): Promise<void>;
    refreshValues(ctx: RefreshValuesContext): Promise<void>;
    setMappedBasicValue(ctx: GetValueDB, value: number): boolean;
}
export interface BinarySwitchCCSetOptions {
    targetValue: boolean;
    duration?: Duration | string;
}
export declare class BinarySwitchCCSet extends BinarySwitchCC {
    constructor(options: WithAddress<BinarySwitchCCSetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): BinarySwitchCCSet;
    targetValue: boolean;
    duration: Duration | undefined;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface BinarySwitchCCReportOptions {
    currentValue?: MaybeUnknown<boolean>;
    targetValue?: MaybeUnknown<boolean>;
    duration?: Duration | string;
}
export declare class BinarySwitchCCReport extends BinarySwitchCC {
    constructor(options: WithAddress<BinarySwitchCCReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): BinarySwitchCCReport;
    readonly currentValue: MaybeUnknown<boolean> | undefined;
    readonly targetValue: MaybeUnknown<boolean> | undefined;
    readonly duration: Duration | undefined;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class BinarySwitchCCGet extends BinarySwitchCC {
}
//# sourceMappingURL=BinarySwitchCC.d.ts.map