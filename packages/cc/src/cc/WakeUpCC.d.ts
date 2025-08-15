import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { CommandClasses, type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type SupervisionResult, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { CCAPI, POLL_VALUE, type PollValueImplementation, SET_VALUE, type SetValueImplementation } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext, type PersistValuesContext } from "../lib/CommandClass.js";
import { WakeUpCommand } from "../lib/_Types.js";
export declare const WakeUpCCValues: Readonly<{
    controllerNodeId: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Wake Up"];
            readonly property: "controllerNodeId";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Wake Up"];
            readonly endpoint: 0;
            readonly property: "controllerNodeId";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Node ID of the controller";
            readonly writeable: false;
            readonly type: "any";
            readonly readable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: false;
            readonly autoCreate: true;
        };
    };
    wakeUpInterval: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Wake Up"];
            readonly property: "wakeUpInterval";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Wake Up"];
            readonly endpoint: 0;
            readonly property: "wakeUpInterval";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Wake Up interval";
            readonly min: 0;
            readonly max: 16777215;
            readonly type: "number";
            readonly readable: true;
            readonly writeable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: false;
            readonly autoCreate: true;
        };
    };
    wakeUpOnDemandSupported: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Wake Up"];
            readonly property: "wakeUpOnDemandSupported";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Wake Up"];
            readonly endpoint: 0;
            readonly property: "wakeUpOnDemandSupported";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: Readonly<{
            readonly type: "any";
            readonly readable: true;
            readonly writeable: true;
        }>;
        options: {
            readonly internal: true;
            readonly minVersion: 3;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: false;
            readonly autoCreate: true;
        };
    };
}>;
export declare class WakeUpCCAPI extends CCAPI {
    supportsCommand(cmd: WakeUpCommand): MaybeNotKnown<boolean>;
    protected get [SET_VALUE](): SetValueImplementation;
    protected get [POLL_VALUE](): PollValueImplementation;
    getInterval(): Promise<Pick<WakeUpCCIntervalReport, "controllerNodeId" | "wakeUpInterval"> | undefined>;
    getIntervalCapabilities(): Promise<Pick<WakeUpCCIntervalCapabilitiesReport, "wakeUpOnDemandSupported" | "defaultWakeUpInterval" | "minWakeUpInterval" | "maxWakeUpInterval" | "wakeUpIntervalSteps"> | undefined>;
    setInterval(wakeUpInterval: number, controllerNodeId: number): Promise<SupervisionResult | undefined>;
    sendNoMoreInformation(): Promise<void>;
}
export declare class WakeUpCC extends CommandClass {
    ccCommand: WakeUpCommand;
    interview(ctx: InterviewContext): Promise<void>;
}
export interface WakeUpCCIntervalSetOptions {
    wakeUpInterval: number;
    controllerNodeId: number;
}
export declare class WakeUpCCIntervalSet extends WakeUpCC {
    constructor(options: WithAddress<WakeUpCCIntervalSetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): WakeUpCCIntervalSet;
    wakeUpInterval: number;
    controllerNodeId: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface WakeUpCCIntervalReportOptions {
    wakeUpInterval: number;
    controllerNodeId: number;
}
export declare class WakeUpCCIntervalReport extends WakeUpCC {
    constructor(options: WithAddress<WakeUpCCIntervalReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): WakeUpCCIntervalReport;
    readonly wakeUpInterval: number;
    readonly controllerNodeId: number;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class WakeUpCCIntervalGet extends WakeUpCC {
}
export declare class WakeUpCCWakeUpNotification extends WakeUpCC {
}
export declare class WakeUpCCNoMoreInformation extends WakeUpCC {
}
export interface WakeUpCCIntervalCapabilitiesReportOptions {
    minWakeUpInterval: number;
    maxWakeUpInterval: number;
    defaultWakeUpInterval: number;
    wakeUpIntervalSteps: number;
    wakeUpOnDemandSupported: boolean;
}
export declare class WakeUpCCIntervalCapabilitiesReport extends WakeUpCC {
    constructor(options: WithAddress<WakeUpCCIntervalCapabilitiesReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): WakeUpCCIntervalCapabilitiesReport;
    persistValues(ctx: PersistValuesContext): boolean;
    readonly minWakeUpInterval: number;
    readonly maxWakeUpInterval: number;
    readonly defaultWakeUpInterval: number;
    readonly wakeUpIntervalSteps: number;
    readonly wakeUpOnDemandSupported: boolean;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class WakeUpCCIntervalCapabilitiesGet extends WakeUpCC {
}
//# sourceMappingURL=WakeUpCC.d.ts.map