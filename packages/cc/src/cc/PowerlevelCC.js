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
import { CommandClasses, NodeStatus, ZWaveError, ZWaveErrorCodes, validatePayload, } from "@zwave-js/core";
import { Bytes, getEnumMemberName, pick } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { PhysicalCCAPI } from "../lib/API.js";
import { CommandClass } from "../lib/CommandClass.js";
import { API, CCCommand, commandClass, expectedCCResponse, implementedVersion, useSupervision, } from "../lib/CommandClassDecorators.js";
import { Powerlevel, PowerlevelCommand, PowerlevelTestStatus, } from "../lib/_Types.js";
let PowerlevelCCAPI = (() => {
    let _classDecorators = [API(CommandClasses.Powerlevel)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = PhysicalCCAPI;
    let _instanceExtraInitializers = [];
    let _setCustomPowerlevel_decorators;
    let _reportPowerlevel_decorators;
    let _startNodeTest_decorators;
    let _sendNodeTestReport_decorators;
    var PowerlevelCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _setCustomPowerlevel_decorators = [validateArgs({ strictEnums: true })];
            _reportPowerlevel_decorators = [validateArgs()];
            _startNodeTest_decorators = [validateArgs({ strictEnums: true })];
            _sendNodeTestReport_decorators = [validateArgs()];
            __esDecorate(this, null, _setCustomPowerlevel_decorators, { kind: "method", name: "setCustomPowerlevel", static: false, private: false, access: { has: obj => "setCustomPowerlevel" in obj, get: obj => obj.setCustomPowerlevel }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _reportPowerlevel_decorators, { kind: "method", name: "reportPowerlevel", static: false, private: false, access: { has: obj => "reportPowerlevel" in obj, get: obj => obj.reportPowerlevel }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _startNodeTest_decorators, { kind: "method", name: "startNodeTest", static: false, private: false, access: { has: obj => "startNodeTest" in obj, get: obj => obj.startNodeTest }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _sendNodeTestReport_decorators, { kind: "method", name: "sendNodeTestReport", static: false, private: false, access: { has: obj => "sendNodeTestReport" in obj, get: obj => obj.sendNodeTestReport }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            PowerlevelCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case PowerlevelCommand.Get:
                case PowerlevelCommand.Report:
                case PowerlevelCommand.TestNodeGet:
                case PowerlevelCommand.TestNodeReport:
                    return this.isSinglecast();
                case PowerlevelCommand.Set:
                case PowerlevelCommand.TestNodeSet:
                    return true;
            }
            return super.supportsCommand(cmd);
        }
        async setNormalPowerlevel() {
            this.assertSupportsCommand(PowerlevelCommand, PowerlevelCommand.Set);
            const cc = new PowerlevelCCSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                powerlevel: Powerlevel["Normal Power"],
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        async setCustomPowerlevel(powerlevel, timeout) {
            this.assertSupportsCommand(PowerlevelCommand, PowerlevelCommand.Set);
            const cc = new PowerlevelCCSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                powerlevel,
                timeout,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        async getPowerlevel() {
            this.assertSupportsCommand(PowerlevelCommand, PowerlevelCommand.Get);
            const cc = new PowerlevelCCGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, ["powerlevel", "timeout"]);
            }
        }
        async reportPowerlevel(options) {
            this.assertSupportsCommand(PowerlevelCommand, PowerlevelCommand.Report);
            const cc = new PowerlevelCCReport({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                ...options,
            });
            await this.host.sendCommand(cc, this.commandOptions);
        }
        async startNodeTest(testNodeId, powerlevel, testFrameCount) {
            this.assertSupportsCommand(PowerlevelCommand, PowerlevelCommand.TestNodeSet);
            if (testNodeId === this.endpoint.nodeId) {
                throw new ZWaveError(`For a powerlevel test, the test node ID must different from the source node ID.`, ZWaveErrorCodes.Argument_Invalid);
            }
            const testNode = this.host.getNodeOrThrow(testNodeId);
            if (testNode.isFrequentListening) {
                throw new ZWaveError(`Node ${testNodeId} is FLiRS and therefore cannot be used for a powerlevel test.`, ZWaveErrorCodes.PowerlevelCC_UnsupportedTestNode);
            }
            if (testNode.canSleep && testNode.status !== NodeStatus.Awake) {
                throw new ZWaveError(`Node ${testNodeId} is not awake and therefore cannot be used for a powerlevel test.`, ZWaveErrorCodes.PowerlevelCC_UnsupportedTestNode);
            }
            const cc = new PowerlevelCCTestNodeSet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                testNodeId,
                powerlevel,
                testFrameCount,
            });
            return this.host.sendCommand(cc, this.commandOptions);
        }
        async getNodeTestStatus() {
            this.assertSupportsCommand(PowerlevelCommand, PowerlevelCommand.TestNodeGet);
            const cc = new PowerlevelCCTestNodeGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, [
                    "testNodeId",
                    "status",
                    "acknowledgedFrames",
                ]);
            }
        }
        async sendNodeTestReport(options) {
            this.assertSupportsCommand(PowerlevelCommand, PowerlevelCommand.TestNodeReport);
            const cc = new PowerlevelCCTestNodeReport({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                ...options,
            });
            await this.host.sendCommand(cc, this.commandOptions);
        }
        constructor() {
            super(...arguments);
            __runInitializers(this, _instanceExtraInitializers);
        }
    };
    return PowerlevelCCAPI = _classThis;
})();
export { PowerlevelCCAPI };
let PowerlevelCC = (() => {
    let _classDecorators = [commandClass(CommandClasses.Powerlevel), implementedVersion(1)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var PowerlevelCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            PowerlevelCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return PowerlevelCC = _classThis;
})();
export { PowerlevelCC };
let PowerlevelCCSet = (() => {
    let _classDecorators = [CCCommand(PowerlevelCommand.Set), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = PowerlevelCC;
    var PowerlevelCCSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            PowerlevelCCSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.powerlevel = options.powerlevel;
            if (options.powerlevel !== Powerlevel["Normal Power"]) {
                if (options.timeout < 1 || options.timeout > 255) {
                    throw new ZWaveError(`The timeout parameter must be between 1 and 255.`, ZWaveErrorCodes.Argument_Invalid);
                }
                this.timeout = options.timeout;
            }
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const powerlevel = raw.payload[0];
            if (powerlevel === Powerlevel["Normal Power"]) {
                return new this({
                    nodeId: ctx.sourceNodeId,
                    powerlevel,
                });
            }
            else {
                validatePayload(raw.payload.length >= 2);
                const timeout = raw.payload[1];
                return new this({
                    nodeId: ctx.sourceNodeId,
                    powerlevel,
                    timeout,
                });
            }
        }
        powerlevel;
        timeout;
        serialize(ctx) {
            this.payload = Bytes.from([this.powerlevel, this.timeout ?? 0x00]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const message = {
                "power level": getEnumMemberName(Powerlevel, this.powerlevel),
            };
            if (this.timeout != undefined) {
                message.timeout = `${this.timeout} s`;
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return PowerlevelCCSet = _classThis;
})();
export { PowerlevelCCSet };
let PowerlevelCCReport = (() => {
    let _classDecorators = [CCCommand(PowerlevelCommand.Report)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = PowerlevelCC;
    var PowerlevelCCReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            PowerlevelCCReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.powerlevel = options.powerlevel;
            this.timeout = options.timeout;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const powerlevel = raw.payload[0];
            if (powerlevel === Powerlevel["Normal Power"]) {
                return new this({
                    nodeId: ctx.sourceNodeId,
                    powerlevel,
                });
            }
            else {
                validatePayload(raw.payload.length >= 2);
                const timeout = raw.payload[1];
                return new this({
                    nodeId: ctx.sourceNodeId,
                    powerlevel,
                    timeout,
                });
            }
        }
        powerlevel;
        timeout;
        serialize(ctx) {
            this.payload = Bytes.from([this.powerlevel, this.timeout ?? 0x00]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const message = {
                "power level": getEnumMemberName(Powerlevel, this.powerlevel),
            };
            if (this.timeout != undefined) {
                message.timeout = `${this.timeout} s`;
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return PowerlevelCCReport = _classThis;
})();
export { PowerlevelCCReport };
let PowerlevelCCGet = (() => {
    let _classDecorators = [CCCommand(PowerlevelCommand.Get), expectedCCResponse(PowerlevelCCReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = PowerlevelCC;
    var PowerlevelCCGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            PowerlevelCCGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return PowerlevelCCGet = _classThis;
})();
export { PowerlevelCCGet };
let PowerlevelCCTestNodeSet = (() => {
    let _classDecorators = [CCCommand(PowerlevelCommand.TestNodeSet), useSupervision()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = PowerlevelCC;
    var PowerlevelCCTestNodeSet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            PowerlevelCCTestNodeSet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.testNodeId = options.testNodeId;
            this.powerlevel = options.powerlevel;
            this.testFrameCount = options.testFrameCount;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 4);
            const testNodeId = raw.payload[0];
            const powerlevel = raw.payload[1];
            const testFrameCount = raw.payload.readUInt16BE(2);
            return new this({
                nodeId: ctx.sourceNodeId,
                testNodeId,
                powerlevel,
                testFrameCount,
            });
        }
        testNodeId;
        powerlevel;
        testFrameCount;
        serialize(ctx) {
            this.payload = Bytes.from([this.testNodeId, this.powerlevel, 0, 0]);
            this.payload.writeUInt16BE(this.testFrameCount, 2);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "test node id": this.testNodeId,
                    "power level": getEnumMemberName(Powerlevel, this.powerlevel),
                    "test frame count": this.testFrameCount,
                },
            };
        }
    };
    return PowerlevelCCTestNodeSet = _classThis;
})();
export { PowerlevelCCTestNodeSet };
let PowerlevelCCTestNodeReport = (() => {
    let _classDecorators = [CCCommand(PowerlevelCommand.TestNodeReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = PowerlevelCC;
    var PowerlevelCCTestNodeReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            PowerlevelCCTestNodeReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.testNodeId = options.testNodeId;
            this.status = options.status;
            this.acknowledgedFrames = options.acknowledgedFrames;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 4);
            const testNodeId = raw.payload[0];
            const status = raw.payload[1];
            const acknowledgedFrames = raw.payload.readUInt16BE(2);
            return new this({
                nodeId: ctx.sourceNodeId,
                testNodeId,
                status,
                acknowledgedFrames,
            });
        }
        testNodeId;
        status;
        acknowledgedFrames;
        serialize(ctx) {
            this.payload = Bytes.from([
                this.testNodeId,
                this.status,
                // Placeholder for acknowledged frames
                0,
                0,
            ]);
            this.payload.writeUInt16BE(this.acknowledgedFrames, 2);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "test node id": this.testNodeId,
                    status: getEnumMemberName(PowerlevelTestStatus, this.status),
                    "acknowledged frames": this.acknowledgedFrames,
                },
            };
        }
    };
    return PowerlevelCCTestNodeReport = _classThis;
})();
export { PowerlevelCCTestNodeReport };
let PowerlevelCCTestNodeGet = (() => {
    let _classDecorators = [CCCommand(PowerlevelCommand.TestNodeGet), expectedCCResponse(PowerlevelCCTestNodeReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = PowerlevelCC;
    var PowerlevelCCTestNodeGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            PowerlevelCCTestNodeGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return PowerlevelCCTestNodeGet = _classThis;
})();
export { PowerlevelCCTestNodeGet };
//# sourceMappingURL=PowerlevelCC.js.map