var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
import { CommandClasses, MessagePriority, ValueMetadata, encodeFloatWithScale, enumValuesToMetadataStates, parseFloatWithScale, timespan, validatePayload, } from "@zwave-js/core";
import { Bytes, getEnumMemberName, pick, } from "@zwave-js/shared";
import { CCAPI, POLL_VALUE, PhysicalCCAPI, throwUnsupportedProperty, } from "../lib/API.js";
import { CommandClass, } from "../lib/CommandClass.js";
import { API, CCCommand, ccValueProperty, ccValues, commandClass, expectedCCResponse, implementedVersion, } from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import { BatteryChargingStatus, BatteryCommand, BatteryReplacementStatus, } from "../lib/_Types.js";
import { NotificationCCValues } from "./NotificationCC.js";
export const BatteryCCValues = V.defineCCValues(CommandClasses.Battery, {
    ...V.staticProperty("level", {
        ...ValueMetadata.ReadOnlyUInt8,
        max: 100,
        unit: "%",
        label: "Battery level",
    }),
    ...V.staticProperty("maximumCapacity", {
        ...ValueMetadata.ReadOnlyUInt8,
        max: 100,
        unit: "%",
        label: "Maximum capacity",
    }, {
        minVersion: 2,
    }),
    ...V.staticProperty("temperature", {
        ...ValueMetadata.ReadOnlyInt8,
        label: "Temperature",
        // For now, only °C is specified as a valid unit
        // If this ever changes, update the unit in persistValues on the fly
        unit: "°C",
    }, {
        minVersion: 2,
    }),
    ...V.staticProperty("chargingStatus", {
        ...ValueMetadata.ReadOnlyUInt8,
        label: "Charging status",
        states: enumValuesToMetadataStates(BatteryChargingStatus),
    }, {
        minVersion: 2,
    }),
    ...V.staticProperty("rechargeable", {
        ...ValueMetadata.ReadOnlyBoolean,
        label: "Rechargeable",
    }, {
        minVersion: 2,
    }),
    ...V.staticProperty("backup", {
        ...ValueMetadata.ReadOnlyBoolean,
        label: "Used as backup",
    }, {
        minVersion: 2,
    }),
    ...V.staticProperty("overheating", {
        ...ValueMetadata.ReadOnlyBoolean,
        label: "Overheating",
    }, {
        minVersion: 2,
    }),
    ...V.staticProperty("lowFluid", {
        ...ValueMetadata.ReadOnlyBoolean,
        label: "Fluid is low",
    }, {
        minVersion: 2,
    }),
    ...V.staticProperty("rechargeOrReplace", {
        ...ValueMetadata.ReadOnlyUInt8,
        label: "Recharge or replace",
        states: enumValuesToMetadataStates(BatteryReplacementStatus),
    }, {
        minVersion: 2,
    }),
    ...V.staticProperty("disconnected", {
        ...ValueMetadata.ReadOnlyBoolean,
        label: "Battery is disconnected",
    }, {
        minVersion: 2,
    }),
    ...V.staticProperty("lowTemperatureStatus", {
        ...ValueMetadata.ReadOnlyBoolean,
        label: "Battery temperature is low",
    }, {
        minVersion: 3,
    }),
});
// @noSetValueAPI This CC is read-only
let BatteryCCAPI = (() => {
    let _classDecorators = [API(CommandClasses.Battery)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = PhysicalCCAPI;
    var BatteryCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            BatteryCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case BatteryCommand.Get:
                    return true; // This is mandatory
                case BatteryCommand.HealthGet:
                    return this.version >= 2;
            }
            return super.supportsCommand(cmd);
        }
        get [POLL_VALUE]() {
            return async function ({ property }) {
                switch (property) {
                    case "level":
                    case "chargingStatus":
                    case "rechargeable":
                    case "backup":
                    case "overheating":
                    case "lowFluid":
                    case "rechargeOrReplace":
                    case "lowTemperatureStatus":
                    case "disconnected":
                        return (await this.get())?.[property];
                    case "maximumCapacity":
                    case "temperature":
                        return (await this.getHealth())?.[property];
                    default:
                        throwUnsupportedProperty(this.ccId, property);
                }
            };
        }
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        async get() {
            this.assertSupportsCommand(BatteryCommand, BatteryCommand.Get);
            const cc = new BatteryCCGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, [
                    "level",
                    "chargingStatus",
                    "rechargeable",
                    "backup",
                    "overheating",
                    "lowFluid",
                    "rechargeOrReplace",
                    "lowTemperatureStatus",
                    "disconnected",
                ]);
            }
        }
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        async getHealth() {
            this.assertSupportsCommand(BatteryCommand, BatteryCommand.HealthGet);
            const cc = new BatteryCCHealthGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, ["maximumCapacity", "temperature"]);
            }
        }
    };
    return BatteryCCAPI = _classThis;
})();
export { BatteryCCAPI };
let BatteryCC = (() => {
    let _classDecorators = [commandClass(CommandClasses.Battery), implementedVersion(3), ccValues(BatteryCCValues)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var BatteryCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            BatteryCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        async interview(ctx) {
            const node = this.getNode(ctx);
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: `Interviewing ${this.ccName}...`,
                direction: "none",
            });
            // Query the Battery status
            await this.refreshValues(ctx);
            // Remember that the interview is complete
            this.setInterviewComplete(ctx, true);
        }
        async refreshValues(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses.Battery, ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: "querying battery status...",
                direction: "outbound",
            });
            const batteryStatus = await api.get();
            if (batteryStatus) {
                let logMessage = `received response for battery information:
level:                           ${batteryStatus.level === 0xff
                    ? "low"
                    : (batteryStatus.level + " %")}`;
                if (api.version >= 2) {
                    logMessage += `
status:                          ${BatteryChargingStatus[batteryStatus.chargingStatus]}
rechargeable:                    ${batteryStatus.rechargeable}
is backup:                       ${batteryStatus.backup}
is overheating:                  ${batteryStatus.overheating}
fluid is low:                    ${batteryStatus.lowFluid}
needs to be replaced or charged: ${BatteryReplacementStatus[batteryStatus.rechargeOrReplace]}
is low temperature               ${batteryStatus.lowTemperatureStatus}
is disconnected:                 ${batteryStatus.disconnected}`;
                }
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: logMessage,
                    direction: "inbound",
                });
            }
            if (api.version >= 2) {
                // always query the health
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: "querying battery health...",
                    direction: "outbound",
                });
                const batteryHealth = await api.getHealth();
                if (batteryHealth) {
                    const logMessage = `received response for battery health:
max. capacity: ${batteryHealth.maximumCapacity} %
temperature:   ${batteryHealth.temperature} °C`;
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message: logMessage,
                        direction: "inbound",
                    });
                }
            }
        }
        shouldRefreshValues(ctx) {
            // Check when the battery state was last updated
            const valueDB = ctx.tryGetValueDB(this.nodeId);
            if (!valueDB)
                return true;
            const lastUpdated = valueDB.getTimestamp(BatteryCCValues.level.endpoint(this.endpointIndex));
            return (lastUpdated == undefined
                // The specs say once per month, but that's a bit too unfrequent IMO
                // Also the maximum that setInterval supports is ~24.85 days
                || Date.now() - lastUpdated > timespan.days(7));
        }
    };
    return BatteryCC = _classThis;
})();
export { BatteryCC };
let BatteryCCReport = (() => {
    let _classDecorators = [CCCommand(BatteryCommand.Report), ccValueProperty("level", BatteryCCValues.level), ccValueProperty("chargingStatus", BatteryCCValues.chargingStatus), ccValueProperty("rechargeable", BatteryCCValues.rechargeable), ccValueProperty("backup", BatteryCCValues.backup), ccValueProperty("overheating", BatteryCCValues.overheating), ccValueProperty("lowFluid", BatteryCCValues.lowFluid), ccValueProperty("rechargeOrReplace", BatteryCCValues.rechargeOrReplace), ccValueProperty("disconnected", BatteryCCValues.disconnected), ccValueProperty("lowTemperatureStatus", BatteryCCValues.lowTemperatureStatus)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BatteryCC;
    var BatteryCCReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            BatteryCCReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.level = typeof options.level === "number" ? options.level : 0xff;
            this.chargingStatus = options.chargingStatus;
            this.rechargeable = options.rechargeable;
            this.backup = options.backup;
            this.overheating = options.overheating;
            this.lowFluid = options.lowFluid;
            this.rechargeOrReplace = options.rechargeOrReplace;
            this.disconnected = options.disconnected;
            this.lowTemperatureStatus = options.lowTemperatureStatus;
        }
        static from(raw, ctx) {
            let ccOptions;
            validatePayload(raw.payload.length >= 1);
            const level = raw.payload[0];
            ccOptions = {
                level,
            };
            if (raw.payload.length >= 3) {
                // Starting with V2
                const chargingStatus = raw.payload[1] >>> 6;
                const rechargeable = !!(raw.payload[1] & 0b0010_0000);
                const backup = !!(raw.payload[1] & 0b0001_0000);
                const overheating = !!(raw.payload[1] & 0b1000);
                const lowFluid = !!(raw.payload[1] & 0b0100);
                const rechargeOrReplace = !!(raw.payload[1] & 0b10)
                    ? BatteryReplacementStatus.Now
                    : !!(raw.payload[1] & 0b1)
                        ? BatteryReplacementStatus.Soon
                        : BatteryReplacementStatus.No;
                const lowTemperatureStatus = !!(raw.payload[2] & 0b10);
                const disconnected = !!(raw.payload[2] & 0b1);
                ccOptions = {
                    ...ccOptions,
                    chargingStatus,
                    rechargeable,
                    backup,
                    overheating,
                    lowFluid,
                    rechargeOrReplace,
                    lowTemperatureStatus,
                    disconnected,
                };
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                ...ccOptions,
            });
        }
        persistValues(ctx) {
            // This is a bit hacky, but we need to avoid persisting 0xff as the battery level
            // because the report is meant as a notification in that case.
            if (this.level === 0xff) {
                // @ts-expect-error
                this.level = undefined;
            }
            if (!super.persistValues(ctx))
                return false;
            if (this.level === undefined) {
                // @ts-expect-error
                this.level = 0xff;
            }
            // Naïve heuristic for a full battery
            if (this.level >= 90) {
                // Some devices send Notification CC Reports with battery information,
                // or this information is mapped from legacy V1 alarm values.
                // We may need to idle the corresponding values when the battery is full
                const notificationCCVersion = ctx.getSupportedCCVersion(CommandClasses.Notification, this.nodeId, this.endpointIndex);
                if (
                // supported
                notificationCCVersion > 0
                    // but idling is not required
                    && notificationCCVersion < 8) {
                    const batteryLevelStatusValue = NotificationCCValues
                        .notificationVariable("Power Management", "Battery level status");
                    // If not undefined and not idle
                    if (this.getValue(ctx, batteryLevelStatusValue)) {
                        this.setValue(ctx, batteryLevelStatusValue, 0);
                    }
                }
            }
            return true;
        }
        level;
        chargingStatus;
        rechargeable;
        backup;
        overheating;
        lowFluid;
        rechargeOrReplace;
        disconnected;
        lowTemperatureStatus;
        serialize(ctx) {
            this.payload = Bytes.from([this.level]);
            if (this.chargingStatus != undefined) {
                this.payload = Bytes.concat([
                    this.payload,
                    Bytes.from([
                        (this.chargingStatus << 6)
                            + (this.rechargeable ? 0b0010_0000 : 0)
                            + (this.backup ? 0b0001_0000 : 0)
                            + (this.overheating ? 0b1000 : 0)
                            + (this.lowFluid ? 0b0100 : 0)
                            + (this.rechargeOrReplace === BatteryReplacementStatus.Now
                                ? 0b10
                                : this.rechargeOrReplace
                                    === BatteryReplacementStatus.Soon
                                    ? 0b1
                                    : 0),
                        (this.lowTemperatureStatus ? 0b10 : 0)
                            + (this.disconnected ? 0b1 : 0),
                    ]),
                ]);
            }
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const message = this.level === 0xff
                ? { "is low": true }
                : { level: this.level };
            if (this.chargingStatus != undefined) {
                message["charging status"] = getEnumMemberName(BatteryChargingStatus, this.chargingStatus);
            }
            if (this.rechargeable != undefined) {
                message.rechargeable = this.rechargeable;
            }
            if (this.backup != undefined) {
                message.backup = this.backup;
            }
            if (this.overheating != undefined) {
                message.overheating = this.overheating;
            }
            if (this.lowFluid != undefined) {
                message["low fluid"] = this.lowFluid;
            }
            if (this.rechargeOrReplace != undefined) {
                message["recharge or replace"] = getEnumMemberName(BatteryReplacementStatus, this.rechargeOrReplace);
            }
            if (this.lowTemperatureStatus != undefined) {
                message.lowTemperatureStatus = this.lowTemperatureStatus;
            }
            if (this.disconnected != undefined) {
                message.disconnected = this.disconnected;
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return BatteryCCReport = _classThis;
})();
export { BatteryCCReport };
let BatteryCCGet = (() => {
    let _classDecorators = [CCCommand(BatteryCommand.Get), expectedCCResponse(BatteryCCReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BatteryCC;
    var BatteryCCGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            BatteryCCGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return BatteryCCGet = _classThis;
})();
export { BatteryCCGet };
let BatteryCCHealthReport = (() => {
    let _classDecorators = [CCCommand(BatteryCommand.HealthReport), ccValueProperty("maximumCapacity", BatteryCCValues.maximumCapacity), ccValueProperty("temperature", BatteryCCValues.temperature)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BatteryCC;
    var BatteryCCHealthReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            BatteryCCHealthReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.maximumCapacity = options.maximumCapacity;
            this.temperature = options.temperature;
            this.temperatureScale = options.temperatureScale;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            // Parse maximum capacity. 0xff means unknown
            let maximumCapacity = raw.payload[0];
            if (maximumCapacity === 0xff)
                maximumCapacity = undefined;
            const { value: temperature, scale: temperatureScale, } = parseFloatWithScale(raw.payload.subarray(1), true);
            return new this({
                nodeId: ctx.sourceNodeId,
                maximumCapacity,
                temperature,
                temperatureScale,
            });
        }
        maximumCapacity;
        temperature;
        temperatureScale;
        serialize(ctx) {
            const temperature = this.temperature != undefined
                ? encodeFloatWithScale(this.temperature, this.temperatureScale ?? 0x00)
                // size, precision and scale must be 0 if the temperature is omitted
                : Bytes.from([0x00]);
            this.payload = Bytes.concat([
                [this.maximumCapacity ?? 0xff],
                temperature,
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    temperature: this.temperature != undefined
                        ? this.temperature
                        : "unknown",
                    "max capacity": this.maximumCapacity != undefined
                        ? `${this.maximumCapacity} %`
                        : "unknown",
                },
            };
        }
    };
    return BatteryCCHealthReport = _classThis;
})();
export { BatteryCCHealthReport };
let BatteryCCHealthGet = (() => {
    let _classDecorators = [CCCommand(BatteryCommand.HealthGet), expectedCCResponse(BatteryCCHealthReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = BatteryCC;
    var BatteryCCHealthGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            BatteryCCHealthGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return BatteryCCHealthGet = _classThis;
})();
export { BatteryCCHealthGet };
//# sourceMappingURL=BatteryCC.js.map