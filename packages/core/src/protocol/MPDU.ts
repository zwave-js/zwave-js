import { Bytes, buffer2hex } from "@zwave-js/shared";
import { BeamingInfo, MPDUHeaderType } from "../definitions/Frame.js";
import {
	ProtocolDataRate,
	ProtocolHeaderFormat,
	getProtocolHeaderFormat,
	protocolDataRateToString,
	rfRegionToRadioProtocolMode,
} from "../definitions/Protocol.js";
import { type RFRegion } from "../definitions/RFRegion.js";
import { type RSSI, parseRSSI, rssiToString } from "../definitions/RSSI.js";
import { ZWaveError, ZWaveErrorCodes } from "../index_browser.js";
import { type MessageOrCCLogEntry, type MessageRecord } from "../log/shared.js";
import { validatePayload } from "../util/misc.js";
import { encodeNodeBitMask, parseBitMask } from "../values/Primitive.js";
import { ExplorerFrameCommand } from "./_Types.js";
import { formatNodeId, formatRoute } from "./utils.js";

export interface MPDUOptions {
	homeId: number;
	sourceNodeId: number;
	ackRequested: boolean;
	headerType: MPDUHeaderType;
	sequenceNumber: number;
	payload?: Uint8Array;
}

/** Common information shared by all MPDUs */
export abstract class MPDU {
	protected constructor(options: MPDUOptions) {
		this.homeId = options.homeId;
		this.sourceNodeId = options.sourceNodeId;
		this.ackRequested = options.ackRequested;
		this.headerType = options.headerType;
		this.sequenceNumber = options.sequenceNumber;
		this.payload = Bytes.view(options.payload ?? new Uint8Array());
	}

	public homeId: number;
	public sourceNodeId: number;
	public ackRequested: boolean;
	public headerType: MPDUHeaderType;
	public sequenceNumber: number;
	public payload: Bytes;

	public static parse(
		data: Bytes,
		ctx: MPDUParsingContext,
	): MPDU {
		if (ctx.channel <= 2) {
			// Channels 0-2 are Z-Wave classic
			const raw = ZWaveMPDURaw.parse(data, ctx);
			switch (raw.headerType) {
				case MPDUHeaderType.Singlecast:
					return SinglecastZWaveMPDU.from(raw, ctx);
				case MPDUHeaderType.Multicast:
					return MulticastZWaveMPDU.from(raw, ctx);
				case MPDUHeaderType.Acknowledgement:
					return AckZWaveMPDU.from(raw, ctx);
				case MPDUHeaderType.Explorer: {
					// Figure out the correct subtype for explorer frames
					const explorerRaw = ExplorerZWaveMPDURaw.from(raw, ctx);
					switch (explorerRaw.command) {
						case ExplorerFrameCommand.Normal:
							return NormalExplorerZWaveMPDU.from(
								explorerRaw,
								ctx,
							);
						case ExplorerFrameCommand.InclusionRequest:
							return InclusionRequestExplorerZWaveMPDU.from(
								explorerRaw,
								ctx,
							);
						case ExplorerFrameCommand.SearchResult:
							return SearchResultExplorerZWaveMPDU.from(
								explorerRaw,
								ctx,
							);
						default:
							validatePayload.fail(
								// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
								`Unsupported explorer frame command ${explorerRaw.command}.`,
							);
					}
				}
				case MPDUHeaderType.Routed:
					return RoutedZWaveMPDU.from(raw, ctx);
			}
			validatePayload.fail(
				// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
				`Unsupported MPDU header type ${raw.headerType}.`,
			);
		}

		if (ctx.channel <= 4) {
			// Channels 3-4 are Long Range
			const raw = LongRangeMPDURaw.parse(data, ctx);
			switch (raw.headerType) {
				case MPDUHeaderType.Singlecast:
					return SinglecastLongRangeMPDU.from(raw, ctx);
				case MPDUHeaderType.Acknowledgement:
					return AckLongRangeMPDU.from(raw, ctx);
				default:
					validatePayload.fail(
						`Unsupported Long Range MPDU header type ${raw.headerType}`,
					);
			}
		}

		validatePayload.fail(
			`Unsupported channel ${ctx.channel}. MPDU payload: ${
				buffer2hex(data)
			}`,
		);
	}

	public serialize(_ctx: MPDUEncodingContext): Bytes {
		return this.payload;
	}

	public abstract toLogEntry(ctx: MPDULogContext): MessageOrCCLogEntry;
}

export interface MPDUParsingContext {
	channel: number;
	region: RFRegion;
	protocolDataRate: ProtocolDataRate;
}

export type MPDUEncodingContext = MPDUParsingContext;
export interface MPDULogContext extends MPDUParsingContext {
	rssi?: RSSI;
	rssiRaw?: number;
}

export interface ZWaveMPDURawOptions {
	homeId: number;
	sourceNodeId: number;
	ackRequested: boolean;
	headerType: MPDUHeaderType;
	sequenceNumber: number;
	routed: boolean;
	lowPower: boolean;
	speedModified: boolean;
	beamingInfo: BeamingInfo;
	payload: Bytes;
}

