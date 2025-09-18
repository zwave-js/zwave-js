import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { CommandClasses, Duration, type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type SupervisionResult, type ValueID, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { CCAPI, POLL_VALUE, type PollValueImplementation, SET_VALUE, type SetValueImplementation } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext, type PersistValuesContext, type RefreshValuesContext } from "../lib/CommandClass.js";
import { ColorComponent, ColorSwitchCommand, type ColorTable, LevelChangeDirection } from "../lib/_Types.js";
export declare const ColorSwitchCCValues: Readonly<{
    supportedColorComponents: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Color Switch"];
            readonly property: "supportedColorComponents";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Color Switch"];
            readonly endpoint: number;
            readonly property: "supportedColorComponents";
        };
        is: (valueId: ValueID) => boolean;
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
    supportsHexColor: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Color Switch"];
            readonly property: "supportsHexColor";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Color Switch"];
            readonly endpoint: number;
            readonly property: "supportsHexColor";
        };
        is: (valueId: ValueID) => boolean;
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
    currentColor: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Color Switch"];
            readonly property: "currentColor";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Color Switch"];
            readonly endpoint: number;
            readonly property: "currentColor";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Current color";
            readonly writeable: false;
            readonly type: "any";
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
    targetColor: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Color Switch"];
            readonly property: "targetColor";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Color Switch"];
            readonly endpoint: number;
            readonly property: "targetColor";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly label: "Target color";
            readonly valueChangeOptions: readonly ["transitionDuration"];
            readonly type: "any";
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
            readonly commandClass: (typeof CommandClasses)["Color Switch"];
            readonly property: "duration";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Color Switch"];
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
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    hexColor: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Color Switch"];
            readonly property: "hexColor";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Color Switch"];
            readonly endpoint: number;
            readonly property: "hexColor";
        };
        is: (valueId: ValueID) => boolean;
        readonly meta: {
            readonly minLength: 6;
            readonly maxLength: 7;
            readonly label: "RGB Color";
            readonly valueChangeOptions: readonly ["transitionDuration"];
            readonly type: "color";
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
    currentColorChannel: ((component: ColorComponent) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Color Switch"];
            readonly property: "currentColor";
            readonly propertyKey: ColorComponent;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Color Switch"];
            readonly endpoint: number;
            readonly property: "currentColor";
            readonly propertyKey: ColorComponent;
        };
        readonly meta: {
            readonly label: `Current value (${string})`;
            readonly description: `The current value of the ${string} channel.`;
            readonly writeable: false;
            readonly min: 0;
            readonly max: 255;
            readonly type: "number";
            readonly readable: true;
        };
    }) & {
        is: (valueId: ValueID) => boolean;
        options: {
            readonly internal: false;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    targetColorChannel: ((component: ColorComponent) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Color Switch"];
            readonly property: "targetColor";
            readonly propertyKey: ColorComponent;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Color Switch"];
            readonly endpoint: number;
            readonly property: "targetColor";
            readonly propertyKey: ColorComponent;
        };
        readonly meta: {
            readonly label: `Target value (${string})`;
            readonly description: `The target value of the ${string} channel.`;
            readonly valueChangeOptions: readonly ["transitionDuration"];
            readonly min: 0;
            readonly max: 255;
            readonly type: "number";
            readonly readable: true;
            readonly writeable: true;
        };
    }) & {
        is: (valueId: ValueID) => boolean;
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
export declare class ColorSwitchCCAPI extends CCAPI {
    supportsCommand(cmd: ColorSwitchCommand): MaybeNotKnown<boolean>;
    getSupported(): Promise<MaybeNotKnown<readonly ColorComponent[]>>;
    get(component: ColorComponent): Promise<Pick<ColorSwitchCCReport, "duration" | "currentValue" | "targetValue"> | undefined>;
    set(options: ColorSwitchCCSetOptions): Promise<SupervisionResult | undefined>;
    /** Updates the current color for a given node by merging in the given changes */
    private updateCurrentColor;
    startLevelChange(options: ColorSwitchCCStartLevelChangeOptions): Promise<SupervisionResult | undefined>;
    stopLevelChange(colorComponent: ColorComponent): Promise<SupervisionResult | undefined>;
    protected get [SET_VALUE](): SetValueImplementation;
    isSetValueOptimistic(_valueId: ValueID): boolean;
    protected get [POLL_VALUE](): PollValueImplementation;
}
export declare class ColorSwitchCC extends CommandClass {
    ccCommand: ColorSwitchCommand;
    interview(ctx: InterviewContext): Promise<void>;
    refreshValues(ctx: RefreshValuesContext): Promise<void>;
    translatePropertyKey(ctx: GetValueDB, property: string | number, propertyKey: string | number): string | undefined;
}
export interface ColorSwitchCCSupportedReportOptions {
    supportedColorComponents: readonly ColorComponent[];
}
export declare class ColorSwitchCCSupportedReport extends ColorSwitchCC {
    constructor(options: WithAddress<ColorSwitchCCSupportedReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ColorSwitchCCSupportedReport;
    readonly supportedColorComponents: readonly ColorComponent[];
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class ColorSwitchCCSupportedGet extends ColorSwitchCC {
}
export interface ColorSwitchCCReportOptions {
    colorComponent: ColorComponent;
    currentValue: number;
    targetValue?: number;
    duration?: Duration | string;
}
export declare class ColorSwitchCCReport extends ColorSwitchCC {
    constructor(options: WithAddress<ColorSwitchCCReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ColorSwitchCCReport;
    persistValues(ctx: PersistValuesContext): boolean;
    readonly colorComponent: ColorComponent;
    readonly currentValue: number;
    readonly targetValue: number | undefined;
    readonly duration: Duration | undefined;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface ColorSwitchCCGetOptions {
    colorComponent: ColorComponent;
}
export declare class ColorSwitchCCGet extends ColorSwitchCC {
    constructor(options: WithAddress<ColorSwitchCCGetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ColorSwitchCCGet;
    private _colorComponent;
    get colorComponent(): ColorComponent;
    set colorComponent(value: ColorComponent);
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export type ColorSwitchCCSetOptions = (ColorTable | {
    hexColor: string;
}) & {
    duration?: Duration | string;
};
export declare class ColorSwitchCCSet extends ColorSwitchCC {
    constructor(options: WithAddress<ColorSwitchCCSetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ColorSwitchCCSet;
    colorTable: ColorTable;
    duration: Duration | undefined;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export type ColorSwitchCCStartLevelChangeOptions = {
    colorComponent: ColorComponent;
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
export declare class ColorSwitchCCStartLevelChange extends ColorSwitchCC {
    constructor(options: WithAddress<ColorSwitchCCStartLevelChangeOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ColorSwitchCCStartLevelChange;
    duration: Duration | undefined;
    startLevel: number;
    ignoreStartLevel: boolean;
    direction: keyof typeof LevelChangeDirection;
    colorComponent: ColorComponent;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface ColorSwitchCCStopLevelChangeOptions {
    colorComponent: ColorComponent;
}
export declare class ColorSwitchCCStopLevelChange extends ColorSwitchCC {
    constructor(options: WithAddress<ColorSwitchCCStopLevelChangeOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ColorSwitchCCStopLevelChange;
    readonly colorComponent: ColorComponent;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
//# sourceMappingURL=ColorSwitchCC.d.ts.map