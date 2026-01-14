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
import { CommandClasses, MessagePriority, validatePayload, } from "@zwave-js/core";
import { Bytes, getEnumMemberName, num2hex, pick } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { CCAPI, PhysicalCCAPI } from "../lib/API.js";
import { CommandClass, } from "../lib/CommandClass.js";
import { API, CCCommand, ccValueProperty, ccValues, commandClass, expectedCCResponse, implementedVersion, } from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import { ZWavePlusCommand, ZWavePlusNodeType, ZWavePlusRoleType, } from "../lib/_Types.js";
// SDS13782 The advertised Z-Wave Plus Version, Role Type and Node Type information values
// MUST be identical for the Root Device and all Multi Channel End Points
// --> We only access endpoint 0
export const ZWavePlusCCValues = V.defineCCValues(CommandClasses["Z-Wave Plus Info"], {
    ...V.staticProperty("zwavePlusVersion", undefined, {
        supportsEndpoints: false,
        internal: true,
    }),
    ...V.staticProperty("nodeType", undefined, {
        supportsEndpoints: false,
        internal: true,
    }),
    ...V.staticProperty("roleType", undefined, {
        supportsEndpoints: false,
        internal: true,
    }),
    ...V.staticProperty("userIcon", undefined, {
        internal: true,
    }),
    ...V.staticProperty("installerIcon", undefined, {
        internal: true,
    }),
});
// @noSetValueAPI This CC is read-only
let ZWavePlusCCAPI = (() => {
    let _classDecorators = [API(CommandClasses["Z-Wave Plus Info"])];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = PhysicalCCAPI;
    let _instanceExtraInitializers = [];
    let _sendReport_decorators;
    var ZWavePlusCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _sendReport_decorators = [validateArgs()];
            __esDecorate(this, null, _sendReport_decorators, { kind: "method", name: "sendReport", static: false, private: false, access: { has: obj => "sendReport" in obj, get: obj => obj.sendReport }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ZWavePlusCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case ZWavePlusCommand.Get:
                case ZWavePlusCommand.Report:
                    return true; // This is mandatory
            }
            return super.supportsCommand(cmd);
        }
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        async get() {
            this.assertSupportsCommand(ZWavePlusCommand, ZWavePlusCommand.Get);
            const cc = new ZWavePlusCCGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, [
                    "zwavePlusVersion",
                    "nodeType",
                    "roleType",
                    "installerIcon",
                    "userIcon",
                ]);
            }
        }
        async sendReport(options) {
            this.assertSupportsCommand(ZWavePlusCommand, ZWavePlusCommand.Report);
            const cc = new ZWavePlusCCReport({
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
    return ZWavePlusCCAPI = _classThis;
})();
export { ZWavePlusCCAPI };
let ZWavePlusCC = (() => {
    let _classDecorators = [commandClass(CommandClasses["Z-Wave Plus Info"]), implementedVersion(2), ccValues(ZWavePlusCCValues)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var ZWavePlusCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ZWavePlusCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        async interview(ctx) {
            const node = this.getNode(ctx);
            const endpoint = this.getEndpoint(ctx);
            const api = CCAPI.create(CommandClasses["Z-Wave Plus Info"], ctx, endpoint).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: `Interviewing ${this.ccName}...`,
                direction: "none",
            });
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: "querying Z-Wave+ information...",
                direction: "outbound",
            });
            const zwavePlusResponse = await api.get();
            if (zwavePlusResponse) {
                const logMessage = `received response for Z-Wave+ information:
Z-Wave+ version: ${zwavePlusResponse.zwavePlusVersion}
role type:       ${ZWavePlusRoleType[zwavePlusResponse.roleType]}
node type:       ${ZWavePlusNodeType[zwavePlusResponse.nodeType]}
installer icon:  ${num2hex(zwavePlusResponse.installerIcon)}
user icon:       ${num2hex(zwavePlusResponse.userIcon)}`;
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: logMessage,
                    direction: "inbound",
                });
            }
            // Remember that the interview is complete
            this.setInterviewComplete(ctx, true);
        }
    };
    return ZWavePlusCC = _classThis;
})();
export { ZWavePlusCC };
let ZWavePlusCCReport = (() => {
    let _classDecorators = [CCCommand(ZWavePlusCommand.Report), ccValueProperty("zwavePlusVersion", ZWavePlusCCValues.zwavePlusVersion), ccValueProperty("nodeType", ZWavePlusCCValues.nodeType), ccValueProperty("roleType", ZWavePlusCCValues.roleType), ccValueProperty("installerIcon", ZWavePlusCCValues.installerIcon), ccValueProperty("userIcon", ZWavePlusCCValues.userIcon)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ZWavePlusCC;
    var ZWavePlusCCReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ZWavePlusCCReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.zwavePlusVersion = options.zwavePlusVersion;
            this.roleType = options.roleType;
            this.nodeType = options.nodeType;
            this.installerIcon = options.installerIcon;
            this.userIcon = options.userIcon;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 7);
            const zwavePlusVersion = raw.payload[0];
            const roleType = raw.payload[1];
            const nodeType = raw.payload[2];
            const installerIcon = raw.payload.readUInt16BE(3);
            const userIcon = raw.payload.readUInt16BE(5);
            return new this({
                nodeId: ctx.sourceNodeId,
                zwavePlusVersion,
                roleType,
                nodeType,
                installerIcon,
                userIcon,
            });
        }
        zwavePlusVersion;
        nodeType;
        roleType;
        installerIcon;
        userIcon;
        serialize(ctx) {
            this.payload = Bytes.from([
                this.zwavePlusVersion,
                this.roleType,
                this.nodeType,
                // placeholder for icons
                0,
                0,
                0,
                0,
            ]);
            this.payload.writeUInt16BE(this.installerIcon, 3);
            this.payload.writeUInt16BE(this.userIcon, 5);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    version: this.zwavePlusVersion,
                    "node type": getEnumMemberName(ZWavePlusNodeType, this.nodeType),
                    "role type": getEnumMemberName(ZWavePlusRoleType, this.roleType),
                    "icon (mgmt.)": num2hex(this.installerIcon),
                    "icon (user)": num2hex(this.userIcon),
                },
            };
        }
    };
    return ZWavePlusCCReport = _classThis;
})();
export { ZWavePlusCCReport };
let ZWavePlusCCGet = (() => {
    let _classDecorators = [CCCommand(ZWavePlusCommand.Get), expectedCCResponse(ZWavePlusCCReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = ZWavePlusCC;
    var ZWavePlusCCGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ZWavePlusCCGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return ZWavePlusCCGet = _classThis;
})();
export { ZWavePlusCCGet };
//# sourceMappingURL=ZWavePlusCC.js.map