export class ZWaveMPDURaw {
	public constructor(options: ZWaveMPDURawOptions) {
		this.homeId = options.homeId;
		this.sourceNodeId = options.sourceNodeId;
		this.ackRequested = options.ackRequested;
		this.headerType = options.headerType;
		this.sequenceNumber = options.sequenceNumber;
		this.routed = options.routed;
		this.lowPower = options.lowPower;
		this.speedModified = options.speedModified;
		this.beamingInfo = options.beamingInfo;
		this.payload = options.payload;
	}

	public static parse(
		data: Bytes,
		ctx: MPDUParsingContext,
	): ZWaveMPDURaw {
		// FIXME: Parse Beams

		const homeId = data.readUInt32BE(0);
		const sourceNodeId = data[4];
		const frameControl = data.subarray(5, 7);
		let payloadOffset = 8;

		let ackRequested: boolean;
		let headerType: MPDUHeaderType;
		let sequenceNumber: number;
		let routed: boolean;
		let lowPower: boolean;
		let speedModified: boolean;
		let beamingInfo: BeamingInfo;

		const headerFormat = getProtocolHeaderFormat(
			rfRegionToRadioProtocolMode(ctx.region),
			ctx.channel,
		);
		switch (headerFormat) {
			case ProtocolHeaderFormat.Classic2Channel: {
				routed = !!(frameControl[0] & 0b1000_0000);
				ackRequested = !!(frameControl[0] & 0b0100_0000);
				lowPower = !!(frameControl[0] & 0b0010_0000);
				speedModified = !!(frameControl[0] & 0b0001_0000);
				headerType = frameControl[0] & 0b0000_1111;
				beamingInfo = (frameControl[1] & 0b0110_0000) >>> 5;
				sequenceNumber = frameControl[1] & 0b0000_1111;
				break;
			}
			case ProtocolHeaderFormat.Classic3Channel: {
				routed = false;
				ackRequested = !!(frameControl[0] & 0b1000_0000);
				lowPower = !!(frameControl[0] & 0b0100_0000);
				speedModified = false;
				headerType = frameControl[0] & 0b0000_1111;
				beamingInfo = (frameControl[1] & 0b0111_0000) >>> 4;
				sequenceNumber = data[payloadOffset++];
			}
			default: {
				validatePayload.fail(
					`Unsupported combination of region (${ctx.region}) and channel (${ctx.channel}) for ZWaveMPDU.`,
				);
			}
		}

		const payload = data.subarray(payloadOffset);
		return new ZWaveMPDURaw({
			homeId,
			sourceNodeId,
			ackRequested,
			headerType,
			sequenceNumber,
			routed,
			lowPower,
			speedModified,
			beamingInfo,
			payload,
		});
	}

	public homeId: number;
	public sourceNodeId: number;
	public ackRequested: boolean;
	public headerType: MPDUHeaderType;
	public sequenceNumber: number;
	public routed: boolean;
	public lowPower: boolean;
	public speedModified: boolean;
	public beamingInfo: BeamingInfo;
	public payload: Bytes;
}

export interface ZWaveMPDUOptions extends MPDUOptions {
	routed: boolean;
	lowPower?: boolean;
	speedModified?: boolean;
	beamingInfo?: BeamingInfo;
}

export class ZWaveMPDU extends MPDU {
	public constructor(options: ZWaveMPDUOptions) {
		super(options);
		this.routed = options.routed;
		this.lowPower = options.lowPower ?? false;
		this.speedModified = options.speedModified ?? false;
		this.beamingInfo = options.beamingInfo ?? BeamingInfo.None;
	}

	public routed: boolean;
	public lowPower: boolean;
	public speedModified: boolean;
	public beamingInfo: BeamingInfo;

	public serialize(ctx: MPDUEncodingContext): Bytes {
		let payload: Bytes;

		const headerFormat = getProtocolHeaderFormat(
			rfRegionToRadioProtocolMode(ctx.region),
			ctx.channel,
		);
		switch (headerFormat) {
			case ProtocolHeaderFormat.Classic2Channel: {
				const frameControl0 = (this.routed ? 0b1000_0000 : 0)
					| (this.ackRequested ? 0b0100_0000 : 0)
					| (this.lowPower ? 0b0010_0000 : 0)
					| (this.speedModified ? 0b0001_0000 : 0)
					| (this.headerType & 0b0000_1111);
				const frameControl1 = ((this.beamingInfo << 5) & 0b0110_0000)
					| (this.sequenceNumber & 0b0000_1111);

				payload = new Bytes(8);
				payload[5] = frameControl0;
				payload[6] = frameControl1;
				break;
			}
			case ProtocolHeaderFormat.Classic3Channel: {
				const frameControl0 = (this.ackRequested ? 0b1000_0000 : 0)
					| (this.lowPower ? 0b0100_0000 : 0)
					| (this.headerType & 0b0000_1111);
				const frameControl1 = (this.beamingInfo << 4) & 0b0111_0000;

				payload = new Bytes(9);
				payload[5] = frameControl0;
				payload[6] = frameControl1;
				payload[7] = this.sequenceNumber;
			}
			default: {
				throw new ZWaveError(
					`Unsupported combination of region (${ctx.region}) and channel (${ctx.channel}) for ZWaveMPDU.`,
					ZWaveErrorCodes.Argument_Invalid,
				);
			}
		}

		payload.writeUInt32BE(this.homeId, 0);
		payload[4] = this.sourceNodeId;
		// The length spans the entire MPDU, payload and the checksum (1 or 2 bytes)
		const length = payload.length
			+ this.payload.length
			+ (ctx.protocolDataRate < ProtocolDataRate.ZWave_100k ? 1 : 2);
		payload[payload.length - 1] = length;

		this.payload = Bytes.concat([
			payload,
			this.payload,
		]);

		return super.serialize(ctx);
	}

