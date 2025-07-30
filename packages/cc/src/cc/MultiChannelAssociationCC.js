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
import { CommandClasses, MAX_NODES, MessagePriority, ZWaveError, ZWaveErrorCodes, encodeBitMask, parseBitMask, validatePayload, } from "@zwave-js/core";
import { Bytes, pick } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { CCAPI, PhysicalCCAPI } from "../lib/API.js";
import { CommandClass, } from "../lib/CommandClass.js";
import { API, CCCommand, ccValueProperty, ccValues, commandClass, expectedCCResponse, implementedVersion, useSupervision, } from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import { MultiChannelAssociationCommand, } from "../lib/_Types.js";
import * as ccUtils from "../lib/utils.js";
import { AssociationCCValues } from "./AssociationCC.js";
export const MultiChannelAssociationCCValues = V.defineCCValues(CommandClasses["Multi Channel Association"], {
    ...V.staticProperty("groupCount", undefined, { internal: true }),
    ...V.dynamicPropertyAndKeyWithName("maxNodes", "maxNodes", (groupId) => groupId, ({ property, propertyKey }) => property === "maxNodes" && typeof propertyKey === "number", undefined, { internal: true }),
    ...V.dynamicPropertyAndKeyWithName("nodeIds", "nodeIds", (groupId) => groupId, ({ property, propertyKey }) => property === "nodeIds" && typeof propertyKey === "number", undefined, { internal: true }),
    ...V.dynamicPropertyAndKeyWithName("endpoints", "endpoints", (groupId) => groupId, ({ property, propertyKey }) => property === "endpoints" && typeof propertyKey === "number", undefined, { internal: true }),
});
function endpointAddressesToString(endpoints) {
    return endpoints
        .map(({ nodeId, endpoint }) => {
        if (typeof endpoint === "number") {
            return `${nodeId}:${endpoint}`;
        }
        else {
            return `${nodeId}:[${endpoint.map(String).join(", ")}]`;
        }
    })
        .join(", ");
}
const MULTI_CHANNEL_ASSOCIATION_MARKER = 0x00;
function serializeMultiChannelAssociationDestination(nodeIds, endpoints) {
    const nodeAddressBytes = nodeIds.length;
    const endpointAddressBytes = endpoints.length * 2;
    const payload = new Bytes(
    // node addresses
    nodeAddressBytes
        // endpoint marker
        + (endpointAddressBytes > 0 ? 1 : 0)
        // endpoints
        + endpointAddressBytes);
    // write node addresses
    for (let i = 0; i < nodeIds.length; i++) {
        payload[i] = nodeIds[i];
    }
    // write endpoint addresses
    if (endpointAddressBytes > 0) {
        let offset = nodeIds.length;
        payload[offset] = MULTI_CHANNEL_ASSOCIATION_MARKER;
        offset += 1;
        for (let i = 0; i < endpoints.length; i++) {
            const endpoint = endpoints[i];
            const destination = typeof endpoint.endpoint === "number"
                // The destination is a single number
                ? endpoint.endpoint & 0b0111_1111
                // The destination is a bit mask
                : encodeBitMask(endpoint.endpoint, 7)[0] | 0b1000_0000;
            payload[offset + 2 * i] = endpoint.nodeId;
            payload[offset + 2 * i + 1] = destination;
        }
    }
    return payload;
}
function deserializeMultiChannelAssociationDestination(data) {
    const nodeIds = [];
    let endpointOffset = data.length;
    // Scan node ids until we find the marker
    for (let i = 0; i < data.length; i++) {
        if (data[i] === MULTI_CHANNEL_ASSOCIATION_MARKER) {
            endpointOffset = i + 1;
            break;
        }
        nodeIds.push(data[i]);
    }
    const endpoints = [];
    for (let i = endpointOffset; i < data.length; i += 2) {
        const nodeId = data[i];
        const isBitMask = !!(data[i + 1] & 0b1000_0000);
        const destination = data[i + 1] & 0b0111_1111;
        const endpoint = isBitMask
            ? parseBitMask(Bytes.from([destination]))
            : destination;
        endpoints.push({ nodeId, endpoint });
    }
    return { nodeIds, endpoints };
}
// @noSetValueAPI
let MultiChannelAssociationCCAPI = (() => {
    let _classDecorators = [API(CommandClasses["Multi Channel Association"])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = PhysicalCCAPI;
    let _instanceExtraInitializers = [];
    let _reportGroupCount_decorators;
    let _getGroup_decorators;
    let _sendReport_decorators;
    let _addDestinations_decorators;
    let _removeDestinations_decorators;
    var MultiChannelAssociationCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _reportGroupCount_decorators = [validateArgs()];
            _getGroup_decorators = [validateArgs()];
            _sendReport_decorators = [validateArgs()];
            _addDestinations_decorators = [validateArgs()];
            _removeDestinations_decorators = [validateArgs()];
            __esDecorate(this, null, _reportGroupCount_decorators, { kind: "method", name: "reportGroupCount", static: false, private: false, access: { has: obj => "reportGroupCount" in obj, get: obj => obj.reportGroupCount }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getGroup_decorators, { kind: "method", name: "getGroup", static: false, private: false, access: { has: obj => "getGroup" in obj, get: obj => obj.getGroup }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _sendReport_decorators, { kind: "method", name: "sendReport", static: false, private: false, access: { has: obj => "sendReport" in obj, get: obj => obj.sendReport }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _addDestinations_decorators, { kind: "method", name: "addDestinations", static: false, private: false, access: { has: obj => "addDestinations" in obj, get: obj => obj.addDestinations }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _removeDestinations_decorators, { kind: "method", name: "removeDestinations", static: false, private: false, access: { has: obj => "removeDestinations" in obj, get: obj => obj.removeDestinations }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MultiChannelAssociationCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case MultiChannelAssociationCommand.Get:
                case MultiChannelAssociationCommand.Set:
                case MultiChannelAssociationCommand.Report:
                case MultiChannelAssociationCommand.Remove:
                case MultiChannelAssociationCommand.SupportedGroupingsGet:
                case MultiChannelAssociationCommand.SupportedGroupingsReport:
                    return true; // This is mandatory
            }
            return super.supportsCommand(cmd);
        }
        /**
         * Returns the number of association groups a node supports.
         * Association groups are consecutive, starting at 1.
         */
        async getGroupCount() {
            this.assertSupportsCommand(MultiChannelAssociationCommand, MultiChannelAssociationCommand.SupportedGroupingsGet);
            const cc = new MultiChannelAssociationCCSupportedGroupingsGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            return response?.groupCount;
        }
        async reportGroupCount(groupCount) {
            this.assertSupportsCommand(MultiChannelAssociationCommand, MultiChannelAssociationCommand.SupportedGroupingsReport);
            const cc = new MultiChannelAssociationCCSupportedGroupingsReport({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                groupCount,
            });
            await this.host.sendCommand(cc, this.commandOptions);
        }
        /**
         * Returns information about an association group.
         */
        async getGroup(groupId) {
            this.assertSupportsCommand(MultiChannelAssociationCommand, MultiChannelAssociationCommand.Get);
            const cc = new MultiChannelAssociationCCGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                groupId,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, ["maxNodes", "nodeIds", "endpoints"]);
            }
        }
        async sendReport(options) {
            this.assertSupportsCommand(MultiChannelAssociationCommand, MultiChannelAssociationCommand.Report);
            const cc = new MultiChannelAssociationCCReport({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                ...options,
            });
            await this.host.sendCommand(cc, this.commandOptions);
        }
        /**
         * Adds new nodes or endpoints to an association group
         */
        async addDestinations(options) {
            this.assertSupportsCommand(MultiChannelAssociationCommand, MultiChannelAssociationCommand.Set);
            const cc = new MultiChannelAssociationCCSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                ...options,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        /**
         * Removes nodes or endpoints from an association group
         */
        async removeDestinations(options) {
            this.assertSupportsCommand(MultiChannelAssociationCommand, MultiChannelAssociationCommand.Remove);
            if (!options.groupId && this.version === 1) {
                // V1 does not support omitting the group, manually remove the destination from all groups
                // We don't want to do too much work, so find out which groups the destination is in
                const currentDestinations = MultiChannelAssociationCC
                    .getAllDestinationsCached(this.host, this.endpoint);
                for (const [group, destinations] of currentDestinations) {
                    const cc = new MultiChannelAssociationCCRemove({
                        nodeId: this.endpoint.nodeId,
                        endpointIndex: this.endpoint.index,
                        groupId: group,
                        nodeIds: destinations
                            .filter((d) => d.endpoint != undefined)
                            .map((d) => d.nodeId),
                        endpoints: destinations.filter((d) => d.endpoint != undefined),
                    });
                    // TODO: evaluate intermediate supervision results
                    await this.host.sendCommand(cc, this.commandOptions);
                }
            }
            else if (options.groupId && options.groupId < 0) {
                throw new ZWaveError("The group id must not be negative!", ZWaveErrorCodes.Argument_Invalid);
            }
            else {
                const cc = new MultiChannelAssociationCCRemove({
                    nodeId: this.endpoint.nodeId,
                    endpointIndex: this.endpoint.index,
                    ...options,
                });
                return this.host.sendCommand(cc, this.commandOptions);
            }
        }
        constructor() {
            super(...arguments);
            __runInitializers(this, _instanceExtraInitializers);
        }
    };
    return MultiChannelAssociationCCAPI = _classThis;
})();
export { MultiChannelAssociationCCAPI };
let MultiChannelAssociationCC = (() => {
    let _classDecorators = [commandClass(CommandClasses["Multi Channel Association"]), implementedVersion(5), ccValues(MultiChannelAssociationCCValues)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var MultiChannelAssociationCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MultiChannelAssociationCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        determineRequiredCCInterviews() {
            // MultiChannelAssociationCC must be interviewed after Z-Wave+ if that is supported
            return [
                ...super.determineRequiredCCInterviews(),
                CommandClasses["Z-Wave Plus Info"],
                // We need information about endpoints to correctly configure the lifeline associations
                CommandClasses["Multi Channel"],
                // AssociationCC will short-circuit if this CC is supported
                CommandClasses.Association,
            ];
        }
        /**
         * Returns the number of association groups reported by the node/endpoint.
         * This only works AFTER the interview process
         */
        static getGroupCountCached(ctx, endpoint) {
            return ctx
                .getValueDB(endpoint.nodeId)
                .getValue(MultiChannelAssociationCCValues.groupCount.endpoint(endpoint.index)) || 0;
        }
        /**
         * Returns the number of nodes an association group supports.
         * This only works AFTER the interview process
         */
        static getMaxNodesCached(ctx, endpoint, groupId) {
            return ctx
                .getValueDB(endpoint.nodeId)
                .getValue(MultiChannelAssociationCCValues.maxNodes(groupId).endpoint(endpoint.index)) ?? 0;
        }
        /**
         * Returns all the destinations of all association groups reported by the node/endpoint.
         * This only works AFTER the interview process
         */
        static getAllDestinationsCached(ctx, endpoint) {
            const ret = new Map();
            const groupCount = this.getGroupCountCached(ctx, endpoint);
            const valueDB = ctx.getValueDB(endpoint.nodeId);
            for (let i = 1; i <= groupCount; i++) {
                const groupDestinations = [];
                // Add all node destinations
                const nodes = valueDB.getValue(MultiChannelAssociationCCValues.nodeIds(i).endpoint(endpoint.index)) ?? [];
                groupDestinations.push(...nodes.map((nodeId) => ({ nodeId })));
                // And all endpoint destinations
                const endpoints = valueDB.getValue(MultiChannelAssociationCCValues.endpoints(i).endpoint(endpoint.index)) ?? [];
                for (const ep of endpoints) {
                    if (typeof ep.endpoint === "number") {
                        groupDestinations.push({
                            nodeId: ep.nodeId,
                            endpoint: ep.endpoint,
                        });
                    }
                    else {
                        groupDestinations.push(...ep.endpoint.map((e) => ({
                            nodeId: ep.nodeId,
                            endpoint: e,
                        })));
                    }
                }
                ret.set(i, 
                // Filter out duplicates
                groupDestinations.filter((addr, index) => index
                    === groupDestinations.findIndex(({ nodeId, endpoint }) => nodeId === addr.nodeId
                        && endpoint === addr.endpoint)));
            }
            return ret;
        }
        async interview(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const mcAPI = CCAPI.create(CommandClasses["Multi Channel Association"], ctx, endpoint);
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: `Interviewing ${this.ccName}...`,
                direction: "none",
            });
            // First find out how many groups are supported as multi channel
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: "querying number of multi channel association groups...",
                direction: "outbound",
            });
            const mcGroupCount = await mcAPI.getGroupCount();
            if (mcGroupCount != undefined) {
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: `supports ${mcGroupCount} multi channel association groups`,
                    direction: "inbound",
                });
            }
            else {
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: "Querying multi channel association groups timed out, skipping interview...",
                    level: "warn",
                });
                return;
            }
            // Query each association group for its members
            await this.refreshValues(ctx);
            // And set up lifeline associations
            await ccUtils.configureLifelineAssociations(ctx, endpoint);
            // Remember that the interview is complete
            this.setInterviewComplete(ctx, true);
        }
        async refreshValues(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const mcAPI = CCAPI.create(CommandClasses["Multi Channel Association"], ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            const assocAPI = CCAPI.create(CommandClasses.Association, ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            const mcGroupCount = this.getValue(ctx, MultiChannelAssociationCCValues.groupCount) ?? 0;
            // Some devices report more association groups than multi channel association groups, so we need this info here
            const assocGroupCount = this.getValue(ctx, AssociationCCValues.groupCount)
                || mcGroupCount;
            // Then query each multi channel association group
            for (let groupId = 1; groupId <= mcGroupCount; groupId++) {
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: `querying multi channel association group #${groupId}...`,
                    direction: "outbound",
                });
                const group = await mcAPI.getGroup(groupId);
                if (!group)
                    continue;
                const logMessage = `received information for multi channel association group #${groupId}:
maximum # of nodes:           ${group.maxNodes}
currently assigned nodes:     ${group.nodeIds.map(String).join(", ")}
currently assigned endpoints: ${group.endpoints
                    .map(({ nodeId, endpoint }) => {
                    if (typeof endpoint === "number") {
                        return `${nodeId}:${endpoint}`;
                    }
                    else {
                        return `${nodeId}:[${endpoint.map(String).join(", ")}]`;
                    }
                })
                    .join("")}`;
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: logMessage,
                    direction: "inbound",
                });
            }
            // Check if there are more non-multi-channel association groups we haven't queried yet
            if (assocAPI.isSupported() && assocGroupCount > mcGroupCount) {
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: `querying additional non-multi-channel association groups...`,
                    direction: "outbound",
                });
                for (let groupId = mcGroupCount + 1; groupId <= assocGroupCount; groupId++) {
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message: `querying association group #${groupId}...`,
                        direction: "outbound",
                    });
                    const group = await assocAPI.getGroup(groupId);
                    if (!group)
                        continue;
                    const logMessage = `received information for association group #${groupId}:
maximum # of nodes:           ${group.maxNodes}
currently assigned nodes:     ${group.nodeIds.map(String).join(", ")}`;
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message: logMessage,
                        direction: "inbound",
                    });
                }
            }
        }
    };
    return MultiChannelAssociationCC = _classThis;
})();
export { MultiChannelAssociationCC };
let MultiChannelAssociationCCSet = (() => {
    let _classDecorators = [CCCommand(MultiChannelAssociationCommand.Set), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = MultiChannelAssociationCC;
    var MultiChannelAssociationCCSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MultiChannelAssociationCCSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            if (options.groupId < 1) {
                throw new ZWaveError("The group id must be positive!", ZWaveErrorCodes.Argument_Invalid);
            }
            this.groupId = options.groupId;
            this.nodeIds = ("nodeIds" in options && options.nodeIds) || [];
            if (this.nodeIds.some((n) => n < 1 || n > MAX_NODES)) {
                throw new ZWaveError(`All node IDs must be between 1 and ${MAX_NODES}!`, ZWaveErrorCodes.Argument_Invalid);
            }
            this.endpoints = ("endpoints" in options && options.endpoints)
                || [];
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const groupId = raw.payload[0];
            const { nodeIds, endpoints } = deserializeMultiChannelAssociationDestination(raw.payload.subarray(1));
            return new this({
                nodeId: ctx.sourceNodeId,
                groupId,
                nodeIds,
                endpoints,
            });
        }
        groupId;
        nodeIds;
        endpoints;
        serialize(ctx) {
            this.payload = Bytes.concat([
                Bytes.from([this.groupId]),
                serializeMultiChannelAssociationDestination(this.nodeIds, this.endpoints),
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "group id": this.groupId,
                    "node ids": this.nodeIds.join(", "),
                    endpoints: endpointAddressesToString(this.endpoints),
                },
            };
        }
    };
    return MultiChannelAssociationCCSet = _classThis;
})();
export { MultiChannelAssociationCCSet };
let MultiChannelAssociationCCRemove = (() => {
    let _classDecorators = [CCCommand(MultiChannelAssociationCommand.Remove), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = MultiChannelAssociationCC;
    var MultiChannelAssociationCCRemove = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MultiChannelAssociationCCRemove = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // When removing associations, we allow invalid node IDs.
            // See GH#3606 - it is possible that those exist.
            this.groupId = options.groupId;
            this.nodeIds = options.nodeIds;
            this.endpoints = options.endpoints;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const groupId = raw.payload[0];
            const { nodeIds, endpoints } = deserializeMultiChannelAssociationDestination(raw.payload.subarray(1));
            return new this({
                nodeId: ctx.sourceNodeId,
                groupId,
                nodeIds,
                endpoints,
            });
        }
        groupId;
        nodeIds;
        endpoints;
        serialize(ctx) {
            this.payload = Bytes.concat([
                Bytes.from([this.groupId || 0]),
                serializeMultiChannelAssociationDestination(this.nodeIds || [], this.endpoints || []),
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const message = {
                "group id": this.groupId || "(all groups)",
            };
            if (this.nodeIds) {
                message["node ids"] = this.nodeIds.join(", ");
            }
            if (this.endpoints) {
                message.endpoints = endpointAddressesToString(this.endpoints);
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return MultiChannelAssociationCCRemove = _classThis;
})();
export { MultiChannelAssociationCCRemove };
let MultiChannelAssociationCCReport = (() => {
    let _classDecorators = [CCCommand(MultiChannelAssociationCommand.Report), ccValueProperty("maxNodes", MultiChannelAssociationCCValues.maxNodes, (self) => [self.groupId]), ccValueProperty("nodeIds", MultiChannelAssociationCCValues.nodeIds, (self) => [self.groupId]), ccValueProperty("endpoints", MultiChannelAssociationCCValues.endpoints, (self) => [self.groupId])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = MultiChannelAssociationCC;
    var MultiChannelAssociationCCReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MultiChannelAssociationCCReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.groupId = options.groupId;
            this.maxNodes = options.maxNodes;
            this.nodeIds = options.nodeIds;
            this.endpoints = options.endpoints;
            this.reportsToFollow = options.reportsToFollow;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 3);
            const groupId = raw.payload[0];
            const maxNodes = raw.payload[1];
            const reportsToFollow = raw.payload[2];
            const { nodeIds, endpoints } = deserializeMultiChannelAssociationDestination(raw.payload.subarray(3));
            return new this({
                nodeId: ctx.sourceNodeId,
                groupId,
                maxNodes,
                nodeIds,
                endpoints,
                reportsToFollow,
            });
        }
        groupId;
        maxNodes;
        nodeIds;
        endpoints;
        reportsToFollow;
        getPartialCCSessionId() {
            // Distinguish sessions by the association group ID
            return { groupId: this.groupId };
        }
        expectMoreMessages() {
            return this.reportsToFollow > 0;
        }
        mergePartialCCs(partials, _ctx) {
            // Concat the list of nodes
            this.nodeIds = [...partials, this]
                .map((report) => [...report.nodeIds])
                .reduce((prev, cur) => prev.concat(...cur), []);
            // Concat the list of endpoints
            this.endpoints = [...partials, this]
                .map((report) => [...report.endpoints])
                .reduce((prev, cur) => prev.concat(...cur), []);
            return Promise.resolve();
        }
        serialize(ctx) {
            const destinations = serializeMultiChannelAssociationDestination(this.nodeIds, this.endpoints);
            this.payload = Bytes.concat([
                Bytes.from([
                    this.groupId,
                    this.maxNodes,
                    this.reportsToFollow,
                ]),
                destinations,
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "group id": this.groupId,
                    "maximum # of nodes": this.maxNodes,
                    "node ids": this.nodeIds.join(", "),
                    endpoints: endpointAddressesToString(this.endpoints),
                },
            };
        }
    };
    return MultiChannelAssociationCCReport = _classThis;
})();
export { MultiChannelAssociationCCReport };
let MultiChannelAssociationCCGet = (() => {
    let _classDecorators = [CCCommand(MultiChannelAssociationCommand.Get), expectedCCResponse(MultiChannelAssociationCCReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = MultiChannelAssociationCC;
    var MultiChannelAssociationCCGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MultiChannelAssociationCCGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            if (options.groupId < 1) {
                throw new ZWaveError("The group id must be positive!", ZWaveErrorCodes.Argument_Invalid);
            }
            this.groupId = options.groupId;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const groupId = raw.payload[0];
            return new this({
                nodeId: ctx.sourceNodeId,
                groupId,
            });
        }
        groupId;
        serialize(ctx) {
            this.payload = Bytes.from([this.groupId]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: { "group id": this.groupId },
            };
        }
    };
    return MultiChannelAssociationCCGet = _classThis;
})();
export { MultiChannelAssociationCCGet };
let MultiChannelAssociationCCSupportedGroupingsReport = (() => {
    let _classDecorators = [CCCommand(MultiChannelAssociationCommand.SupportedGroupingsReport), ccValueProperty("groupCount", MultiChannelAssociationCCValues.groupCount)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = MultiChannelAssociationCC;
    var MultiChannelAssociationCCSupportedGroupingsReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MultiChannelAssociationCCSupportedGroupingsReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.groupCount = options.groupCount;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const groupCount = raw.payload[0];
            return new this({
                nodeId: ctx.sourceNodeId,
                groupCount,
            });
        }
        groupCount;
        serialize(ctx) {
            this.payload = Bytes.from([this.groupCount]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: { "group count": this.groupCount },
            };
        }
    };
    return MultiChannelAssociationCCSupportedGroupingsReport = _classThis;
})();
export { MultiChannelAssociationCCSupportedGroupingsReport };
let MultiChannelAssociationCCSupportedGroupingsGet = (() => {
    let _classDecorators = [CCCommand(MultiChannelAssociationCommand.SupportedGroupingsGet), expectedCCResponse(MultiChannelAssociationCCSupportedGroupingsReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = MultiChannelAssociationCC;
    var MultiChannelAssociationCCSupportedGroupingsGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            MultiChannelAssociationCCSupportedGroupingsGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return MultiChannelAssociationCCSupportedGroupingsGet = _classThis;
})();
export { MultiChannelAssociationCCSupportedGroupingsGet };
//# sourceMappingURL=MultiChannelAssociationCC.js.map