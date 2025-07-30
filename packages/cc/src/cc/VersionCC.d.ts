import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { CommandClasses, type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type WithAddress, ZWaveLibraryTypes } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { PhysicalCCAPI } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext } from "../lib/CommandClass.js";
import { VersionCommand } from "../lib/_Types.js";
export declare const VersionCCValues: Readonly<{
    firmwareVersions: {
        id: {
            readonly commandClass: CommandClasses.Version;
            readonly property: "firmwareVersions";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: CommandClasses.Version;
            readonly endpoint: 0;
            readonly property: "firmwareVersions";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly type: "string[]";
            readonly label: "Z-Wave chip firmware versions";
            readonly writeable: false;
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
    libraryType: {
        id: {
            readonly commandClass: CommandClasses.Version;
            readonly property: "libraryType";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: CommandClasses.Version;
            readonly endpoint: 0;
            readonly property: "libraryType";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Library type";
            readonly states: Record<number, string>;
            readonly writeable: false;
            readonly type: "number";
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
    protocolVersion: {
        id: {
            readonly commandClass: CommandClasses.Version;
            readonly property: "protocolVersion";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: CommandClasses.Version;
            readonly endpoint: 0;
            readonly property: "protocolVersion";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Z-Wave protocol version";
            readonly writeable: false;
            readonly type: "string";
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
    hardwareVersion: {
        id: {
            readonly commandClass: CommandClasses.Version;
            readonly property: "hardwareVersion";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: CommandClasses.Version;
            readonly endpoint: 0;
            readonly property: "hardwareVersion";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Z-Wave chip hardware version";
            readonly writeable: false;
            readonly type: "number";
            readonly readable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 2;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: false;
            readonly autoCreate: true;
        };
    };
    supportsZWaveSoftwareGet: {
        id: {
            readonly commandClass: CommandClasses.Version;
            readonly property: "supportsZWaveSoftwareGet";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Version;
            readonly endpoint: number;
            readonly property: "supportsZWaveSoftwareGet";
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
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    sdkVersion: {
        id: {
            readonly commandClass: CommandClasses.Version;
            readonly property: "sdkVersion";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: CommandClasses.Version;
            readonly endpoint: 0;
            readonly property: "sdkVersion";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "SDK version";
            readonly writeable: false;
            readonly type: "string";
            readonly readable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 3;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: false;
            readonly autoCreate: true;
        };
    };
    applicationFrameworkAPIVersion: {
        id: {
            readonly commandClass: CommandClasses.Version;
            readonly property: "applicationFrameworkAPIVersion";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: CommandClasses.Version;
            readonly endpoint: 0;
            readonly property: "applicationFrameworkAPIVersion";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Z-Wave application framework API version";
            readonly writeable: false;
            readonly type: "string";
            readonly readable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 3;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: false;
            readonly autoCreate: true;
        };
    };
    applicationFrameworkBuildNumber: {
        id: {
            readonly commandClass: CommandClasses.Version;
            readonly property: "applicationFrameworkBuildNumber";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: CommandClasses.Version;
            readonly endpoint: 0;
            readonly property: "applicationFrameworkBuildNumber";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Z-Wave application framework API build number";
            readonly writeable: false;
            readonly type: "string";
            readonly readable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 3;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: false;
            readonly autoCreate: true;
        };
    };
    serialAPIVersion: {
        id: {
            readonly commandClass: CommandClasses.Version;
            readonly property: "hostInterfaceVersion";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: CommandClasses.Version;
            readonly endpoint: 0;
            readonly property: "hostInterfaceVersion";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Serial API version";
            readonly writeable: false;
            readonly type: "string";
            readonly readable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 3;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: false;
            readonly autoCreate: true;
        };
    };
    serialAPIBuildNumber: {
        id: {
            readonly commandClass: CommandClasses.Version;
            readonly property: "hostInterfaceBuildNumber";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: CommandClasses.Version;
            readonly endpoint: 0;
            readonly property: "hostInterfaceBuildNumber";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Serial API build number";
            readonly writeable: false;
            readonly type: "string";
            readonly readable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 3;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: false;
            readonly autoCreate: true;
        };
    };
    zWaveProtocolVersion: {
        id: {
            readonly commandClass: CommandClasses.Version;
            readonly property: "zWaveProtocolVersion";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: CommandClasses.Version;
            readonly endpoint: 0;
            readonly property: "zWaveProtocolVersion";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Z-Wave protocol version";
            readonly writeable: false;
            readonly type: "string";
            readonly readable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 3;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: false;
            readonly autoCreate: true;
        };
    };
    zWaveProtocolBuildNumber: {
        id: {
            readonly commandClass: CommandClasses.Version;
            readonly property: "zWaveProtocolBuildNumber";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: CommandClasses.Version;
            readonly endpoint: 0;
            readonly property: "zWaveProtocolBuildNumber";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Z-Wave protocol build number";
            readonly writeable: false;
            readonly type: "string";
            readonly readable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 3;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: false;
            readonly autoCreate: true;
        };
    };
    applicationVersion: {
        id: {
            readonly commandClass: CommandClasses.Version;
            readonly property: "applicationVersion";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: CommandClasses.Version;
            readonly endpoint: 0;
            readonly property: "applicationVersion";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Application version";
            readonly writeable: false;
            readonly type: "string";
            readonly readable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 3;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: false;
            readonly autoCreate: true;
        };
    };
    applicationBuildNumber: {
        id: {
            readonly commandClass: CommandClasses.Version;
            readonly property: "applicationBuildNumber";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: CommandClasses.Version;
            readonly endpoint: 0;
            readonly property: "applicationBuildNumber";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Application build number";
            readonly writeable: false;
            readonly type: "string";
            readonly readable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 3;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: false;
            readonly autoCreate: true;
        };
    };
}>;
export declare class VersionCCAPI extends PhysicalCCAPI {
    supportsCommand(cmd: VersionCommand): MaybeNotKnown<boolean>;
    get(): Promise<Pick<VersionCCReport, "protocolVersion" | "firmwareVersions" | "libraryType" | "hardwareVersion"> | undefined>;
    sendReport(options: VersionCCReportOptions): Promise<void>;
    getCCVersion(requestedCC: CommandClasses): Promise<MaybeNotKnown<number>>;
    reportCCVersion(requestedCC: CommandClasses, version?: number): Promise<void>;
    getCapabilities(): Promise<Pick<VersionCCCapabilitiesReport, "supportsZWaveSoftwareGet"> | undefined>;
    reportCapabilities(): Promise<void>;
    getZWaveSoftware(): Promise<Pick<VersionCCZWaveSoftwareReport, "sdkVersion" | "applicationFrameworkAPIVersion" | "applicationFrameworkBuildNumber" | "hostInterfaceVersion" | "hostInterfaceBuildNumber" | "zWaveProtocolVersion" | "zWaveProtocolBuildNumber" | "applicationVersion" | "applicationBuildNumber"> | undefined>;
}
export declare class VersionCC extends CommandClass {
    ccCommand: VersionCommand;
    determineRequiredCCInterviews(): readonly CommandClasses[];
    interview(ctx: InterviewContext): Promise<void>;
}
export interface VersionCCReportOptions {
    libraryType: ZWaveLibraryTypes;
    protocolVersion: string;
    firmwareVersions: string[];
    hardwareVersion?: number;
}
export declare class VersionCCReport extends VersionCC {
    constructor(options: WithAddress<VersionCCReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): VersionCCReport;
    readonly libraryType: ZWaveLibraryTypes;
    readonly protocolVersion: string;
    readonly firmwareVersions: string[];
    readonly hardwareVersion: number | undefined;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class VersionCCGet extends VersionCC {
}
export interface VersionCCCommandClassReportOptions {
    requestedCC: CommandClasses;
    ccVersion: number;
}
export declare class VersionCCCommandClassReport extends VersionCC {
    constructor(options: WithAddress<VersionCCCommandClassReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): VersionCCCommandClassReport;
    ccVersion: number;
    requestedCC: CommandClasses;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface VersionCCCommandClassGetOptions {
    requestedCC: CommandClasses;
}
export declare class VersionCCCommandClassGet extends VersionCC {
    constructor(options: WithAddress<VersionCCCommandClassGetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): VersionCCCommandClassGet;
    requestedCC: CommandClasses;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface VersionCCCapabilitiesReportOptions {
    supportsZWaveSoftwareGet: boolean;
}
export declare class VersionCCCapabilitiesReport extends VersionCC {
    constructor(options: WithAddress<VersionCCCapabilitiesReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): VersionCCCapabilitiesReport;
    supportsZWaveSoftwareGet: boolean;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class VersionCCCapabilitiesGet extends VersionCC {
}
export interface VersionCCZWaveSoftwareReportOptions {
    sdkVersion: string;
    applicationFrameworkAPIVersion: string;
    applicationFrameworkBuildNumber: number;
    hostInterfaceVersion: string;
    hostInterfaceBuildNumber: number;
    zWaveProtocolVersion: string;
    zWaveProtocolBuildNumber: number;
    applicationVersion: string;
    applicationBuildNumber: number;
}
export declare class VersionCCZWaveSoftwareReport extends VersionCC {
    constructor(options: WithAddress<VersionCCZWaveSoftwareReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): VersionCCZWaveSoftwareReport;
    readonly sdkVersion: string;
    readonly applicationFrameworkAPIVersion: string;
    readonly applicationFrameworkBuildNumber: number;
    readonly hostInterfaceVersion: string;
    readonly hostInterfaceBuildNumber: number;
    readonly zWaveProtocolVersion: string;
    readonly zWaveProtocolBuildNumber: number;
    readonly applicationVersion: string;
    readonly applicationBuildNumber: number;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class VersionCCZWaveSoftwareGet extends VersionCC {
}
//# sourceMappingURL=VersionCC.d.ts.map