	public toLogEntry(ctx: MPDULogContext): MessageOrCCLogEntry {
		const tags = [formatNodeId(this.sourceNodeId)];

		const message: MessageRecord = {
			"sequence no.": this.sequenceNumber,
			channel: ctx.channel,
			"protocol/data rate": protocolDataRateToString(ctx.protocolDataRate)
				+ (this.speedModified ? " (reduced)" : ""),
		};
		if (ctx.rssi != undefined) {
			message.RSSI = rssiToString(ctx.rssi);
		} else if (ctx.rssiRaw != undefined) {
			message.RSSI = ctx.rssiRaw.toString();
		}

		return {
			tags,
			message,
		};
	}
}

export interface SinglecastZWaveMPDUOptions
	extends Omit<ZWaveMPDUOptions, "routed" | "headerType">
{
	destinationNodeId: number;
}

export class SinglecastZWaveMPDU extends ZWaveMPDU {
	public constructor(options: SinglecastZWaveMPDUOptions) {
		super({
			...options,
			routed: false,
			headerType: MPDUHeaderType.Singlecast,
		});
		this.destinationNodeId = options.destinationNodeId;
	}

	public static from(
		raw: ZWaveMPDURaw,
		_ctx: MPDUParsingContext,
	): SinglecastZWaveMPDU {
		const destinationNodeId = raw.payload[0];
		const payload = raw.payload.subarray(1);

		return new this({
			...raw,
			destinationNodeId,
			payload,
		});
	}

	public readonly destinationNodeId: number;

	public serialize(ctx: MPDUEncodingContext): Bytes {
		this.payload = Bytes.concat([
			[this.destinationNodeId],
			this.payload,
		]);
		return super.serialize(ctx);
	}

	public toLogEntry(ctx: MPDULogContext): MessageOrCCLogEntry {
		const { tags, message: original } = super.toLogEntry(ctx);
		tags[0] = formatRoute(
			this.sourceNodeId,
			[],
			this.destinationNodeId,
			// Singlecast frames do not contain a bit for this, we consider them all "outbound"
			"outbound",
			0,
		);

		const message: MessageRecord = {
			...original,
			"ack requested": this.ackRequested,
			payload: buffer2hex(this.payload),
		};
		return {
			tags,
			message,
		};
	}
}

export interface AckZWaveMPDUOptions
	extends Omit<ZWaveMPDUOptions, "routed" | "headerType" | "ackRequested">
{
	destinationNodeId: number;
}

export class AckZWaveMPDU extends ZWaveMPDU {
	public constructor(options: AckZWaveMPDUOptions) {
		super({
			...options,
			headerType: MPDUHeaderType.Acknowledgement,
			routed: false,
			ackRequested: false,
		});
		this.destinationNodeId = options.destinationNodeId;
	}

	public static from(
		raw: ZWaveMPDURaw,
		_ctx: MPDUParsingContext,
	): AckZWaveMPDU {
		const destinationNodeId = raw.payload[0];

		return new this({
			...raw,
			destinationNodeId,
			payload: undefined,
		});
	}

	public readonly destinationNodeId: number;

	public serialize(ctx: MPDUEncodingContext): Bytes {
		this.payload = Bytes.from([this.destinationNodeId]);
		return super.serialize(ctx);
	}

	public toLogEntry(ctx: MPDULogContext): MessageOrCCLogEntry {
		const { tags, message } = super.toLogEntry(ctx);
		tags[0] = formatRoute(
			this.sourceNodeId,
			[],
			this.destinationNodeId,
			// ACK frames do not contain a bit for this, we consider them all "inbound"
			"inbound",
			0,
		);
		tags.unshift("ACK");

		return {
			tags,
			message,
		};
	}
}

export interface RoutedZWaveMPDUOptions extends ZWaveMPDUOptions {
	destinationNodeId: number;
	direction: "outbound" | "inbound";
	routedAck: boolean;
	routedError: boolean;
	failedHop?: number;
	hop: number;
	repeaters: readonly number[];
	destinationWakeup?: boolean;
	destinationWakeupType?: "250ms" | "1000ms";
	repeaterRSSI?: readonly RSSI[];
}

export class RoutedZWaveMPDU extends ZWaveMPDU {
	public constructor(options: RoutedZWaveMPDUOptions) {
		super(options);

		this.destinationNodeId = options.destinationNodeId;
		this.direction = options.direction;
		this.routedAck = options.routedAck;
		this.routedError = options.routedError;
		this.failedHop = options.failedHop;
		this.hop = options.hop;
		this.repeaters = options.repeaters;
		this.destinationWakeup = options.destinationWakeup;
		this.destinationWakeupType = options.destinationWakeupType;
		this.repeaterRSSI = options.repeaterRSSI;
	}

