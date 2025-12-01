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
import { CRC16_CCITT, CommandClasses, ZWaveError, ZWaveErrorCodes, validatePayload, } from "@zwave-js/core";
import { Bytes, buffer2hex } from "@zwave-js/shared";
import { CommandClass } from "../lib/CommandClass.js";
import { CCCommand, commandClass, implementedVersion, } from "../lib/CommandClassDecorators.js";
import { TransportServiceCommand } from "../lib/_Types.js";
export const MAX_SEGMENT_SIZE = 39;
export const RELAXED_TIMING_THRESHOLD = 2;
// TODO: Figure out how we know if communicating with R2 or R3
/** @publicAPI */
export const TransportServiceTimeouts = {
    /** Waiting time before requesting a missing segment at data rate R2 */
    requestMissingSegmentR2: 800,
    /** Waiting time before requesting a missing segment at data rate R3 */
    requestMissingSegmentR3: 400,
    /** Waiting time before sending another datagram at data rate R2 */
    segmentCompleteR2: 1000,
    /** Waiting time before sending another datagram at data rate R3 */
    segmentCompleteR3: 500,
    /** Waiting time between segments when sending more than {@link RELAXED_TIMING_THRESHOLD} segments at data rate R2 */
    relaxedTimingDelayR2: 35,
    /** Waiting time between segments when sending more than {@link RELAXED_TIMING_THRESHOLD} segments at data rate R3 */
    relaxedTimingDelayR3: 15,
};
let TransportServiceCC = (() => {
    let _classDecorators = [commandClass(CommandClasses["Transport Service"]), implementedVersion(2)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var TransportServiceCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            TransportServiceCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return TransportServiceCC = _classThis;
})();
export { TransportServiceCC };
/** @publicAPI */
export function isTransportServiceEncapsulation(command) {
    return (command.ccId === CommandClasses["Transport Service"]
        && (command.ccCommand === TransportServiceCommand.FirstSegment
            || command.ccCommand === TransportServiceCommand.SubsequentSegment));
}
let TransportServiceCCFirstSegment = (() => {
    let _classDecorators = [CCCommand(TransportServiceCommand.FirstSegment)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = TransportServiceCC;
    var TransportServiceCCFirstSegment = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            TransportServiceCCFirstSegment = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.datagramSize = options.datagramSize;
            this.sessionId = options.sessionId;
            this.headerExtension = options.headerExtension;
            this.partialDatagram = options.partialDatagram;
        }
        static from(raw, ctx) {
            // Deserialization has already split the datagram size from the ccCommand.
            // Therefore we have one more payload byte
            validatePayload(raw.payload.length >= 6); // 2 bytes dgram size, 1 byte sessid/ext, 1+ bytes payload, 2 bytes checksum
            // Verify the CRC
            const headerBuffer = Bytes.from([
                CommandClasses["Transport Service"],
                TransportServiceCommand.FirstSegment | raw.payload[0],
            ]);
            const ccBuffer = raw.payload.subarray(1, -2);
            let expectedCRC = CRC16_CCITT(headerBuffer);
            expectedCRC = CRC16_CCITT(ccBuffer, expectedCRC);
            const actualCRC = raw.payload.readUInt16BE(raw.payload.length - 2);
            validatePayload(expectedCRC === actualCRC);
            const datagramSize = raw.payload.readUInt16BE(0);
            const sessionId = raw.payload[2] >>> 4;
            let payloadOffset = 3;
            // If there is a header extension, read it
            const hasHeaderExtension = !!(raw.payload[2] & 0b1000);
            let headerExtension;
            if (hasHeaderExtension) {
                const extLength = raw.payload[3];
                headerExtension = raw.payload.subarray(4, 4 + extLength);
                payloadOffset += 1 + extLength;
            }
            const partialDatagram = raw.payload.subarray(payloadOffset, -2);
            // A node supporting the Transport Service Command Class, version 2
            // MUST NOT send Transport Service segments with the Payload field longer than 39 bytes.
            validatePayload(partialDatagram.length <= MAX_SEGMENT_SIZE);
            return new this({
                nodeId: ctx.sourceNodeId,
                datagramSize,
                sessionId,
                headerExtension,
                partialDatagram,
            });
        }
        datagramSize;
        sessionId;
        headerExtension;
        partialDatagram;
        encapsulated;
        serialize(ctx) {
            // Transport Service re-uses the lower 3 bits of the ccCommand as payload
            this.ccCommand = (this.ccCommand & 0b11111_000)
                | ((this.datagramSize >>> 8) & 0b111);
            const ext = !!this.headerExtension && this.headerExtension.length >= 1;
            this.payload = Bytes.from([
                this.datagramSize & 0xff,
                ((this.sessionId & 0b1111) << 4) | (ext ? 0b1000 : 0),
            ]);
            if (ext) {
                this.payload = Bytes.concat([
                    this.payload,
                    Bytes.from([this.headerExtension.length]),
                    this.headerExtension,
                ]);
            }
            this.payload = Bytes.concat([
                this.payload,
                this.partialDatagram,
                Bytes.alloc(2, 0), // checksum
            ]);
            // Compute and save the CRC16 in the payload
            // The CC header is included in the CRC computation
            const headerBuffer = Bytes.from([this.ccId, this.ccCommand]);
            let crc = CRC16_CCITT(headerBuffer);
            crc = CRC16_CCITT(this.payload.subarray(0, -2), crc);
            // Write the checksum into the last two bytes of the payload
            this.payload.writeUInt16BE(crc, this.payload.length - 2);
            return super.serialize(ctx);
        }
        expectMoreMessages() {
            return true; // The FirstSegment message always expects more messages
        }
        getPartialCCSessionId() {
            // Only use the session ID to identify the session, not the CC command
            return { ccCommand: undefined, sessionId: this.sessionId };
        }
        computeEncapsulationOverhead() {
            // Transport Service CC (first segment) adds 1 byte datagram size, 1 byte Session ID/..., 2 bytes checksum and (0 OR n+1) bytes header extension
            return (super.computeEncapsulationOverhead()
                + 4
                + (this.headerExtension?.length
                    ? 1 + this.headerExtension.length
                    : 0));
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "session ID": this.sessionId,
                    "datagram size": this.datagramSize,
                    "byte range": `0...${this.partialDatagram.length - 1}`,
                    payload: buffer2hex(this.partialDatagram),
                },
            };
        }
    };
    return TransportServiceCCFirstSegment = _classThis;
})();
export { TransportServiceCCFirstSegment };
let TransportServiceCCSubsequentSegment = (() => {
    let _classDecorators = [CCCommand(TransportServiceCommand.SubsequentSegment)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = TransportServiceCC;
    var TransportServiceCCSubsequentSegment = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            TransportServiceCCSubsequentSegment = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.datagramSize = options.datagramSize;
            this.datagramOffset = options.datagramOffset;
            this.sessionId = options.sessionId;
            this.headerExtension = options.headerExtension;
            this.partialDatagram = options.partialDatagram;
        }
        static from(raw, ctx) {
            // Deserialization has already split the datagram size from the ccCommand.
            // Therefore we have one more payload byte
            validatePayload(raw.payload.length >= 7); // 2 bytes dgram size, 1 byte sessid/ext/offset, 1 byte offset, 1+ bytes payload, 2 bytes checksum
            // Verify the CRC
            const headerBuffer = Bytes.from([
                CommandClasses["Transport Service"],
                TransportServiceCommand.SubsequentSegment | raw.payload[0],
            ]);
            const ccBuffer = raw.payload.subarray(1, -2);
            let expectedCRC = CRC16_CCITT(headerBuffer);
            expectedCRC = CRC16_CCITT(ccBuffer, expectedCRC);
            const actualCRC = raw.payload.readUInt16BE(raw.payload.length - 2);
            validatePayload(expectedCRC === actualCRC);
            const datagramSize = raw.payload.readUInt16BE(0);
            const sessionId = raw.payload[2] >>> 4;
            const datagramOffset = ((raw.payload[2] & 0b111) << 8)
                + raw.payload[3];
            let payloadOffset = 4;
            // If there is a header extension, read it
            const hasHeaderExtension = !!(raw.payload[2] & 0b1000);
            let headerExtension;
            if (hasHeaderExtension) {
                const extLength = raw.payload[4];
                headerExtension = raw.payload.subarray(5, 5 + extLength);
                payloadOffset += 1 + extLength;
            }
            const partialDatagram = raw.payload.subarray(payloadOffset, -2);
            // A node supporting the Transport Service Command Class, version 2
            // MUST NOT send Transport Service segments with the Payload field longer than 39 bytes.
            validatePayload(partialDatagram.length <= MAX_SEGMENT_SIZE);
            return new this({
                nodeId: ctx.sourceNodeId,
                datagramSize,
                sessionId,
                datagramOffset,
                headerExtension,
                partialDatagram,
            });
        }
        datagramSize;
        datagramOffset;
        sessionId;
        headerExtension;
        partialDatagram;
        // This can only be received
        _encapsulated;
        get encapsulated() {
            return this._encapsulated;
        }
        expectMoreMessages(session) {
            if (!(session[0] instanceof TransportServiceCCFirstSegment)) {
                // First segment is missing
                return true;
            }
            const datagramSize = session[0].datagramSize;
            const receivedBytes = new Array(datagramSize).fill(false);
            for (const segment of [...session, this]) {
                const offset = segment instanceof TransportServiceCCFirstSegment
                    ? 0
                    : segment.datagramOffset;
                for (let i = offset; i <= offset + segment.partialDatagram.length; i++) {
                    receivedBytes[i] = true;
                }
            }
            // Expect more messages as long as we haven't received everything
            return receivedBytes.includes(false);
        }
        getPartialCCSessionId() {
            // Only use the session ID to identify the session, not the CC command
            return { ccCommand: undefined, sessionId: this.sessionId };
        }
        async mergePartialCCs(partials, ctx) {
            // Concat the CC buffers
            const datagram = new Bytes(this.datagramSize);
            for (const partial of [...partials, this]) {
                // Ensure that we don't try to write out-of-bounds
                const offset = partial instanceof TransportServiceCCFirstSegment
                    ? 0
                    : partial.datagramOffset;
                if (offset + partial.partialDatagram.length > datagram.length) {
                    throw new ZWaveError(`The partial datagram offset and length in a segment are not compatible to the communicated datagram length`, ZWaveErrorCodes.PacketFormat_InvalidPayload);
                }
                datagram.set(partial.partialDatagram, offset);
            }
            // and deserialize the CC
            this._encapsulated = await CommandClass.parse(datagram, ctx);
            this._encapsulated.encapsulatingCC = this;
        }
        serialize(ctx) {
            // Transport Service re-uses the lower 3 bits of the ccCommand as payload
            this.ccCommand = (this.ccCommand & 0b11111_000)
                | ((this.datagramSize >>> 8) & 0b111);
            const ext = !!this.headerExtension && this.headerExtension.length >= 1;
            this.payload = Bytes.from([
                this.datagramSize & 0xff,
                ((this.sessionId & 0b1111) << 4)
                    | (ext ? 0b1000 : 0)
                    | ((this.datagramOffset >>> 8) & 0b111),
                this.datagramOffset & 0xff,
            ]);
            if (ext) {
                this.payload = Bytes.concat([
                    this.payload,
                    Bytes.from([this.headerExtension.length]),
                    this.headerExtension,
                ]);
            }
            this.payload = Bytes.concat([
                this.payload,
                this.partialDatagram,
                Bytes.alloc(2, 0), // checksum
            ]);
            // Compute and save the CRC16 in the payload
            // The CC header is included in the CRC computation
            const headerBuffer = Bytes.from([this.ccId, this.ccCommand]);
            let crc = CRC16_CCITT(headerBuffer);
            crc = CRC16_CCITT(this.payload.subarray(0, -2), crc);
            // Write the checksum into the last two bytes of the payload
            this.payload.writeUInt16BE(crc, this.payload.length - 2);
            return super.serialize(ctx);
        }
        computeEncapsulationOverhead() {
            // Transport Service CC (first segment) adds 1 byte datagram size, 1 byte Session ID/..., 1 byte offset, 2 bytes checksum and (0 OR n+1) bytes header extension
            return (super.computeEncapsulationOverhead()
                + 5
                + (this.headerExtension?.length
                    ? 1 + this.headerExtension.length
                    : 0));
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "session ID": this.sessionId,
                    "datagram size": this.datagramSize,
                    "byte range": `${this.datagramOffset}...${this.datagramOffset + this.partialDatagram.length - 1}`,
                    payload: buffer2hex(this.partialDatagram),
                },
            };
        }
    };
    return TransportServiceCCSubsequentSegment = _classThis;
})();
export { TransportServiceCCSubsequentSegment };
let TransportServiceCCSegmentRequest = (() => {
    let _classDecorators = [CCCommand(TransportServiceCommand.SegmentRequest)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = TransportServiceCC;
    var TransportServiceCCSegmentRequest = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            TransportServiceCCSegmentRequest = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.sessionId = options.sessionId;
            this.datagramOffset = options.datagramOffset;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 3);
            const sessionId = raw.payload[1] >>> 4;
            const datagramOffset = ((raw.payload[1] & 0b111) << 8)
                + raw.payload[2];
            return new this({
                nodeId: ctx.sourceNodeId,
                sessionId,
                datagramOffset,
            });
        }
        sessionId;
        datagramOffset;
        serialize(ctx) {
            this.payload = Bytes.from([
                ((this.sessionId & 0b1111) << 4)
                    | ((this.datagramOffset >>> 8) & 0b111),
                this.datagramOffset & 0xff,
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "session ID": this.sessionId,
                    offset: this.datagramOffset,
                },
            };
        }
    };
    return TransportServiceCCSegmentRequest = _classThis;
})();
export { TransportServiceCCSegmentRequest };
let TransportServiceCCSegmentComplete = (() => {
    let _classDecorators = [CCCommand(TransportServiceCommand.SegmentComplete)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = TransportServiceCC;
    var TransportServiceCCSegmentComplete = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            TransportServiceCCSegmentComplete = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.sessionId = options.sessionId;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const sessionId = raw.payload[1] >>> 4;
            return new this({
                nodeId: ctx.sourceNodeId,
                sessionId,
            });
        }
        sessionId;
        serialize(ctx) {
            this.payload = Bytes.from([(this.sessionId & 0b1111) << 4]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: { "session ID": this.sessionId },
            };
        }
    };
    return TransportServiceCCSegmentComplete = _classThis;
})();
export { TransportServiceCCSegmentComplete };
let TransportServiceCCSegmentWait = (() => {
    let _classDecorators = [CCCommand(TransportServiceCommand.SegmentWait)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = TransportServiceCC;
    var TransportServiceCCSegmentWait = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            TransportServiceCCSegmentWait = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.pendingSegments = options.pendingSegments;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const pendingSegments = raw.payload[1];
            return new this({
                nodeId: ctx.sourceNodeId,
                pendingSegments,
            });
        }
        pendingSegments;
        serialize(ctx) {
            this.payload = Bytes.from([this.pendingSegments]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: { "pending segments": this.pendingSegments },
            };
        }
    };
    return TransportServiceCCSegmentWait = _classThis;
})();
export { TransportServiceCCSegmentWait };
//# sourceMappingURL=TransportServiceCC.js.map