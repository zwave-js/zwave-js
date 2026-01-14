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
import { CommandClasses, MessagePriority, encodeCCId, getCCName, parseCCId, validatePayload, } from "@zwave-js/core";
import { Bytes, cpp2js, getEnumMemberName, num2hex } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { CCAPI, PhysicalCCAPI } from "../lib/API.js";
import { CommandClass, } from "../lib/CommandClass.js";
import { API, CCCommand, ccValueProperty, ccValues, commandClass, expectedCCResponse, implementedVersion, } from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import { AssociationGroupInfoCommand, AssociationGroupInfoProfile, } from "../lib/_Types.js";
import { AssociationCC } from "./AssociationCC.js";
import { MultiChannelAssociationCC } from "./MultiChannelAssociationCC.js";
export const AssociationGroupInfoCCValues = V.defineCCValues(CommandClasses["Association Group Information"], {
    ...V.staticProperty("hasDynamicInfo", undefined, { internal: true }),
    ...V.dynamicPropertyAndKeyWithName("groupName", "name", (groupId) => groupId, ({ property, propertyKey }) => property === "name" && typeof propertyKey === "number", undefined, { internal: true }),
    ...V.dynamicPropertyAndKeyWithName("groupInfo", "info", (groupId) => groupId, ({ property, propertyKey }) => property === "info" && typeof propertyKey === "number", undefined, { internal: true }),
    ...V.dynamicPropertyAndKeyWithName("commands", "issuedCommands", (groupId) => groupId, ({ property, propertyKey }) => property === "issuedCommands"
        && typeof propertyKey === "number", undefined, { internal: true }),
});
// @noSetValueAPI This CC only has get-type commands
let AssociationGroupInfoCCAPI = (() => {
    let _classDecorators = [API(CommandClasses["Association Group Information"])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = PhysicalCCAPI;
    let _instanceExtraInitializers = [];
    let _getGroupName_decorators;
    let _reportGroupName_decorators;
    let _getGroupInfo_decorators;
    let _reportGroupInfo_decorators;
    let _getCommands_decorators;
    let _reportCommands_decorators;
    var AssociationGroupInfoCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _getGroupName_decorators = [validateArgs()];
            _reportGroupName_decorators = [validateArgs()];
            _getGroupInfo_decorators = [validateArgs()];
            _reportGroupInfo_decorators = [validateArgs()];
            _getCommands_decorators = [validateArgs()];
            _reportCommands_decorators = [validateArgs()];
            __esDecorate(this, null, _getGroupName_decorators, { kind: "method", name: "getGroupName", static: false, private: false, access: { has: obj => "getGroupName" in obj, get: obj => obj.getGroupName }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _reportGroupName_decorators, { kind: "method", name: "reportGroupName", static: false, private: false, access: { has: obj => "reportGroupName" in obj, get: obj => obj.reportGroupName }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getGroupInfo_decorators, { kind: "method", name: "getGroupInfo", static: false, private: false, access: { has: obj => "getGroupInfo" in obj, get: obj => obj.getGroupInfo }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _reportGroupInfo_decorators, { kind: "method", name: "reportGroupInfo", static: false, private: false, access: { has: obj => "reportGroupInfo" in obj, get: obj => obj.reportGroupInfo }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getCommands_decorators, { kind: "method", name: "getCommands", static: false, private: false, access: { has: obj => "getCommands" in obj, get: obj => obj.getCommands }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _reportCommands_decorators, { kind: "method", name: "reportCommands", static: false, private: false, access: { has: obj => "reportCommands" in obj, get: obj => obj.reportCommands }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AssociationGroupInfoCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case AssociationGroupInfoCommand.NameGet:
                case AssociationGroupInfoCommand.NameReport:
                case AssociationGroupInfoCommand.InfoGet:
                case AssociationGroupInfoCommand.InfoReport:
                case AssociationGroupInfoCommand.CommandListGet:
                case AssociationGroupInfoCommand.CommandListReport:
                    return true; // This is mandatory
            }
            return super.supportsCommand(cmd);
        }
        async getGroupName(groupId) {
            this.assertSupportsCommand(AssociationGroupInfoCommand, AssociationGroupInfoCommand.NameGet);
            const cc = new AssociationGroupInfoCCNameGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                groupId,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response)
                return response.name;
        }
        async reportGroupName(groupId, name) {
            this.assertSupportsCommand(AssociationGroupInfoCommand, AssociationGroupInfoCommand.NameReport);
            const cc = new AssociationGroupInfoCCNameReport({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                groupId,
                name,
            });
            await this.host.sendCommand(cc, this.commandOptions);
        }
        async getGroupInfo(groupId, refreshCache = false) {
            this.assertSupportsCommand(AssociationGroupInfoCommand, AssociationGroupInfoCommand.InfoGet);
            const cc = new AssociationGroupInfoCCInfoGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                groupId,
                refreshCache,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            // SDS13782 says: If List Mode is set to 0, the Group Count field MUST be set to 1.
            // But that's not always the case. Apparently some endpoints return 0 groups
            // although they support AGI CC
            if (response && response.groups.length > 0) {
                const { groupId: _, ...info } = response.groups[0];
                return {
                    hasDynamicInfo: response.hasDynamicInfo,
                    ...info,
                };
            }
        }
        async reportGroupInfo(options) {
            this.assertSupportsCommand(AssociationGroupInfoCommand, AssociationGroupInfoCommand.InfoReport);
            const cc = new AssociationGroupInfoCCInfoReport({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                ...options,
            });
            await this.host.sendCommand(cc, this.commandOptions);
        }
        async getCommands(groupId, allowCache = true) {
            this.assertSupportsCommand(AssociationGroupInfoCommand, AssociationGroupInfoCommand.CommandListGet);
            const cc = new AssociationGroupInfoCCCommandListGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                groupId,
                allowCache,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response)
                return response.commands;
        }
        async reportCommands(groupId, commands) {
            this.assertSupportsCommand(AssociationGroupInfoCommand, AssociationGroupInfoCommand.CommandListReport);
            const cc = new AssociationGroupInfoCCCommandListReport({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                groupId,
                commands,
            });
            await this.host.sendCommand(cc, this.commandOptions);
        }
        constructor() {
            super(...arguments);
            __runInitializers(this, _instanceExtraInitializers);
        }
    };
    return AssociationGroupInfoCCAPI = _classThis;
})();
export { AssociationGroupInfoCCAPI };
let AssociationGroupInfoCC = (() => {
    let _classDecorators = [commandClass(CommandClasses["Association Group Information"]), implementedVersion(3), ccValues(AssociationGroupInfoCCValues)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var AssociationGroupInfoCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AssociationGroupInfoCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        determineRequiredCCInterviews() {
            // AssociationCC must be interviewed after Z-Wave+ if that is supported
            return [
                ...super.determineRequiredCCInterviews(),
                CommandClasses.Association,
                CommandClasses["Multi Channel Association"],
            ];
        }
        /** Returns the name of an association group */
        static getGroupNameCached(ctx, endpoint, groupId) {
            return ctx
                .getValueDB(endpoint.nodeId)
                .getValue(AssociationGroupInfoCCValues.groupName(groupId).endpoint(endpoint.index));
        }
        /** Returns the association profile for an association group */
        static getGroupProfileCached(ctx, endpoint, groupId) {
            return ctx.getValueDB(endpoint.nodeId).getValue(AssociationGroupInfoCCValues.groupInfo(groupId).endpoint(endpoint.index))
                ?.profile;
        }
        /** Returns the dictionary of all commands issued by the given association group */
        static getIssuedCommandsCached(ctx, endpoint, groupId) {
            return ctx
                .getValueDB(endpoint.nodeId)
                .getValue(AssociationGroupInfoCCValues.commands(groupId).endpoint(endpoint.index));
        }
        static findGroupsForIssuedCommand(ctx, endpoint, ccId, command) {
            const ret = [];
            const associationGroupCount = this.getAssociationGroupCountCached(ctx, endpoint);
            for (let groupId = 1; groupId <= associationGroupCount; groupId++) {
                // Scan the issued commands of all groups if there's a match
                const issuedCommands = this.getIssuedCommandsCached(ctx, endpoint, groupId);
                if (!issuedCommands)
                    continue;
                if (issuedCommands.has(ccId)
                    && issuedCommands.get(ccId).includes(command)) {
                    ret.push(groupId);
                    continue;
                }
            }
            return ret;
        }
        static getAssociationGroupCountCached(ctx, endpoint) {
            // The association group count is either determined by the
            // Association CC or the Multi Channel Association CC
            return (
            // First query the Multi Channel Association CC
            // And fall back to 0
            (endpoint.supportsCC(CommandClasses["Multi Channel Association"])
                && MultiChannelAssociationCC.getGroupCountCached(ctx, endpoint))
                // Then the Association CC
                || (endpoint.supportsCC(CommandClasses.Association)
                    && AssociationCC.getGroupCountCached(ctx, endpoint))
                || 0);
        }
        async interview(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses["Association Group Information"], ctx, endpoint).withOptions({ priority: MessagePriority.NodeQuery });
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: `Interviewing ${this.ccName}...`,
                direction: "none",
            });
            const associationGroupCount = AssociationGroupInfoCC
                .getAssociationGroupCountCached(ctx, endpoint);
            for (let groupId = 1; groupId <= associationGroupCount; groupId++) {
                // First get the group's name
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: `Association group #${groupId}: Querying name...`,
                    direction: "outbound",
                });
                const name = await api.getGroupName(groupId);
                if (name) {
                    const logMessage = `Association group #${groupId} has name "${name}"`;
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message: logMessage,
                        direction: "inbound",
                    });
                }
                // Then the command list
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: `Association group #${groupId}: Querying command list...`,
                    direction: "outbound",
                });
                await api.getCommands(groupId);
                // Not sure how to log this
            }
            // Finally query each group for its information
            await this.refreshValues(ctx);
            // Remember that the interview is complete
            this.setInterviewComplete(ctx, true);
        }
        async refreshValues(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses["Association Group Information"], ctx, endpoint).withOptions({ priority: MessagePriority.NodeQuery });
            // Query the information for each group (this is the only thing that could be dynamic)
            const associationGroupCount = AssociationGroupInfoCC
                .getAssociationGroupCountCached(ctx, endpoint);
            const hasDynamicInfo = this.getValue(ctx, AssociationGroupInfoCCValues.hasDynamicInfo);
            for (let groupId = 1; groupId <= associationGroupCount; groupId++) {
                // Then its information
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: `Association group #${groupId}: Querying info...`,
                    direction: "outbound",
                });
                const info = await api.getGroupInfo(groupId, !!hasDynamicInfo);
                if (info) {
                    const logMessage = `Received info for association group #${groupId}:
info is dynamic: ${info.hasDynamicInfo}
profile:         ${getEnumMemberName(AssociationGroupInfoProfile, info.profile)}`;
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message: logMessage,
                        direction: "inbound",
                    });
                }
            }
        }
    };
    return AssociationGroupInfoCC = _classThis;
})();
export { AssociationGroupInfoCC };
let AssociationGroupInfoCCNameReport = (() => {
    let _classDecorators = [CCCommand(AssociationGroupInfoCommand.NameReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = AssociationGroupInfoCC;
    var AssociationGroupInfoCCNameReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AssociationGroupInfoCCNameReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.groupId = options.groupId;
            this.name = options.name;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const groupId = raw.payload[0];
            const nameLength = raw.payload[1];
            validatePayload(raw.payload.length >= 2 + nameLength);
            // The specs don't allow 0-terminated string, but some devices use them
            // So we need to cut them off
            const name = cpp2js(raw.payload.subarray(2, 2 + nameLength).toString("utf8"));
            return new this({
                nodeId: ctx.sourceNodeId,
                groupId,
                name,
            });
        }
        groupId;
        name;
        persistValues(ctx) {
            if (!super.persistValues(ctx))
                return false;
            const valueDB = this.getValueDB(ctx);
            valueDB.setValue(AssociationGroupInfoCCValues.groupName(this.groupId).endpoint(this.endpointIndex), this.name);
            return true;
        }
        serialize(ctx) {
            this.payload = Bytes.concat([
                Bytes.from([this.groupId, this.name.length]),
                Bytes.from(this.name, "utf8"),
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "group id": this.groupId,
                    name: this.name,
                },
            };
        }
    };
    return AssociationGroupInfoCCNameReport = _classThis;
})();
export { AssociationGroupInfoCCNameReport };
let AssociationGroupInfoCCNameGet = (() => {
    let _classDecorators = [CCCommand(AssociationGroupInfoCommand.NameGet), expectedCCResponse(AssociationGroupInfoCCNameReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = AssociationGroupInfoCC;
    var AssociationGroupInfoCCNameGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AssociationGroupInfoCCNameGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
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
    return AssociationGroupInfoCCNameGet = _classThis;
})();
export { AssociationGroupInfoCCNameGet };
let AssociationGroupInfoCCInfoReport = (() => {
    let _classDecorators = [CCCommand(AssociationGroupInfoCommand.InfoReport), ccValueProperty("hasDynamicInfo", AssociationGroupInfoCCValues.hasDynamicInfo)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = AssociationGroupInfoCC;
    var AssociationGroupInfoCCInfoReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AssociationGroupInfoCCInfoReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.isListMode = options.isListMode;
            this.hasDynamicInfo = options.hasDynamicInfo;
            this.groups = options.groups;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const isListMode = !!(raw.payload[0] & 0b1000_0000);
            const hasDynamicInfo = !!(raw.payload[0] & 0b0100_0000);
            const groupCount = raw.payload[0] & 0b0011_1111;
            // each group requires 7 bytes of payload
            validatePayload(raw.payload.length >= 1 + groupCount * 7);
            const groups = [];
            for (let i = 0; i < groupCount; i++) {
                const offset = 1 + i * 7;
                // Parse the payload
                const groupBytes = raw.payload.subarray(offset, offset + 7);
                const groupId = groupBytes[0];
                const mode = 0; // groupBytes[1];
                const profile = groupBytes.readUInt16BE(2);
                const eventCode = 0; // groupBytes.readUInt16BE(5);
                groups.push({ groupId, mode, profile, eventCode });
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                isListMode,
                hasDynamicInfo,
                groups,
            });
        }
        isListMode;
        hasDynamicInfo;
        groups;
        persistValues(ctx) {
            if (!super.persistValues(ctx))
                return false;
            for (const group of this.groups) {
                const { groupId, mode, profile, eventCode } = group;
                this.setValue(ctx, AssociationGroupInfoCCValues.groupInfo(groupId), {
                    mode,
                    profile,
                    eventCode,
                });
            }
            return true;
        }
        serialize(ctx) {
            this.payload = Bytes.alloc(1 + this.groups.length * 7, 0);
            this.payload[0] = (this.isListMode ? 0b1000_0000 : 0)
                | (this.hasDynamicInfo ? 0b0100_0000 : 0)
                | (this.groups.length & 0b0011_1111);
            for (let i = 0; i < this.groups.length; i++) {
                const offset = 1 + i * 7;
                this.payload[offset] = this.groups[i].groupId;
                this.payload.writeUInt16BE(this.groups[i].profile, offset + 2);
                // The remaining bytes are zero
            }
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "is list mode": this.isListMode,
                    "has dynamic info": this.hasDynamicInfo,
                    groups: `${this.groups
                        .map((g) => `
· Group #${g.groupId}
  mode:       ${g.mode}
  profile:    ${g.profile}
  event code: ${g.eventCode}`)
                        .join("")}`,
                },
            };
        }
    };
    return AssociationGroupInfoCCInfoReport = _classThis;
})();
export { AssociationGroupInfoCCInfoReport };
let AssociationGroupInfoCCInfoGet = (() => {
    let _classDecorators = [CCCommand(AssociationGroupInfoCommand.InfoGet), expectedCCResponse(AssociationGroupInfoCCInfoReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = AssociationGroupInfoCC;
    var AssociationGroupInfoCCInfoGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AssociationGroupInfoCCInfoGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.refreshCache = options.refreshCache;
            if ("listMode" in options)
                this.listMode = options.listMode;
            if ("groupId" in options)
                this.groupId = options.groupId;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const optionByte = raw.payload[0];
            const refreshCache = !!(optionByte & 0b1000_0000);
            const listMode = !!(optionByte & 0b0100_0000);
            let groupId;
            if (!listMode) {
                groupId = raw.payload[1];
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                refreshCache,
                listMode,
                groupId,
            });
        }
        refreshCache;
        listMode;
        groupId;
        serialize(ctx) {
            const isListMode = this.listMode === true;
            const optionByte = (this.refreshCache ? 0b1000_0000 : 0)
                | (isListMode ? 0b0100_0000 : 0);
            this.payload = Bytes.from([
                optionByte,
                isListMode ? 0 : this.groupId,
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const message = {};
            if (this.groupId != undefined) {
                message["group id"] = this.groupId;
            }
            if (this.listMode != undefined) {
                message["list mode"] = this.listMode;
            }
            message["refresh cache"] = this.refreshCache;
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return AssociationGroupInfoCCInfoGet = _classThis;
})();
export { AssociationGroupInfoCCInfoGet };
let AssociationGroupInfoCCCommandListReport = (() => {
    let _classDecorators = [CCCommand(AssociationGroupInfoCommand.CommandListReport), ccValueProperty("commands", AssociationGroupInfoCCValues.commands, (self) => [self.groupId])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = AssociationGroupInfoCC;
    var AssociationGroupInfoCCCommandListReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AssociationGroupInfoCCCommandListReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.groupId = options.groupId;
            this.commands = options.commands;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const groupId = raw.payload[0];
            const listLength = raw.payload[1];
            validatePayload(raw.payload.length >= 2 + listLength);
            const listBytes = raw.payload.subarray(2, 2 + listLength);
            // Parse all CC ids and commands
            let offset = 0;
            const commands = new Map();
            while (offset < listLength) {
                const { ccId, bytesRead } = parseCCId(listBytes, offset);
                const command = listBytes[offset + bytesRead];
                if (!commands.has(ccId))
                    commands.set(ccId, []);
                commands.get(ccId).push(command);
                offset += bytesRead + 1;
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                groupId,
                commands,
            });
        }
        groupId;
        commands;
        serialize(ctx) {
            // To make it easier to encode possible extended CCs, we first
            // allocate as much space as we may need, then trim it again
            this.payload = new Bytes(2 + this.commands.size * 3);
            this.payload[0] = this.groupId;
            let offset = 2;
            for (const [ccId, commands] of this.commands) {
                for (const command of commands) {
                    offset += encodeCCId(ccId, this.payload, offset);
                    this.payload[offset] = command;
                    offset++;
                }
            }
            this.payload[1] = offset - 2; // list length
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "group id": this.groupId,
                    commands: `${[...this.commands]
                        .map(([cc, cmds]) => {
                        return `\n· ${getCCName(cc)}: ${cmds
                            .map((cmd) => num2hex(cmd))
                            .join(", ")}`;
                    })
                        .join("")}`,
                },
            };
        }
    };
    return AssociationGroupInfoCCCommandListReport = _classThis;
})();
export { AssociationGroupInfoCCCommandListReport };
let AssociationGroupInfoCCCommandListGet = (() => {
    let _classDecorators = [CCCommand(AssociationGroupInfoCommand.CommandListGet), expectedCCResponse(AssociationGroupInfoCCCommandListReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = AssociationGroupInfoCC;
    var AssociationGroupInfoCCCommandListGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            AssociationGroupInfoCCCommandListGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.allowCache = options.allowCache;
            this.groupId = options.groupId;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const allowCache = !!(raw.payload[0] & 0b1000_0000);
            const groupId = raw.payload[1];
            return new this({
                nodeId: ctx.sourceNodeId,
                allowCache,
                groupId,
            });
        }
        allowCache;
        groupId;
        serialize(ctx) {
            this.payload = Bytes.from([
                this.allowCache ? 0b1000_0000 : 0,
                this.groupId,
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "group id": this.groupId,
                    "allow cache": this.allowCache,
                },
            };
        }
    };
    return AssociationGroupInfoCCCommandListGet = _classThis;
})();
export { AssociationGroupInfoCCCommandListGet };
//# sourceMappingURL=AssociationGroupInfoCC.js.map