	public static from(
		raw: ZWaveMPDURaw,
		ctx: MPDUParsingContext,
	): RoutedZWaveMPDU {
		const headerFormat = getProtocolHeaderFormat(
			rfRegionToRadioProtocolMode(ctx.region),
			ctx.channel,
		);

		// The destination is technically part of the MAC header, but it makes much
		// more sense to handle it here
		const destinationNodeId = raw.payload[0];

		const direction = (raw.payload[1] & 0b1) ? "inbound" : "outbound";
		const routedAck = !!(raw.payload[1] & 0b10);
		const routedError = !!(raw.payload[1] & 0b100);
		const hasExtendedHeader = !!(raw.payload[1] & 0b1000);
		let failedHop: number | undefined;
		let speedModified = raw.speedModified;
		if (routedError) {
			failedHop = raw.payload[1] >>> 4;
		} else if (headerFormat === ProtocolHeaderFormat.Classic2Channel) {
			speedModified = !!(raw.payload[1] & 0b10000);
		}

		let hop = raw.payload[2] & 0b1111;
		// The hop field in the MPDU indicates which repeater should handle the frame next.
		// This means that for an inbound frame between repeater 0 and 1, the value is one
		// less (0) than for an outbound frame (1). This also means that the field overflows
		// to 0x0f when the frame returns to the source node.
		//
		// We normalize this, so hop = 0 always means the frame is transmitted between the source node and repeater 0.
		if (direction === "inbound") {
			hop = (hop + 1) % 16;
		}

		const numRepeaters = raw.payload[2] >>> 4;
		const repeaters = [...raw.payload.subarray(3, 3 + numRepeaters)];

		let offset = 3 + numRepeaters;
		let destinationWakeup: boolean | undefined;
		if (headerFormat === ProtocolHeaderFormat.Classic3Channel) {
			destinationWakeup = raw.payload[offset++] === 0x02;
		}

		let destinationWakeupType: "250ms" | "1000ms" | undefined;
		let repeaterRSSI: RSSI[] | undefined;
		if (hasExtendedHeader) {
			const headerPreamble = raw.payload[offset++];
			const headerLength = headerPreamble >>> 4;
			const headerType = headerPreamble & 0b1111;
			const header = raw.payload.subarray(offset, offset + headerLength);
			offset += headerLength;

			if (headerType === 0x00) {
				destinationWakeupType = header[0] & 0b0100_0000
					? "1000ms"
					: header[0] & 0b0010_0000
					? "250ms"
					: undefined;
			} else if (headerType === 0x01) {
				repeaterRSSI = [];
				for (let i = 0; i < numRepeaters; i++) {
					repeaterRSSI.push(parseRSSI(header, i));
				}
			}
		}

		const payload = raw.payload.subarray(offset);

		return new this({
			...raw,
			speedModified,
			destinationNodeId,
			direction,
			routedAck,
			routedError,
			failedHop,
			hop,
			repeaters,
			destinationWakeup,
			destinationWakeupType,
			repeaterRSSI,
			payload,
		});
	}

	public destinationNodeId: number;
	public direction: "outbound" | "inbound";
	public routedAck: boolean;
	public routedError: boolean;
	public failedHop?: number;
	public hop: number;
	public repeaters: readonly number[];
	public destinationWakeup?: boolean;
	public destinationWakeupType?: "250ms" | "1000ms";
	public repeaterRSSI?: readonly RSSI[];

	public serialize(ctx: MPDUEncodingContext): Bytes {
		const headerFormat = getProtocolHeaderFormat(
			rfRegionToRadioProtocolMode(ctx.region),
			ctx.channel,
		);

		const hasExtendedHeader =
			(headerFormat === ProtocolHeaderFormat.Classic2Channel
				&& this.destinationWakeupType != undefined)
			|| this.repeaterRSSI?.length;

		// Until the end of the repeater list, all channel configurations
		// are identical
		let payload = new Bytes(7);
		payload[0] = this.destinationNodeId;
		payload[1] = (this.direction === "inbound" ? 0b1 : 0)
			| (this.routedAck ? 0b10 : 0)
			| (this.routedError ? 0b100 : 0)
			| (hasExtendedHeader ? 0b1000 : 0);
		if (this.routedError && this.failedHop) {
			payload[1] |= this.failedHop << 4;
		}

		// The hop field in the MPDU indicates which repeater should handle the frame next.
		// This means that for an inbound frame between repeater 0 and 1, the value is one
		// less (0) than for an outbound frame (1). This also means that the field overflows
		// to 0x0f when the frame returns to the source node.
		//
		// When parsing, we normalize this, so hop = 0 always means the frame is transmitted between the source node and repeater 0.
		// This means we need to undo the normalization here
		const hop = this.direction === "inbound"
			? (this.hop - 1)
			: this.hop;
		payload[2] = ((this.repeaters.length & 0xf) << 4) | (hop & 0xf);
		for (let i = 0; i < 4; i++) {
			payload[3 + i] = this.repeaters[i] ?? 0;
		}

		// Add destination wakeup byte for channel configuration 3
		if (headerFormat === ProtocolHeaderFormat.Classic3Channel) {
			payload = Bytes.concat([
				payload,
				[this.destinationWakeup ? 0x02 : 0x00],
			]);
		}

		if (
			headerFormat === ProtocolHeaderFormat.Classic2Channel
			&& this.destinationWakeupType != undefined
		) {
			// Add destination wakeup header for other channel configurations
			const headerLength = 1;
			const headerType = 0x00;
			const headerBody = this.destinationWakeupType === "1000ms"
				? 0b0100_0000
				: 0b0010_0000; // 250ms
			payload = Bytes.concat([
				payload,
				[
					(headerLength << 4) | headerType,
					headerBody,
				],
			]);
		} else if (this.repeaterRSSI?.length) {
			// Add repeater RSSI header
			const headerLength = 4;
			const headerType = 0x01;
			const headerBody = new Bytes(4);
			for (let i = 0; i < headerBody.length; i++) {
				headerBody[i] = this.repeaterRSSI[i] ?? 0;
			}
			payload = Bytes.concat([
				payload,
				[(headerLength << 4) | headerType],
				headerBody,
			]);
		}

		// Include the actual payload
		this.payload = Bytes.concat([
			payload,
			this.payload,
		]);

		return super.serialize(ctx);
	}

