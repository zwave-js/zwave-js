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
import { CommandClasses, MessagePriority, ValueMetadata, ZWaveError, ZWaveErrorCodes, validatePayload, } from "@zwave-js/core";
import { Bytes, stringToUint8ArrayUTF16BE, uint8ArrayToStringUTF16BE, } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { CCAPI, POLL_VALUE, PhysicalCCAPI, SET_VALUE, throwUnsupportedProperty, throwWrongValueType, } from "../lib/API.js";
import { CommandClass, } from "../lib/CommandClass.js";
import { API, CCCommand, ccValueProperty, ccValues, commandClass, expectedCCResponse, implementedVersion, useSupervision, } from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import { NodeNamingAndLocationCommand } from "../lib/_Types.js";
export const NodeNamingAndLocationCCValues = V.defineCCValues(CommandClasses["Node Naming and Location"], {
    ...V.staticProperty("name", {
        ...ValueMetadata.String,
        label: "Node name",
    }, { supportsEndpoints: false }),
    ...V.staticProperty("location", {
        ...ValueMetadata.String,
        label: "Node location",
    }, { supportsEndpoints: false }),
});
function isASCII(str) {
    return /^[\x00-\x7F]*$/.test(str);
}
let NodeNamingAndLocationCCAPI = (() => {
    let _classDecorators = [API(CommandClasses["Node Naming and Location"])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = PhysicalCCAPI;
    let _instanceExtraInitializers = [];
    let _setName_decorators;
    let _setLocation_decorators;
    var NodeNamingAndLocationCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _setName_decorators = [validateArgs()];
            _setLocation_decorators = [validateArgs()];
            __esDecorate(this, null, _setName_decorators, { kind: "method", name: "setName", static: false, private: false, access: { has: obj => "setName" in obj, get: obj => obj.setName }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _setLocation_decorators, { kind: "method", name: "setLocation", static: false, private: false, access: { has: obj => "setLocation" in obj, get: obj => obj.setLocation }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            NodeNamingAndLocationCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case NodeNamingAndLocationCommand.NameGet:
                case NodeNamingAndLocationCommand.NameSet:
                case NodeNamingAndLocationCommand.LocationGet:
                case NodeNamingAndLocationCommand.LocationSet:
                    return true; // This is mandatory
            }
            return super.supportsCommand(cmd);
        }
        get [SET_VALUE]() {
            return async function ({ property }, value) {
                if (property !== "name" && property !== "location") {
                    throwUnsupportedProperty(this.ccId, property);
                }
                if (typeof value !== "string") {
                    throwWrongValueType(this.ccId, property, "string", typeof value);
                }
                switch (property) {
                    case "name":
                        return this.setName(value);
                    case "location":
                        return this.setLocation(value);
                }
                return undefined;
            };
        }
        get [POLL_VALUE]() {
            return async function ({ property }) {
                switch (property) {
                    case "name":
                        return this.getName();
                    case "location":
                        return this.getLocation();
                    default:
                        throwUnsupportedProperty(this.ccId, property);
                }
            };
        }
        async getName() {
            this.assertSupportsCommand(NodeNamingAndLocationCommand, NodeNamingAndLocationCommand.NameGet);
            const cc = new NodeNamingAndLocationCCNameGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            return response?.name;
        }
        async setName(name) {
            this.assertSupportsCommand(NodeNamingAndLocationCommand, NodeNamingAndLocationCommand.NameSet);
            const cc = new NodeNamingAndLocationCCNameSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                name,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        async getLocation() {
            this.assertSupportsCommand(NodeNamingAndLocationCommand, NodeNamingAndLocationCommand.LocationGet);
            const cc = new NodeNamingAndLocationCCLocationGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            return response?.location;
        }
        async setLocation(location) {
            this.assertSupportsCommand(NodeNamingAndLocationCommand, NodeNamingAndLocationCommand.LocationSet);
            const cc = new NodeNamingAndLocationCCLocationSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                location,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        constructor() {
            super(...arguments);
            __runInitializers(this, _instanceExtraInitializers);
        }
    };
    return NodeNamingAndLocationCCAPI = _classThis;
})();
export { NodeNamingAndLocationCCAPI };
let NodeNamingAndLocationCC = (() => {
    let _classDecorators = [commandClass(CommandClasses["Node Naming and Location"]), implementedVersion(1), ccValues(NodeNamingAndLocationCCValues)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var NodeNamingAndLocationCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            NodeNamingAndLocationCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        skipEndpointInterview() {
            // As the name says, this is for the node, not for endpoints
            return true;
        }
        async interview(ctx) {
            const node = this.getNode(ctx);
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: `Interviewing ${this.ccName}...`,
                direction: "none",
            });
            await this.refreshValues(ctx);
            // Remember that the interview is complete
            this.setInterviewComplete(ctx, true);
        }
        async refreshValues(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses["Node Naming and Location"], ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            ctx.logNode(node.id, {
                message: "retrieving node name...",
                direction: "outbound",
            });
            const name = await api.getName();
            if (name != undefined) {
                ctx.logNode(node.id, {
                    message: `is named "${name}"`,
                    direction: "inbound",
                });
            }
            ctx.logNode(node.id, {
                message: "retrieving node location...",
                direction: "outbound",
            });
            const location = await api.getLocation();
            if (location != undefined) {
                ctx.logNode(node.id, {
                    message: `received location: ${location}`,
                    direction: "inbound",
                });
            }
        }
    };
    return NodeNamingAndLocationCC = _classThis;
})();
export { NodeNamingAndLocationCC };
let NodeNamingAndLocationCCNameSet = (() => {
    let _classDecorators = [CCCommand(NodeNamingAndLocationCommand.NameSet), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = NodeNamingAndLocationCC;
    var NodeNamingAndLocationCCNameSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            NodeNamingAndLocationCCNameSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.name = options.name;
        }
        static from(_raw, _ctx) {
            // TODO: Deserialize payload
            throw new ZWaveError(`${this.name}: deserialization not implemented`, ZWaveErrorCodes.Deserialization_NotImplemented);
            // return new NodeNamingAndLocationCCNameSet({
            // 	nodeId: ctx.sourceNodeId,
            // });
        }
        name;
        serialize(ctx) {
            const encoding = isASCII(this.name) ? "ascii" : "utf16le";
            this.payload = new Bytes(1 + this.name.length * (encoding === "ascii" ? 1 : 2));
            this.payload[0] = encoding === "ascii" ? 0x0 : 0x2;
            let nameBuffer;
            if (encoding === "utf16le") {
                nameBuffer = stringToUint8ArrayUTF16BE(this.name);
            }
            else {
                nameBuffer = Bytes.from(this.name, "ascii");
            }
            // Copy at most 16 bytes
            this.payload.set(nameBuffer.subarray(0, Math.min(16, nameBuffer.length)), 0);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: { name: this.name },
            };
        }
    };
    return NodeNamingAndLocationCCNameSet = _classThis;
})();
export { NodeNamingAndLocationCCNameSet };
let NodeNamingAndLocationCCNameReport = (() => {
    let _classDecorators = [CCCommand(NodeNamingAndLocationCommand.NameReport), ccValueProperty("name", NodeNamingAndLocationCCValues.name)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = NodeNamingAndLocationCC;
    var NodeNamingAndLocationCCNameReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            NodeNamingAndLocationCCNameReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.name = options.name;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const encoding = raw.payload[0] === 2 ? "utf16le" : "ascii";
            const nameBuffer = raw.payload.subarray(1);
            let name;
            if (encoding === "utf16le") {
                validatePayload(nameBuffer.length % 2 === 0);
                name = uint8ArrayToStringUTF16BE(nameBuffer);
            }
            else {
                name = nameBuffer.toString("ascii");
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                name,
            });
        }
        name;
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: { name: this.name },
            };
        }
    };
    return NodeNamingAndLocationCCNameReport = _classThis;
})();
export { NodeNamingAndLocationCCNameReport };
let NodeNamingAndLocationCCNameGet = (() => {
    let _classDecorators = [CCCommand(NodeNamingAndLocationCommand.NameGet), expectedCCResponse(NodeNamingAndLocationCCNameReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = NodeNamingAndLocationCC;
    var NodeNamingAndLocationCCNameGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            NodeNamingAndLocationCCNameGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return NodeNamingAndLocationCCNameGet = _classThis;
})();
export { NodeNamingAndLocationCCNameGet };
let NodeNamingAndLocationCCLocationSet = (() => {
    let _classDecorators = [CCCommand(NodeNamingAndLocationCommand.LocationSet), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = NodeNamingAndLocationCC;
    var NodeNamingAndLocationCCLocationSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            NodeNamingAndLocationCCLocationSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.location = options.location;
        }
        static from(_raw, _ctx) {
            // TODO: Deserialize payload
            throw new ZWaveError(`${this.name}: deserialization not implemented`, ZWaveErrorCodes.Deserialization_NotImplemented);
            // return new NodeNamingAndLocationCCLocationSet({
            // 	nodeId: ctx.sourceNodeId,
            // });
        }
        location;
        serialize(ctx) {
            const encoding = isASCII(this.location) ? "ascii" : "utf16le";
            this.payload = new Bytes(1 + this.location.length * (encoding === "ascii" ? 1 : 2));
            this.payload[0] = encoding === "ascii" ? 0x0 : 0x2;
            let locationBuffer;
            if (encoding === "utf16le") {
                locationBuffer = stringToUint8ArrayUTF16BE(this.location);
            }
            else {
                locationBuffer = Bytes.from(this.location, "ascii");
            }
            // Copy at most 16 bytes
            this.payload.set(locationBuffer.subarray(0, Math.min(16, locationBuffer.length)), 0);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: { location: this.location },
            };
        }
    };
    return NodeNamingAndLocationCCLocationSet = _classThis;
})();
export { NodeNamingAndLocationCCLocationSet };
let NodeNamingAndLocationCCLocationReport = (() => {
    let _classDecorators = [CCCommand(NodeNamingAndLocationCommand.LocationReport), ccValueProperty("location", NodeNamingAndLocationCCValues.location)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = NodeNamingAndLocationCC;
    var NodeNamingAndLocationCCLocationReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            NodeNamingAndLocationCCLocationReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.location = options.location;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const encoding = raw.payload[0] === 2 ? "utf16le" : "ascii";
            const locationBuffer = raw.payload.subarray(1);
            let location;
            if (encoding === "utf16le") {
                validatePayload(locationBuffer.length % 2 === 0);
                location = uint8ArrayToStringUTF16BE(locationBuffer);
            }
            else {
                location = locationBuffer.toString("ascii");
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                location,
            });
        }
        location;
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: { location: this.location },
            };
        }
    };
    return NodeNamingAndLocationCCLocationReport = _classThis;
})();
export { NodeNamingAndLocationCCLocationReport };
let NodeNamingAndLocationCCLocationGet = (() => {
    let _classDecorators = [CCCommand(NodeNamingAndLocationCommand.LocationGet), expectedCCResponse(NodeNamingAndLocationCCLocationReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = NodeNamingAndLocationCC;
    var NodeNamingAndLocationCCLocationGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            NodeNamingAndLocationCCLocationGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return NodeNamingAndLocationCCLocationGet = _classThis;
})();
export { NodeNamingAndLocationCCLocationGet };
//# sourceMappingURL=NodeNamingCC.js.map