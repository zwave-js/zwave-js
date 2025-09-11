import type { MessageOrCCLogEntry, RSSI } from "@zwave-js/core";
import { RCPFunctionType, RCPMessageType } from "../../message/Constants.js";
import {
	RCPMessage,
	type RCPMessageBaseOptions,
	type RCPMessageParsingContext,
	type RCPMessageRaw,
	rcpMessageTypes,
} from "../../message/RCPMessages.js";

export interface ReceiveCallbackOptions {
	data: Uint8Array;
	rssi: RSSI;
	lqi: number;
	channel: number;
}

@rcpMessageTypes(RCPMessageType.Callback, RCPFunctionType.Receive)
export class ReceiveCallback extends RCPMessage {
	public constructor(
		options: ReceiveCallbackOptions & RCPMessageBaseOptions,
	) {
		super(options);
		this.data = options.data;
		this.rssi = options.rssi;
		this.lqi = options.lqi;
		this.channel = options.channel;
	}

	public static from(
		raw: RCPMessageRaw,
		_ctx: RCPMessageParsingContext,
	): ReceiveCallback {
		const dataLength = raw.payload[0];
		const data = raw.payload.slice(1, 1 + dataLength);
		let offset = 1 + dataLength;
		const rssi = raw.payload.readInt8(offset++);
		// FIXME: LQI is useless in Z-Wave, it's always 0xff
		const lqi = raw.payload[offset++];
		const channel = raw.payload[offset++];

		return new this({
			data,
			rssi,
			lqi,
			channel,
		});
	}

	public data: Uint8Array;
	public rssi: RSSI;
	public lqi: number;
	public channel: number;

	public toLogEntry(): MessageOrCCLogEntry {
		return {
			...super.toLogEntry(),
			message: {
				channel: this.channel,
				RSSI: this.rssi, // FIXME: convert to actual dBm in firmware
				lqi: this.lqi,
				data: `(${this.data.length} bytes)`,
			},
		};
	}
}