	public toLogEntry(ctx: MPDULogContext): MessageOrCCLogEntry {
		const { tags, message: original } = super.toLogEntry(ctx);
		tags[0] = formatRoute(
			this.sourceNodeId,
			this.repeaters,
			this.destinationNodeId,
			this.direction,
			this.hop,
			this.failedHop,
		);

		const message: MessageRecord = {
			...original,
			"ack requested": this.ackRequested,
		};

		if (this.routedAck) {
			tags.unshift("R-ACK");
		} else {
			message.payload = buffer2hex(this.payload);
		}

		return {
			tags,
			message,
		};
	}
}

export interface MulticastZWaveMPDUOptions extends ZWaveMPDUOptions {
	destinationNodeIds: number[];
}

export class MulticastZWaveMPDU extends ZWaveMPDU {
	public constructor(options: MulticastZWaveMPDUOptions) {
		super(options);
		this.destinationNodeIds = options.destinationNodeIds;
	}

	public static from(
		raw: ZWaveMPDURaw,
		_ctx: MPDUParsingContext,
	): MulticastZWaveMPDU {
		// 3 bits offset, 5 bits mask length
		const control = raw.payload[0];
		const addressOffset = control >>> 5;
		const maskLength = control & 0b11111;
		const destinationMask = raw.payload.subarray(1, 1 + maskLength);
		const destinationNodeIds = parseBitMask(
			destinationMask,
			32 * addressOffset,
		);

		const payload = raw.payload.subarray(1 + maskLength);

		return new this({
			...raw,
			destinationNodeIds,
			payload,
		});
	}

	public destinationNodeIds: number[];

	public serialize(ctx: MPDUEncodingContext): Bytes {
		// ITU-T G.9959:
		// a sending node shall set the address offset field to zero
		// and the number of mask bytes field shall be set to 29
		const control = 29;
		const mask = encodeNodeBitMask(this.destinationNodeIds);
		this.payload = Bytes.concat([
			[control],
			mask,
			this.payload,
		]);

		return super.serialize(ctx);
	}

	public toLogEntry(ctx: MPDULogContext): MessageOrCCLogEntry {
		const { tags, message: original } = super.toLogEntry(ctx);
		tags.push("MULTICAST");

		const message: MessageRecord = {
			destinations: this.destinationNodeIds.join(", "),
			...original,
			payload: buffer2hex(this.payload),
		};
		return {
			tags,
			message,
		};
	}
}

export interface ExplorerZWaveMPDURawOptions extends ZWaveMPDURawOptions {
	destinationNodeId: number;
	version: number;
	command: ExplorerFrameCommand;
	stop: boolean;
	sourceRouted: boolean;
	direction: "outbound" | "inbound";
	randomTXInterval: number;
	ttl: number;
	repeaters: readonly number[];
	payload: Bytes;
}

export class ExplorerZWaveMPDURaw extends ZWaveMPDURaw {
	public constructor(options: ExplorerZWaveMPDURawOptions) {
		super(options);

		this.destinationNodeId = options.destinationNodeId;
		this.version = options.version;
		this.command = options.command;
		this.stop = options.stop;
		this.sourceRouted = options.sourceRouted;
		this.direction = options.direction;
		this.randomTXInterval = options.randomTXInterval;
		this.ttl = options.ttl;
		this.repeaters = options.repeaters;
		this.payload = options.payload;
	}

	public static from(
		parent: ZWaveMPDURaw,
		_ctx: MPDUParsingContext,
	): ExplorerZWaveMPDURaw {
		const destinationNodeId = parent.payload[0];

		const version = parent.payload[1] >>> 5;
		const command = parent.payload[1] & 0b0001_1111;
		const stop = !!(parent.payload[2] & 0b100);
		const direction = parent.payload[2] & 0b010 ? "inbound" : "outbound";
		const sourceRouted = !!(parent.payload[2] & 0b001);
		const randomTXInterval = parent.payload[3];
		const ttl = parent.payload[4] >>> 4;
		const numRepeaters = parent.payload[4] & 0b1111;
		const repeaters = [...parent.payload.subarray(5, 5 + numRepeaters)];
		const payload = parent.payload.subarray(9);

		return new this({
			...parent,
			destinationNodeId,
			version,
			command,
			stop,
			sourceRouted,
			direction,
			randomTXInterval,
			ttl,
			repeaters,
			payload,
		});
	}

