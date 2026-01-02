import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { CommandClasses, type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { PhysicalCCAPI } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext } from "../lib/CommandClass.js";
import { ZWavePlusCommand, ZWavePlusNodeType, ZWavePlusRoleType } from "../lib/_Types.js";
export declare const ZWavePlusCCValues: Readonly<{
    zwavePlusVersion: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Z-Wave Plus Info"];
            readonly property: "zwavePlusVersion";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Z-Wave Plus Info"];
            readonly endpoint: 0;
            readonly property: "zwavePlusVersion";
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
    nodeType: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Z-Wave Plus Info"];
            readonly property: "nodeType";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Z-Wave Plus Info"];
            readonly endpoint: 0;
            readonly property: "nodeType";
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
    roleType: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Z-Wave Plus Info"];
            readonly property: "roleType";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Z-Wave Plus Info"];
            readonly endpoint: 0;
            readonly property: "roleType";
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
    userIcon: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Z-Wave Plus Info"];
            readonly property: "userIcon";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Z-Wave Plus Info"];
            readonly endpoint: number;
            readonly property: "userIcon";
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
    installerIcon: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Z-Wave Plus Info"];
            readonly property: "installerIcon";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Z-Wave Plus Info"];
            readonly endpoint: number;
            readonly property: "installerIcon";
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
}>;
export declare class ZWavePlusCCAPI extends PhysicalCCAPI {
    supportsCommand(cmd: ZWavePlusCommand): MaybeNotKnown<boolean>;
    get(): Promise<Pick<ZWavePlusCCReport, "nodeType" | "zwavePlusVersion" | "roleType" | "userIcon" | "installerIcon"> | undefined>;
    sendReport(options: ZWavePlusCCReportOptions): Promise<void>;
}
export declare class ZWavePlusCC extends CommandClass {
    ccCommand: ZWavePlusCommand;
    interview(ctx: InterviewContext): Promise<void>;
}
export interface ZWavePlusCCReportOptions {
    zwavePlusVersion: number;
    nodeType: ZWavePlusNodeType;
    roleType: ZWavePlusRoleType;
    installerIcon: number;
    userIcon: number;
}
export declare class ZWavePlusCCReport extends ZWavePlusCC {
    constructor(options: WithAddress<ZWavePlusCCReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ZWavePlusCCReport;
    zwavePlusVersion: number;
    nodeType: ZWavePlusNodeType;
    roleType: ZWavePlusRoleType;
    installerIcon: number;
    userIcon: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class ZWavePlusCCGet extends ZWavePlusCC {
}
//# sourceMappingURL=ZWavePlusCC.d.ts.map