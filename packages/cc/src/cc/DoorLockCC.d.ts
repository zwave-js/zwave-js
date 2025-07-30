import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { CommandClasses, Duration, type EndpointId, type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type SupervisionResult, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { POLL_VALUE, PhysicalCCAPI, type PollValueImplementation, SET_VALUE, type SetValueImplementation } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext, type PersistValuesContext, type RefreshValuesContext } from "../lib/CommandClass.js";
import { type DoorHandleStatus, DoorLockCommand, DoorLockMode, DoorLockOperationType } from "../lib/_Types.js";
export declare const DoorLockCCValues: Readonly<{
    targetMode: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "targetMode";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "targetMode";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Target lock mode";
            readonly states: Record<number, string>;
            readonly min: 0;
            readonly max: 255;
            readonly type: "number";
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
    currentMode: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "currentMode";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "currentMode";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Current lock mode";
            readonly states: Record<number, string>;
            readonly writeable: false;
            readonly min: 0;
            readonly max: 255;
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
    duration: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "duration";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "duration";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Remaining duration until target lock mode";
            readonly writeable: false;
            readonly type: "duration";
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
    supportedOutsideHandles: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "supportedOutsideHandles";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "supportedOutsideHandles";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: Readonly<{
            readonly type: "any";
            readonly readable: true;
            readonly writeable: true;
        }>;
        options: {
            readonly internal: true;
            readonly minVersion: 4;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    outsideHandlesCanOpenDoorConfiguration: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "outsideHandlesCanOpenDoorConfiguration";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "outsideHandlesCanOpenDoorConfiguration";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Which outside handles can open the door (configuration)";
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
    outsideHandlesCanOpenDoor: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "outsideHandlesCanOpenDoor";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "outsideHandlesCanOpenDoor";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Which outside handles can open the door (actual status)";
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
    supportedInsideHandles: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "supportedInsideHandles";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "supportedInsideHandles";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: Readonly<{
            readonly type: "any";
            readonly readable: true;
            readonly writeable: true;
        }>;
        options: {
            readonly internal: true;
            readonly minVersion: 4;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    insideHandlesCanOpenDoorConfiguration: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "insideHandlesCanOpenDoorConfiguration";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "insideHandlesCanOpenDoorConfiguration";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Which inside handles can open the door (configuration)";
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
    insideHandlesCanOpenDoor: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "insideHandlesCanOpenDoor";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "insideHandlesCanOpenDoor";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Which inside handles can open the door (actual status)";
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
    operationType: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "operationType";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "operationType";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Lock operation type";
            readonly states: Record<number, string>;
            readonly min: 0;
            readonly max: 255;
            readonly type: "number";
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
    lockTimeoutConfiguration: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "lockTimeoutConfiguration";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "lockTimeoutConfiguration";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Duration of timed mode in seconds";
            readonly min: 0;
            readonly max: 65535;
            readonly type: "number";
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
    lockTimeout: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "lockTimeout";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "lockTimeout";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Seconds until lock mode times out";
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
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    autoRelockSupported: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "autoRelockSupported";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "autoRelockSupported";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: Readonly<{
            readonly type: "any";
            readonly readable: true;
            readonly writeable: true;
        }>;
        options: {
            readonly internal: true;
            readonly minVersion: 4;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    autoRelockTime: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "autoRelockTime";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "autoRelockTime";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Duration in seconds until lock returns to secure state";
            readonly min: 0;
            readonly max: 65535;
            readonly type: "number";
            readonly readable: true;
            readonly writeable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 4;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: (ctx: GetValueDB, endpoint: EndpointId) => boolean;
        };
    };
    holdAndReleaseSupported: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "holdAndReleaseSupported";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "holdAndReleaseSupported";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: Readonly<{
            readonly type: "any";
            readonly readable: true;
            readonly writeable: true;
        }>;
        options: {
            readonly internal: true;
            readonly minVersion: 4;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    holdAndReleaseTime: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "holdAndReleaseTime";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "holdAndReleaseTime";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Duration in seconds the latch stays retracted";
            readonly min: 0;
            readonly max: 65535;
            readonly type: "number";
            readonly readable: true;
            readonly writeable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 4;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: (ctx: GetValueDB, endpoint: EndpointId) => boolean;
        };
    };
    twistAssistSupported: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "twistAssistSupported";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "twistAssistSupported";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: Readonly<{
            readonly type: "any";
            readonly readable: true;
            readonly writeable: true;
        }>;
        options: {
            readonly internal: true;
            readonly minVersion: 4;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    twistAssist: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "twistAssist";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "twistAssist";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Twist Assist enabled";
            readonly type: "boolean";
            readonly readable: true;
            readonly writeable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 4;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: (ctx: GetValueDB, endpoint: EndpointId) => boolean;
        };
    };
    blockToBlockSupported: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "blockToBlockSupported";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "blockToBlockSupported";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: Readonly<{
            readonly type: "any";
            readonly readable: true;
            readonly writeable: true;
        }>;
        options: {
            readonly internal: true;
            readonly minVersion: 4;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
    blockToBlock: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "blockToBlock";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "blockToBlock";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Block-to-block functionality enabled";
            readonly type: "boolean";
            readonly readable: true;
            readonly writeable: true;
        };
        options: {
            readonly internal: false;
            readonly minVersion: 4;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: (ctx: GetValueDB, endpoint: EndpointId) => boolean;
        };
    };
    latchSupported: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "latchSupported";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "latchSupported";
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
    latchStatus: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "latchStatus";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "latchStatus";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Current status of the latch";
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
            readonly autoCreate: (ctx: GetValueDB, endpoint: EndpointId) => boolean;
        };
    };
    boltSupported: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "boltSupported";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "boltSupported";
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
    boltStatus: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "boltStatus";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "boltStatus";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Current status of the bolt";
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
            readonly autoCreate: (ctx: GetValueDB, endpoint: EndpointId) => boolean;
        };
    };
    doorSupported: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "doorSupported";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "doorSupported";
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
    doorStatus: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly property: "doorStatus";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Door Lock"];
            readonly endpoint: number;
            readonly property: "doorStatus";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Current status of the door";
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
            readonly autoCreate: (ctx: GetValueDB, endpoint: EndpointId) => boolean;
        };
    };
}>;
export declare function shouldAutoCreateLatchStatusValue(ctx: GetValueDB, endpoint: EndpointId): boolean;
export declare function shouldAutoCreateBoltStatusValue(ctx: GetValueDB, endpoint: EndpointId): boolean;
export declare function shouldAutoCreateDoorStatusValue(ctx: GetValueDB, endpoint: EndpointId): boolean;
export declare function shouldAutoCreateTwistAssistConfigValue(ctx: GetValueDB, endpoint: EndpointId): boolean;
export declare function shouldAutoCreateBlockToBlockConfigValue(ctx: GetValueDB, endpoint: EndpointId): boolean;
export declare function shouldAutoCreateAutoRelockConfigValue(ctx: GetValueDB, endpoint: EndpointId): boolean;
export declare function shouldAutoCreateHoldAndReleaseConfigValue(ctx: GetValueDB, endpoint: EndpointId): boolean;
export declare class DoorLockCCAPI extends PhysicalCCAPI {
    supportsCommand(cmd: DoorLockCommand): MaybeNotKnown<boolean>;
    protected get [SET_VALUE](): SetValueImplementation;
    protected get [POLL_VALUE](): PollValueImplementation;
    getCapabilities(): Promise<Pick<DoorLockCCCapabilitiesReport, "supportedOutsideHandles" | "supportedInsideHandles" | "autoRelockSupported" | "holdAndReleaseSupported" | "twistAssistSupported" | "blockToBlockSupported" | "latchSupported" | "boltSupported" | "doorSupported" | "supportedDoorLockModes" | "supportedOperationTypes"> | undefined>;
    get(): Promise<Pick<DoorLockCCOperationReport, "duration" | "targetMode" | "currentMode" | "outsideHandlesCanOpenDoor" | "insideHandlesCanOpenDoor" | "lockTimeout" | "latchStatus" | "boltStatus" | "doorStatus"> | undefined>;
    set(mode: DoorLockMode): Promise<SupervisionResult | undefined>;
    setConfiguration(configuration: DoorLockCCConfigurationSetOptions): Promise<SupervisionResult | undefined>;
    getConfiguration(): Promise<Pick<DoorLockCCConfigurationReport, "outsideHandlesCanOpenDoorConfiguration" | "insideHandlesCanOpenDoorConfiguration" | "operationType" | "lockTimeoutConfiguration" | "autoRelockTime" | "holdAndReleaseTime" | "twistAssist" | "blockToBlock"> | undefined>;
}
export declare class DoorLockCC extends CommandClass {
    ccCommand: DoorLockCommand;
    interview(ctx: InterviewContext): Promise<void>;
    refreshValues(ctx: RefreshValuesContext): Promise<void>;
    /**
     * Returns whether the node supports auto relock.
     * This only works AFTER the node has been interviewed.
     */
    static supportsAutoRelockCached(ctx: GetValueDB, endpoint: EndpointId): boolean;
    /**
     * Returns whether the node supports hold and release.
     * This only works AFTER the node has been interviewed.
     */
    static supportsHoldAndReleaseCached(ctx: GetValueDB, endpoint: EndpointId): boolean;
    /**
     * Returns whether the node supports twist assist.
     * This only works AFTER the node has been interviewed.
     */
    static supportsTwistAssistCached(ctx: GetValueDB, endpoint: EndpointId): boolean;
    /**
     * Returns whether the node supports block to block.
     * This only works AFTER the node has been interviewed.
     */
    static supportsBlockToBlockCached(ctx: GetValueDB, endpoint: EndpointId): boolean;
    /**
     * Returns the supported outside handles.
     * This only works AFTER the node has been interviewed.
     */
    static getSupportedOutsideHandlesCached(ctx: GetValueDB, endpoint: EndpointId): MaybeNotKnown<DoorHandleStatus>;
    /**
     * Returns the supported inside handles.
     * This only works AFTER the node has been interviewed.
     */
    static getSupportedInsideHandlesCached(ctx: GetValueDB, endpoint: EndpointId): MaybeNotKnown<DoorHandleStatus>;
}
export interface DoorLockCCOperationSetOptions {
    mode: DoorLockMode;
}
export declare class DoorLockCCOperationSet extends DoorLockCC {
    constructor(options: WithAddress<DoorLockCCOperationSetOptions>);
    static from(_raw: CCRaw, _ctx: CCParsingContext): DoorLockCCOperationSet;
    mode: DoorLockMode;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface DoorLockCCOperationReportOptions {
    currentMode: DoorLockMode;
    outsideHandlesCanOpenDoor: DoorHandleStatus;
    insideHandlesCanOpenDoor: DoorHandleStatus;
    doorStatus?: "closed" | "open";
    boltStatus?: "unlocked" | "locked";
    latchStatus?: "closed" | "open";
    lockTimeout?: number;
    targetMode?: DoorLockMode;
    duration?: Duration;
}
export declare class DoorLockCCOperationReport extends DoorLockCC {
    constructor(options: WithAddress<DoorLockCCOperationReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): DoorLockCCOperationReport;
    persistValues(ctx: PersistValuesContext): boolean;
    readonly currentMode: DoorLockMode;
    readonly targetMode?: DoorLockMode;
    readonly duration?: Duration;
    readonly outsideHandlesCanOpenDoor: DoorHandleStatus;
    readonly insideHandlesCanOpenDoor: DoorHandleStatus;
    readonly latchStatus?: "open" | "closed";
    readonly boltStatus?: "locked" | "unlocked";
    readonly doorStatus?: "open" | "closed";
    readonly lockTimeout?: number;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class DoorLockCCOperationGet extends DoorLockCC {
}
export interface DoorLockCCConfigurationReportOptions {
    operationType: DoorLockOperationType;
    outsideHandlesCanOpenDoorConfiguration: DoorHandleStatus;
    insideHandlesCanOpenDoorConfiguration: DoorHandleStatus;
    lockTimeoutConfiguration?: number;
    autoRelockTime?: number;
    holdAndReleaseTime?: number;
    twistAssist?: boolean;
    blockToBlock?: boolean;
}
export declare class DoorLockCCConfigurationReport extends DoorLockCC {
    constructor(options: WithAddress<DoorLockCCConfigurationReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): DoorLockCCConfigurationReport;
    readonly operationType: DoorLockOperationType;
    readonly outsideHandlesCanOpenDoorConfiguration: DoorHandleStatus;
    readonly insideHandlesCanOpenDoorConfiguration: DoorHandleStatus;
    readonly lockTimeoutConfiguration?: number;
    readonly autoRelockTime?: number;
    readonly holdAndReleaseTime?: number;
    readonly twistAssist?: boolean;
    readonly blockToBlock?: boolean;
    persistValues(ctx: PersistValuesContext): boolean;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class DoorLockCCConfigurationGet extends DoorLockCC {
}
export type DoorLockCCConfigurationSetOptions = ({
    operationType: DoorLockOperationType.Timed;
    lockTimeoutConfiguration: number;
} | {
    operationType: DoorLockOperationType.Constant;
    lockTimeoutConfiguration?: undefined;
}) & {
    outsideHandlesCanOpenDoorConfiguration: DoorHandleStatus;
    insideHandlesCanOpenDoorConfiguration: DoorHandleStatus;
    autoRelockTime?: number;
    holdAndReleaseTime?: number;
    twistAssist?: boolean;
    blockToBlock?: boolean;
};
export declare class DoorLockCCConfigurationSet extends DoorLockCC {
    constructor(options: WithAddress<DoorLockCCConfigurationSetOptions>);
    static from(_raw: CCRaw, _ctx: CCParsingContext): DoorLockCCConfigurationSet;
    operationType: DoorLockOperationType;
    outsideHandlesCanOpenDoorConfiguration: DoorHandleStatus;
    insideHandlesCanOpenDoorConfiguration: DoorHandleStatus;
    lockTimeoutConfiguration?: number;
    autoRelockTime?: number;
    holdAndReleaseTime?: number;
    twistAssist?: boolean;
    blockToBlock?: boolean;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface DoorLockCCCapabilitiesReportOptions {
    supportedOperationTypes: DoorLockOperationType[];
    supportedDoorLockModes: DoorLockMode[];
    supportedOutsideHandles: DoorHandleStatus;
    supportedInsideHandles: DoorHandleStatus;
    doorSupported: boolean;
    boltSupported: boolean;
    latchSupported: boolean;
    blockToBlockSupported: boolean;
    twistAssistSupported: boolean;
    holdAndReleaseSupported: boolean;
    autoRelockSupported: boolean;
}
export declare class DoorLockCCCapabilitiesReport extends DoorLockCC {
    constructor(options: WithAddress<DoorLockCCCapabilitiesReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): DoorLockCCCapabilitiesReport;
    readonly supportedOperationTypes: readonly DoorLockOperationType[];
    readonly supportedDoorLockModes: readonly DoorLockMode[];
    readonly supportedOutsideHandles: DoorHandleStatus;
    readonly supportedInsideHandles: DoorHandleStatus;
    readonly latchSupported: boolean;
    readonly boltSupported: boolean;
    readonly doorSupported: boolean;
    readonly autoRelockSupported: boolean;
    readonly holdAndReleaseSupported: boolean;
    readonly twistAssistSupported: boolean;
    readonly blockToBlockSupported: boolean;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class DoorLockCCCapabilitiesGet extends DoorLockCC {
}
//# sourceMappingURL=DoorLockCC.d.ts.map