import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { CommandClasses, Duration, type GetValueDB, type MaybeNotKnown, type MaybeUnknown, type MessageOrCCLogEntry, type SupervisionResult, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { CCAPI, POLL_VALUE, type PollValueImplementation, SET_VALUE, SET_VALUE_HOOKS, type SetValueImplementation, type SetValueImplementationHooksFactory } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext, type PersistValuesContext, type RefreshValuesContext } from "../lib/CommandClass.js";
import { LevelChangeDirection, MultilevelSwitchCommand, SwitchType } from "../lib/_Types.js";
export declare const MultilevelSwitchCCValues: Readonly<{
    currentValue: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
            readonly property: "currentValue";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
            readonly endpoint: number;
            readonly property: "currentValue";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
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
            readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
            readonly property: "targetValue";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
            readonly endpoint: number;
            readonly property: "targetValue";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Target value";
            readonly valueChangeOptions: readonly ["transitionDuration"];
            readonly max: 99;
            readonly min: 0;
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
            readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
            readonly property: "duration";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
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
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    restorePrevious: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
            readonly property: "restorePrevious";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
            readonly endpoint: number;
            readonly property: "restorePrevious";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
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
            readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
            readonly property: "event";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
            readonly endpoint: number;
            readonly property: "event";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
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
            readonly autoCreate: (applHost: GetValueDB & import("@zwave-js/config").GetDeviceConfig, endpoint: import("@zwave-js/core").EndpointId) => boolean;
        };
    };
    switchType: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
            readonly property: "switchType";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
            readonly endpoint: number;
            readonly property: "switchType";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: Readonly<{
            readonly type: "any";
            readonly readable: true;
            readonly writeable: true;
        }>;
        options: {
            readonly internal: true;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    superviseStartStopLevelChange: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
            readonly property: "superviseStartStopLevelChange";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
            readonly endpoint: 0;
            readonly property: "superviseStartStopLevelChange";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: Readonly<{
            readonly type: "any";
            readonly readable: true;
            readonly writeable: true;
        }>;
        options: {
            readonly internal: true;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: false;
            readonly autoCreate: true;
        };
    };
    levelChangeUp: ((switchType: SwitchType) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
            readonly property: string;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
            readonly endpoint: number;
            readonly property: string;
        };
        readonly meta: {
            readonly label: `Perform a level change (${string})`;
            readonly valueChangeOptions: readonly ["transitionDuration"];
            readonly states: {
                readonly true: "Start";
                readonly false: "Stop";
            };
            readonly ccSpecific: {
                readonly switchType: SwitchType;
            };
            readonly readable: false;
            readonly type: "boolean";
            readonly writeable: true;
        };
    }) & {
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        options: {
            readonly internal: false;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    levelChangeDown: ((switchType: SwitchType) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
            readonly property: string;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Multilevel Switch"];
            readonly endpoint: number;
            readonly property: string;
        };
        readonly meta: {
            readonly label: `Perform a level change (${string})`;
            readonly valueChangeOptions: readonly ["transitionDuration"];
            readonly states: {
                readonly true: "Start";
                readonly false: "Stop";
            };
            readonly ccSpecific: {
                readonly switchType: SwitchType;
            };
            readonly readable: false;
            readonly type: "boolean";
            readonly writeable: true;
        };
    }) & {
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        options: {
            readonly internal: false;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
}>;
export declare class MultilevelSwitchCCAPI extends CCAPI {
    supportsCommand(cmd: MultilevelSwitchCommand): MaybeNotKnown<boolean>;
    get(): Promise<Pick<MultilevelSwitchCCReport, "duration" | "currentValue" | "targetValue"> | undefined>;
    /**
     * Sets the switch to a new value
     * @param targetValue The new target value for the switch
     * @param duration The duration after which the target value should be reached. Can be a Duration instance or a user-friendly duration string like `"1m17s"`. Only supported in V2 and above.
     * @returns A promise indicating whether the command was completed
     */
    set(targetValue: number, duration?: Duration | string): Promise<SupervisionResult | undefined>;
    startLevelChange(options: MultilevelSwitchCCStartLevelChangeOptions): Promise<SupervisionResult | undefined>;
    stopLevelChange(): Promise<SupervisionResult | undefined>;
    getSupported(): Promise<MaybeNotKnown<SwitchType>>;
    protected get [SET_VALUE](): SetValueImplementation;
    protected [SET_VALUE_HOOKS]: SetValueImplementationHooksFactory;
    protected get [POLL_VALUE](): PollValueImplementation;
}
export declare class MultilevelSwitchCC extends CommandClass {
    ccCommand: MultilevelSwitchCommand;
    interview(ctx: InterviewContext): Promise<void>;
    refreshValues(ctx: RefreshValuesContext): Promise<void>;
    setMappedBasicValue(ctx: GetValueDB, value: number): boolean;
    protected createMetadataForLevelChangeActions(ctx: GetValueDB, switchType?: SwitchType): void;
}
export interface MultilevelSwitchCCSetOptions {
    targetValue: number;
    duration?: Duration | string;
}
export declare class MultilevelSwitchCCSet extends MultilevelSwitchCC {
    constructor(options: WithAddress<MultilevelSwitchCCSetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): MultilevelSwitchCCSet;
    targetValue: number;
    duration: Duration | undefined;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface MultilevelSwitchCCReportOptions {
    currentValue?: MaybeUnknown<number>;
    targetValue?: MaybeUnknown<number>;
    duration?: Duration | string;
}
export declare class MultilevelSwitchCCReport extends MultilevelSwitchCC {
    constructor(options: WithAddress<MultilevelSwitchCCReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): MultilevelSwitchCCReport;
    targetValue: MaybeUnknown<number> | undefined;
    duration: Duration | undefined;
    currentValue: MaybeUnknown<number> | undefined;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class MultilevelSwitchCCGet extends MultilevelSwitchCC {
}
export type MultilevelSwitchCCStartLevelChangeOptions = {
    direction: keyof typeof LevelChangeDirection;
} & ({
    ignoreStartLevel: true;
    startLevel?: number;
} | {
    ignoreStartLevel: false;
    startLevel: number;
}) & {
    duration?: Duration | string;
};
export declare class MultilevelSwitchCCStartLevelChange extends MultilevelSwitchCC {
    constructor(options: WithAddress<MultilevelSwitchCCStartLevelChangeOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): MultilevelSwitchCCStartLevelChange;
    duration: Duration | undefined;
    startLevel: number;
    ignoreStartLevel: boolean;
    direction: keyof typeof LevelChangeDirection;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class MultilevelSwitchCCStopLevelChange extends MultilevelSwitchCC {
}
export interface MultilevelSwitchCCSupportedReportOptions {
    switchType: SwitchType;
}
export declare class MultilevelSwitchCCSupportedReport extends MultilevelSwitchCC {
    constructor(options: WithAddress<MultilevelSwitchCCSupportedReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): MultilevelSwitchCCSupportedReport;
    readonly switchType: SwitchType;
    persistValues(ctx: PersistValuesContext): boolean;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class MultilevelSwitchCCSupportedGet extends MultilevelSwitchCC {
}
//# sourceMappingURL=MultilevelSwitchCC.d.ts.map