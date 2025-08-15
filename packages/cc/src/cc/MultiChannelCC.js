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
import { CommandClasses, MessagePriority, ZWaveError, ZWaveErrorCodes, encodeApplicationNodeInformation, encodeBitMask, getCCName, getGenericDeviceClass, getSpecificDeviceClass, parseApplicationNodeInformation, parseBitMask, validatePayload, } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { distinct } from "alcalzone-shared/arrays";
import { CCAPI } from "../lib/API.js";
import { CommandClass, getEffectiveCCVersion, } from "../lib/CommandClass.js";
import { API, CCCommand, ccValueProperty, ccValues, commandClass, expectedCCResponse, implementedVersion, } from "../lib/CommandClassDecorators.js";
import { isEncapsulatingCommandClass, isMultiEncapsulatingCommandClass, } from "../lib/EncapsulatingCommandClass.js";
import { V } from "../lib/Values.js";
import { MultiChannelCommand } from "../lib/_Types.js";
// TODO: Handle removal reports of dynamic endpoints
export const MultiChannelCCValues = V.defineCCValues(CommandClasses["Multi Channel"], {
    ...V.staticProperty("endpointIndizes", undefined, {
        internal: true,
        supportsEndpoints: false,
    }),
    ...V.staticPropertyWithName("individualEndpointCount", "individualCount", undefined, {
        internal: true,
        supportsEndpoints: false,
    }),
    ...V.staticPropertyWithName("aggregatedEndpointCount", "aggregatedCount", undefined, {
        internal: true,
        supportsEndpoints: false,
    }),
    ...V.staticPropertyWithName("endpointCountIsDynamic", "countIsDynamic", undefined, {
        internal: true,
        supportsEndpoints: false,
    }),
    ...V.staticPropertyWithName("endpointsHaveIdenticalCapabilities", "identicalCapabilities", undefined, {
        internal: true,
        supportsEndpoints: false,
    }),
    ...V.staticPropertyWithName("endpointCCs", "commandClasses", undefined, { internal: true }),
    ...V.staticPropertyWithName("endpointDeviceClass", "deviceClass", undefined, { internal: true }),
    ...V.dynamicPropertyAndKeyWithName("aggregatedEndpointMembers", "members", (endpointIndex) => endpointIndex, ({ property, propertyKey }) => property === "members" && typeof propertyKey === "number", undefined, { internal: true }),
});
// @noSetValueAPI
/**
 * Many devices unnecessarily use endpoints when they could (or do) provide all functionality via the root device.
 * This function gives an estimate if this is the case (i.e. all endpoints have a different device class)
 */