	public destinationNodeId: number;
	public version: number;
	public command: ExplorerFrameCommand;
	public stop: boolean;
	public sourceRouted: boolean;
	public direction: "outbound" | "inbound";
	public randomTXInterval: number;
	public ttl: number;
	public repeaters: readonly number[];
	public payload: Bytes;
}

export interface ExplorerZWaveMPDUOptions extends ZWaveMPDUOptions {
	destinationNodeId: number;
	version: number;
	command: ExplorerFrameCommand;
	stop: boolean;
	sourceRouted: boolean;
	direction: "outbound" | "inbound";
	randomTXInterval: number;
	ttl: number;
	repeaters: readonly number[];
}

export class ExplorerZWaveMPDU extends ZWaveMPDU {
	public constructor(options: ExplorerZWaveMPDUOptions) {
		super(options);

		this.destinationNodeId = options.destinationNodeId;
		this.version = options.version;
		this.command = options.command;
		this.stop = options.stop;
		this.sourceRouted = options.sourceRouted;
		this.direction = options.direction;
		this.randomTXInterval = options.randomTXInterval;
		this.ttl = options.ttl;
		this.repeaters = options.repeaters;
	}

	public static from(
		raw: ExplorerZWaveMPDURaw,
		_ctx: MPDUParsingContext,
	): ExplorerZWaveMPDU {
		return new this({ ...raw });
	}

	public destinationNodeId: number;
	public version: number;
	public command: ExplorerFrameCommand;
	public stop: boolean;
	public sourceRouted: boolean;
	public direction: "outbound" | "inbound";
	public randomTXInterval: number;
	public ttl: number;
	public repeaters: readonly number[];

	public serialize(ctx: MPDUEncodingContext): Bytes {
		const payload = new Bytes(9);
		payload[0] = this.destinationNodeId;
		payload[1] = ((this.version & 0b111) << 5) | (this.command & 0b11111);
		payload[2] = (this.stop ? 0b100 : 0)
			| (this.direction === "inbound" ? 0b010 : 0)
			| (this.sourceRouted ? 0b001 : 0);
		payload[3] = this.randomTXInterval;
		payload[4] = ((this.ttl & 0b1111) << 4)
			| (this.repeaters.length & 0b1111);
		for (let i = 0; i < 4; i++) {
			payload[5 + i] = this.repeaters[i] ?? 0;
		}

		this.payload = Bytes.concat([
			payload,
			this.payload,
		]);

		return super.serialize(ctx);
	}
}

export class NormalExplorerZWaveMPDU extends ExplorerZWaveMPDU {
	public toLogEntry(ctx: MPDULogContext): MessageOrCCLogEntry {
		const { tags, message: original } = super.toLogEntry(ctx);
		tags[0] = formatRoute(
			this.sourceNodeId,
			this.repeaters,
			this.destinationNodeId,
			// Explorer frames do not contain a bit for the direction, we consider them all "outbound"
			"outbound",
			4 - this.ttl,
		);
		tags.unshift("EXPLORER");

		const message: MessageRecord = {
			...original,
			"ack requested": this.ackRequested,
			payload: buffer2hex(this.payload),
		};
		return {
			tags,
			message,
		};
	}
}

export interface InclusionRequestExplorerZWaveMPDUOptions
	extends ExplorerZWaveMPDUOptions
{
	networkHomeId: number;
}

export class InclusionRequestExplorerZWaveMPDU extends ExplorerZWaveMPDU {
	public constructor(options: InclusionRequestExplorerZWaveMPDUOptions) {
		super(options);
		this.networkHomeId = options.networkHomeId;
	}

	public static from(
		raw: ExplorerZWaveMPDURaw,
		_ctx: MPDUParsingContext,
	): InclusionRequestExplorerZWaveMPDU {
		const networkHomeId = raw.payload.readUInt32BE(0);
		const payload = raw.payload.subarray(4);

		return new this({
			...raw,
			networkHomeId,
			payload,
		});
	}

	/** The home ID of the repeating node */
	public readonly networkHomeId: number;

	public serialize(ctx: MPDUEncodingContext): Bytes {
		const homeId = new Bytes(4);
		homeId.writeUInt32BE(this.networkHomeId, 0);

		this.payload = Bytes.concat([
			homeId,
			this.payload,
		]);
		return super.serialize(ctx);
	}

	public toLogEntry(ctx: MPDULogContext): MessageOrCCLogEntry {
		const { tags, message: original } = super.toLogEntry(ctx);
		tags[0] = formatRoute(
			this.sourceNodeId,
			this.repeaters,
			this.destinationNodeId,
			// Explorer frames do not contain a bit for the direction, we consider them all "outbound"
			"outbound",
			4 - this.ttl,
		);
		tags.unshift("INCL REQUEST");

		const message: MessageRecord = {
			...original,
			"network home ID": this.networkHomeId.toString(16).padStart(
				8,
				"0",
			),
			payload: buffer2hex(this.payload),
		};
		return {
			tags,
			message,
		};
	}
}

