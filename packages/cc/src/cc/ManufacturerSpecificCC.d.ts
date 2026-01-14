import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { CommandClasses, type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { PhysicalCCAPI } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext } from "../lib/CommandClass.js";
import { DeviceIdType, ManufacturerSpecificCommand } from "../lib/_Types.js";
export declare const ManufacturerSpecificCCValues: Readonly<{
    manufacturerId: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Manufacturer Specific"];
            readonly property: "manufacturerId";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Manufacturer Specific"];
            readonly endpoint: 0;
            readonly property: "manufacturerId";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Manufacturer ID";
            readonly writeable: false;
            readonly min: 0;
            readonly max: 65535;
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
    productType: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Manufacturer Specific"];
            readonly property: "productType";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Manufacturer Specific"];
            readonly endpoint: 0;
            readonly property: "productType";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Product type";
            readonly writeable: false;
            readonly min: 0;
            readonly max: 65535;
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
    productId: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Manufacturer Specific"];
            readonly property: "productId";
        };
        endpoint: (_endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Manufacturer Specific"];
            readonly endpoint: 0;
            readonly property: "productId";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Product ID";
            readonly writeable: false;
            readonly min: 0;
            readonly max: 65535;
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
    deviceId: ((type: DeviceIdType) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Manufacturer Specific"];
            readonly property: "deviceId";
            readonly propertyKey: string;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Manufacturer Specific"];
            readonly endpoint: number;
            readonly property: "deviceId";
            readonly propertyKey: string;
        };
        readonly meta: {
            readonly label: `Device ID (${string})`;
            readonly writeable: false;
            readonly type: "string";
            readonly readable: true;
        };
    }) & {
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        options: {
            readonly internal: false;
            readonly minVersion: 2;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
}>;
export declare class ManufacturerSpecificCCAPI extends PhysicalCCAPI {
    supportsCommand(cmd: ManufacturerSpecificCommand): MaybeNotKnown<boolean>;
    get(): Promise<Pick<ManufacturerSpecificCCReport, "manufacturerId" | "productType" | "productId"> | undefined>;
    deviceSpecificGet(deviceIdType: DeviceIdType): Promise<MaybeNotKnown<string>>;
    sendReport(options: ManufacturerSpecificCCReportOptions): Promise<void>;
}
export declare class ManufacturerSpecificCC extends CommandClass {
    ccCommand: ManufacturerSpecificCommand;
    determineRequiredCCInterviews(): readonly CommandClasses[];
    interview(ctx: InterviewContext): Promise<void>;
}
export interface ManufacturerSpecificCCReportOptions {
    manufacturerId: number;
    productType: number;
    productId: number;
}
export declare class ManufacturerSpecificCCReport extends ManufacturerSpecificCC {
    constructor(options: WithAddress<ManufacturerSpecificCCReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ManufacturerSpecificCCReport;
    readonly manufacturerId: number;
    readonly productType: number;
    readonly productId: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class ManufacturerSpecificCCGet extends ManufacturerSpecificCC {
}
export interface ManufacturerSpecificCCDeviceSpecificReportOptions {
    type: DeviceIdType;
    deviceId: string;
}
export declare class ManufacturerSpecificCCDeviceSpecificReport extends ManufacturerSpecificCC {
    constructor(options: WithAddress<ManufacturerSpecificCCDeviceSpecificReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ManufacturerSpecificCCDeviceSpecificReport;
    readonly type: DeviceIdType;
    readonly deviceId: string;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface ManufacturerSpecificCCDeviceSpecificGetOptions {
    deviceIdType: DeviceIdType;
}
export declare class ManufacturerSpecificCCDeviceSpecificGet extends ManufacturerSpecificCC {
    constructor(options: WithAddress<ManufacturerSpecificCCDeviceSpecificGetOptions>);
    static from(_raw: CCRaw, _ctx: CCParsingContext): ManufacturerSpecificCCDeviceSpecificGet;
    deviceIdType: DeviceIdType;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
//# sourceMappingURL=ManufacturerSpecificCC.d.ts.map