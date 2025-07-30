import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { CommandClasses, Duration, type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type SupervisionResult, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { CCAPI, POLL_VALUE, type PollValueImplementation, SET_VALUE, SET_VALUE_HOOKS, type SetValueImplementation, type SetValueImplementationHooksFactory } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext } from "../lib/CommandClass.js";
import { type LevelChangeDirection, WindowCoveringCommand, WindowCoveringParameter } from "../lib/_Types.js";
export declare const WindowCoveringCCValues: Readonly<{
    supportedParameters: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Window Covering"];
            readonly property: "supportedParameters";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Window Covering"];
            readonly endpoint: number;
            readonly property: "supportedParameters";
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
    currentValue: ((parameter: WindowCoveringParameter) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Window Covering"];
            readonly property: "currentValue";
            readonly propertyKey: WindowCoveringParameter;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Window Covering"];
            readonly endpoint: number;
            readonly property: "currentValue";
            readonly propertyKey: WindowCoveringParameter;
        };
        readonly meta: {
            readonly label: `Current value - ${string}`;
            readonly states: Record<number, string>;
            readonly ccSpecific: {
                readonly parameter: WindowCoveringParameter;
            };
            readonly writeable: false;
            readonly max: 99;
            readonly min: 0;
            readonly type: "number";
            readonly readable: true;
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
    targetValue: ((parameter: WindowCoveringParameter) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Window Covering"];
            readonly property: "targetValue";
            readonly propertyKey: WindowCoveringParameter;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Window Covering"];
            readonly endpoint: number;
            readonly property: "targetValue";
            readonly propertyKey: WindowCoveringParameter;
        };
        readonly meta: {
            readonly label: `Target value - ${string}`;
            readonly writeable: boolean;
            readonly states: Record<number, string>;
            readonly allowManualEntry: boolean;
            readonly ccSpecific: {
                readonly parameter: WindowCoveringParameter;
            };
            readonly valueChangeOptions: readonly ["transitionDuration"];
            readonly max: 99;
            readonly min: 0;
            readonly type: "number";
            readonly readable: true;
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
    duration: ((parameter: WindowCoveringParameter) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Window Covering"];
            readonly property: "duration";
            readonly propertyKey: WindowCoveringParameter;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Window Covering"];
            readonly endpoint: number;
            readonly property: "duration";
            readonly propertyKey: WindowCoveringParameter;
        };
        readonly meta: {
            readonly label: `Remaining duration - ${string}`;
            readonly ccSpecific: {
                readonly parameter: WindowCoveringParameter;
            };
            readonly writeable: false;
            readonly type: "duration";
            readonly readable: true;
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
    levelChangeUp: ((parameter: WindowCoveringParameter) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Window Covering"];
            readonly property: "levelChangeUp";
            readonly propertyKey: WindowCoveringParameter;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Window Covering"];
            readonly endpoint: number;
            readonly property: "levelChangeUp";
            readonly propertyKey: WindowCoveringParameter;
        };
        readonly meta: {
            readonly label: `${string} - ${string}`;
            readonly valueChangeOptions: readonly ["transitionDuration"];
            readonly states: {
                readonly true: "Start";
                readonly false: "Stop";
            };
            readonly ccSpecific: {
                readonly parameter: WindowCoveringParameter;
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
    levelChangeDown: ((parameter: WindowCoveringParameter) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Window Covering"];
            readonly property: "levelChangeDown";
            readonly propertyKey: WindowCoveringParameter;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Window Covering"];
            readonly endpoint: number;
            readonly property: "levelChangeDown";
            readonly propertyKey: WindowCoveringParameter;
        };
        readonly meta: {
            readonly label: `${string} - ${string}`;
            readonly valueChangeOptions: readonly ["transitionDuration"];
            readonly states: {
                readonly true: "Start";
                readonly false: "Stop";
            };
            readonly ccSpecific: {
                readonly parameter: WindowCoveringParameter;
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
export declare class WindowCoveringCCAPI extends CCAPI {
    supportsCommand(cmd: WindowCoveringCommand): MaybeNotKnown<boolean>;
    protected get [SET_VALUE](): SetValueImplementation;
    protected [SET_VALUE_HOOKS]: SetValueImplementationHooksFactory;
    protected get [POLL_VALUE](): PollValueImplementation;
    getSupported(): Promise<MaybeNotKnown<readonly WindowCoveringParameter[]>>;
    get(parameter: WindowCoveringParameter): Promise<Pick<WindowCoveringCCReport, "duration" | "currentValue" | "targetValue"> | undefined>;
    set(targetValues: {
        parameter: WindowCoveringParameter;
        value: number;
    }[], duration?: Duration | string): Promise<SupervisionResult | undefined>;
    startLevelChange(parameter: WindowCoveringParameter, direction: keyof typeof LevelChangeDirection, duration?: Duration | string): Promise<SupervisionResult | undefined>;
    stopLevelChange(parameter: WindowCoveringParameter): Promise<SupervisionResult | undefined>;
}
export declare class WindowCoveringCC extends CommandClass {
    ccCommand: WindowCoveringCommand;
    interview(ctx: InterviewContext): Promise<void>;
    translatePropertyKey(ctx: GetValueDB, property: string | number, propertyKey: string | number): string | undefined;
}
export interface WindowCoveringCCSupportedReportOptions {
    supportedParameters: readonly WindowCoveringParameter[];
}
export declare class WindowCoveringCCSupportedReport extends WindowCoveringCC {
    constructor(options: WithAddress<WindowCoveringCCSupportedReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): WindowCoveringCCSupportedReport;
    readonly supportedParameters: readonly WindowCoveringParameter[];
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class WindowCoveringCCSupportedGet extends WindowCoveringCC {
}
export interface WindowCoveringCCReportOptions {
    parameter: WindowCoveringParameter;
    currentValue: number;
    targetValue: number;
    duration: Duration;
}
export declare class WindowCoveringCCReport extends WindowCoveringCC {
    constructor(options: WithAddress<WindowCoveringCCReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): WindowCoveringCCReport;
    readonly parameter: WindowCoveringParameter;
    readonly currentValue: number;
    readonly targetValue: number;
    readonly duration: Duration;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface WindowCoveringCCGetOptions {
    parameter: WindowCoveringParameter;
}
export declare class WindowCoveringCCGet extends WindowCoveringCC {
    constructor(options: WithAddress<WindowCoveringCCGetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): WindowCoveringCCGet;
    parameter: WindowCoveringParameter;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface WindowCoveringCCSetOptions {
    targetValues: {
        parameter: WindowCoveringParameter;
        value: number;
    }[];
    duration?: Duration | string;
}
export declare class WindowCoveringCCSet extends WindowCoveringCC {
    constructor(options: WithAddress<WindowCoveringCCSetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): WindowCoveringCCSet;
    targetValues: {
        parameter: WindowCoveringParameter;
        value: number;
    }[];
    duration: Duration | undefined;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface WindowCoveringCCStartLevelChangeOptions {
    parameter: WindowCoveringParameter;
    direction: keyof typeof LevelChangeDirection;
    duration?: Duration | string;
}
export declare class WindowCoveringCCStartLevelChange extends WindowCoveringCC {
    constructor(options: WithAddress<WindowCoveringCCStartLevelChangeOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): WindowCoveringCCStartLevelChange;
    parameter: WindowCoveringParameter;
    direction: keyof typeof LevelChangeDirection;
    duration: Duration | undefined;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface WindowCoveringCCStopLevelChangeOptions {
    parameter: WindowCoveringParameter;
}
export declare class WindowCoveringCCStopLevelChange extends WindowCoveringCC {
    constructor(options: WithAddress<WindowCoveringCCStopLevelChangeOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): WindowCoveringCCStopLevelChange;
    parameter: WindowCoveringParameter;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
//# sourceMappingURL=WindowCoveringCC.d.ts.map