export interface SearchResultExplorerZWaveMPDUOptions
	extends ExplorerZWaveMPDUOptions
{
	searchingNodeId: number;
	frameHandle: number;
	resultTTL: number;
	resultRepeaters: number[];
}

export class SearchResultExplorerZWaveMPDU extends ExplorerZWaveMPDU {
	public constructor(options: SearchResultExplorerZWaveMPDUOptions) {
		super(options);
		this.searchingNodeId = options.searchingNodeId;
		this.frameHandle = options.frameHandle;
		this.resultTTL = options.resultTTL;
		this.resultRepeaters = options.resultRepeaters;
	}

	public static from(
		raw: ExplorerZWaveMPDURaw,
		_ctx: MPDUParsingContext,
	): SearchResultExplorerZWaveMPDU {
		const searchingNodeId = raw.payload[0];
		const frameHandle = raw.payload[1];
		const resultTTL = raw.payload[2] >>> 4;
		const numRepeaters = raw.payload[2] & 0b1111;
		const resultRepeaters = [
			...raw.payload.subarray(3, 3 + numRepeaters),
		];

		return new this({
			...raw,
			searchingNodeId,
			frameHandle,
			resultTTL,
			resultRepeaters,
			// This frame contains no payload
			payload: new Bytes(),
		});
	}

	/** The node ID that sent the explorer frame that's being answered here */
	public readonly searchingNodeId: number;
	/** The sequence number of the original explorer frame */
	public readonly frameHandle: number;
	public readonly resultTTL: number;
	public readonly resultRepeaters: number[];

	public serialize(ctx: MPDUEncodingContext): Bytes {
		const payload = new Bytes(7);
		payload[0] = this.searchingNodeId;
		payload[1] = this.frameHandle;
		payload[2] = ((this.resultTTL & 0b1111) << 4)
			| (this.resultRepeaters.length & 0b1111);
		for (let i = 0; i < 4; i++) {
			payload[3 + i] = this.resultRepeaters[i] ?? 0;
		}

		this.payload = payload;
		return super.serialize(ctx);
	}

	public toLogEntry(ctx: MPDULogContext): MessageOrCCLogEntry {
		const { tags, message: original } = super.toLogEntry(ctx);
		tags[0] = formatRoute(
			this.sourceNodeId,
			this.repeaters,
			this.destinationNodeId,
			// Explorer frames do not contain a bit for the direction, we consider their responses "inbound"
			"inbound",
			4 - this.ttl,
		);
		tags.unshift("EXPLORER RESULT");

		const message: MessageRecord = {
			...original,
			"frame handle": this.frameHandle,
			"result TTL": this.resultTTL,
			"result repeaters": this.resultRepeaters.join(", "),
		};
		return {
			tags,
			message,
		};
	}
}

export interface LongRangeMPDURawOptions {
	homeId: number;
	sourceNodeId: number;
	destinationNodeId: number;
	ackRequested: boolean;
	headerType: MPDUHeaderType;
	sequenceNumber: number;
	noiseFloor: RSSI;
	txPower: number;
	payload: Bytes;
}

export class LongRangeMPDURaw {
	public constructor(options: LongRangeMPDURawOptions) {
		this.homeId = options.homeId;
		this.sourceNodeId = options.sourceNodeId;
		this.destinationNodeId = options.destinationNodeId;
		this.ackRequested = options.ackRequested;
		this.headerType = options.headerType;
		this.sequenceNumber = options.sequenceNumber;
		this.noiseFloor = options.noiseFloor;
		this.txPower = options.txPower;
		this.payload = options.payload;
	}

	public static parse(
		data: Bytes,
		_ctx: MPDUParsingContext,
	): LongRangeMPDURaw {
		// FIXME: Parse Beams

		const homeId = data.readUInt32BE(0);

		const nodeIds = data.readUIntBE(4, 3);
		const sourceNodeId = nodeIds >>> 12;
		const destinationNodeId = nodeIds & 0xfff;

		// skip length byte

		const frameControl = data[8];
		const ackRequested = !!(frameControl & 0b1000_0000);
		const hasExtendedHeader = !!(frameControl & 0b0100_0000);
		const headerType = frameControl & 0b0000_0111;

		const sequenceNumber = data[9];
		const noiseFloor = parseRSSI(data, 10);
		const txPower = data.readInt8(11);

		let offset = 12;
		if (hasExtendedHeader) {
			const extensionControl = data[offset++];
			const extensionLength = extensionControl & 0b111;
			// const discardUnknown = extensionControl & 0b0000_1000;
			// const extensionType = (extensionControl & 0b0111_0000) >>> 4;
			// TODO: Parse extension (once there is a definition)
			offset += extensionLength;
		}

		const payload = data.subarray(offset);

		return new LongRangeMPDURaw({
			homeId,
			sourceNodeId,
			destinationNodeId,
			ackRequested,
			headerType,
			sequenceNumber,
			noiseFloor,
			txPower,
			payload,
		});
	}

	public homeId: number;
	public sourceNodeId: number;
	public destinationNodeId: number;
	public ackRequested: boolean;
	public headerType: MPDUHeaderType;
	public sequenceNumber: number;
	public noiseFloor: RSSI;
	public txPower: number;
	public payload: Bytes;
}

