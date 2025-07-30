import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import type { GetDeviceConfig } from "@zwave-js/config";
import { CommandClasses, Duration, type EndpointId, type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type SupervisionResult, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { CCAPI, POLL_VALUE, type PollValueImplementation, SET_VALUE, type SetValueImplementation } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext, type PersistValuesContext, type RefreshValuesContext } from "../lib/CommandClass.js";
import { SceneControllerConfigurationCommand } from "../lib/_Types.js";
export declare const SceneControllerConfigurationCCValues: Readonly<{
    sceneId: ((groupId: number) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Scene Controller Configuration"];
            readonly property: "sceneId";
            readonly propertyKey: number;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Scene Controller Configuration"];
            readonly endpoint: number;
            readonly property: "sceneId";
            readonly propertyKey: number;
        };
        readonly meta: {
            readonly label: `Associated Scene ID (${number})`;
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
    dimmingDuration: ((groupId: number) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Scene Controller Configuration"];
            readonly property: "dimmingDuration";
            readonly propertyKey: number;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Scene Controller Configuration"];
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
export declare class SceneControllerConfigurationCCAPI extends CCAPI {
    supportsCommand(cmd: SceneControllerConfigurationCommand): MaybeNotKnown<boolean>;
    protected get [SET_VALUE](): SetValueImplementation;
    protected get [POLL_VALUE](): PollValueImplementation;
    disable(groupId: number): Promise<SupervisionResult | undefined>;
    set(groupId: number, sceneId: number, dimmingDuration?: Duration | string): Promise<SupervisionResult | undefined>;
    getLastActivated(): Promise<MaybeNotKnown<Pick<SceneControllerConfigurationCCReport, "groupId" | "sceneId" | "dimmingDuration">>>;
    get(groupId: number): Promise<MaybeNotKnown<Pick<SceneControllerConfigurationCCReport, "sceneId" | "dimmingDuration">>>;
}
export declare class SceneControllerConfigurationCC extends CommandClass {
    ccCommand: SceneControllerConfigurationCommand;
    determineRequiredCCInterviews(): readonly CommandClasses[];
    interview(ctx: InterviewContext): Promise<void>;
    refreshValues(ctx: RefreshValuesContext): Promise<void>;
    /**
     * Returns the number of association groups reported by the node.
     * This only works AFTER the node has been interviewed by this CC
     * or the AssociationCC.
     */
    static getGroupCountCached(ctx: GetValueDB & GetDeviceConfig, endpoint: EndpointId): number;
}
export interface SceneControllerConfigurationCCSetOptions {
    groupId: number;
    sceneId: number;
    dimmingDuration?: Duration | string;
}
export declare class SceneControllerConfigurationCCSet extends SceneControllerConfigurationCC {
    constructor(options: WithAddress<SceneControllerConfigurationCCSetOptions>);
    static from(_raw: CCRaw, _ctx: CCParsingContext): SceneControllerConfigurationCCSet;
    groupId: number;
    sceneId: number;
    dimmingDuration: Duration;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface SceneControllerConfigurationCCReportOptions {
    groupId: number;
    sceneId: number;
    dimmingDuration: Duration;
}
export declare class SceneControllerConfigurationCCReport extends SceneControllerConfigurationCC {
    constructor(options: WithAddress<SceneControllerConfigurationCCReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): SceneControllerConfigurationCCReport;
    readonly groupId: number;
    readonly sceneId: number;
    readonly dimmingDuration: Duration;
    persistValues(ctx: PersistValuesContext): boolean;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface SceneControllerConfigurationCCGetOptions {
    groupId: number;
}
export declare class SceneControllerConfigurationCCGet extends SceneControllerConfigurationCC {
    constructor(options: WithAddress<SceneControllerConfigurationCCGetOptions>);
    static from(_raw: CCRaw, _ctx: CCParsingContext): SceneControllerConfigurationCCGet;
    groupId: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
//# sourceMappingURL=SceneControllerConfigurationCC.d.ts.map