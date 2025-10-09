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
import { CommandClasses, Duration, EncapsulationFlags, MessagePriority, SupervisionStatus, TransmitOptions, ZWaveError, ZWaveErrorCodes, isTransmissionError, validatePayload, } from "@zwave-js/core";
import { Bytes, getEnumMemberName } from "@zwave-js/shared";
import { PhysicalCCAPI } from "../lib/API.js";
import { CommandClass } from "../lib/CommandClass.js";
import { API, CCCommand, commandClass, expectedCCResponse, implementedVersion, shouldUseSupervision, } from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import { SupervisionCommand } from "../lib/_Types.js";
export const SupervisionCCValues = V.defineCCValues(CommandClasses.Supervision, {
    ...V.dynamicPropertyAndKeyWithName("ccSupported", "ccSupported", (ccId) => ccId, ({ property, propertyKey }) => property === "commandSupported"
        && typeof propertyKey === "number", undefined, { internal: true, supportsEndpoints: false }),
});
// @noSetValueAPI - This CC has no values to set
// @noInterview - This CC is only used for encapsulation
// Encapsulation CCs are used internally and too frequently that we
// want to pay the cost of validating each call
/* eslint-disable @zwave-js/ccapi-validate-args */
let SupervisionCCAPI = (() => {
    let _classDecorators = [API(CommandClasses.Supervision)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = PhysicalCCAPI;
    var SupervisionCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SupervisionCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case SupervisionCommand.Get:
                case SupervisionCommand.Report:
                    return true; // This is mandatory
            }
            return super.supportsCommand(cmd);
        }
        async sendReport(options) {
            // Here we don't assert support - some devices only half-support Supervision, so we treat them
            // as if they don't support it. We still need to be able to respond to the Get command though.
            const { encapsulationFlags = EncapsulationFlags.None, lowPriority = false, ...cmdOptions } = options;
            const cc = new SupervisionCCReport({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                ...cmdOptions,
            });
            // The report must be sent back with the same encapsulation order
            cc.encapsulationFlags = encapsulationFlags;
            try {
                await this.host.sendCommand(cc, {
                    ...this.commandOptions,
                    // Supervision Reports must be prioritized over normal messages
                    priority: lowPriority
                        ? MessagePriority.ImmediateLow
                        : MessagePriority.Immediate,
                    // But we don't want to wait for an ACK because this can lock up the network for seconds
                    // if the target node is asleep or unreachable
                    transmitOptions: TransmitOptions.DEFAULT_NOACK,
                    // Only try sending the report once. If it fails, the node will ask again
                    maxSendAttempts: 1,
                });
            }
            catch (e) {
                if (isTransmissionError(e)) {
                    // Swallow errors related to transmission failures
                    return;
                }
                else {
                    // Pass other errors through
                    throw e;
                }
            }
        }
    };
    return SupervisionCCAPI = _classThis;
})();
export { SupervisionCCAPI };
let SupervisionCC = (() => {
    let _classDecorators = [commandClass(CommandClasses.Supervision), implementedVersion(2)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var SupervisionCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SupervisionCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        /** Tests if a command should be supervised and thus requires encapsulation */
        static requiresEncapsulation(cc) {
            return (!!(cc.encapsulationFlags & EncapsulationFlags.Supervision)
                && !(cc instanceof SupervisionCCGet)
                && !(cc instanceof SupervisionCCReport));
        }
        /** Encapsulates a command that targets a specific endpoint */
        static encapsulate(cc, sessionId, requestStatusUpdates = true) {
            if (!cc.isSinglecast()) {
                throw new ZWaveError(`Supervision is only possible for singlecast commands!`, ZWaveErrorCodes.Argument_Invalid);
            }
            const ret = new SupervisionCCGet({
                nodeId: cc.nodeId,
                // Supervision CC is wrapped inside MultiChannel CCs, so the endpoint must be copied
                endpointIndex: cc.endpointIndex,
                encapsulated: cc,
                sessionId,
                requestStatusUpdates,
            });
            // Copy the encapsulation flags from the encapsulated command
            // but omit Supervision, since we're doing that right now
            ret.encapsulationFlags = cc.encapsulationFlags
                & ~EncapsulationFlags.Supervision;
            return ret;
        }
        /**
         * Given a CC instance, this returns the Supervision session ID which is used for this command.
         * Returns `undefined` when there is no session ID or the command was sent as multicast.
         */
        static getSessionId(command) {
            if (command.isEncapsulatedWith(CommandClasses.Supervision, SupervisionCommand.Get)) {
                const supervisionEncapsulation = command.getEncapsulatingCC(CommandClasses.Supervision, SupervisionCommand.Get);
                if (supervisionEncapsulation.frameType !== "broadcast"
                    && supervisionEncapsulation.frameType !== "multicast") {
                    return supervisionEncapsulation.sessionId;
                }
            }
        }
        /**
         * Returns whether a node supports the given CC with Supervision encapsulation.
         */
        static getCCSupportedWithSupervision(ctx, endpoint, ccId) {
            // By default assume supervision is supported for all CCs, unless we've remembered one not to be
            return (ctx
                .getValueDB(endpoint.nodeId)
                .getValue(SupervisionCCValues.ccSupported(ccId).endpoint(endpoint.index)) ?? true);
        }
        /**
         * Remembers whether a node supports the given CC with Supervision encapsulation.
         */
        static setCCSupportedWithSupervision(ctx, endpoint, ccId, supported) {
            ctx
                .getValueDB(endpoint.nodeId)
                .setValue(SupervisionCCValues.ccSupported(ccId).endpoint(endpoint.index), supported);
        }
        /** Returns whether this is a valid command to send supervised */
        static mayUseSupervision(ctx, command) {
            // Supervision may only be used for singlecast CCs that expect no response
            // The specs mention that Supervision CAN be used for S2 multicast, but conveniently fail to explain how to respond to that.
            if (!command.isSinglecast())
                return false;
            if (command.expectsCCResponse())
                return false;
            // with a valid node and endpoint
            const node = command.getNode(ctx);
            if (!node)
                return false;
            const endpoint = command.getEndpoint(ctx);
            if (!endpoint)
                return false;
            // and only if ...
            return (
            // ... the node supports it
            node.supportsCC(CommandClasses.Supervision)
                // ... the command is marked as "should use supervision"
                && shouldUseSupervision(command)
                // ... and we haven't previously determined that the node doesn't properly support it
                && SupervisionCC.getCCSupportedWithSupervision(ctx, endpoint, command.ccId));
        }
    };
    return SupervisionCC = _classThis;
})();
export { SupervisionCC };
let SupervisionCCReport = (() => {
    let _classDecorators = [CCCommand(SupervisionCommand.Report)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = SupervisionCC;
    var SupervisionCCReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SupervisionCCReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.moreUpdatesFollow = options.moreUpdatesFollow;
            this.requestWakeUpOnDemand = !!options.requestWakeUpOnDemand;
            this.sessionId = options.sessionId;
            this.status = options.status;
            if (options.status === SupervisionStatus.Working) {
                this.duration = options.duration;
            }
            else {
                this.duration = new Duration(0, "seconds");
            }
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 3);
            const moreUpdatesFollow = !!(raw.payload[0] & 0b1_0_000000);
            const requestWakeUpOnDemand = !!(raw.payload[0] & 0b0_1_000000);
            const sessionId = raw.payload[0] & 0b111111;
            const status = raw.payload[1];
            if (status === SupervisionStatus.Working) {
                const duration = Duration.parseReport(raw.payload[2])
                    ?? new Duration(0, "seconds");
                return new this({
                    nodeId: ctx.sourceNodeId,
                    moreUpdatesFollow,
                    requestWakeUpOnDemand,
                    sessionId,
                    status,
                    duration,
                });
            }
            else {
                return new this({
                    nodeId: ctx.sourceNodeId,
                    moreUpdatesFollow,
                    requestWakeUpOnDemand,
                    sessionId,
                    status,
                });
            }
        }
        moreUpdatesFollow;
        requestWakeUpOnDemand;
        sessionId;
        status;
        duration;
        serialize(ctx) {
            this.payload = Bytes.concat([
                Bytes.from([
                    (this.moreUpdatesFollow ? 0b1_0_000000 : 0)
                        | (this.requestWakeUpOnDemand ? 0b0_1_000000 : 0)
                        | (this.sessionId & 0b111111),
                    this.status,
                ]),
            ]);
            if (this.duration) {
                this.payload = Bytes.concat([
                    this.payload,
                    Bytes.from([this.duration.serializeReport()]),
                ]);
            }
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const message = {
                "session id": this.sessionId,
                "more updates follow": this.moreUpdatesFollow,
                status: getEnumMemberName(SupervisionStatus, this.status),
            };
            if (this.duration) {
                message.duration = this.duration.toString();
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
        toSupervisionResult() {
            if (this.status === SupervisionStatus.Working) {
                return {
                    status: this.status,
                    remainingDuration: this.duration,
                };
            }
            else {
                return {
                    status: this.status,
                };
            }
        }
    };
    return SupervisionCCReport = _classThis;
})();
export { SupervisionCCReport };
function testResponseForSupervisionCCGet(sent, received) {
    return received.sessionId === sent.sessionId;
}
let SupervisionCCGet = (() => {
    let _classDecorators = [CCCommand(SupervisionCommand.Get), expectedCCResponse(SupervisionCCReport, testResponseForSupervisionCCGet)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = SupervisionCC;
    var SupervisionCCGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SupervisionCCGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.sessionId = options.sessionId;
            this.requestStatusUpdates = options.requestStatusUpdates;
            this.encapsulated = options.encapsulated;
            // Supervision is inside MultiChannel CCs, so the endpoint must be copied
            this.encapsulated.endpointIndex = this.endpointIndex;
            this.encapsulated.encapsulatingCC = this;
        }
        static async from(raw, ctx) {
            validatePayload(raw.payload.length >= 3);
            const requestStatusUpdates = !!(raw.payload[0] & 0b1_0_000000);
            const sessionId = raw.payload[0] & 0b111111;
            const encapsulated = await CommandClass.parse(raw.payload.subarray(2), ctx);
            return new this({
                nodeId: ctx.sourceNodeId,
                requestStatusUpdates,
                sessionId,
                encapsulated,
            });
        }
        requestStatusUpdates;
        sessionId;
        encapsulated;
        async serialize(ctx) {
            const encapCC = await this.encapsulated.serialize(ctx);
            this.payload = Bytes.concat([
                Bytes.from([
                    (this.requestStatusUpdates ? 0b10_000000 : 0)
                        | (this.sessionId & 0b111111),
                    encapCC.length,
                ]),
                encapCC,
            ]);
            return super.serialize(ctx);
        }
        computeEncapsulationOverhead() {
            // Supervision CC adds two bytes (control byte + cc length)
            return super.computeEncapsulationOverhead() + 2;
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "session id": this.sessionId,
                    "request updates": this.requestStatusUpdates,
                },
            };
        }
    };
    return SupervisionCCGet = _classThis;
})();
export { SupervisionCCGet };
//# sourceMappingURL=SupervisionCC.js.map