export interface LongRangeMPDUOptions extends MPDUOptions {
	destinationNodeId: number;
	noiseFloor: RSSI;
	txPower: number;
}

export class LongRangeMPDU extends MPDU {
	public constructor(options: LongRangeMPDUOptions) {
		super(options);

		this.destinationNodeId = options.destinationNodeId;
		this.noiseFloor = options.noiseFloor;
		this.txPower = options.txPower;
	}

	public static from(
		raw: LongRangeMPDURaw,
		_ctx: MPDUParsingContext,
	): LongRangeMPDU {
		return new this({ ...raw });
	}

	public destinationNodeId: number;
	public noiseFloor: RSSI;
	public txPower: number;

	public serialize(ctx: MPDUEncodingContext): Bytes {
		const payload = new Bytes(12);

		payload.writeUInt32BE(this.homeId, 0);
		payload.writeUIntBE(
			((this.sourceNodeId & 0xfff) << 12)
				| (this.destinationNodeId & 0xfff),
			4,
			3,
		);

		// The length includes the entire MPDU, with additional payload
		// plus 2 bytes for the checksum
		payload[7] = 12 + this.payload.length + 2;

		const frameControl = (this.ackRequested ? 0b1000_0000 : 0)
			// | (this.hasExtendedHeader ? 0b0100_0000 : 0)
			| (this.headerType & 0b0000_0111);
		payload[8] = frameControl;
		payload[9] = this.sequenceNumber;
		payload.writeUInt8(this.noiseFloor, 10);
		payload.writeInt8(this.txPower, 11);
		// TODO: Once extensions are defined, add them here

		this.payload = Bytes.concat([
			payload,
			this.payload,
		]);

		return super.serialize(ctx);
	}

	public toLogEntry(ctx: MPDULogContext): MessageOrCCLogEntry {
		const tags = [
			formatRoute(
				this.sourceNodeId,
				[],
				this.destinationNodeId,
				// Singlecast frames do not contain a bit for this, we consider them all "outbound"
				"outbound",
				0,
			),
		];
		if (this.headerType === MPDUHeaderType.Acknowledgement) {
			tags.unshift("ACK");
		}

		const message: MessageRecord = {
			"sequence no.": this.sequenceNumber,
			channel: ctx.channel,
			"protocol/data rate": protocolDataRateToString(
				ctx.protocolDataRate,
			),
			"TX power": `${this.txPower} dBm`,
			"noise floor": rssiToString(this.noiseFloor),
		};
		if (ctx.rssi != undefined) {
			message.RSSI = rssiToString(ctx.rssi);
		} else if (ctx.rssiRaw != undefined) {
			message.RSSI = ctx.rssiRaw.toString();
		}
		if (this.headerType !== MPDUHeaderType.Acknowledgement) {
			message["ack requested"] = this.ackRequested;
		}
		if (this.payload.length > 0) {
			message.payload = buffer2hex(this.payload);
		}
		return {
			tags,
			message,
		};
	}
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SinglecastLongRangeMPDUOptions
	extends Omit<LongRangeMPDUOptions, "headerType">
{
}

export class SinglecastLongRangeMPDU extends LongRangeMPDU {
	public constructor(options: SinglecastLongRangeMPDUOptions) {
		super({
			...options,
			headerType: MPDUHeaderType.Singlecast,
		});
	}

	public toLogEntry(ctx: MPDULogContext): MessageOrCCLogEntry {
		const { tags, message: original } = super.toLogEntry(ctx);

		const message: MessageRecord = {
			...original,
			payload: buffer2hex(this.payload),
		};
		return {
			tags,
			message,
		};
	}
}

export interface AckLongRangeMPDUOptions
	extends Omit<LongRangeMPDUOptions, "headerType">
{
	incomingRSSI: RSSI;
}

export class AckLongRangeMPDU extends LongRangeMPDU {
	public constructor(options: AckLongRangeMPDUOptions) {
		super({
			...options,
			headerType: MPDUHeaderType.Acknowledgement,
		});
		this.incomingRSSI = options.incomingRSSI;
	}

	public static from(
		raw: LongRangeMPDURaw,
		_ctx: MPDUParsingContext,
	): AckLongRangeMPDU {
		const incomingRSSI: RSSI = parseRSSI(raw.payload, 0);
		const payload = raw.payload.subarray(1);

		return new this({
			...raw,
			incomingRSSI,
			payload,
		});
	}

	public readonly incomingRSSI: RSSI;

	public serialize(ctx: MPDUEncodingContext): Bytes {
		const payload = new Bytes(1);
		payload.writeUInt8(this.incomingRSSI, 0);

		this.payload = Bytes.concat([payload, this.payload]);
		return super.serialize(ctx);
	}

	public toLogEntry(ctx: MPDULogContext): MessageOrCCLogEntry {
		const { tags, message: original } = super.toLogEntry(ctx);

		const message: MessageRecord = {
			...original,
			"incoming RSSI": rssiToString(this.incomingRSSI),
		};
		if (this.payload.length > 0) {
			message.payload = buffer2hex(this.payload);
		}

		return {
			tags,
			message,
		};
	}
}
