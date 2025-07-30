import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import type { GetDeviceConfig } from "@zwave-js/config";
import { CommandClasses, type ControlsCC, type EndpointId, type GetEndpoint, type GetNode, type GetSupportedCCVersion, type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type NodeId, type SinglecastCC, type SupportsCC, type WithAddress } from "@zwave-js/core";
import { type AllOrNone, Bytes } from "@zwave-js/shared";
import { POLL_VALUE, PhysicalCCAPI, type PollValueImplementation } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext, type PersistValuesContext, type RefreshValuesContext } from "../lib/CommandClass.js";
import { BatteryChargingStatus, BatteryCommand, BatteryReplacementStatus } from "../lib/_Types.js";
export declare const BatteryCCValues: Readonly<{
    level: {
        id: {
            readonly commandClass: CommandClasses.Battery;
            readonly property: "level";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Battery;
            readonly endpoint: number;
            readonly property: "level";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly max: 100;
            readonly unit: "%";
            readonly label: "Battery level";
            readonly writeable: false;
            readonly min: 0;
            readonly type: "number";
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
    maximumCapacity: {
        id: {
            readonly commandClass: CommandClasses.Battery;
            readonly property: "maximumCapacity";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Battery;
            readonly endpoint: number;
            readonly property: "maximumCapacity";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly max: 100;
            readonly unit: "%";
            readonly label: "Maximum capacity";
            readonly writeable: false;
            readonly min: 0;
            readonly type: "number";
            readonly readable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 2;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    temperature: {
        id: {
            readonly commandClass: CommandClasses.Battery;
            readonly property: "temperature";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Battery;
            readonly endpoint: number;
            readonly property: "temperature";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Temperature";
            readonly unit: "°C";
            readonly writeable: false;
            readonly min: -128;
            readonly max: 127;
            readonly type: "number";
            readonly readable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 2;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    chargingStatus: {
        id: {
            readonly commandClass: CommandClasses.Battery;
            readonly property: "chargingStatus";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Battery;
            readonly endpoint: number;
            readonly property: "chargingStatus";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Charging status";
            readonly states: Record<number, string>;
            readonly writeable: false;
            readonly min: 0;
            readonly max: 255;
            readonly type: "number";
            readonly readable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 2;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    rechargeable: {
        id: {
            readonly commandClass: CommandClasses.Battery;
            readonly property: "rechargeable";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Battery;
            readonly endpoint: number;
            readonly property: "rechargeable";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Rechargeable";
            readonly writeable: false;
            readonly type: "boolean";
            readonly readable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 2;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    backup: {
        id: {
            readonly commandClass: CommandClasses.Battery;
            readonly property: "backup";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Battery;
            readonly endpoint: number;
            readonly property: "backup";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Used as backup";
            readonly writeable: false;
            readonly type: "boolean";
            readonly readable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 2;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    overheating: {
        id: {
            readonly commandClass: CommandClasses.Battery;
            readonly property: "overheating";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Battery;
            readonly endpoint: number;
            readonly property: "overheating";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Overheating";
            readonly writeable: false;
            readonly type: "boolean";
            readonly readable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 2;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    lowFluid: {
        id: {
            readonly commandClass: CommandClasses.Battery;
            readonly property: "lowFluid";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Battery;
            readonly endpoint: number;
            readonly property: "lowFluid";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Fluid is low";
            readonly writeable: false;
            readonly type: "boolean";
            readonly readable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 2;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    rechargeOrReplace: {
        id: {
            readonly commandClass: CommandClasses.Battery;
            readonly property: "rechargeOrReplace";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Battery;
            readonly endpoint: number;
            readonly property: "rechargeOrReplace";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Recharge or replace";
            readonly states: Record<number, string>;
            readonly writeable: false;
            readonly min: 0;
            readonly max: 255;
            readonly type: "number";
            readonly readable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 2;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    disconnected: {
        id: {
            readonly commandClass: CommandClasses.Battery;
            readonly property: "disconnected";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Battery;
            readonly endpoint: number;
            readonly property: "disconnected";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Battery is disconnected";
            readonly writeable: false;
            readonly type: "boolean";
            readonly readable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 2;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    lowTemperatureStatus: {
        id: {
            readonly commandClass: CommandClasses.Battery;
            readonly property: "lowTemperatureStatus";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Battery;
            readonly endpoint: number;
            readonly property: "lowTemperatureStatus";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Battery temperature is low";
            readonly writeable: false;
            readonly type: "boolean";
            readonly readable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 3;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
}>;
export declare class BatteryCCAPI extends PhysicalCCAPI {
    supportsCommand(cmd: BatteryCommand): MaybeNotKnown<boolean>;
    protected get [POLL_VALUE](): PollValueImplementation;
    get(): Promise<Pick<BatteryCCReport, "level" | "chargingStatus" | "rechargeable" | "backup" | "overheating" | "lowFluid" | "rechargeOrReplace" | "disconnected" | "lowTemperatureStatus"> | undefined>;
    getHealth(): Promise<Pick<BatteryCCHealthReport, "temperature" | "maximumCapacity"> | undefined>;
}
export declare class BatteryCC extends CommandClass {
    ccCommand: BatteryCommand;
    interview(ctx: InterviewContext): Promise<void>;
    refreshValues(ctx: RefreshValuesContext): Promise<void>;
    shouldRefreshValues(this: SinglecastCC<this>, ctx: GetValueDB & GetSupportedCCVersion & GetDeviceConfig & GetNode<NodeId & GetEndpoint<EndpointId & SupportsCC & ControlsCC>>): boolean;
}
export type BatteryCCReportOptions = {
    level: number | "low";
} & AllOrNone<{
    chargingStatus: BatteryChargingStatus;
    rechargeable: boolean;
    backup: boolean;
    overheating: boolean;
    lowFluid: boolean;
    rechargeOrReplace: BatteryReplacementStatus;
    disconnected: boolean;
}> & AllOrNone<{
    lowTemperatureStatus: boolean;
}>;
export declare class BatteryCCReport extends BatteryCC {
    constructor(options: WithAddress<BatteryCCReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): BatteryCCReport;
    persistValues(ctx: PersistValuesContext): boolean;
    readonly level: number;
    readonly chargingStatus: BatteryChargingStatus | undefined;
    readonly rechargeable: boolean | undefined;
    readonly backup: boolean | undefined;
    readonly overheating: boolean | undefined;
    readonly lowFluid: boolean | undefined;
    readonly rechargeOrReplace: BatteryReplacementStatus | undefined;
    readonly disconnected: boolean | undefined;
    readonly lowTemperatureStatus: boolean | undefined;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class BatteryCCGet extends BatteryCC {
}
export interface BatteryCCHealthReportOptions {
    maximumCapacity?: number;
    temperature?: number;
    temperatureScale?: number;
}
export declare class BatteryCCHealthReport extends BatteryCC {
    constructor(options: WithAddress<BatteryCCHealthReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): BatteryCCHealthReport;
    readonly maximumCapacity: number | undefined;
    readonly temperature: number | undefined;
    private readonly temperatureScale;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class BatteryCCHealthGet extends BatteryCC {
}
//# sourceMappingURL=BatteryCC.d.ts.map