import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { CommandClasses, Duration, type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type SupervisionResult, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { CCAPI, POLL_VALUE, type PollValueImplementation, SET_VALUE, type SetValueImplementation } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext, type PersistValuesContext } from "../lib/CommandClass.js";
import { SceneActuatorConfigurationCommand } from "../lib/_Types.js";
export declare const SceneActuatorConfigurationCCValues: Readonly<{
    level: ((sceneId: number) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Scene Actuator Configuration"];
            readonly property: "level";
            readonly propertyKey: number;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Scene Actuator Configuration"];
            readonly endpoint: number;
            readonly property: "level";
            readonly propertyKey: number;
        };
        readonly meta: {
            readonly label: `Level (${number})`;
            readonly valueChangeOptions: readonly ["transitionDuration"];
            readonly min: 0;
            readonly max: 255;
            readonly type: "number";
            readonly readable: true;
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
    dimmingDuration: ((sceneId: number) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Scene Actuator Configuration"];
            readonly property: "dimmingDuration";
            readonly propertyKey: number;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Scene Actuator Configuration"];
            readonly endpoint: number;
            readonly property: "dimmingDuration";
            readonly propertyKey: number;
        };
        readonly meta: {
            readonly label: `Dimming duration (${number})`;
            readonly type: "duration";
            readonly readable: true;
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
export declare class SceneActuatorConfigurationCCAPI extends CCAPI {
    supportsCommand(cmd: SceneActuatorConfigurationCommand): MaybeNotKnown<boolean>;
    protected get [SET_VALUE](): SetValueImplementation;
    protected get [POLL_VALUE](): PollValueImplementation;
    set(sceneId: number, dimmingDuration?: Duration | string, level?: number): Promise<SupervisionResult | undefined>;
    getActive(): Promise<MaybeNotKnown<Pick<SceneActuatorConfigurationCCReport, "sceneId" | "level" | "dimmingDuration">>>;
    get(sceneId: number): Promise<MaybeNotKnown<Pick<SceneActuatorConfigurationCCReport, "level" | "dimmingDuration">>>;
}
export declare class SceneActuatorConfigurationCC extends CommandClass {
    ccCommand: SceneActuatorConfigurationCommand;
    interview(ctx: InterviewContext): Promise<void>;
}
export interface SceneActuatorConfigurationCCSetOptions {
    sceneId: number;
    dimmingDuration: Duration;
    level?: number;
}
export declare class SceneActuatorConfigurationCCSet extends SceneActuatorConfigurationCC {
    constructor(options: WithAddress<SceneActuatorConfigurationCCSetOptions>);
    static from(_raw: CCRaw, _ctx: CCParsingContext): SceneActuatorConfigurationCCSet;
    sceneId: number;
    dimmingDuration: Duration;
    level?: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface SceneActuatorConfigurationCCReportOptions {
    sceneId: number;
    level?: number;
    dimmingDuration?: Duration;
}
export declare class SceneActuatorConfigurationCCReport extends SceneActuatorConfigurationCC {
    constructor(options: WithAddress<SceneActuatorConfigurationCCReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): SceneActuatorConfigurationCCReport;
    readonly sceneId: number;
    readonly level?: number;
    readonly dimmingDuration?: Duration;
    persistValues(ctx: PersistValuesContext): boolean;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface SceneActuatorConfigurationCCGetOptions {
    sceneId: number;
}
export declare class SceneActuatorConfigurationCCGet extends SceneActuatorConfigurationCC {
    constructor(options: WithAddress<SceneActuatorConfigurationCCGetOptions>);
    static from(_raw: CCRaw, _ctx: CCParsingContext): SceneActuatorConfigurationCCGet;
    sceneId: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
//# sourceMappingURL=SceneActuatorConfigurationCC.d.ts.map