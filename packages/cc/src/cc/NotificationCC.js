var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
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
import { CommandClasses, Duration, MessagePriority, SecurityClass, ValueMetadata, ZWaveError, ZWaveErrorCodes, encodeBitMask, getCCName, getNotification, getNotificationEventName, getNotificationName, getNotificationValue, getNotificationValueName, isZWaveError, parseBitMask, timespan, validatePayload, } from "@zwave-js/core";
import { Bytes, buffer2hex, isUint8Array, num2hex, pick, } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { isArray } from "alcalzone-shared/typeguards";
import { CCAPI, POLL_VALUE, PhysicalCCAPI, throwUnsupportedProperty, } from "../lib/API.js";
import { CCRaw, CommandClass, InvalidCC, getEffectiveCCVersion, } from "../lib/CommandClass.js";
import { API, CCCommand, ccValueProperty, ccValues, commandClass, expectedCCResponse, getCCCommandConstructor, implementedVersion, useSupervision, } from "../lib/CommandClassDecorators.js";
import { isNotificationEventPayload } from "../lib/NotificationEventPayload.js";
import { V } from "../lib/Values.js";
import { NotificationCommand, UserCodeCommand } from "../lib/_Types.js";
import * as ccUtils from "../lib/utils.js";
import { AssociationGroupInfoCC } from "./AssociationGroupInfoCC.js";
export const NotificationCCValues = V.defineCCValues(CommandClasses.Notification, {
    ...V.staticProperty("supportsV1Alarm", undefined, {
        internal: true,
        supportsEndpoints: false,
    }),
    ...V.staticProperty("supportedNotificationTypes", undefined, {
        internal: true,
        supportsEndpoints: false,
    }),
    ...V.staticProperty("notificationMode", undefined, {
        internal: true,
        supportsEndpoints: false,
    }),
    ...V.staticProperty("lastRefresh", undefined, {
        internal: true,
    }),
    ...V.staticProperty("alarmType", {
        ...ValueMetadata.ReadOnlyUInt8,
        label: "Alarm Type",
    }),
    ...V.staticProperty("alarmLevel", {
        ...ValueMetadata.ReadOnlyUInt8,
        label: "Alarm Level",
    }),
    ...V.staticPropertyAndKeyWithName("doorStateSimple", "Access Control", "Door state (simple)", {
        // Must be a number for compatibility reasons
        ...ValueMetadata.ReadOnlyUInt8,
        label: "Door state (simple)",
        states: {
            [0x16]: "Window/door is open",
            [0x17]: "Window/door is closed",
        },
        ccSpecific: {
            notificationType: 0x06,
        },
    }, {
        autoCreate: shouldAutoCreateSimpleDoorSensorValue,
    }),
    ...V.staticPropertyAndKeyWithName("doorTiltState", "Access Control", "Door tilt state", {
        // Must be a number for compatibility reasons
        ...ValueMetadata.ReadOnlyUInt8,
        label: "Door tilt state",
        states: {
            [0x00]: "Window/door is not tilted",
            [0x01]: "Window/door is tilted",
        },
        ccSpecific: {
            notificationType: 0x06,
        },
    }, {
        // This is created when the tilt state is first received.
        autoCreate: false,
    }),
    ...V.dynamicPropertyAndKeyWithName("supportedNotificationEvents", "supportedNotificationEvents", (notificationType) => notificationType, ({ property, propertyKey }) => property === "supportedNotificationEvents"
        && typeof propertyKey === "number", undefined, { internal: true, supportsEndpoints: false }),
    ...V.dynamicPropertyWithName("unknownNotificationType", (notificationType) => `UNKNOWN_${num2hex(notificationType)}`, ({ property }) => typeof property === "string"
        && property.startsWith("UNKNOWN_0x"), (notificationType) => ({
        ...ValueMetadata.ReadOnlyUInt8,
        label: `Unknown notification (${num2hex(notificationType)})`,
        ccSpecific: { notificationType },
    })),
    ...V.dynamicPropertyAndKeyWithName("unknownNotificationVariable", (notificationType, notificationName) => notificationName, "unknown", ({ property, propertyKey }) => typeof property === "string" && propertyKey === "unknown", (notificationType, notificationName) => ({
        ...ValueMetadata.ReadOnlyUInt8,
        label: `${notificationName}: Unknown value`,
        ccSpecific: { notificationType },
    })),
    ...V.dynamicPropertyAndKeyWithName("notificationVariable", 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (notificationName, variableName) => notificationName, (notificationName, variableName) => variableName, ({ property, propertyKey }) => typeof property === "string" && typeof propertyKey === "string", 
    // Notification metadata is so dynamic, it does not make sense to define it here
    undefined),
});
export function shouldAutoCreateSimpleDoorSensorValue(ctx, endpoint) {
    const valueDB = ctx.tryGetValueDB(endpoint.nodeId);
    if (!valueDB)
        return false;
    const supportedACEvents = valueDB.getValue(NotificationCCValues.supportedNotificationEvents(
    // Access Control
    0x06).endpoint(endpoint.index));
    if (!supportedACEvents)
        return false;
    return (supportedACEvents.includes(
    // Window/door is open
    0x16)
        && supportedACEvents.includes(
        // Window/door is closed
        0x17));
}
let NotificationCCAPI = (() => {
    let _classDecorators = [API(CommandClasses.Notification)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = PhysicalCCAPI;
    let _instanceExtraInitializers = [];
    let _sendReport_decorators;
    let _get_decorators;
    let _set_decorators;
    let _getSupportedEvents_decorators;
    var NotificationCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _sendReport_decorators = [validateArgs()];
            _get_decorators = [validateArgs()];
            _set_decorators = [validateArgs()];
            _getSupportedEvents_decorators = [validateArgs()];
            __esDecorate(this, null, _sendReport_decorators, { kind: "method", name: "sendReport", static: false, private: false, access: { has: obj => "sendReport" in obj, get: obj => obj.sendReport }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _get_decorators, { kind: "method", name: "get", static: false, private: false, access: { has: obj => "get" in obj, get: obj => obj.get }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _set_decorators, { kind: "method", name: "set", static: false, private: false, access: { has: obj => "set" in obj, get: obj => obj.set }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getSupportedEvents_decorators, { kind: "method", name: "getSupportedEvents", static: false, private: false, access: { has: obj => "getSupportedEvents" in obj, get: obj => obj.getSupportedEvents }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            NotificationCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case NotificationCommand.Report:
                case NotificationCommand.Get:
                    return true; // These exist starting with V1
                case NotificationCommand.Set:
                case NotificationCommand.SupportedGet:
                    return this.version >= 2;
                case NotificationCommand.EventSupportedGet:
                    return this.version >= 3;
            }
            return super.supportsCommand(cmd);
        }
        get [POLL_VALUE]() {
            return async function ({ property, propertyKey }) {
                const valueId = {
                    commandClass: this.ccId,
                    endpoint: this.endpoint.index,
                    property,
                    propertyKey,
                };
                if (NotificationCCValues.notificationVariable.is(valueId)) {
                    const notificationType = this
                        .tryGetValueDB()?.getMetadata(valueId)?.ccSpecific
                        ?.notificationType;
                    if (notificationType != undefined) {
                        return this.getInternal({ notificationType });
                    }
                }
                throwUnsupportedProperty(this.ccId, property);
            };
        }
        /**
         * @internal
         */
        async getInternal(options) {
            this.assertSupportsCommand(NotificationCommand, NotificationCommand.Get);
            const cc = new NotificationCCGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                ...options,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        async sendReport(options) {
            this.assertSupportsCommand(NotificationCommand, NotificationCommand.Report);
            const cc = new NotificationCCReport({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                ...options,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        async get(options) {
            const response = await this.getInternal(options);
            if (response) {
                return pick(response, [
                    "notificationStatus",
                    "notificationEvent",
                    "alarmLevel",
                    "eventParameters",
                    "sequenceNumber",
                ]);
            }
        }
        async set(notificationType, notificationStatus) {
            this.assertSupportsCommand(NotificationCommand, NotificationCommand.Set);
            const cc = new NotificationCCSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                notificationType,
                notificationStatus,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        async getSupported() {
            this.assertSupportsCommand(NotificationCommand, NotificationCommand.SupportedGet);
            const cc = new NotificationCCSupportedGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, [
                    "supportsV1Alarm",
                    "supportedNotificationTypes",
                ]);
            }
        }
        async getSupportedEvents(notificationType) {
            this.assertSupportsCommand(NotificationCommand, NotificationCommand.EventSupportedGet);
            const cc = new NotificationCCEventSupportedGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                notificationType,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            return response?.supportedEvents;
        }
        constructor() {
            super(...arguments);
            __runInitializers(this, _instanceExtraInitializers);
        }
    };
    return NotificationCCAPI = _classThis;
})();
export { NotificationCCAPI };
export function getNotificationEnumBehavior(notification, valueConfig) {
    const variable = notification.variables.find((v) => v.states.has(valueConfig.value));
    if (!variable)
        return "none";
    const numStatesWithEnums = [...variable.states.values()].filter((val) => val.parameter?.type === "enum").length;
    if (numStatesWithEnums === 0)
        return "none";
    // An enum value replaces the original value if there is only a single possible state
    // which also has an enum parameter
    if (numStatesWithEnums === 1 && variable.states.size === 1) {
        return "replace";
    }
    return "extend";
}
export function getNotificationStateValueWithEnum(stateValue, enumValue) {
    return (stateValue << 8) | enumValue;
}
/**
 * Returns the metadata to use for a known notification value.
 * Can be used to extend a previously defined metadata,
 * e.g. for V2 notifications that don't allow discovering supported events.
 */
export function getNotificationValueMetadata(previous, notification, valueConfig) {
    const metadata = previous ?? {
        ...ValueMetadata.ReadOnlyUInt8,
        label: valueConfig.variableName,
        states: {},
        ccSpecific: {
            notificationType: notification.type,
        },
    };
    if (valueConfig.idle) {
        metadata.states[0] = "idle";
    }
    const enumBehavior = getNotificationEnumBehavior(notification, valueConfig);
    if (enumBehavior !== "replace") {
        metadata.states[valueConfig.value] = valueConfig.label;
    }
    if (valueConfig.parameter?.type === "enum") {
        for (const [key, label] of Object.entries(valueConfig.parameter.values)) {
            const value = parseInt(key);
            const stateKey = enumBehavior === "replace"
                ? value
                : getNotificationStateValueWithEnum(valueConfig.value, value);
            metadata.states[stateKey] = label;
        }
    }
    return metadata;
}
let NotificationCC = (() => {
    let _classDecorators = [commandClass(CommandClasses.Notification), implementedVersion(8), ccValues(NotificationCCValues)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var NotificationCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            NotificationCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        // former AlarmCC (v1..v2)
        determineRequiredCCInterviews() {
            return [
                ...super.determineRequiredCCInterviews(),
                CommandClasses.Association,
                CommandClasses["Multi Channel Association"],
                CommandClasses["Association Group Information"],
            ];
        }
        async determineNotificationMode(ctx, api, supportedNotificationEvents) {
            const node = this.getNode(ctx);
            // SDS14223: If the supporting node does not support the Association Command Class,
            // it may be concluded that the supporting node implements Pull Mode and discovery may be aborted.
            if (!node.supportsCC(CommandClasses.Association))
                return "pull";
            if (node.supportsCC(CommandClasses["Association Group Information"])) {
                try {
                    const groupsIssueingNotifications = AssociationGroupInfoCC
                        .findGroupsForIssuedCommand(ctx, node, this.ccId, NotificationCommand.Report);
                    return groupsIssueingNotifications.length > 0 ? "push" : "pull";
                }
                catch {
                    // We might be dealing with an older cache file, fall back to testing
                }
            }
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: `determining whether this node is pull or push...`,
                direction: "outbound",
            });
            // Find a notification type with at least one supported event
            for (const [type, events] of supportedNotificationEvents) {
                if (events.length === 0)
                    continue;
                // Enable the event and request the status
                await api.set(type, true);
                try {
                    const resp = await api.get({
                        notificationType: type,
                        notificationEvent: events[0],
                    });
                    switch (resp?.notificationStatus) {
                        case 0xff:
                            return "push";
                        case 0xfe:
                        case 0x00:
                            return "pull";
                    }
                }
                catch {
                    /* ignore */
                }
            }
            // If everything failed, e.g. because the node is V1/V2, assume this is a "push" node.
            // If we assumed "pull", we would have to query the node regularly, which can cause
            // the node to return old (already handled) notifications.
            // https://github.com/zwave-js/zwave-js/issues/5626
            return "push";
        }
        /** Whether the node implements push or pull notifications */
        static getNotificationMode(ctx, node) {
            return ctx
                .getValueDB(node.id)
                .getValue(NotificationCCValues.notificationMode.id);
        }
        async interview(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses.Notification, ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: `Interviewing ${this.ccName}...`,
                direction: "none",
            });
            // If one Association group issues Notification Reports,
            // we must associate ourselves with that channel
            try {
                await ccUtils.assignLifelineIssueingCommand(ctx, endpoint, this.ccId, NotificationCommand.Report);
            }
            catch {
                ctx.logNode(node.id, {
                    endpoint: endpoint.index,
                    message: `Configuring associations to receive ${getCCName(this.ccId)} reports failed!`,
                    level: "warn",
                });
            }
            let supportsV1Alarm = false;
            if (api.version >= 2) {
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: "querying supported notification types...",
                    direction: "outbound",
                });
                const suppResponse = await api.getSupported();
                if (!suppResponse) {
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message: "Querying supported notification types timed out, skipping interview...",
                        level: "warn",
                    });
                    return;
                }
                supportsV1Alarm = suppResponse.supportsV1Alarm;
                const supportedNotificationTypes = suppResponse.supportedNotificationTypes;
                const supportedNotificationNames = supportedNotificationTypes.map(getNotificationName);
                const supportedNotificationEvents = new Map();
                const logMessage = `received supported notification types:${supportedNotificationNames
                    .map((name) => `\n· ${name}`)
                    .join("")}`;
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: logMessage,
                    direction: "inbound",
                });
                if (api.version >= 3) {
                    // Query each notification for its supported events
                    for (let i = 0; i < supportedNotificationTypes.length; i++) {
                        const type = supportedNotificationTypes[i];
                        const name = supportedNotificationNames[i];
                        ctx.logNode(node.id, {
                            endpoint: this.endpointIndex,
                            message: `querying supported notification events for ${name}...`,
                            direction: "outbound",
                        });
                        const supportedEvents = await api.getSupportedEvents(type);
                        if (supportedEvents) {
                            supportedNotificationEvents.set(type, supportedEvents);
                            ctx.logNode(node.id, {
                                endpoint: this.endpointIndex,
                                message: `received supported notification events for ${name}: ${supportedEvents
                                    .map(String)
                                    .join(", ")}`,
                                direction: "inbound",
                            });
                        }
                    }
                }
                // Determine whether the node is a push or pull node
                let notificationMode = this.getValue(ctx, NotificationCCValues.notificationMode);
                if (notificationMode !== "push" && notificationMode !== "pull") {
                    notificationMode = await this.determineNotificationMode(ctx, api, supportedNotificationEvents);
                    this.setValue(ctx, NotificationCCValues.notificationMode, notificationMode);
                }
                if (notificationMode === "pull") {
                    await this.refreshValues(ctx);
                } /* if (notificationMode === "push") */
                else {
                    for (let i = 0; i < supportedNotificationTypes.length; i++) {
                        const type = supportedNotificationTypes[i];
                        const name = supportedNotificationNames[i];
                        const notification = getNotification(type);
                        // Enable reports for each notification type
                        ctx.logNode(node.id, {
                            endpoint: this.endpointIndex,
                            message: `enabling notifications for ${name}...`,
                            direction: "outbound",
                        });
                        await api.set(type, true);
                        // Set the value to idle if possible and there is no value yet
                        if (notification) {
                            const events = supportedNotificationEvents.get(type);
                            if (events) {
                                // Find all variables that are supported by this node and have an idle state
                                for (const variable of notification.variables
                                    .filter((v) => !!v.idle)) {
                                    if ([...variable.states.keys()].some((key) => events.includes(key))) {
                                        const value = NotificationCCValues
                                            .notificationVariable(notification.name, variable.name);
                                        // Set the value to idle if it has no value yet
                                        // TODO: GH#1028
                                        // * do this only if the last update was more than 5 minutes ago
                                        // * schedule an auto-idle if the last update was less than 5 minutes ago but before the current applHost start
                                        if (this.getValue(ctx, value)
                                            == undefined) {
                                            this.setValue(ctx, value, 0);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
            // Only create metadata for V1 values if necessary
            if (api.version === 1 || supportsV1Alarm) {
                this.ensureMetadata(ctx, NotificationCCValues.alarmType);
                this.ensureMetadata(ctx, NotificationCCValues.alarmLevel);
            }
            // Also create metadata for values mapped through compat config
            const mappings = ctx.getDeviceConfig?.(this.nodeId)
                ?.compat?.alarmMapping;
            if (mappings) {
                // Find all mappings to a valid notification variable
                const supportedNotifications = new Map();
                for (const { to } of mappings) {
                    const notification = getNotification(to.notificationType);
                    if (!notification)
                        continue;
                    const valueConfig = getNotificationValue(notification, to.notificationEvent);
                    // Remember supported notification types and events to create the internal values later
                    if (!supportedNotifications.has(to.notificationType)) {
                        supportedNotifications.set(to.notificationType, new Set());
                    }
                    const supportedNotificationTypesSet = supportedNotifications
                        .get(to.notificationType);
                    supportedNotificationTypesSet.add(to.notificationEvent);
                    if (valueConfig?.type !== "state")
                        continue;
                    const notificationValue = NotificationCCValues
                        .notificationVariable(notification.name, valueConfig.variableName);
                    // Create or update the metadata
                    const metadata = getNotificationValueMetadata(this.getMetadata(ctx, notificationValue), notification, valueConfig);
                    this.setMetadata(ctx, notificationValue, metadata);
                    // Set the value to idle if it has no value yet
                    if (valueConfig.idle) {
                        // TODO: GH#1028
                        // * do this only if the last update was more than 5 minutes ago
                        // * schedule an auto-idle if the last update was less than 5 minutes ago but before the current applHost start
                        if (this.getValue(ctx, notificationValue) == undefined) {
                            this.setValue(ctx, notificationValue, 0);
                        }
                    }
                }
                // Remember supported notification types and events in the cache
                this.setValue(ctx, NotificationCCValues.supportedNotificationTypes, [...supportedNotifications.keys()]);
                for (const [type, events] of supportedNotifications) {
                    this.setValue(ctx, NotificationCCValues.supportedNotificationEvents(type), [...events]);
                }
            }
            // Remember that the interview is complete
            this.setInterviewComplete(ctx, true);
        }
        async refreshValues(ctx) {
            const node = this.getNode(ctx);
            // Refreshing values only works on pull nodes
            if (NotificationCC.getNotificationMode(ctx, node) === "pull") {
                const endpoint = this.getEndpoint(ctx);
                const api = CCAPI.create(CommandClasses.Notification, ctx, endpoint).withOptions({
                    priority: MessagePriority.NodeQuery,
                });
                // Load supported notification types and events from cache
                const supportedNotificationTypes = this.getValue(ctx, NotificationCCValues.supportedNotificationTypes) ?? [];
                const supportedNotificationNames = supportedNotificationTypes.map(getNotificationName);
                for (let i = 0; i < supportedNotificationTypes.length; i++) {
                    const type = supportedNotificationTypes[i];
                    const name = supportedNotificationNames[i];
                    // Always query each notification for its current status
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message: `querying notification status for ${name}...`,
                        direction: "outbound",
                    });
                    const response = await api.getInternal({
                        notificationType: type,
                    });
                    // NotificationReports don't store their values themselves,
                    // because the behaviour is too complex and spans the lifetime
                    // of several reports. Thus we handle it in the Node instance
                    // @ts-expect-error
                    if (response)
                        await node.handleCommand(response);
                }
                // Remember when we did this
                this.setValue(ctx, NotificationCCValues.lastRefresh, Date.now());
            }
        }
        shouldRefreshValues(ctx) {
            // Pull-mode nodes must be polled regularly
            const isPullMode = NotificationCC.getNotificationMode(ctx, this.getNode(ctx)) === "pull";
            if (!isPullMode)
                return false;
            const lastUpdated = this.getValue(ctx, NotificationCCValues.lastRefresh);
            return (lastUpdated == undefined
                || Date.now() - lastUpdated > timespan.hours(6));
        }
    };
    return NotificationCC = _classThis;
})();
export { NotificationCC };
let NotificationCCSet = (() => {
    let _classDecorators = [CCCommand(NotificationCommand.Set), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = NotificationCC;
    var NotificationCCSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            NotificationCCSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.notificationType = options.notificationType;
            this.notificationStatus = options.notificationStatus;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const notificationType = raw.payload[0];
            const notificationStatus = raw.payload[1] === 0xff;
            return new this({
                nodeId: ctx.sourceNodeId,
                notificationType,
                notificationStatus,
            });
        }
        notificationType;
        notificationStatus;
        serialize(ctx) {
            this.payload = Bytes.from([
                this.notificationType,
                this.notificationStatus ? 0xff : 0x00,
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "notification type": getNotificationName(this.notificationType),
                    status: this.notificationStatus,
                },
            };
        }
    };
    return NotificationCCSet = _classThis;
})();
export { NotificationCCSet };
let NotificationCCReport = (() => {
    let _classDecorators = [CCCommand(NotificationCommand.Report), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = NotificationCC;
    var NotificationCCReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            NotificationCCReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            if (options.alarmType != undefined) {
                this.alarmType = options.alarmType;
                this.alarmLevel = options.alarmLevel;
            }
            if (options.notificationType != undefined) {
                this.notificationType = options.notificationType;
                this.notificationStatus = options.notificationStatus ?? true;
                this.notificationEvent = options.notificationEvent;
                this.eventParameters = options.eventParameters;
                this.sequenceNumber = options.sequenceNumber;
            }
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const alarmType = raw.payload[0];
            const alarmLevel = raw.payload[1];
            // Byte 2 used to be zensorNetSourceNodeId in V2 and V3, but we don't care about that
            if (raw.payload.length < 7) {
                return new this({
                    nodeId: ctx.sourceNodeId,
                    alarmType,
                    alarmLevel,
                });
            }
            // V2+ requires the alarm bytes to be zero. Manufacturers don't care though, so we don't enforce that.
            // Don't use the version to decide because we might discard notifications
            // before the interview is complete
            const notificationStatus = raw.payload[3];
            const notificationType = raw.payload[4];
            const notificationEvent = raw.payload[5];
            const containsSeqNum = !!(raw.payload[6] & 0b1000_0000);
            const numEventParams = raw.payload[6] & 0b11111;
            let eventParameters;
            if (numEventParams > 0) {
                validatePayload(raw.payload.length >= 7 + numEventParams);
                eventParameters = raw.payload.subarray(7, 7 + numEventParams);
            }
            let sequenceNumber;
            if (containsSeqNum) {
                validatePayload(raw.payload.length >= 7 + numEventParams + 1);
                sequenceNumber = raw.payload[7 + numEventParams];
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                alarmType,
                alarmLevel,
                notificationStatus,
                notificationType,
                notificationEvent,
                eventParameters,
                sequenceNumber,
            });
        }
        persistValues(ctx) {
            if (!super.persistValues(ctx))
                return false;
            const ccVersion = getEffectiveCCVersion(ctx, this);
            // Check if we need to re-interpret the alarm values somehow
            if (this.alarmType != undefined
                && this.alarmLevel != undefined
                && this.alarmType !== 0) {
                if (ccVersion >= 2) {
                    // Check if the device actually supports Notification CC, but chooses
                    // to send Alarm frames instead (GH#1034)
                    const supportedNotificationTypes = this.getValue(ctx, NotificationCCValues.supportedNotificationTypes);
                    if (isArray(supportedNotificationTypes)
                        && supportedNotificationTypes.includes(this.alarmType)) {
                        const supportedNotificationEvents = this.getValue(ctx, NotificationCCValues.supportedNotificationEvents(this.alarmType));
                        if (isArray(supportedNotificationEvents)
                            && supportedNotificationEvents.includes(this.alarmLevel)) {
                            // This alarm frame corresponds to a valid notification event
                            ctx.logNode(this.nodeId, `treating V1 Alarm frame as Notification Report`);
                            this.notificationType = this.alarmType;
                            this.notificationEvent = this.alarmLevel;
                            this.alarmType = undefined;
                            this.alarmLevel = undefined;
                        }
                    }
                }
                else {
                    // V1 Alarm, check if there is a compat option to map this V1 report to a V2+ report
                    const mapping = ctx.getDeviceConfig?.(this.nodeId)?.compat?.alarmMapping;
                    const match = mapping?.find((m) => m.from.alarmType === this.alarmType
                        && (m.from.alarmLevel == undefined
                            || m.from.alarmLevel === this.alarmLevel));
                    if (match) {
                        ctx.logNode(this.nodeId, `compat mapping found, treating V1 Alarm frame as Notification Report`);
                        this.notificationType = match.to.notificationType;
                        this.notificationEvent = match.to.notificationEvent;
                        if (match.to.eventParameters) {
                            this.eventParameters = {};
                            for (const [key, val] of Object.entries(match.to.eventParameters)) {
                                if (typeof val === "number") {
                                    this.eventParameters[key] = val;
                                }
                                else if (val === "alarmLevel") {
                                    this.eventParameters[key] = this.alarmLevel;
                                }
                            }
                        }
                        // After mapping we do not set the legacy V1 values to undefined
                        // Otherwise, adding a new mapping will be a breaking change
                    }
                }
            }
            // Now we can interpret the event parameters and turn them into something useful
            this.parseEventParameters(ctx);
            if (this.alarmType != undefined) {
                const alarmTypeValue = NotificationCCValues.alarmType;
                this.ensureMetadata(ctx, alarmTypeValue);
                this.setValue(ctx, alarmTypeValue, this.alarmType);
            }
            if (this.alarmLevel != undefined) {
                const alarmLevelValue = NotificationCCValues.alarmLevel;
                this.ensureMetadata(ctx, alarmLevelValue);
                this.setValue(ctx, alarmLevelValue, this.alarmLevel);
            }
            return true;
        }
        alarmType;
        alarmLevel;
        notificationType;
        notificationStatus;
        notificationEvent;
        eventParameters;
        sequenceNumber;
        toLogEntry(ctx) {
            let message = {};
            if (this.alarmType) {
                message = {
                    "V1 alarm type": this.alarmType,
                    "V1 alarm level": this.alarmLevel,
                };
            }
            let valueConfig;
            if (this.notificationType) {
                const notification = getNotification(this.notificationType);
                if (notification) {
                    valueConfig = getNotificationValue(notification, this.notificationEvent);
                }
                if (valueConfig) {
                    message = {
                        ...message,
                        "notification type": getNotificationName(this.notificationType),
                        "notification status": this.notificationStatus,
                        [`notification ${valueConfig.type}`]: valueConfig.label
                            ?? `Unknown (${num2hex(this.notificationEvent)})`,
                    };
                }
                else if (this.notificationEvent === 0x00) {
                    message = {
                        ...message,
                        "notification type": this.notificationType,
                        "notification status": this.notificationStatus,
                        "notification state": "idle",
                    };
                }
                else {
                    message = {
                        ...message,
                        "notification type": this.notificationType,
                        "notification status": this.notificationStatus,
                        "notification event": num2hex(this.notificationEvent),
                    };
                }
            }
            if (this.sequenceNumber != undefined) {
                message["sequence number"] = this.sequenceNumber;
            }
            if (this.eventParameters != undefined) {
                if (typeof this.eventParameters === "number") {
                    // Try to look up the enum label
                    let found = false;
                    if (valueConfig?.parameter?.type === "enum") {
                        const label = valueConfig.parameter.values[this.eventParameters];
                        if (label) {
                            message["state parameters"] = label;
                            found = true;
                        }
                    }
                    if (!found) {
                        message["state parameters"] = num2hex(this.eventParameters);
                    }
                }
                else if (isUint8Array(this.eventParameters)) {
                    message["event parameters"] = buffer2hex(this.eventParameters);
                }
                else if (Duration.isDuration(this.eventParameters)) {
                    message["event parameters"] = this.eventParameters.toString();
                }
                else {
                    message["event parameters"] = Object.entries(this.eventParameters)
                        .map(([param, val]) => `\n  ${param}: ${num2hex(val)}`)
                        .join("");
                }
            }
            else if (valueConfig?.parameter?.type === "enum"
                && valueConfig.parameter.default != undefined) {
                const label = valueConfig.parameter.values[valueConfig.parameter.default];
                if (label) {
                    message["state parameters"] = `${label} (omitted)`;
                }
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
        parseEventParameters(ctx) {
            // This only makes sense for V2+ notifications
            if (this.notificationType == undefined
                || this.notificationEvent == undefined) {
                return;
            }
            // Look up the received notification and value in the config
            const notification = getNotification(this.notificationType);
            if (!notification)
                return;
            const valueConfig = getNotificationValue(notification, this.notificationEvent);
            if (!valueConfig)
                return;
            // Parse the event parameters if possible
            if (valueConfig.parameter?.type === "duration") {
                // This only makes sense if the event parameters are a buffer
                if (!isUint8Array(this.eventParameters)) {
                    return;
                }
                // The parameters contain a Duration
                this.eventParameters = Duration.parseReport(this.eventParameters[0]);
            }
            else if (valueConfig.parameter?.type === "commandclass") {
                // This only makes sense if the event parameters are a buffer
                if (!isUint8Array(this.eventParameters)) {
                    return;
                }
                // The parameters **should** contain a CC, however there might be some exceptions
                if (this.eventParameters.length === 1
                    && notification.type === 0x06
                    && (this.notificationEvent === 0x05
                        || this.notificationEvent === 0x06)) {
                    // Access control -> Keypad Lock/Unlock operation
                    // Some devices only send the User ID, not a complete CC payload
                    this.eventParameters = {
                        userId: this.eventParameters[0],
                    };
                }
                else {
                    // Try to parse the event parameters - if this fails, we should still handle the notification report
                    try {
                        // Convert CommandClass instances to a standardized object representation
                        // We do not want to parse asynchronously here, but the `CommandClass.parse` method is async.
                        // However, we only deal with simple CCs that can be parsed synchronously. We can do this
                        // by replicating what `CommandClass.parse` does: determine the correct CC class and call its
                        // `from` method. If that returns a CC instance, we're good to continue.
                        const raw = CCRaw.parse(this.eventParameters);
                        if (raw.ccCommand == undefined) {
                            validatePayload.fail("event parameters contain an invalid CC");
                        }
                        const CommandConstructor = getCCCommandConstructor(raw.ccId, raw.ccCommand);
                        if (!CommandConstructor) {
                            validatePayload.fail("event parameters contain an invalid CC");
                        }
                        const cc = CommandConstructor.from(raw, {
                            ...ctx,
                            frameType: "singlecast",
                            sourceNodeId: this.nodeId,
                            // Security encapsulation is handled outside of this CC,
                            // so it is not needed here:
                            hasSecurityClass: () => false,
                            getHighestSecurityClass: () => SecurityClass.None,
                            setSecurityClass: () => { },
                            securityManager: undefined,
                            securityManager2: undefined,
                            securityManagerLR: undefined,
                        });
                        if (cc instanceof Promise) {
                            validatePayload.fail("Cannot asynchronously parse CC from event parameters");
                        }
                        validatePayload(!(cc instanceof InvalidCC));
                        cc.encapsulatingCC = this;
                        if (isNotificationEventPayload(cc)) {
                            this.eventParameters = cc
                                .toNotificationEventParameters();
                        }
                        else {
                            // If a CC has no good toJSON() representation, we're only interested in the payload
                            let json = cc.toJSON();
                            if ("nodeId" in json
                                && "ccId" in json
                                && "payload" in json) {
                                json = pick(json, ["payload"]);
                            }
                            this.eventParameters = json;
                        }
                    }
                    catch (e) {
                        if (isZWaveError(e)
                            && e.code
                                === ZWaveErrorCodes.PacketFormat_InvalidPayload
                            && isUint8Array(this.eventParameters)) {
                            const { ccId, ccCommand } = CCRaw.parse(this.eventParameters);
                            if (ccId === CommandClasses["User Code"]
                                && ccCommand === UserCodeCommand.Report
                                && this.eventParameters.length >= 3) {
                                // Access control -> Keypad Lock/Unlock operation
                                // Some devices report the user code with truncated UserCode reports
                                this.eventParameters = {
                                    userId: this.eventParameters[2],
                                };
                            }
                            else {
                                ctx.logNode(this.nodeId, `Failed to parse Notification CC event parameters, ignoring them...`, "error");
                            }
                        }
                        else {
                            // unexpected error
                            throw e;
                        }
                    }
                }
            }
            else if (valueConfig.parameter?.type === "value") {
                // This only makes sense if the event parameters are a buffer
                if (!isUint8Array(this.eventParameters)) {
                    return;
                }
                // The parameters contain a named value
                this.eventParameters = {
                    [valueConfig.parameter.propertyName]: Bytes.view(this.eventParameters)
                        .readUIntBE(0, this.eventParameters.length),
                };
            }
            else if (valueConfig.parameter?.type === "enum") {
                // The parameters may contain an enum value
                this.eventParameters = isUint8Array(this.eventParameters)
                    && this.eventParameters.length === 1
                    ? this.eventParameters[0]
                    : undefined;
                // Some devices send notifications without an event parameter when they should.
                // In this case, fall back to the default value where possible.
                if (this.eventParameters == undefined
                    && valueConfig.parameter.default != undefined) {
                    this.eventParameters = valueConfig.parameter.default;
                }
            }
        }
        serialize(ctx) {
            if (this.notificationType != undefined) {
                if (this.notificationEvent == undefined) {
                    throw new ZWaveError(`Notification CC reports requires the notification event to be set!`, ZWaveErrorCodes.Argument_Invalid);
                }
                else if (this.eventParameters != undefined
                    && !isUint8Array(this.eventParameters)) {
                    throw new ZWaveError(`When sending Notification CC reports, the event parameters can only be buffers!`, ZWaveErrorCodes.Argument_Invalid);
                }
                const controlByte = (this.sequenceNumber != undefined ? 0b1000_0000 : 0)
                    | ((this.eventParameters?.length ?? 0) & 0b11111);
                this.payload = Bytes.from([
                    0,
                    0,
                    0,
                    0xff,
                    this.notificationType,
                    this.notificationEvent,
                    controlByte,
                ]);
                if (this.eventParameters) {
                    this.payload = Bytes.concat([
                        this.payload,
                        this.eventParameters,
                    ]);
                }
                if (this.sequenceNumber != undefined) {
                    this.payload = Bytes.concat([
                        this.payload,
                        Bytes.from([this.sequenceNumber]),
                    ]);
                }
            }
            else {
                this.payload = Bytes.from([
                    this.alarmType ?? 0x00,
                    this.alarmLevel ?? 0x00,
                ]);
            }
            return super.serialize(ctx);
        }
    };
    return NotificationCCReport = _classThis;
})();
export { NotificationCCReport };
let NotificationCCGet = (() => {
    let _classDecorators = [CCCommand(NotificationCommand.Get), expectedCCResponse(NotificationCCReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = NotificationCC;
    var NotificationCCGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            NotificationCCGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            if ("alarmType" in options) {
                this.alarmType = options.alarmType;
            }
            else {
                this.notificationType = options.notificationType;
                this.notificationEvent = options.notificationEvent;
            }
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            if (raw.payload.length >= 2) {
                const notificationType = raw.payload[1];
                let notificationEvent;
                if (raw.payload.length >= 3 && notificationType != 0xff) {
                    notificationEvent = raw.payload[2];
                }
                return new this({
                    nodeId: ctx.sourceNodeId,
                    notificationType,
                    notificationEvent,
                });
            }
            else {
                const alarmType = raw.payload[0];
                return new this({
                    nodeId: ctx.sourceNodeId,
                    alarmType,
                });
            }
        }
        /** Proprietary V1/V2 alarm type */
        alarmType;
        /** Regulated V3+ notification type */
        notificationType;
        notificationEvent;
        serialize(ctx) {
            const notificationEvent = this.notificationEvent === 0xff
                ? 0x00
                : this.notificationEvent;
            this.payload = Bytes.from([
                this.alarmType ?? 0x00,
                this.notificationType ?? 0xff,
                notificationEvent ?? 0x00,
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const message = {};
            if (this.alarmType != undefined) {
                message["V1 alarm type"] = this.alarmType;
            }
            if (this.notificationType != undefined) {
                message["notification type"] = getNotificationName(this.notificationType);
                if (this.notificationEvent != undefined) {
                    message["notification event"] = getNotificationEventName(this.notificationType, this.notificationEvent);
                }
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return NotificationCCGet = _classThis;
})();
export { NotificationCCGet };
let NotificationCCSupportedReport = (() => {
    let _classDecorators = [CCCommand(NotificationCommand.SupportedReport), ccValueProperty("supportsV1Alarm", NotificationCCValues.supportsV1Alarm), ccValueProperty("supportedNotificationTypes", NotificationCCValues.supportedNotificationTypes)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = NotificationCC;
    var NotificationCCSupportedReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            NotificationCCSupportedReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.supportsV1Alarm = options.supportsV1Alarm;
            this.supportedNotificationTypes = options.supportedNotificationTypes;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const supportsV1Alarm = !!(raw.payload[0] & 0b1000_0000);
            const numBitMaskBytes = raw.payload[0] & 0b0001_1111;
            validatePayload(numBitMaskBytes > 0, raw.payload.length >= 1 + numBitMaskBytes);
            const notificationBitMask = raw.payload.subarray(1, 1 + numBitMaskBytes);
            const supportedNotificationTypes = parseBitMask(notificationBitMask, 
            // bit 0 is ignored, but counting still starts at 1, so the first bit must have the value 0
            0);
            return new this({
                nodeId: ctx.sourceNodeId,
                supportsV1Alarm,
                supportedNotificationTypes,
            });
        }
        supportsV1Alarm;
        supportedNotificationTypes;
        serialize(ctx) {
            const bitMask = encodeBitMask(this.supportedNotificationTypes, Math.max(...this.supportedNotificationTypes), 0);
            this.payload = Bytes.concat([
                Bytes.from([
                    (this.supportsV1Alarm ? 0b1000_0000 : 0) | bitMask.length,
                ]),
                bitMask,
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "supports V1 alarm": this.supportsV1Alarm,
                    "supported notification types": this.supportedNotificationTypes
                        .map((t) => `\n· ${getNotificationName(t)}`)
                        .join(""),
                },
            };
        }
    };
    return NotificationCCSupportedReport = _classThis;
})();
export { NotificationCCSupportedReport };
let NotificationCCSupportedGet = (() => {
    let _classDecorators = [CCCommand(NotificationCommand.SupportedGet), expectedCCResponse(NotificationCCSupportedReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = NotificationCC;
    var NotificationCCSupportedGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            NotificationCCSupportedGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return NotificationCCSupportedGet = _classThis;
})();
export { NotificationCCSupportedGet };
let NotificationCCEventSupportedReport = (() => {
    let _classDecorators = [CCCommand(NotificationCommand.EventSupportedReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = NotificationCC;
    var NotificationCCEventSupportedReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            NotificationCCEventSupportedReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.notificationType = options.notificationType;
            this.supportedEvents = options.supportedEvents;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const notificationType = raw.payload[0];
            const numBitMaskBytes = raw.payload[1] & 0b000_11111;
            if (numBitMaskBytes === 0) {
                // Notification type is not supported
                return new this({
                    nodeId: ctx.sourceNodeId,
                    notificationType,
                    supportedEvents: [],
                });
            }
            validatePayload(raw.payload.length >= 2 + numBitMaskBytes);
            const eventBitMask = raw.payload.subarray(2, 2 + numBitMaskBytes);
            const supportedEvents = parseBitMask(eventBitMask, 
            // In this mask, bit 0 is ignored, but counting still starts at 1, so the first bit must have the value 0
            0);
            return new this({
                nodeId: ctx.sourceNodeId,
                notificationType,
                supportedEvents,
            });
        }
        persistValues(ctx) {
            if (!super.persistValues(ctx))
                return false;
            // Store which events this notification supports
            this.setValue(ctx, NotificationCCValues.supportedNotificationEvents(this.notificationType), this.supportedEvents);
            // For each event, predefine the value metadata
            const notification = getNotification(this.notificationType);
            if (!notification) {
                // This is an unknown notification
                this.setMetadata(ctx, NotificationCCValues.unknownNotificationType(this.notificationType));
            }
            else {
                // This is a standardized notification
                let isFirst = true;
                for (const value of this.supportedEvents) {
                    // Find out which property we need to update
                    const valueConfig = getNotificationValue(notification, value);
                    if (valueConfig?.type === "state") {
                        const notificationValue = NotificationCCValues
                            .notificationVariable(notification.name, valueConfig.variableName);
                        // After we've created the metadata initially, extend it
                        const metadata = getNotificationValueMetadata(isFirst
                            ? undefined
                            : this.getMetadata(ctx, notificationValue), notification, valueConfig);
                        this.setMetadata(ctx, notificationValue, metadata);
                        isFirst = false;
                    }
                }
            }
            return true;
        }
        notificationType;
        supportedEvents;
        serialize(ctx) {
            this.payload = Bytes.from([this.notificationType, 0]);
            if (this.supportedEvents.length > 0) {
                const bitMask = encodeBitMask(this.supportedEvents, Math.max(...this.supportedEvents), 0);
                this.payload[1] = bitMask.length;
                this.payload = Bytes.concat([this.payload, bitMask]);
            }
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "notification type": getNotificationName(this.notificationType),
                    "supported events": this.supportedEvents
                        .map((e) => `\n· ${getNotificationValueName(this.notificationType, e)}`)
                        .join(""),
                },
            };
        }
    };
    return NotificationCCEventSupportedReport = _classThis;
})();
export { NotificationCCEventSupportedReport };
let NotificationCCEventSupportedGet = (() => {
    let _classDecorators = [CCCommand(NotificationCommand.EventSupportedGet), expectedCCResponse(NotificationCCEventSupportedReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = NotificationCC;
    var NotificationCCEventSupportedGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            NotificationCCEventSupportedGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.notificationType = options.notificationType;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const notificationType = raw.payload[0];
            return new this({
                nodeId: ctx.sourceNodeId,
                notificationType,
            });
        }
        notificationType;
        serialize(ctx) {
            this.payload = Bytes.from([this.notificationType]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "notification type": getNotificationName(this.notificationType),
                },
            };
        }
    };
    return NotificationCCEventSupportedGet = _classThis;
})();
export { NotificationCCEventSupportedGet };
//# sourceMappingURL=NotificationCC.js.map