function areEndpointsUnnecessary(ctx, nodeId, endpointIndizes) {
    // Gather all device classes
    const deviceClasses = new Map();
    for (const endpoint of endpointIndizes) {
        const devClassValueId = MultiChannelCCValues.endpointDeviceClass
            .endpoint(endpoint);
        const deviceClass = ctx.getValueDB(nodeId).getValue(devClassValueId);
        if (deviceClass) {
            deviceClasses.set(endpoint, {
                generic: deviceClass.generic,
                specific: deviceClass.specific,
            });
        }
    }
    // Endpoints may be useless if all of them have different device classes
    const distinctDeviceClasses = distinct([...deviceClasses.values()].map(({ generic, specific }) => generic * 256 + specific));
    if (distinctDeviceClasses.length !== endpointIndizes.length) {
        // There are endpoints with the same device class, so they are not unnecessary
        return false;
    }
    // Endpoints are necessary if more than 1 of them has a switch-type device class
    const switchTypeDeviceClasses = [
        0x10, // Binary Switch
        0x11, // Multilevel Switch
        0x12, // Remote Switch
        0x13, // Toggle Switch
    ];
    const numSwitchEndpoints = [...deviceClasses.values()].filter(({ generic }) => switchTypeDeviceClasses.includes(generic)).length;
    if (numSwitchEndpoints > 1)
        return false;
    return true;
}
let MultiChannelCCAPI = (() => {
    let _classDecorators = [API(CommandClasses["Multi Channel"])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CCAPI;
    let _instanceExtraInitializers = [];
    let _getEndpointCapabilities_decorators;
    let _findEndpoints_decorators;
    let _getAggregatedMembers_decorators;
    let _getEndpointCountV1_decorators;
    var MultiChannelCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _getEndpointCapabilities_decorators = [validateArgs()];
            _findEndpoints_decorators = [validateArgs()];
            _getAggregatedMembers_decorators = [validateArgs()];
            _getEndpointCountV1_decorators = [validateArgs()];
            __esDecorate(this, null, _getEndpointCapabilities_decorators, { kind: "method", name: "getEndpointCapabilities", static: false, private: false, access: { has: obj => "getEndpointCapabilities" in obj, get: obj => obj.getEndpointCapabilities }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _findEndpoints_decorators, { kind: "method", name: "findEndpoints", static: false, private: false, access: { has: obj => "findEndpoints" in obj, get: obj => obj.findEndpoints }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getAggregatedMembers_decorators, { kind: "method", name: "getAggregatedMembers", static: false, private: false, access: { has: obj => "getAggregatedMembers" in obj, get: obj => obj.getAggregatedMembers }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getEndpointCountV1_decorators, { kind: "method", name: "getEndpointCountV1", static: false, private: false, access: { has: obj => "getEndpointCountV1" in obj, get: obj => obj.getEndpointCountV1 }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MultiChannelCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                // Legacy commands:
                case MultiChannelCommand.GetV1:
                    return this.isSinglecast() && this.version === 1;
                case MultiChannelCommand.CommandEncapsulationV1:
                    return this.version === 1;
                // The specs start at version 3 but according to OZW,
                // these do seem to be supported in version 2
                case MultiChannelCommand.EndPointGet:
                case MultiChannelCommand.CapabilityGet:
                    return this.version >= 2 && this.isSinglecast();
                case MultiChannelCommand.CommandEncapsulation:
                    return this.version >= 2;
                case MultiChannelCommand.EndPointFind:
                    return this.version >= 3 && this.isSinglecast();
                case MultiChannelCommand.AggregatedMembersGet:
                    return this.version >= 4 && this.isSinglecast();
            }
            return super.supportsCommand(cmd);
        }
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        async getEndpoints() {
            this.assertSupportsCommand(MultiChannelCommand, MultiChannelCommand.EndPointGet);
            const cc = new MultiChannelCCEndPointGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return {
                    isDynamicEndpointCount: response.countIsDynamic,
                    identicalCapabilities: response.identicalCapabilities,
                    individualEndpointCount: response.individualCount,
                    aggregatedEndpointCount: response.aggregatedCount,
                };
            }
        }
        async getEndpointCapabilities(endpoint) {
            this.assertSupportsCommand(MultiChannelCommand, MultiChannelCommand.CapabilityGet);
            const cc = new MultiChannelCCCapabilityGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                requestedEndpoint: endpoint,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                const generic = getGenericDeviceClass(response.genericDeviceClass);
                const specific = getSpecificDeviceClass(response.genericDeviceClass, response.specificDeviceClass);
                return {
                    isDynamic: response.isDynamic,
                    wasRemoved: response.wasRemoved,
                    supportedCCs: response.supportedCCs,
                    generic,
                    specific,
                };
            }
        }
        async findEndpoints(genericClass, specificClass) {
            this.assertSupportsCommand(MultiChannelCommand, MultiChannelCommand.EndPointFind);
            const cc = new MultiChannelCCEndPointFind({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                genericClass,
                specificClass,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            return response?.foundEndpoints;
        }
        async getAggregatedMembers(endpoint) {
            this.assertSupportsCommand(MultiChannelCommand, MultiChannelCommand.AggregatedMembersGet);
            const cc = new MultiChannelCCAggregatedMembersGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                requestedEndpoint: endpoint,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            return response?.members;
        }
        // Encapsulation is used internally and too frequently that we
        // want to pay the cost of validating each call
        // eslint-disable-next-line @zwave-js/ccapi-validate-args
        async sendEncapsulated(options) {
            this.assertSupportsCommand(MultiChannelCommand, MultiChannelCommand.CommandEncapsulation);
            const cc = new MultiChannelCCCommandEncapsulation({
                nodeId: this.endpoint.nodeId,
                ...options,
            });
            await this.host.sendCommand(cc, this.commandOptions);
        }
        async getEndpointCountV1(ccId) {
            this.assertSupportsCommand(MultiChannelCommand, MultiChannelCommand.GetV1);
            const cc = new MultiChannelCCV1Get({
                nodeId: this.endpoint.nodeId,
                requestedCC: ccId,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            return response?.endpointCount;
        }
        // Encapsulation is used internally and too frequently that we
        // want to pay the cost of validating each call
        // eslint-disable-next-line @zwave-js/ccapi-validate-args
        async sendEncapsulatedV1(encapsulated) {
            this.assertSupportsCommand(MultiChannelCommand, MultiChannelCommand.CommandEncapsulationV1);
            const cc = new MultiChannelCCV1CommandEncapsulation({
                nodeId: this.endpoint.nodeId,
                encapsulated,
            });
            await this.host.sendCommand(cc, this.commandOptions);
        }
        constructor() {
            super(...arguments);
            __runInitializers(this, _instanceExtraInitializers);
        }
    };
    return MultiChannelCCAPI = _classThis;
})();
export { MultiChannelCCAPI };
let MultiChannelCC = (() => {
    let _classDecorators = [commandClass(CommandClasses["Multi Channel"]), implementedVersion(4), ccValues(MultiChannelCCValues)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var MultiChannelCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MultiChannelCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        /** Tests if a command targets a specific endpoint and thus requires encapsulation */
        static requiresEncapsulation(cc) {
            return (cc.endpointIndex !== 0
                && !(cc instanceof MultiChannelCCCommandEncapsulation)
                && !(cc instanceof MultiChannelCCV1CommandEncapsulation));
        }
        /** Encapsulates a command that targets a specific endpoint, with version 2+ of the Multi Channel CC */
        static encapsulate(cc) {
            const ret = new MultiChannelCCCommandEncapsulation({
                nodeId: cc.nodeId,
                encapsulated: cc,
                destination: cc.endpointIndex,
            });
            // Copy the encapsulation flags from the encapsulated command
            ret.encapsulationFlags = cc.encapsulationFlags;
            return ret;
        }
        /** Encapsulates a command that targets a specific endpoint, with version 1 of the Multi Channel CC */
        static encapsulateV1(cc) {
            const ret = new MultiChannelCCV1CommandEncapsulation({
                nodeId: cc.nodeId,
                endpointIndex: cc.endpointIndex,
                encapsulated: cc,
            });
            // Copy the encapsulation flags from the encapsulated command
            ret.encapsulationFlags = cc.encapsulationFlags;
            return ret;
        }
        skipEndpointInterview() {
            // The endpoints are discovered by querying the root device
            return true;
        }
        async interview(ctx) {
            const node = this.getNode(ctx);
            const removeEndpoints = ctx.getDeviceConfig?.(node.id)?.compat
                ?.removeEndpoints;
            if (removeEndpoints === "*") {
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: `Skipping ${this.ccName} interview b/c all endpoints are ignored by the device config file...`,
                    direction: "none",
                });
                return;
            }
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: `Interviewing ${this.ccName}...`,
                direction: "none",
            });
            // Special interview procedure for legacy nodes
            const ccVersion = getEffectiveCCVersion(ctx, this);
            if (ccVersion === 1)
                return this.interviewV1(ctx);
            const endpoint = node.getEndpoint(this.endpointIndex);
            const api = CCAPI.create(CommandClasses["Multi Channel"], ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            const valueDB = this.getValueDB(ctx);
            // Step 1: Retrieve general information about end points
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: "querying device endpoint information...",
                direction: "outbound",
            });
            const multiResponse = await api.getEndpoints();
            if (!multiResponse) {
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: "Querying device endpoint information timed out, aborting interview...",
                    level: "warn",
                });
                return this.throwMissingCriticalInterviewResponse();
            }
            let logMessage = `received response for device endpoints:
endpoint count (individual): ${multiResponse.individualEndpointCount}
count is dynamic:            ${multiResponse.isDynamicEndpointCount}
identical capabilities:      ${multiResponse.identicalCapabilities}`;
            if (multiResponse.aggregatedEndpointCount != undefined) {
                logMessage +=
                    `\nendpoint count (aggregated): ${multiResponse.aggregatedEndpointCount}`;
            }
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: logMessage,
                direction: "inbound",
            });
            let allEndpoints = [];
            const addSequentialEndpoints = () => {
                for (let i = 1; i
                    <= multiResponse.individualEndpointCount
                        + (multiResponse.aggregatedEndpointCount ?? 0); i++) {
                    allEndpoints.push(i);
                }
            };
            if (api.supportsCommand(MultiChannelCommand.EndPointFind)) {
                // Step 2a: Find all endpoints
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: "querying all endpoints...",
                    direction: "outbound",
                });
                const foundEndpoints = await api.findEndpoints(0xff, 0xff);
                if (foundEndpoints)
                    allEndpoints.push(...foundEndpoints);
                if (!allEndpoints.length) {
                    // Create a sequential list of endpoints
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message: `Endpoint query returned no results, assuming that endpoints are sequential`,
                        direction: "inbound",
                    });
                    addSequentialEndpoints();
                }
                else {
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message: `received endpoints: ${allEndpoints
                            .map(String)
                            .join(", ")}`,
                        direction: "inbound",
                    });
                }
            }
            else {
                // Step 2b: Assume that the endpoints are in sequential order
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: `does not support EndPointFind, assuming that endpoints are sequential`,
                    direction: "none",
                });
                addSequentialEndpoints();
            }
            // Step 2.5: remove ignored endpoints
            if (removeEndpoints?.length) {
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: `The following endpoints are ignored through the config file: ${removeEndpoints.join(", ")}`,
                    direction: "none",
                });
                allEndpoints = allEndpoints.filter((e) => !removeEndpoints.includes(e));
            }
            // Step 3: Query endpoints
            let hasQueriedCapabilities = false;
            for (const endpoint of allEndpoints) {
                if (endpoint > multiResponse.individualEndpointCount
                    && ccVersion >= 4) {
                    // Find members of aggregated end point
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message: `querying members of aggregated endpoint #${endpoint}...`,
                        direction: "outbound",
                    });
                    const members = await api.getAggregatedMembers(endpoint);
                    if (members) {
                        ctx.logNode(node.id, {
                            endpoint: this.endpointIndex,
                            message: `aggregated endpoint #${endpoint} has members ${members
                                .map(String)
                                .join(", ")}`,
                            direction: "inbound",
                        });
                    }
                }
                // When the device reports identical capabilities for all endpoints,
                // we don't need to query them all
                if (multiResponse.identicalCapabilities && hasQueriedCapabilities) {
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message: `all endpoints identical, skipping capability query for endpoint #${endpoint}...`,
                        direction: "none",
                    });
                    // copy the capabilities from the first endpoint
                    const devClass = valueDB.getValue(MultiChannelCCValues.endpointDeviceClass.endpoint(allEndpoints[0]));
                    valueDB.setValue(MultiChannelCCValues.endpointDeviceClass.endpoint(endpoint), devClass);
                    const ep1Caps = valueDB.getValue(MultiChannelCCValues.endpointCCs.endpoint(allEndpoints[0]));
                    valueDB.setValue(MultiChannelCCValues.endpointCCs.endpoint(endpoint), [...ep1Caps]);
                    continue;
                }
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: `querying capabilities for endpoint #${endpoint}...`,
                    direction: "outbound",
                });
                const caps = await api.getEndpointCapabilities(endpoint);
                if (caps) {
                    hasQueriedCapabilities = true;
                    logMessage =
                        `received response for endpoint capabilities (#${endpoint}):
generic device class:  ${caps.generic.label}
specific device class: ${caps.specific.label}
is dynamic end point:  ${caps.isDynamic}
supported CCs:`;
                    for (const cc of caps.supportedCCs) {
                        logMessage += `\n  · ${getCCName(cc)}`;
                    }
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message: logMessage,
                        direction: "inbound",
                    });
                }
                else {
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message: `Querying endpoint #${endpoint} capabilities timed out, aborting interview...`,
                        level: "warn",
                    });
                    return this.throwMissingCriticalInterviewResponse();
                }
            }
            // Now that all endpoints have been interviewed, remember which ones are there
            // But first figure out if they seem unnecessary and if they do, which ones should be preserved
            if (!multiResponse.identicalCapabilities
                && areEndpointsUnnecessary(ctx, node.id, allEndpoints)) {
                const preserve = ctx.getDeviceConfig?.(node.id)?.compat
                    ?.preserveEndpoints;
                if (!preserve) {
                    allEndpoints = [];
                    ctx.logNode(node.id, {
                        message: `Endpoints seem unnecessary b/c they have different device classes, ignoring all...`,
                    });
                }
                else if (preserve === "*") {
                    // preserve all endpoints, do nothing
                    ctx.logNode(node.id, {
                        message: `Endpoints seem unnecessary, but are configured to be preserved.`,
                    });
                }
                else {
                    allEndpoints = allEndpoints.filter((ep) => preserve.includes(ep));
                    ctx.logNode(node.id, {
                        message: `Endpoints seem unnecessary, but endpoints ${allEndpoints.join(", ")} are configured to be preserved.`,
                    });
                }
            }
            this.setValue(ctx, MultiChannelCCValues.endpointIndizes, allEndpoints);
            // Remember that the interview is complete
            this.setInterviewComplete(ctx, true);
        }
        async interviewV1(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const removeEndpoints = ctx.getDeviceConfig?.(node.id)?.compat
                ?.removeEndpoints;
            if (removeEndpoints === "*") {
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: `Skipping ${this.ccName} interview b/c all endpoints are ignored by the device config file...`,
                    direction: "none",
                });
                return;
            }
            const api = CCAPI.create(CommandClasses["Multi Channel"], ctx, endpoint);
            const valueDB = this.getValueDB(ctx);
            // V1 works the opposite way - we scan all CCs and remember how many
            // endpoints they have
            const supportedCCs = [...node.getCCs()]
                // Don't query CCs the node only controls
                .filter(([, info]) => info.isSupported)
                .map(([cc]) => cc)
                // Don't query CCs that want to skip the endpoint interview
                .filter((cc) => !CommandClass.createInstanceUnchecked(node, cc)?.skipEndpointInterview());
            const endpointCounts = new Map();
            for (const ccId of supportedCCs) {
                ctx.logNode(node.id, {
                    message: `Querying endpoint count for CommandClass ${getCCName(ccId)}...`,
                    direction: "outbound",
                });
                const endpointCount = await api.getEndpointCountV1(ccId);
                if (endpointCount != undefined) {
                    endpointCounts.set(ccId, endpointCount);
                    ctx.logNode(node.id, {
                        message: `CommandClass ${getCCName(ccId)} has ${endpointCount} endpoints`,
                        direction: "inbound",
                    });
                }
            }
            // Store the collected information
            // We have only individual and no dynamic and no aggregated endpoints
            const numEndpoints = Math.max(...endpointCounts.values());
            this.setValue(ctx, MultiChannelCCValues.endpointCountIsDynamic, false);
            this.setValue(ctx, MultiChannelCCValues.aggregatedEndpointCount, 0);
            this.setValue(ctx, MultiChannelCCValues.individualEndpointCount, numEndpoints);
            // Since we queried all CCs separately, we can assume that all
            // endpoints have different capabilities
            this.setValue(ctx, MultiChannelCCValues.endpointsHaveIdenticalCapabilities, false);
            if (removeEndpoints?.length) {
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: `The following endpoints are ignored through the config file: ${removeEndpoints.join(", ")}`,
                    direction: "none",
                });
            }
            const allEndpoints = [];
            for (let endpoint = 1; endpoint <= numEndpoints; endpoint++) {
                // Skip this endpoint if flagged for removal
                if (!removeEndpoints?.includes(endpoint)) {
                    // Check which CCs exist on this endpoint
                    const endpointCCs = [...endpointCounts.entries()]
                        .filter(([, ccEndpoints]) => ccEndpoints >= endpoint)
                        .map(([ccId]) => ccId);
                    // And store it per endpoint
                    valueDB.setValue(MultiChannelCCValues.endpointCCs.endpoint(endpoint), endpointCCs);
                    allEndpoints.push(endpoint);
                }
            }
            this.setValue(ctx, MultiChannelCCValues.endpointIndizes, allEndpoints);
            // Remember that the interview is complete
            this.setInterviewComplete(ctx, true);
        }
    };
    return MultiChannelCC = _classThis;
})();
export { MultiChannelCC };
let MultiChannelCCEndPointReport = (() => {
    let _classDecorators = [CCCommand(MultiChannelCommand.EndPointReport), ccValueProperty("countIsDynamic", MultiChannelCCValues.endpointCountIsDynamic), ccValueProperty("identicalCapabilities", MultiChannelCCValues.endpointsHaveIdenticalCapabilities), ccValueProperty("individualCount", MultiChannelCCValues.individualEndpointCount), ccValueProperty("aggregatedCount", MultiChannelCCValues.aggregatedEndpointCount)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = MultiChannelCC;
    var MultiChannelCCEndPointReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MultiChannelCCEndPointReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.countIsDynamic = options.countIsDynamic;
            this.identicalCapabilities = options.identicalCapabilities;
            this.individualCount = options.individualCount;
            this.aggregatedCount = options.aggregatedCount;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const countIsDynamic = !!(raw.payload[0] & 0b10000000);
            const identicalCapabilities = !!(raw.payload[0] & 0b01000000);
            const individualCount = raw.payload[1] & 0b01111111;
            let aggregatedCount;
            if (raw.payload.length >= 3) {
                aggregatedCount = raw.payload[2] & 0b01111111;
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                countIsDynamic,
                identicalCapabilities,
                individualCount,
                aggregatedCount,
            });
        }
        countIsDynamic;
        identicalCapabilities;
        individualCount;
        aggregatedCount;
        serialize(ctx) {
            this.payload = Bytes.from([
                (this.countIsDynamic ? 0b10000000 : 0)
                    | (this.identicalCapabilities ? 0b01000000 : 0),
                this.individualCount & 0b01111111,
                this.aggregatedCount ?? 0,
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const message = {
                "endpoint count (individual)": this.individualCount,
                "count is dynamic": this.countIsDynamic,
                "identical capabilities": this.identicalCapabilities,
            };
            if (this.aggregatedCount != undefined) {
                message["endpoint count (aggregated)"] = this.aggregatedCount;
            }
            const ret = {
                ...super.toLogEntry(ctx),
                message,
            };
            return ret;
        }
    };
    return MultiChannelCCEndPointReport = _classThis;
})();
export { MultiChannelCCEndPointReport };
let MultiChannelCCEndPointGet = (() => {
    let _classDecorators = [CCCommand(MultiChannelCommand.EndPointGet), expectedCCResponse(MultiChannelCCEndPointReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = MultiChannelCC;
    var MultiChannelCCEndPointGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MultiChannelCCEndPointGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return MultiChannelCCEndPointGet = _classThis;
})();
export { MultiChannelCCEndPointGet };
let MultiChannelCCCapabilityReport = (() => {
    let _classDecorators = [CCCommand(MultiChannelCommand.CapabilityReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = MultiChannelCC;
    var MultiChannelCCCapabilityReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MultiChannelCCCapabilityReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.endpointIndex = options.endpointIndex;
            this.genericDeviceClass = options.genericDeviceClass;
            this.specificDeviceClass = options.specificDeviceClass;
            this.supportedCCs = options.supportedCCs;
            this.isDynamic = options.isDynamic;
            this.wasRemoved = options.wasRemoved;
        }
        static from(raw, ctx) {
            // Only validate the bytes we expect to see here
            // parseApplicationNodeInformation does its own validation
            validatePayload(raw.payload.length >= 1);
            const endpointIndex = raw.payload[0] & 0b01111111;
            const isDynamic = !!(raw.payload[0] & 0b10000000);
            const NIF = parseApplicationNodeInformation(raw.payload.subarray(1));
            const genericDeviceClass = NIF.genericDeviceClass;
            const specificDeviceClass = NIF.specificDeviceClass;
            const supportedCCs = NIF.supportedCCs;
            // Removal reports have very specific information
            const wasRemoved = isDynamic
                && genericDeviceClass === 0xff // "Non-Interoperable"
                && specificDeviceClass === 0x00;
            return new this({
                nodeId: ctx.sourceNodeId,
                endpointIndex,
                isDynamic,
                genericDeviceClass,
                specificDeviceClass,
                supportedCCs,
                wasRemoved,
            });
        }
        persistValues(ctx) {
            if (!super.persistValues(ctx))
                return false;
            const deviceClassValue = MultiChannelCCValues.endpointDeviceClass;
            const ccsValue = MultiChannelCCValues.endpointCCs;
            if (this.wasRemoved) {
                this.removeValue(ctx, deviceClassValue);
                this.removeValue(ctx, ccsValue);
            }
            else {
                this.setValue(ctx, deviceClassValue, {
                    generic: this.genericDeviceClass,
                    specific: this.specificDeviceClass,
                });
                this.setValue(ctx, ccsValue, this.supportedCCs);
            }
            return true;
        }
        // The endpoint index must be overridden to be able to attribute the information to the correct endpoint
        genericDeviceClass;
        specificDeviceClass;
        supportedCCs;
        isDynamic;
        wasRemoved;
        serialize(ctx) {
            this.payload = Bytes.concat([
                Bytes.from([
                    (this.endpointIndex & 0b01111111)
                        | (this.isDynamic ? 0b10000000 : 0),
                ]),
                encodeApplicationNodeInformation(this),
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "endpoint index": this.endpointIndex,
                    "generic device class": getGenericDeviceClass(this.genericDeviceClass).label,
                    "specific device class": getSpecificDeviceClass(this.genericDeviceClass, this.specificDeviceClass).label,
                    "is dynamic end point": this.isDynamic,
                    "supported CCs": this.supportedCCs
                        .map((cc) => `\n· ${getCCName(cc)}`)
                        .join(""),
                },
            };
        }
    };
    return MultiChannelCCCapabilityReport = _classThis;
})();
export { MultiChannelCCCapabilityReport };
function testResponseForMultiChannelCapabilityGet(sent, received) {
    return received.endpointIndex === sent.requestedEndpoint;
}
let MultiChannelCCCapabilityGet = (() => {
    let _classDecorators = [CCCommand(MultiChannelCommand.CapabilityGet), expectedCCResponse(MultiChannelCCCapabilityReport, testResponseForMultiChannelCapabilityGet)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = MultiChannelCC;
    var MultiChannelCCCapabilityGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MultiChannelCCCapabilityGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.requestedEndpoint = options.requestedEndpoint;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const requestedEndpoint = raw.payload[0] & 0b01111111;
            return new this({
                nodeId: ctx.sourceNodeId,
                requestedEndpoint,
            });
        }
        requestedEndpoint;
        serialize(ctx) {
            this.payload = Bytes.from([this.requestedEndpoint & 0b01111111]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: { endpoint: this.requestedEndpoint },
            };
        }
    };
    return MultiChannelCCCapabilityGet = _classThis;
})();
export { MultiChannelCCCapabilityGet };
let MultiChannelCCEndPointFindReport = (() => {
    let _classDecorators = [CCCommand(MultiChannelCommand.EndPointFindReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = MultiChannelCC;
    var MultiChannelCCEndPointFindReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MultiChannelCCEndPointFindReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.genericClass = options.genericClass;
            this.specificClass = options.specificClass;
            this.foundEndpoints = options.foundEndpoints;
            this.reportsToFollow = options.reportsToFollow;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 3);
            const reportsToFollow = raw.payload[0];
            const genericClass = raw.payload[1];
            const specificClass = raw.payload[2];
            // Some devices omit the endpoint list although that is not allowed in the specs
            // therefore don't validatePayload here.
            const foundEndpoints = [...raw.payload.subarray(3)]
                .map((e) => e & 0b01111111)
                .filter((e) => e !== 0);
            return new this({
                nodeId: ctx.sourceNodeId,
                reportsToFollow,
                genericClass,
                specificClass,
                foundEndpoints,
            });
        }
        genericClass;
        specificClass;
        foundEndpoints;
        reportsToFollow;
        serialize(ctx) {
            this.payload = Bytes.concat([
                Bytes.from([
                    this.reportsToFollow,
                    this.genericClass,
                    this.specificClass,
                ]),
                Bytes.from(this.foundEndpoints.map((e) => e & 0b01111111)),
            ]);
            return super.serialize(ctx);
        }
        getPartialCCSessionId() {
            // Distinguish sessions by the requested device classes
            return {
                genericClass: this.genericClass,
                specificClass: this.specificClass,
            };
        }
        expectMoreMessages() {
            return this.reportsToFollow > 0;
        }
        mergePartialCCs(partials, _ctx) {
            // Concat the list of end points
            this.foundEndpoints = [...partials, this]
                .map((report) => report.foundEndpoints)
                .reduce((prev, cur) => prev.concat(...cur), []);
            return Promise.resolve();
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "generic device class": getGenericDeviceClass(this.genericClass).label,
                    "specific device class": getSpecificDeviceClass(this.genericClass, this.specificClass).label,
                    "found endpoints": this.foundEndpoints.join(", "),
                    "# of reports to follow": this.reportsToFollow,
                },
            };
        }
    };
    return MultiChannelCCEndPointFindReport = _classThis;
})();
export { MultiChannelCCEndPointFindReport };
let MultiChannelCCEndPointFind = (() => {
    let _classDecorators = [CCCommand(MultiChannelCommand.EndPointFind), expectedCCResponse(MultiChannelCCEndPointFindReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = MultiChannelCC;
    var MultiChannelCCEndPointFind = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MultiChannelCCEndPointFind = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.genericClass = options.genericClass;
            this.specificClass = options.specificClass;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const genericClass = raw.payload[0];
            const specificClass = raw.payload[1];
            return new this({
                nodeId: ctx.sourceNodeId,
                genericClass,
                specificClass,
            });
        }
        genericClass;
        specificClass;
        serialize(ctx) {
            this.payload = Bytes.from([this.genericClass, this.specificClass]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "generic device class": getGenericDeviceClass(this.genericClass).label,
                    "specific device class": getSpecificDeviceClass(this.genericClass, this.specificClass).label,
                },
            };
        }
    };
    return MultiChannelCCEndPointFind = _classThis;
})();
export { MultiChannelCCEndPointFind };
let MultiChannelCCAggregatedMembersReport = (() => {
    let _classDecorators = [CCCommand(MultiChannelCommand.AggregatedMembersReport), ccValueProperty("members", MultiChannelCCValues.aggregatedEndpointMembers, (self) => [self.aggregatedEndpointIndex])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = MultiChannelCC;
    var MultiChannelCCAggregatedMembersReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MultiChannelCCAggregatedMembersReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.aggregatedEndpointIndex = options.aggregatedEndpointIndex;
            this.members = options.members;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const aggregatedEndpointIndex = raw.payload[0] & 0b0111_1111;
            const bitMaskLength = raw.payload[1];
            validatePayload(raw.payload.length >= 2 + bitMaskLength);
            const bitMask = raw.payload.subarray(2, 2 + bitMaskLength);
            const members = parseBitMask(bitMask);
            return new this({
                nodeId: ctx.sourceNodeId,
                aggregatedEndpointIndex,
                members,
            });
        }
        aggregatedEndpointIndex;
        members;
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "aggregated endpoint": this.aggregatedEndpointIndex,
                    members: this.members.join(", "),
                },
            };
        }
    };
    return MultiChannelCCAggregatedMembersReport = _classThis;
})();
export { MultiChannelCCAggregatedMembersReport };
let MultiChannelCCAggregatedMembersGet = (() => {
    let _classDecorators = [CCCommand(MultiChannelCommand.AggregatedMembersGet), expectedCCResponse(MultiChannelCCAggregatedMembersReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = MultiChannelCC;
    var MultiChannelCCAggregatedMembersGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MultiChannelCCAggregatedMembersGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.requestedEndpoint = options.requestedEndpoint;
        }
        static from(_raw, _ctx) {
            // TODO: Deserialize payload
            throw new ZWaveError(`${this.name}: deserialization not implemented`, ZWaveErrorCodes.Deserialization_NotImplemented);
            // return new MultiChannelCCAggregatedMembersGet({
            // 	nodeId: ctx.sourceNodeId,
            // });
        }
        requestedEndpoint;
        serialize(ctx) {
            this.payload = Bytes.from([this.requestedEndpoint & 0b0111_1111]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: { endpoint: this.requestedEndpoint },
            };
        }
    };
    return MultiChannelCCAggregatedMembersGet = _classThis;
})();
export { MultiChannelCCAggregatedMembersGet };
// SDS13783: A receiving node MAY respond to a Multi Channel encapsulated command if the Destination
// End Point field specifies a single End Point. In that case, the response MUST be Multi Channel
// encapsulated.
// A receiving node MUST NOT respond to a Multi Channel encapsulated command if the
// Destination End Point field specifies multiple End Points via bit mask addressing.
function getCCResponseForCommandEncapsulation(sent) {
    if (typeof sent.destination === "number"
        && sent.encapsulated.expectsCCResponse()) {
        // Allow both versions of the encapsulation command
        // Our implementation check is a bit too strict, so change the return type
        return [
            MultiChannelCCCommandEncapsulation,
            MultiChannelCCV1CommandEncapsulation,
        ];
    }
}
function testResponseForCommandEncapsulation(sent, received) {
    if (typeof sent.destination === "number"
        && sent.destination === received.endpointIndex) {
        return "checkEncapsulated";
    }
    return false;
}
let MultiChannelCCCommandEncapsulation = (() => {
    let _classDecorators = [CCCommand(MultiChannelCommand.CommandEncapsulation), expectedCCResponse(getCCResponseForCommandEncapsulation, testResponseForCommandEncapsulation)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = MultiChannelCC;
    var MultiChannelCCCommandEncapsulation = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MultiChannelCCCommandEncapsulation = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.encapsulated = options.encapsulated;
            this.encapsulated.encapsulatingCC = this;
            // Propagate the endpoint index all the way down
            let cur = this;
            while (cur) {
                if (isMultiEncapsulatingCommandClass(cur)) {
                    for (const cc of cur.encapsulated) {
                        cc.endpointIndex = this.endpointIndex;
                    }
                    break;
                }
                else if (isEncapsulatingCommandClass(cur)) {
                    cur.encapsulated.endpointIndex = this.endpointIndex;
                    cur = cur.encapsulated;
                }
                else {
                    break;
                }
            }
            this.destination = options.destination;
        }
        static async from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            let endpointIndex;
            let destination;
            if (ctx.getDeviceConfig?.(ctx.sourceNodeId)
                ?.compat?.treatDestinationEndpointAsSource) {
                // This device incorrectly uses the destination field to indicate the source endpoint
                endpointIndex = raw.payload[1] & 0b0111_1111;
                destination = 0;
            }
            else {
                // Parse normally
                endpointIndex = raw.payload[0] & 0b0111_1111;
                const isBitMask = !!(raw.payload[1] & 0b1000_0000);
                destination = raw.payload[1] & 0b0111_1111;
                if (isBitMask) {
                    destination = parseBitMask(Bytes.from([destination]));
                }
            }
            // No need to validate further, each CC does it for itself
            const encapsulated = await CommandClass.parse(raw.payload.subarray(2), ctx);
            return new this({
                nodeId: ctx.sourceNodeId,
                endpointIndex,
                destination,
                encapsulated,
            });
        }
        encapsulated;
        /** The destination end point (0-127) or an array of destination end points (1-7) */
        destination;
        async serialize(ctx) {
            if (ctx.getDeviceConfig?.(this.nodeId)?.compat
                ?.treatDestinationEndpointAsSource) {
                // This device incorrectly responds from the endpoint we've passed as our source endpoint
                if (typeof this.destination === "number") {
                    this.endpointIndex = this.destination;
                }
            }
            const destination = typeof this.destination === "number"
                // The destination is a single number
                ? this.destination & 0b0111_1111
                // The destination is a bit mask
                : encodeBitMask(this.destination, 7)[0] | 0b1000_0000;
            this.payload = Bytes.concat([
                Bytes.from([this.endpointIndex & 0b0111_1111, destination]),
                await this.encapsulated.serialize(ctx),
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    source: this.endpointIndex,
                    destination: typeof this.destination === "number"
                        ? this.destination
                        : this.destination.join(", "),
                },
            };
        }
        computeEncapsulationOverhead() {
            // Multi Channel CC adds two bytes for the source and destination endpoint
            return super.computeEncapsulationOverhead() + 2;
        }
    };
    return MultiChannelCCCommandEncapsulation = _classThis;
})();
export { MultiChannelCCCommandEncapsulation };
let MultiChannelCCV1Report = (() => {
    let _classDecorators = [CCCommand(MultiChannelCommand.ReportV1)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = MultiChannelCC;
    var MultiChannelCCV1Report = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MultiChannelCCV1Report = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.requestedCC = options.requestedCC;
            this.endpointCount = options.endpointCount;
        }
        static from(raw, ctx) {
            // V1 won't be extended in the future, so do an exact check
            validatePayload(raw.payload.length === 2);
            const requestedCC = raw.payload[0];
            const endpointCount = raw.payload[1];
            return new this({
                nodeId: ctx.sourceNodeId,
                requestedCC,
                endpointCount,
            });
        }
        requestedCC;
        endpointCount;
        serialize(ctx) {
            this.payload = Bytes.from([
                this.requestedCC,
                this.endpointCount,
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    CC: getCCName(this.requestedCC),
                    "# of endpoints": this.endpointCount,
                },
            };
        }
    };
    return MultiChannelCCV1Report = _classThis;
})();
export { MultiChannelCCV1Report };
function testResponseForMultiChannelV1Get(sent, received) {
    return sent.requestedCC === received.requestedCC;
}
let MultiChannelCCV1Get = (() => {
    let _classDecorators = [CCCommand(MultiChannelCommand.GetV1), expectedCCResponse(MultiChannelCCV1Report, testResponseForMultiChannelV1Get)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = MultiChannelCC;
    var MultiChannelCCV1Get = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MultiChannelCCV1Get = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.requestedCC = options.requestedCC;
        }
        static from(raw, ctx) {
            // V1 won't be extended in the future, so do an exact check
            validatePayload(raw.payload.length === 1);
            const requestedCC = raw.payload[0];
            return new this({
                nodeId: ctx.sourceNodeId,
                requestedCC,
            });
        }
        requestedCC;
        serialize(ctx) {
            this.payload = Bytes.from([this.requestedCC]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: { CC: getCCName(this.requestedCC) },
            };
        }
    };
    return MultiChannelCCV1Get = _classThis;
})();
export { MultiChannelCCV1Get };
function getResponseForV1CommandEncapsulation(sent) {
    if (sent.encapsulated.expectsCCResponse()) {
        return MultiChannelCCV1CommandEncapsulation;
    }
}
function testResponseForV1CommandEncapsulation(sent, received) {
    if (sent.endpointIndex === received.endpointIndex) {
        return "checkEncapsulated";
    }
    return false;
}
let MultiChannelCCV1CommandEncapsulation = (() => {
    let _classDecorators = [CCCommand(MultiChannelCommand.CommandEncapsulationV1), expectedCCResponse(getResponseForV1CommandEncapsulation, testResponseForV1CommandEncapsulation)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = MultiChannelCC;
    var MultiChannelCCV1CommandEncapsulation = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MultiChannelCCV1CommandEncapsulation = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.encapsulated = options.encapsulated;
            this.encapsulated.encapsulatingCC = this;
            // Propagate the endpoint index all the way down
            let cur = this;
            while (cur) {
                if (isMultiEncapsulatingCommandClass(cur)) {
                    for (const cc of cur.encapsulated) {
                        cc.endpointIndex = this.endpointIndex;
                    }
                    break;
                }
                else if (isEncapsulatingCommandClass(cur)) {
                    cur.encapsulated.endpointIndex = this.endpointIndex;
                    cur = cur.encapsulated;
                }
                else {
                    break;
                }
            }
        }
        static async from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const endpointIndex = raw.payload[0];
            // Some devices send invalid reports, i.e. MultiChannelCCV1CommandEncapsulation, but with V2+ binary format
            // This would be a NoOp CC, but it makes no sense to encapsulate that.
            const isV2withV1Header = raw.payload.length >= 2
                && raw.payload[1] === 0x00;
            // No need to validate further, each CC does it for itself
            const encapsulated = await CommandClass.parse(raw.payload.subarray(isV2withV1Header ? 2 : 1), ctx);
            return new this({
                nodeId: ctx.sourceNodeId,
                endpointIndex,
                encapsulated,
            });
        }
        encapsulated;
        async serialize(ctx) {
            this.payload = Bytes.concat([
                Bytes.from([this.endpointIndex]),
                await this.encapsulated.serialize(ctx),
            ]);
            return super.serialize(ctx);
        }
        computeEncapsulationOverhead() {
            // Multi Channel CC V1 adds one byte for the endpoint index
            return super.computeEncapsulationOverhead() + 1;
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: { source: this.endpointIndex },
            };
        }
    };
    return MultiChannelCCV1CommandEncapsulation = _classThis;
})();
export { MultiChannelCCV1CommandEncapsulation };
//# sourceMappingURL=MultiChannelCC.js.map