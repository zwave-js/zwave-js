import type { Bytes } from "@zwave-js/shared";
import { protocolDataRateToString } from "../definitions/Protocol.js";
import { rssiToString } from "../definitions/RSSI.js";
import type { MessageRecord } from "../log/LogPayload.js";
import type { MessageOrCCLogEntry } from "../log/shared.js";
import { validatePayload } from "../util/misc.js";
import type { MPDULogContext, MPDUParsingContext } from "./MPDU.js";
import { formatNodeId, longRangeBeamPowerToDBm } from "./utils.js";

export interface ZWaveBeamOptions {
	destinationNodeId: number;
	homeIdHash?: number;
}

/** A beam frame used to awaken FL nodes, see ITU-T G.9959, Figure 8-18 */
export class ZWaveBeam {
	public constructor(options: ZWaveBeamOptions) {
		this.destinationNodeId = options.destinationNodeId;
		this.homeIdHash = options.homeIdHash;
	}

	public static parse(
		data: Bytes,
		ctx: MPDUParsingContext,
	): ZWaveBeam {
		if (ctx.channel > 2) {
			validatePayload.fail(
				`Channel ${ctx.channel} (ZWLR) must be parsed as a LongRangeBeam!`,
			);
		}

		// data[0] is the beam tag (0x55)
		const destinationNodeId = data[1];
		let homeIdHash: number | undefined;
		// Contrary to G.9959, the Zniffer output has a 0x01 marker byte
		// before the home ID hash
		if (data[2] === 0x01) {
			homeIdHash = data[3];
		}

		return new ZWaveBeam({
			destinationNodeId,
			homeIdHash,
		});
	}

	public readonly homeIdHash?: number;
	public readonly destinationNodeId: number;

	public toLogEntry(ctx: MPDULogContext): MessageOrCCLogEntry {
		const tags = [
			`BEAM » ${formatNodeId(this.destinationNodeId)}`,
		];

		const message: MessageRecord = {
			channel: ctx.channel,
			"protocol/data rate": protocolDataRateToString(
				ctx.protocolDataRate,
			),
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

export interface LongRangeBeamOptions {
	txPower: number;
	destinationNodeId: number;
	homeIdHash: number;
}

/** A beam frame used to awaken FL nodes, Z-Wave Long Range variant */
export class LongRangeBeam {
	public constructor(options: LongRangeBeamOptions) {
		this.txPower = options.txPower;
		this.destinationNodeId = options.destinationNodeId;
		this.homeIdHash = options.homeIdHash;
	}

	public static parse(
		data: Bytes,
		ctx: MPDUParsingContext,
	): LongRangeBeam {
		if (ctx.channel <= 2) {
			validatePayload.fail(
				`Channel ${ctx.channel} (Mesh) must be parsed as a ZWaveBeam!`,
			);
		}

		// data[0] is the beam tag (0x55)
		const txPower = longRangeBeamPowerToDBm(data[1] >>> 4);
		const destinationNodeId = data.readUInt16BE(1) & 0x0fff;
		const homeIdHash = data[3];

		return new LongRangeBeam({
			txPower,
			destinationNodeId,
			homeIdHash,
		});
	}

	public readonly homeIdHash: number;
	public readonly destinationNodeId: number;
	public readonly txPower: number;

	public toLogEntry(ctx: MPDULogContext): MessageOrCCLogEntry {
		const tags = [
			`BEAM » ${formatNodeId(this.destinationNodeId)}`,
		];

		const message: MessageRecord = {
			channel: ctx.channel,
			"protocol/data rate": protocolDataRateToString(
				ctx.protocolDataRate,
			),
			"TX power": `${this.txPower} dBm`,
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
