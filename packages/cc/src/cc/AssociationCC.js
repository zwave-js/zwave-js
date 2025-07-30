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
import { CommandClasses, MAX_NODES, MessagePriority, ZWaveError, ZWaveErrorCodes, validatePayload, } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { distinct } from "alcalzone-shared/arrays";
import { CCAPI, PhysicalCCAPI } from "../lib/API.js";
import { CommandClass, } from "../lib/CommandClass.js";
import { API, CCCommand, ccValueProperty, ccValues, commandClass, expectedCCResponse, implementedVersion, useSupervision, } from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import { AssociationCommand } from "../lib/_Types.js";
import * as ccUtils from "../lib/utils.js";
export const AssociationCCValues = V.defineCCValues(CommandClasses.Association, {
    ...V.staticProperty("hasLifeline", undefined, { internal: true }),
    ...V.staticProperty("groupCount", undefined, { internal: true }),
    ...V.dynamicPropertyAndKeyWithName("maxNodes", "maxNodes", (groupId) => groupId, ({ property, propertyKey }) => property === "maxNodes" && typeof propertyKey === "number", undefined, { internal: true }),
    ...V.dynamicPropertyAndKeyWithName("nodeIds", "nodeIds", (groupId) => groupId, ({ property, propertyKey }) => property === "nodeIds" && typeof propertyKey === "number", undefined, { internal: true }),
});
// @noSetValueAPI
let AssociationCCAPI = (() => {
    let _classDecorators = [API(CommandClasses.Association)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = PhysicalCCAPI;
    let _instanceExtraInitializers = [];
    let _reportGroupCount_decorators;
    let _getGroup_decorators;
    let _sendReport_decorators;
    let _addNodeIds_decorators;
    let _removeNodeIds_decorators;
    let _removeNodeIdsFromAllGroups_decorators;
    let _getSpecificGroup_decorators;
    let _reportSpecificGroup_decorators;
    var AssociationCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _reportGroupCount_decorators = [validateArgs()];
            _getGroup_decorators = [validateArgs()];
            _sendReport_decorators = [validateArgs()];
            _addNodeIds_decorators = [validateArgs()];
            _removeNodeIds_decorators = [validateArgs()];
            _removeNodeIdsFromAllGroups_decorators = [validateArgs()];
            _getSpecificGroup_decorators = [validateArgs()];
            _reportSpecificGroup_decorators = [validateArgs()];
            __esDecorate(this, null, _reportGroupCount_decorators, { kind: "method", name: "reportGroupCount", static: false, private: false, access: { has: obj => "reportGroupCount" in obj, get: obj => obj.reportGroupCount }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getGroup_decorators, { kind: "method", name: "getGroup", static: false, private: false, access: { has: obj => "getGroup" in obj, get: obj => obj.getGroup }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _sendReport_decorators, { kind: "method", name: "sendReport", static: false, private: false, access: { has: obj => "sendReport" in obj, get: obj => obj.sendReport }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _addNodeIds_decorators, { kind: "method", name: "addNodeIds", static: false, private: false, access: { has: obj => "addNodeIds" in obj, get: obj => obj.addNodeIds }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _removeNodeIds_decorators, { kind: "method", name: "removeNodeIds", static: false, private: false, access: { has: obj => "removeNodeIds" in obj, get: obj => obj.removeNodeIds }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _removeNodeIdsFromAllGroups_decorators, { kind: "method", name: "removeNodeIdsFromAllGroups", static: false, private: false, access: { has: obj => "removeNodeIdsFromAllGroups" in obj, get: obj => obj.removeNodeIdsFromAllGroups }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getSpecificGroup_decorators, { kind: "method", name: "getSpecificGroup", static: false, private: false, access: { has: obj => "getSpecificGroup" in obj, get: obj => obj.getSpecificGroup }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _reportSpecificGroup_decorators, { kind: "method", name: "reportSpecificGroup", static: false, private: false, access: { has: obj => "reportSpecificGroup" in obj, get: obj => obj.reportSpecificGroup }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AssociationCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case AssociationCommand.Get:
                case AssociationCommand.Set:
                case AssociationCommand.Report:
                case AssociationCommand.Remove:
                case AssociationCommand.SupportedGroupingsGet:
                case AssociationCommand.SupportedGroupingsReport:
                    return true;
                case AssociationCommand.SpecificGroupGet:
                case AssociationCommand.SpecificGroupReport:
                    return this.version >= 2;
            }
            return super.supportsCommand(cmd);
        }
        /**
         * Returns the number of association groups a node supports.
         * Association groups are consecutive, starting at 1.
         */
        async getGroupCount() {
            this.assertSupportsCommand(AssociationCommand, AssociationCommand.SupportedGroupingsGet);
            const cc = new AssociationCCSupportedGroupingsGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response)
                return response.groupCount;
        }
        async reportGroupCount(groupCount) {
            this.assertSupportsCommand(AssociationCommand, AssociationCommand.SupportedGroupingsReport);
            const cc = new AssociationCCSupportedGroupingsReport({
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
            this.assertSupportsCommand(AssociationCommand, AssociationCommand.Get);
            const cc = new AssociationCCGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                groupId,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return {
                    maxNodes: response.maxNodes,
                    nodeIds: response.nodeIds,
                };
            }
        }
        async sendReport(options) {
            this.assertSupportsCommand(AssociationCommand, AssociationCommand.Report);
            const cc = new AssociationCCReport({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                ...options,
            });
            await this.host.sendCommand(cc, this.commandOptions);
        }
        /**
         * Adds new nodes to an association group
         */
        async addNodeIds(groupId, ...nodeIds) {
            this.assertSupportsCommand(AssociationCommand, AssociationCommand.Set);
            const cc = new AssociationCCSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                groupId,
                nodeIds,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        /**
         * Removes nodes from an association group
         */
        async removeNodeIds(options) {
            this.assertSupportsCommand(AssociationCommand, AssociationCommand.Remove);
            // Validate options
            if (!options.groupId) {
                if (this.version === 1) {
                    throw new ZWaveError(`Node ${this.endpoint.nodeId} only supports AssociationCC V1 which requires the group Id to be set`, ZWaveErrorCodes.Argument_Invalid);
                }
            }
            else if (options.groupId < 0) {
                throw new ZWaveError("The group id must be positive!", ZWaveErrorCodes.Argument_Invalid);
            }
            const cc = new AssociationCCRemove({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                ...options,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        /**
         * Removes nodes from all association groups
         */
        async removeNodeIdsFromAllGroups(nodeIds) {
            this.assertSupportsCommand(AssociationCommand, AssociationCommand.Remove);
            if (this.version >= 2) {
                // The node supports bulk removal
                return this.removeNodeIds({ nodeIds, groupId: 0 });
            }
            else {
                // We have to remove the node manually from all groups
                const groupCount = this.tryGetValueDB()?.getValue(AssociationCCValues.groupCount.endpoint(this.endpoint.index)) ?? 0;
                for (let groupId = 1; groupId <= groupCount; groupId++) {
                    // TODO: evaluate intermediate supervision results
                    await this.removeNodeIds({ nodeIds, groupId });
                }
            }
        }
        /**
         * Request the association group that represents the most recently detected button press
         */
        async getSpecificGroup() {
            this.assertSupportsCommand(AssociationCommand, AssociationCommand.SpecificGroupGet);
            const cc = new AssociationCCSpecificGroupGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            return response?.group;
        }
        /**
         * Report the association group that represents the most recently detected button press
         */
        async reportSpecificGroup(group) {
            this.assertSupportsCommand(AssociationCommand, AssociationCommand.SpecificGroupReport);
            const cc = new AssociationCCSpecificGroupReport({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                group,
            });
            await this.host.sendCommand(cc, this.commandOptions);
        }
        constructor() {
            super(...arguments);
            __runInitializers(this, _instanceExtraInitializers);
        }
    };
    return AssociationCCAPI = _classThis;
})();
export { AssociationCCAPI };
let AssociationCC = (() => {
    let _classDecorators = [commandClass(CommandClasses.Association), implementedVersion(4), ccValues(AssociationCCValues)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var AssociationCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AssociationCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        determineRequiredCCInterviews() {
            // AssociationCC must be interviewed after Z-Wave+ if that is supported
            return [
                ...super.determineRequiredCCInterviews(),
                CommandClasses["Z-Wave Plus Info"],
                // We need information about endpoints to correctly configure the lifeline associations
                CommandClasses["Multi Channel"],
            ];
        }
        /**
         * Returns the number of association groups reported by the node/endpoint.
         * This only works AFTER the interview process
         */
        static getGroupCountCached(ctx, endpoint) {
            return ctx
                .getValueDB(endpoint.nodeId)
                .getValue(AssociationCCValues.groupCount.endpoint(endpoint.index)) || 0;
        }
        /**
         * Returns the number of nodes an association group supports.
         * This only works AFTER the interview process
         */
        static getMaxNodesCached(ctx, endpoint, groupId) {
            return (ctx
                .getValueDB(endpoint.nodeId)
                .getValue(AssociationCCValues.maxNodes(groupId).endpoint(endpoint.index))
                // If the information is not available, fall back to the configuration file if possible
                // This can happen on some legacy devices which have "hidden" association groups
                ?? ctx
                    .getDeviceConfig?.(endpoint.nodeId)
                    ?.getAssociationConfigForEndpoint(endpoint.index, groupId)
                    ?.maxNodes
                ?? 0);
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
                // Add all root destinations
                const nodes = valueDB.getValue(AssociationCCValues.nodeIds(i).endpoint(endpoint.index)) ?? [];
                ret.set(i, 
                // Filter out duplicates
                distinct(nodes).map((nodeId) => ({ nodeId })));
            }
            return ret;
        }
        async interview(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses.Association, ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: `Interviewing ${this.ccName}...`,
                direction: "none",
            });
            // Even if Multi Channel Association is supported, we still need to query the number of
            // normal association groups since some devices report more association groups than
            // multi channel association groups
            // Find out how many groups are supported
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: "querying number of association groups...",
                direction: "outbound",
            });
            const groupCount = await api.getGroupCount();
            if (groupCount != undefined) {
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: `supports ${groupCount} association groups`,
                    direction: "inbound",
                });
            }
            else {
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: "Querying association groups timed out, skipping interview...",
                    level: "warn",
                });
                return;
            }
            // Query each association group for its members
            await this.refreshValues(ctx);
            // Skip the remaining Association CC interview in favor of Multi Channel Association if possible
            if (endpoint.supportsCC(CommandClasses["Multi Channel Association"])) {
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: `${this.constructor.name}: delaying configuration of lifeline associations until after Multi Channel Association interview...`,
                    direction: "none",
                });
                this.setInterviewComplete(ctx, true);
                return;
            }
            // And set up lifeline associations
            await ccUtils.configureLifelineAssociations(ctx, endpoint);
            // Remember that the interview is complete
            this.setInterviewComplete(ctx, true);
        }
        async refreshValues(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses.Association, ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            const groupCount = AssociationCC.getGroupCountCached(ctx, endpoint);
            // Query each association group
            for (let groupId = 1; groupId <= groupCount; groupId++) {
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: `querying association group #${groupId}...`,
                    direction: "outbound",
                });
                const group = await api.getGroup(groupId);
                if (group != undefined) {
                    const logMessage = `received information for association group #${groupId}:
maximum # of nodes: ${group.maxNodes}
currently assigned nodes: ${group.nodeIds.map(String).join(", ")}`;
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message: logMessage,
                        direction: "inbound",
                    });
                }
            }
        }
    };
    return AssociationCC = _classThis;
})();
export { AssociationCC };
let AssociationCCSet = (() => {
    let _classDecorators = [CCCommand(AssociationCommand.Set), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = AssociationCC;
    var AssociationCCSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AssociationCCSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            if (options.groupId < 1) {
                throw new ZWaveError("The group id must be positive!", ZWaveErrorCodes.Argument_Invalid);
            }
            if (options.nodeIds.some((n) => n < 1 || n > MAX_NODES)) {
                throw new ZWaveError(`All node IDs must be between 1 and ${MAX_NODES}!`, ZWaveErrorCodes.Argument_Invalid);
            }
            this.groupId = options.groupId;
            this.nodeIds = options.nodeIds;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const groupId = raw.payload[0];
            const nodeIds = [...raw.payload.subarray(1)];
            return new this({
                nodeId: ctx.sourceNodeId,
                groupId,
                nodeIds,
            });
        }
        groupId;
        nodeIds;
        serialize(ctx) {
            this.payload = Bytes.from([this.groupId, ...this.nodeIds]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const message = {
                "group id": this.groupId || "all groups",
                "node ids": this.nodeIds.length
                    ? this.nodeIds.join(", ")
                    : "all nodes",
            };
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return AssociationCCSet = _classThis;
})();
export { AssociationCCSet };
let AssociationCCRemove = (() => {
    let _classDecorators = [CCCommand(AssociationCommand.Remove), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = AssociationCC;
    var AssociationCCRemove = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AssociationCCRemove = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // When removing associations, we allow invalid node IDs.
            // See GH#3606 - it is possible that those exist.
            this.groupId = options.groupId;
            this.nodeIds = options.nodeIds;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            let groupId;
            if (raw.payload[0] !== 0) {
                groupId = raw.payload[0];
            }
            const nodeIds = [...raw.payload.subarray(1)];
            return new this({
                nodeId: ctx.sourceNodeId,
                groupId,
                nodeIds,
            });
        }
        groupId;
        nodeIds;
        serialize(ctx) {
            this.payload = Bytes.from([
                this.groupId || 0,
                ...(this.nodeIds || []),
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const message = {
                "group id": this.groupId || "all groups",
                "node ids": this.nodeIds && this.nodeIds.length
                    ? this.nodeIds.join(", ")
                    : "all nodes",
            };
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return AssociationCCRemove = _classThis;
})();
export { AssociationCCRemove };
let AssociationCCReport = (() => {
    let _classDecorators = [CCCommand(AssociationCommand.Report), ccValueProperty("maxNodes", AssociationCCValues.maxNodes, (self) => [self.groupId]), ccValueProperty("nodeIds", AssociationCCValues.nodeIds, (self) => [self.groupId])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = AssociationCC;
    var AssociationCCReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AssociationCCReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.groupId = options.groupId;
            this.maxNodes = options.maxNodes;
            this.nodeIds = options.nodeIds;
            this.reportsToFollow = options.reportsToFollow;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 3);
            const groupId = raw.payload[0];
            const maxNodes = raw.payload[1];
            const reportsToFollow = raw.payload[2];
            const nodeIds = [...raw.payload.subarray(3)];
            return new this({
                nodeId: ctx.sourceNodeId,
                groupId,
                maxNodes,
                reportsToFollow,
                nodeIds,
            });
        }
        groupId;
        maxNodes;
        nodeIds;
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
                .map((report) => report.nodeIds)
                .reduce((prev, cur) => prev.concat(...cur), []);
            return Promise.resolve();
        }
        serialize(ctx) {
            this.payload = Bytes.from([
                this.groupId,
                this.maxNodes,
                this.reportsToFollow,
                ...this.nodeIds,
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "group id": this.groupId,
                    "max # of nodes": this.maxNodes,
                    "node IDs": this.nodeIds.join(", "),
                    "reports to follow": this.reportsToFollow,
                },
            };
        }
    };
    return AssociationCCReport = _classThis;
})();
export { AssociationCCReport };
let AssociationCCGet = (() => {
    let _classDecorators = [CCCommand(AssociationCommand.Get), expectedCCResponse(AssociationCCReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = AssociationCC;
    var AssociationCCGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AssociationCCGet = _classThis = _classDescriptor.value;
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
    return AssociationCCGet = _classThis;
})();
export { AssociationCCGet };
let AssociationCCSupportedGroupingsReport = (() => {
    let _classDecorators = [CCCommand(AssociationCommand.SupportedGroupingsReport), ccValueProperty("groupCount", AssociationCCValues.groupCount)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = AssociationCC;
    var AssociationCCSupportedGroupingsReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AssociationCCSupportedGroupingsReport = _classThis = _classDescriptor.value;
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
    return AssociationCCSupportedGroupingsReport = _classThis;
})();
export { AssociationCCSupportedGroupingsReport };
let AssociationCCSupportedGroupingsGet = (() => {
    let _classDecorators = [CCCommand(AssociationCommand.SupportedGroupingsGet), expectedCCResponse(AssociationCCSupportedGroupingsReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = AssociationCC;
    var AssociationCCSupportedGroupingsGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AssociationCCSupportedGroupingsGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return AssociationCCSupportedGroupingsGet = _classThis;
})();
export { AssociationCCSupportedGroupingsGet };
let AssociationCCSpecificGroupReport = (() => {
    let _classDecorators = [CCCommand(AssociationCommand.SpecificGroupReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = AssociationCC;
    var AssociationCCSpecificGroupReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AssociationCCSpecificGroupReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.group = options.group;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const group = raw.payload[0];
            return new this({
                nodeId: ctx.sourceNodeId,
                group,
            });
        }
        group;
        serialize(ctx) {
            this.payload = Bytes.from([this.group]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: { group: this.group },
            };
        }
    };
    return AssociationCCSpecificGroupReport = _classThis;
})();
export { AssociationCCSpecificGroupReport };
let AssociationCCSpecificGroupGet = (() => {
    let _classDecorators = [CCCommand(AssociationCommand.SpecificGroupGet), expectedCCResponse(AssociationCCSpecificGroupReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = AssociationCC;
    var AssociationCCSpecificGroupGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AssociationCCSpecificGroupGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return AssociationCCSpecificGroupGet = _classThis;
})();
export { AssociationCCSpecificGroupGet };
//# sourceMappingURL=AssociationCC.js.map