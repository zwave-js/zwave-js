import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { CommandClasses, type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type WithAddress } from "@zwave-js/core";
import { type AllOrNone, Bytes } from "@zwave-js/shared";
import { PhysicalCCAPI } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext } from "../lib/CommandClass.js";
import { FirmwareDownloadStatus, FirmwareUpdateActivationStatus, type FirmwareUpdateMetaData, FirmwareUpdateMetaDataCommand, FirmwareUpdateRequestStatus, FirmwareUpdateStatus } from "../lib/_Types.js";
export declare const FirmwareUpdateMetaDataCCValues: Readonly<{
    supportsActivation: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Firmware Update Meta Data"];
            readonly property: "supportsActivation";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Firmware Update Meta Data"];
            readonly endpoint: number;
            readonly property: "supportsActivation";
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
    firmwareUpgradable: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Firmware Update Meta Data"];
            readonly property: "firmwareUpgradable";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Firmware Update Meta Data"];
            readonly endpoint: number;
            readonly property: "firmwareUpgradable";
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
    additionalFirmwareIDs: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Firmware Update Meta Data"];
            readonly property: "additionalFirmwareIDs";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Firmware Update Meta Data"];
            readonly endpoint: number;
            readonly property: "additionalFirmwareIDs";
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
    continuesToFunction: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Firmware Update Meta Data"];
            readonly property: "continuesToFunction";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Firmware Update Meta Data"];
            readonly endpoint: number;
            readonly property: "continuesToFunction";
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
    supportsResuming: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Firmware Update Meta Data"];
            readonly property: "supportsResuming";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Firmware Update Meta Data"];
            readonly endpoint: number;
            readonly property: "supportsResuming";
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
    supportsNonSecureTransfer: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Firmware Update Meta Data"];
            readonly property: "supportsNonSecureTransfer";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Firmware Update Meta Data"];
            readonly endpoint: number;
            readonly property: "supportsNonSecureTransfer";
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
export declare class FirmwareUpdateMetaDataCCAPI extends PhysicalCCAPI {
    supportsCommand(cmd: FirmwareUpdateMetaDataCommand): MaybeNotKnown<boolean>;
    /**
     * Requests information about the current firmware on the device
     */
    getMetaData(): Promise<MaybeNotKnown<FirmwareUpdateMetaData>>;
    reportMetaData(options: FirmwareUpdateMetaDataCCMetaDataReportOptions): Promise<void>;
    /**
     * Requests the device to start the firmware update process and waits for a response.
     * This response may time out on some devices, in which case the caller of this method
     * should wait manually.
     */
    requestUpdate(options: FirmwareUpdateMetaDataCCRequestGetOptions): Promise<FirmwareUpdateMetaDataCCRequestReport | undefined>;
    /**
     * Responds to a firmware update request
     */
    respondToUpdateRequest(options: FirmwareUpdateMetaDataCCRequestReportOptions): Promise<void>;
    /**
     * Responds to a firmware download request
     */
    respondToDownloadRequest(options: FirmwareUpdateMetaDataCCPrepareReportOptions): Promise<void>;
    /**
     * Sends a fragment of the new firmware to the device
     */
    sendFirmwareFragment(fragmentNumber: number, isLastFragment: boolean, data: Uint8Array): Promise<void>;
    /** Activates a previously transferred firmware image */
    activateFirmware(options: FirmwareUpdateMetaDataCCActivationSetOptions): Promise<MaybeNotKnown<FirmwareUpdateActivationStatus>>;
}
export declare class FirmwareUpdateMetaDataCC extends CommandClass {
    ccCommand: FirmwareUpdateMetaDataCommand;
    skipEndpointInterview(): boolean;
    interview(ctx: InterviewContext): Promise<void>;
}
export interface FirmwareUpdateMetaDataCCMetaDataReportOptions {
    manufacturerId: number;
    firmwareId?: number;
    checksum?: number;
    firmwareUpgradable: boolean;
    maxFragmentSize?: number;
    additionalFirmwareIDs?: readonly number[];
    hardwareVersion?: number;
    continuesToFunction?: MaybeNotKnown<boolean>;
    supportsActivation?: MaybeNotKnown<boolean>;
    supportsResuming?: MaybeNotKnown<boolean>;
    supportsNonSecureTransfer?: MaybeNotKnown<boolean>;
}
export declare class FirmwareUpdateMetaDataCCMetaDataReport extends FirmwareUpdateMetaDataCC implements FirmwareUpdateMetaData {
    constructor(options: WithAddress<FirmwareUpdateMetaDataCCMetaDataReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): FirmwareUpdateMetaDataCCMetaDataReport;
    readonly manufacturerId: number;
    readonly firmwareId: number;
    readonly checksum: number;
    readonly firmwareUpgradable: boolean;
    readonly maxFragmentSize?: number;
    readonly additionalFirmwareIDs: readonly number[];
    readonly hardwareVersion?: number;
    readonly continuesToFunction: MaybeNotKnown<boolean>;
    readonly supportsActivation: MaybeNotKnown<boolean>;
    readonly supportsResuming?: MaybeNotKnown<boolean>;
    readonly supportsNonSecureTransfer?: MaybeNotKnown<boolean>;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class FirmwareUpdateMetaDataCCMetaDataGet extends FirmwareUpdateMetaDataCC {
}
export interface FirmwareUpdateMetaDataCCRequestReportOptions {
    status: FirmwareUpdateRequestStatus;
    resume?: boolean;
    nonSecureTransfer?: boolean;
}
export declare class FirmwareUpdateMetaDataCCRequestReport extends FirmwareUpdateMetaDataCC {
    constructor(options: WithAddress<FirmwareUpdateMetaDataCCRequestReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): FirmwareUpdateMetaDataCCRequestReport;
    readonly status: FirmwareUpdateRequestStatus;
    resume?: boolean;
    nonSecureTransfer?: boolean;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export type FirmwareUpdateMetaDataCCRequestGetOptions = {
    manufacturerId: number;
    firmwareId: number;
    checksum: number;
} & AllOrNone<{
    firmwareTarget: number;
    fragmentSize: number;
    activation?: boolean;
    hardwareVersion?: number;
    resume?: boolean;
    nonSecureTransfer?: boolean;
}>;
export declare class FirmwareUpdateMetaDataCCRequestGet extends FirmwareUpdateMetaDataCC {
    constructor(options: WithAddress<FirmwareUpdateMetaDataCCRequestGetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): FirmwareUpdateMetaDataCCRequestGet;
    manufacturerId: number;
    firmwareId: number;
    checksum: number;
    firmwareTarget?: number;
    fragmentSize?: number;
    activation?: boolean;
    hardwareVersion?: number;
    resume?: boolean;
    nonSecureTransfer?: boolean;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface FirmwareUpdateMetaDataCCGetOptions {
    numReports: number;
    reportNumber: number;
}
export declare class FirmwareUpdateMetaDataCCGet extends FirmwareUpdateMetaDataCC {
    constructor(options: WithAddress<FirmwareUpdateMetaDataCCGetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): FirmwareUpdateMetaDataCCGet;
    readonly numReports: number;
    readonly reportNumber: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface FirmwareUpdateMetaDataCCReportOptions {
    isLast: boolean;
    reportNumber: number;
    firmwareData: Uint8Array;
}
export declare class FirmwareUpdateMetaDataCCReport extends FirmwareUpdateMetaDataCC {
    constructor(options: WithAddress<FirmwareUpdateMetaDataCCReportOptions>);
    static from(_raw: CCRaw, _ctx: CCParsingContext): FirmwareUpdateMetaDataCCReport;
    isLast: boolean;
    reportNumber: number;
    firmwareData: Uint8Array;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface FirmwareUpdateMetaDataCCStatusReportOptions {
    status: FirmwareUpdateStatus;
    waitTime?: number;
}
export declare class FirmwareUpdateMetaDataCCStatusReport extends FirmwareUpdateMetaDataCC {
    constructor(options: WithAddress<FirmwareUpdateMetaDataCCStatusReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): FirmwareUpdateMetaDataCCStatusReport;
    readonly status: FirmwareUpdateStatus;
    /** The wait time in seconds before the node becomes available for communication after the update */
    readonly waitTime?: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface FirmwareUpdateMetaDataCCActivationReportOptions {
    manufacturerId: number;
    firmwareId: number;
    checksum: number;
    firmwareTarget: number;
    activationStatus: FirmwareUpdateActivationStatus;
    hardwareVersion?: number;
}
export declare class FirmwareUpdateMetaDataCCActivationReport extends FirmwareUpdateMetaDataCC {
    constructor(options: WithAddress<FirmwareUpdateMetaDataCCActivationReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): FirmwareUpdateMetaDataCCActivationReport;
    readonly manufacturerId: number;
    readonly firmwareId: number;
    readonly checksum: number;
    readonly firmwareTarget: number;
    readonly activationStatus: FirmwareUpdateActivationStatus;
    readonly hardwareVersion?: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface FirmwareUpdateMetaDataCCActivationSetOptions {
    manufacturerId: number;
    firmwareId: number;
    checksum: number;
    firmwareTarget: number;
    hardwareVersion?: number;
}
export declare class FirmwareUpdateMetaDataCCActivationSet extends FirmwareUpdateMetaDataCC {
    constructor(options: WithAddress<FirmwareUpdateMetaDataCCActivationSetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): FirmwareUpdateMetaDataCCActivationSet;
    manufacturerId: number;
    firmwareId: number;
    checksum: number;
    firmwareTarget: number;
    hardwareVersion?: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface FirmwareUpdateMetaDataCCPrepareReportOptions {
    status: FirmwareDownloadStatus;
    checksum: number;
}
export declare class FirmwareUpdateMetaDataCCPrepareReport extends FirmwareUpdateMetaDataCC {
    constructor(options: WithAddress<FirmwareUpdateMetaDataCCPrepareReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): FirmwareUpdateMetaDataCCPrepareReport;
    readonly status: FirmwareDownloadStatus;
    readonly checksum: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface FirmwareUpdateMetaDataCCPrepareGetOptions {
    manufacturerId: number;
    firmwareId: number;
    firmwareTarget: number;
    fragmentSize: number;
    hardwareVersion: number;
}
export declare class FirmwareUpdateMetaDataCCPrepareGet extends FirmwareUpdateMetaDataCC {
    constructor(options: WithAddress<FirmwareUpdateMetaDataCCPrepareGetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): FirmwareUpdateMetaDataCCPrepareGet;
    manufacturerId: number;
    firmwareId: number;
    firmwareTarget: number;
    fragmentSize: number;
    hardwareVersion: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
//# sourceMappingURL=FirmwareUpdateMetaDataCC.d.ts.map