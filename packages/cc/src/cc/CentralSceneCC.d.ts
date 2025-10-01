import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { CommandClasses, type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type SupervisionResult, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { CCAPI, POLL_VALUE, type PollValueImplementation, SET_VALUE, type SetValueImplementation } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext, type PersistValuesContext } from "../lib/CommandClass.js";
import { CentralSceneCommand, CentralSceneKeys } from "../lib/_Types.js";
export declare const CentralSceneCCValues: Readonly<{
    sceneCount: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Central Scene"];
            readonly property: "sceneCount";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Central Scene"];
            readonly endpoint: number;
            readonly property: "sceneCount";
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
    supportsSlowRefresh: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Central Scene"];
            readonly property: "supportsSlowRefresh";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Central Scene"];
            readonly endpoint: number;
            readonly property: "supportsSlowRefresh";
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
    supportedKeyAttributes: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Central Scene"];
            readonly property: "supportedKeyAttributes";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Central Scene"];
            readonly endpoint: number;
            readonly property: "supportedKeyAttributes";
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
    slowRefresh: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Central Scene"];
            readonly property: "slowRefresh";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Central Scene"];
            readonly endpoint: number;
            readonly property: "slowRefresh";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Send held down notifications at a slow rate";
            readonly description: "When this is true, KeyHeldDown notifications are sent every 55s. When this is false, the notifications are sent every 200ms.";
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
    scene: ((sceneNumber: number) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Central Scene"];
            readonly property: "scene";
            readonly propertyKey: string;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Central Scene"];
            readonly endpoint: number;
            readonly property: "scene";
            readonly propertyKey: string;
        };
        readonly meta: {
            readonly label: `Scene ${string}`;
            readonly writeable: false;
            readonly min: 0;
            readonly max: 255;
            readonly type: "number";
            readonly readable: true;
        };
    }) & {
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        options: {
            readonly internal: false;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: false;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
}>;
export declare class CentralSceneCCAPI extends CCAPI {
    supportsCommand(cmd: CentralSceneCommand): MaybeNotKnown<boolean>;
    getSupported(): Promise<Pick<CentralSceneCCSupportedReport, "sceneCount" | "supportsSlowRefresh" | "supportedKeyAttributes"> | undefined>;
    getConfiguration(): Promise<Pick<CentralSceneCCConfigurationReport, "slowRefresh"> | undefined>;
    setConfiguration(slowRefresh: boolean): Promise<SupervisionResult | undefined>;
    protected get [SET_VALUE](): SetValueImplementation;
    protected get [POLL_VALUE](): PollValueImplementation;
}
export declare class CentralSceneCC extends CommandClass {
    ccCommand: CentralSceneCommand;
    determineRequiredCCInterviews(): readonly CommandClasses[];
    skipEndpointInterview(): boolean;
    interview(ctx: InterviewContext): Promise<void>;
}
export interface CentralSceneCCNotificationOptions {
    sequenceNumber: number;
    keyAttribute: CentralSceneKeys;
    sceneNumber: number;
    slowRefresh?: boolean;
}
export declare class CentralSceneCCNotification extends CentralSceneCC {
    constructor(options: WithAddress<CentralSceneCCNotificationOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): CentralSceneCCNotification;
    persistValues(ctx: PersistValuesContext): boolean;
    readonly sequenceNumber: number;
    readonly keyAttribute: CentralSceneKeys;
    readonly sceneNumber: number;
    readonly slowRefresh: boolean | undefined;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface CentralSceneCCSupportedReportOptions {
    sceneCount: number;
    supportsSlowRefresh: MaybeNotKnown<boolean>;
    supportedKeyAttributes: Record<number, readonly CentralSceneKeys[]>;
}
export declare class CentralSceneCCSupportedReport extends CentralSceneCC {
    constructor(options: WithAddress<CentralSceneCCSupportedReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): CentralSceneCCSupportedReport;
    persistValues(ctx: PersistValuesContext): boolean;
    readonly sceneCount: number;
    readonly supportsSlowRefresh: MaybeNotKnown<boolean>;
    private _supportedKeyAttributes;
    get supportedKeyAttributes(): ReadonlyMap<number, readonly CentralSceneKeys[]>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class CentralSceneCCSupportedGet extends CentralSceneCC {
}
export interface CentralSceneCCConfigurationReportOptions {
    slowRefresh: boolean;
}
export declare class CentralSceneCCConfigurationReport extends CentralSceneCC {
    constructor(options: WithAddress<CentralSceneCCConfigurationReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): CentralSceneCCConfigurationReport;
    readonly slowRefresh: boolean;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class CentralSceneCCConfigurationGet extends CentralSceneCC {
}
export interface CentralSceneCCConfigurationSetOptions {
    slowRefresh: boolean;
}
export declare class CentralSceneCCConfigurationSet extends CentralSceneCC {
    constructor(options: WithAddress<CentralSceneCCConfigurationSetOptions>);
    static from(_raw: CCRaw, _ctx: CCParsingContext): CentralSceneCCConfigurationSet;
    slowRefresh: boolean;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
//# sourceMappingURL=CentralSceneCC.d.ts.map