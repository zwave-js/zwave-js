import { ZWaveError, ZWaveErrorCodes, isZWaveError } from "@zwave-js/core";
import {
	ZnifferDataMessage,
	ZnifferMessage,
	ZnifferMessageType,
} from "@zwave-js/serial";
import { Bytes } from "@zwave-js/shared";
import { ZLFAttachment } from "./ZLFAttachment.js";
import type { CapturedData } from "./Zniffer.js";

export function captureToZLFEntry(
	capture: CapturedData,
): Uint8Array {
	const buffer = new Bytes(14 + capture.rawData.length).fill(0);
	// Convert the date to a .NET datetime
	let ticks = BigInt(capture.timestamp.getTime()) * 10000n
		+ 621355968000000000n;
	// https://github.com/dotnet/runtime/blob/179473d3c8a1012b036ad732d02804b062923e8d/src/libraries/System.Private.CoreLib/src/System/DateTime.cs#L161
	ticks = ticks | (2n << 62n); // DateTimeKind.Local << KindShift

	buffer.writeBigUInt64LE(ticks, 0);
	const direction = 0; // inbound, outbound would be 0b1000_0000

	buffer[8] = direction | 0x01; // dir + session ID
	buffer.writeUInt32LE(capture.rawData.length, 9);
	buffer.set(capture.rawData, 13);
	buffer[buffer.length - 1] = 0xfe; // end of frame
	return buffer;
}

export function parseZLFHeader(buffer: Uint8Array): {
	znifferVersion: number;
	checksum: number;
	bytesRead: number;
} {
	if (buffer.length < 2048) {
		throw new ZWaveError(
			"Invalid ZLF file: header too small",
			ZWaveErrorCodes.Argument_Invalid,
		);
	}

	const bytes = Bytes.view(buffer);

	const znifferVersion = bytes[0];
	const checksum = bytes.readUInt16BE(2046);

	return {
		znifferVersion,
		checksum,
		bytesRead: 2048,
	};
}

export enum ZLFEntryKind {
	Zniffer = 0x00,
	Attachment = 0x06,
}

type ParsedZLFEntry =
	| {
		kind: ZLFEntryKind.Zniffer;
		type: ZnifferMessageType.Data;
		msg: ZnifferDataMessage;
		capture: CapturedData;
	}
	| {
		kind: ZLFEntryKind.Zniffer;
		type: ZnifferMessageType.Command;
		msg: ZnifferMessage;
		capture: CapturedData;
	}
	| {
		kind: ZLFEntryKind.Attachment;
		attachment: ZLFAttachment;
	};

type ParseZLFEntryResult =
	& ({
		complete: true;
		bytesRead: number;
		accumulator?: undefined;
	} | {
		complete: false;
		bytesRead: number;
		accumulator: CapturedData;
	})
	& {
		entries: ParsedZLFEntry[];
	};

/** @internal */
export function parseZLFEntry(
	buffer: Uint8Array,
	offset: number,
	accumulator?: CapturedData,
): ParseZLFEntryResult {
	const bytes = Bytes.view(buffer.subarray(offset));

	// Each ZLF entry has a 14-byte overhead, so the buffer must have at least that size
	if (bytes.length < 14) {
		throw new ZWaveError(
			"Invalid ZLF file: entry truncated",
			ZWaveErrorCodes.PacketFormat_Truncated,
		);
	}

	// Parse .NET DateTime ticks (8 bytes, little-endian)
	const ticks = bytes.readBigUInt64LE(0);
	// Kind: 1 = UTC, 2 = Local
	// const dateTimeKind = Number((ticks >> 62n) & 0b11n);
	const timeStampMask = (1n << 62n) - 1n;
	const jsTimestamp = Number(
		((ticks & timeStampMask) - 621355968000000000n) / 10000n,
	);
	// FIXME: dateTimeKind should always be local. Properly support UTC
	const timestamp = new Date(jsTimestamp);

	// Ignore the direction and session ID byte
	const rawDataLength = bytes.readUInt32LE(9);
	const totalLength = 14 + rawDataLength;
	if (bytes.length < totalLength) {
		throw new ZWaveError(
			"Invalid ZLF file: entry truncated",
			ZWaveErrorCodes.PacketFormat_Truncated,
		);
	}
	const kind: ZLFEntryKind = 0xfe - bytes[totalLength - 1];
	// Skip unsupported entries:
	if (kind !== ZLFEntryKind.Zniffer && kind !== ZLFEntryKind.Attachment) {
		return {
			complete: true,
			bytesRead: totalLength,
			entries: [],
		};
	}

	let rawData = bytes.subarray(13, totalLength - 1);
	if (accumulator) {
		rawData = Bytes.concat([
			accumulator.rawData,
			rawData,
		]);
	}

	const parsed: ParsedZLFEntry[] = [];

	try {
		// Parse all entries in this chunk
		if (kind === ZLFEntryKind.Zniffer) {
			while (rawData.length > 0) {
				const { msg, bytesRead } = ZnifferMessage.parse(rawData);
				if (bytesRead === 0) break;

				const capture: CapturedData = {
					timestamp,
					rawData,
					frameData: msg.payload,
				};

				// Help TypeScript out a bit
				if (msg instanceof ZnifferDataMessage) {
					parsed.push({
						kind: ZLFEntryKind.Zniffer,
						type: ZnifferMessageType.Data,
						msg,
						capture,
					});
				} else {
					// We are dealing with a command frame
					parsed.push({
						kind: ZLFEntryKind.Zniffer,
						type: ZnifferMessageType.Command,
						msg,
						capture,
					});
				}
				// Advance the buffer for the next iteration
				rawData = rawData.subarray(bytesRead);
			}
		} else if (kind === ZLFEntryKind.Attachment) {
			try {
				// There should only be one attachment per entry
				const { attachment } = ZLFAttachment.parse(rawData);
				parsed.push({
					kind: ZLFEntryKind.Attachment,
					attachment,
				});
			} catch (e) {
				if (
					isZWaveError(e)
					&& e.code === ZWaveErrorCodes.Deserialization_NotImplemented
				) {
					// Ignore unknown attachment types
					console.warn("Ignoring unsupported ZLF attachment");
				}
			}
		}

		// All data was consumed
		return {
			complete: true,
			bytesRead: totalLength,
			entries: parsed,
		};
	} catch (e) {
		if (
			isZWaveError(e) && e.code === ZWaveErrorCodes.PacketFormat_Truncated
		) {
			// We are dealing with an incomplete frame, so we need to accumulate the data for the next iteration
			accumulator ??= {
				timestamp,
				rawData: new Bytes(),
				frameData: new Bytes(), // Cannot be determined yet
			};
			accumulator.rawData = rawData; // rawData only contains the unparsed data

			return {
				complete: false,
				bytesRead: totalLength,
				accumulator,
				// Include what was parsed already
				entries: parsed,
			};
		}

		debugger;
		throw e;
	}
}
