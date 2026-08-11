import { Bytes } from "@zwave-js/shared";
import { expect, test } from "vitest";
import { MPDUHeaderType } from "../definitions/Frame.js";
import { ProtocolDataRate } from "../definitions/Protocol.js";
import { RFRegion } from "../definitions/RFRegion.js";
import { RssiError } from "../definitions/RSSI.js";
import { ZWaveErrorCodes } from "../error/ZWaveError.js";
import { assertZWaveError } from "../test/assertZWaveError.js";
import {
	MPDU,
	type MPDUEncodingContext,
	RoutedZWaveMPDU,
	type RoutedZWaveMPDUOptions,
	SinglecastLongRangeMPDU,
} from "./MPDU.js";

const ctx2Channel: MPDUEncodingContext = {
	channel: 0,
	region: RFRegion.Europe,
	protocolDataRate: ProtocolDataRate.ZWave_100k,
};

const ctx3Channel: MPDUEncodingContext = {
	channel: 0,
	region: RFRegion.Japan,
	protocolDataRate: ProtocolDataRate.ZWave_100k,
};

function roundtrip(
	options: RoutedZWaveMPDUOptions,
	ctx: MPDUEncodingContext,
): RoutedZWaveMPDU {
	const serialized = new RoutedZWaveMPDU(options).serialize(ctx);
	const parsed = MPDU.parse(Bytes.view(serialized), ctx);
	expect(parsed).toBeInstanceOf(RoutedZWaveMPDU);
	return parsed as RoutedZWaveMPDU;
}

const baseOptions = {
	homeId: 0xdeadbeef,
	sourceNodeId: 1,
	ackRequested: true,
	headerType: MPDUHeaderType.Routed,
	sequenceNumber: 7,
	routed: true,
} as const;

test("RoutedZWaveMPDU round-trips an outbound frame with the wakeup extension", () => {
	const parsed = roundtrip({
		...baseOptions,
		destinationNodeId: 42,
		direction: "outbound",
		routedAck: false,
		routedError: false,
		hop: 1,
		repeaters: [2, 3],
		destinationWakeupType: "1000ms",
		payload: Bytes.from([0x01, 0x02, 0x03]),
	}, ctx2Channel);

	expect(parsed.destinationNodeId).toBe(42);
	expect(parsed.direction).toBe("outbound");
	expect(parsed.hop).toBe(1);
	expect(parsed.repeaters).toStrictEqual([2, 3]);
	expect(parsed.destinationWakeupType).toBe("1000ms");
	expect([...parsed.payload]).toStrictEqual([0x01, 0x02, 0x03]);
});

test("RoutedZWaveMPDU round-trips a 250ms wakeup extension", () => {
	const parsed = roundtrip({
		...baseOptions,
		destinationNodeId: 42,
		direction: "outbound",
		routedAck: false,
		routedError: false,
		hop: 0,
		repeaters: [2],
		destinationWakeupType: "250ms",
	}, ctx2Channel);

	expect(parsed.destinationWakeupType).toBe("250ms");
});

test("RoutedZWaveMPDU round-trips an inbound routed ack with the RSSI extension", () => {
	const parsed = roundtrip({
		...baseOptions,
		ackRequested: false,
		destinationNodeId: 1,
		direction: "inbound",
		routedAck: true,
		routedError: false,
		// The frame has returned to the source node
		hop: 0,
		repeaters: [2, 3, 4],
		repeaterRSSI: [-50, -60, -70],
	}, ctx2Channel);

	expect(parsed.direction).toBe("inbound");
	expect(parsed.routedAck).toBe(true);
	expect(parsed.hop).toBe(0);
	expect(parsed.repeaters).toStrictEqual([2, 3, 4]);
	expect(parsed.repeaterRSSI).toStrictEqual([-50, -60, -70]);
});

test("RoutedZWaveMPDU encodes the routing header bits of an outbound frame", () => {
	const serialized = new RoutedZWaveMPDU({
		...baseOptions,
		destinationNodeId: 42,
		direction: "outbound",
		routedAck: false,
		routedError: false,
		hop: 1,
		repeaters: [2, 3],
		destinationWakeupType: "1000ms",
	}).serialize(ctx2Channel);

	// The routing header starts after the 8 byte MPDU header
	expect(serialized[8]).toBe(42);
	// Outbound, no R-Ack, no R-Err, extended header present
	expect(serialized[9]).toBe(0b0000_1000);
	// 2 repeaters in the high nibble, hop 1 in the low nibble
	expect(serialized[10]).toBe(0x21);
	expect([...serialized.subarray(11, 13)]).toStrictEqual([2, 3]);
	// Extension body length 1, type 0x00, destination beaming 1000ms
	expect([...serialized.subarray(13, 15)]).toStrictEqual([0x10, 0x40]);
});

test("RoutedZWaveMPDU encodes the routing header bits of an inbound routed ack", () => {
	const serialized = new RoutedZWaveMPDU({
		...baseOptions,
		ackRequested: false,
		destinationNodeId: 1,
		direction: "inbound",
		routedAck: true,
		routedError: false,
		hop: 2,
		repeaters: [2, 3, 4],
		repeaterRSSI: [-50, -60, -70],
	}).serialize(ctx2Channel);

	// Inbound, R-Ack, no R-Err, extended header present
	expect(serialized[9]).toBe(0b0000_1011);
	// 3 repeaters in the high nibble, de-normalized hop 1 in the low nibble
	expect(serialized[10]).toBe(0x31);
	// Extension body length 4, type 0x01
	expect(serialized[14]).toBe(0x41);
});

test("RoutedZWaveMPDU encodes a 250ms destination wakeup extension", () => {
	const serialized = new RoutedZWaveMPDU({
		...baseOptions,
		destinationNodeId: 42,
		direction: "outbound",
		routedAck: false,
		routedError: false,
		hop: 0,
		repeaters: [2],
		destinationWakeupType: "250ms",
	}).serialize(ctx2Channel);

	expect([...serialized.subarray(12, 14)]).toStrictEqual([0x10, 0x20]);
});

test("RoutedZWaveMPDU encodes the channel configuration 3 destination wake up byte", () => {
	const options = {
		...baseOptions,
		destinationNodeId: 42,
		direction: "outbound",
		routedAck: false,
		routedError: false,
		hop: 1,
		repeaters: [2, 3],
	} as const;

	// The channel configuration 3 MPDU header is 9 bytes long, and the wake up
	// byte directly follows the repeater list
	const beaming = new RoutedZWaveMPDU({
		...options,
		destinationWakeup: true,
	}).serialize(ctx3Channel);
	expect([...beaming.subarray(9, 14)]).toStrictEqual([42, 0, 0x21, 2, 3]);
	expect(beaming[14]).toBe(0x02);

	const alwaysListening = new RoutedZWaveMPDU({
		...options,
		destinationWakeup: false,
	}).serialize(ctx3Channel);
	expect(alwaysListening[14]).toBe(0x00);
});

test("RoutedZWaveMPDU encodes a routed error with the failed hop", () => {
	const withFailedHop = new RoutedZWaveMPDU({
		...baseOptions,
		ackRequested: false,
		speedModified: true,
		destinationNodeId: 1,
		direction: "inbound",
		routedAck: false,
		routedError: true,
		failedHop: 2,
		hop: 3,
		repeaters: [2, 3, 4],
	}).serialize(ctx2Channel);
	// Inbound, no R-Ack, R-Err, no extended header, failed hop 2
	expect(withFailedHop[9]).toBe(0b0010_0101);

	// The speed modified bit must stay clear, so it is not read as failed hop 1
	const withoutFailedHop = new RoutedZWaveMPDU({
		...baseOptions,
		ackRequested: false,
		speedModified: true,
		destinationNodeId: 1,
		direction: "inbound",
		routedAck: false,
		routedError: true,
		hop: 3,
		repeaters: [2, 3, 4],
	}).serialize(ctx2Channel);
	expect(withoutFailedHop[9]).toBe(0b0000_0101);
});

test("RoutedZWaveMPDU rejects both extensions at once", () => {
	assertZWaveError(
		expect,
		() =>
			new RoutedZWaveMPDU({
				...baseOptions,
				destinationNodeId: 42,
				direction: "outbound",
				routedAck: false,
				routedError: false,
				hop: 0,
				repeaters: [2],
				destinationWakeupType: "250ms",
				repeaterRSSI: [-50],
			}).serialize(ctx2Channel),
		{ errorCode: ZWaveErrorCodes.Argument_Invalid },
	);
});

test("RoutedZWaveMPDU rejects a repeater count outside 1..4", () => {
	for (const repeaters of [[], [1, 2, 3, 4, 5]]) {
		assertZWaveError(
			expect,
			() =>
				new RoutedZWaveMPDU({
					...baseOptions,
					destinationNodeId: 42,
					direction: "outbound",
					routedAck: false,
					routedError: false,
					hop: 0,
					repeaters,
				}).serialize(ctx2Channel),
			{ errorCode: ZWaveErrorCodes.Argument_Invalid },
		);
	}
});

test("RoutedZWaveMPDU pads the RSSI extension to 4 bytes with 0x7F", () => {
	const serialized = new RoutedZWaveMPDU({
		...baseOptions,
		ackRequested: false,
		destinationNodeId: 1,
		direction: "inbound",
		routedAck: true,
		routedError: false,
		hop: 0,
		repeaters: [2],
		repeaterRSSI: [-50],
	}).serialize(ctx2Channel);

	// 8 header bytes, then destination, routing control, hops/repeaters,
	// repeater 0, extension preamble
	const extensionOffset = 8 + 3 + 1;
	expect(serialized[extensionOffset]).toBe(0x41);
	expect([
		...serialized.subarray(extensionOffset + 1, extensionOffset + 5),
	]).toStrictEqual([0xce, 0x7f, 0x7f, 0x7f]);
});

test("RoutedZWaveMPDU writes 0x0F as the hop of a frame returning to the source", () => {
	const serialized = new RoutedZWaveMPDU({
		...baseOptions,
		ackRequested: false,
		destinationNodeId: 1,
		direction: "inbound",
		routedAck: true,
		routedError: false,
		hop: 0,
		repeaters: [2, 3],
	}).serialize(ctx2Channel);

	expect(serialized[8 + 2] & 0x0f).toBe(0x0f);
});

test("RoutedZWaveMPDU round-trips a channel configuration 3 frame with the wakeup byte", () => {
	const parsed = roundtrip({
		...baseOptions,
		destinationNodeId: 42,
		direction: "outbound",
		routedAck: false,
		routedError: false,
		hop: 1,
		repeaters: [2, 3],
		destinationWakeup: true,
		payload: Bytes.from([0xaa]),
	}, ctx3Channel);

	expect(parsed.destinationWakeup).toBe(true);
	expect(parsed.repeaters).toStrictEqual([2, 3]);
	expect([...parsed.payload]).toStrictEqual([0xaa]);
});

test("RoutedZWaveMPDU round-trips a routed error with a failed hop of 0", () => {
	const parsed = roundtrip({
		...baseOptions,
		ackRequested: false,
		destinationNodeId: 1,
		direction: "inbound",
		routedAck: false,
		routedError: true,
		failedHop: 0,
		hop: 1,
		repeaters: [2, 3],
	}, ctx2Channel);

	expect(parsed.routedError).toBe(true);
	expect(parsed.failedHop).toBe(0);
	expect(parsed.hop).toBe(1);
});

test("RoutedZWaveMPDU round-trips a routed error with a non-zero failed hop", () => {
	const parsed = roundtrip({
		...baseOptions,
		ackRequested: false,
		destinationNodeId: 1,
		direction: "inbound",
		routedAck: false,
		routedError: true,
		failedHop: 2,
		hop: 3,
		repeaters: [2, 3, 4],
	}, ctx2Channel);

	expect(parsed.failedHop).toBe(2);
	expect(parsed.hop).toBe(3);
});

const ctxLongRange: MPDUEncodingContext = {
	channel: 0,
	region: RFRegion["USA (Long Range)"],
	protocolDataRate: ProtocolDataRate.LongRange_100k,
};

test("SinglecastLongRangeMPDU serializes the Long Range MPDU header", () => {
	const serialized = new SinglecastLongRangeMPDU({
		homeId: 0xdeadbeef,
		sourceNodeId: 1,
		destinationNodeId: 0x123,
		ackRequested: true,
		sequenceNumber: 5,
		noiseFloor: -96,
		txPower: 14,
		payload: Bytes.from([0x01, 0x02]),
	}).serialize(ctxLongRange);

	expect([...serialized]).toStrictEqual([
		0xde,
		0xad,
		0xbe,
		0xef,
		// source node 1, destination node 0x123
		0x00,
		0x11,
		0x23,
		// length: 12 header bytes, 2 payload bytes, 2 CRC bytes
		16,
		// ack requested, singlecast
		0x81,
		5,
		// noise floor -96 dBm
		0xa0,
		// TX power +14 dBm
		0x0e,
		0x01,
		0x02,
	]);
});

test("MPDU.parse() round-trips a serialized Long Range MPDU", () => {
	const serialized = new SinglecastLongRangeMPDU({
		homeId: 0xdeadbeef,
		sourceNodeId: 1,
		destinationNodeId: 0x123,
		ackRequested: true,
		sequenceNumber: 5,
		noiseFloor: RssiError.NotAvailable,
		txPower: -3,
		payload: Bytes.from([0x01]),
	}).serialize(ctxLongRange);

	const parsed = MPDU.parse(serialized, ctxLongRange);
	expect(parsed).toBeInstanceOf(SinglecastLongRangeMPDU);
	const lr = parsed as SinglecastLongRangeMPDU;
	expect(lr.sourceNodeId).toBe(1);
	expect(lr.destinationNodeId).toBe(0x123);
	expect(lr.noiseFloor).toBe(RssiError.NotAvailable);
	expect(lr.txPower).toBe(-3);
	expect([...lr.payload]).toStrictEqual([0x01]);
});

test("MPDU.parse() rejects an unknown protocol data rate", () => {
	assertZWaveError(
		expect,
		() =>
			MPDU.parse(Bytes.from([0xde, 0xad, 0xbe, 0xef, 0x01, 0x41, 0x07]), {
				channel: 0,
				region: RFRegion.Europe,
				protocolDataRate: 0x7f as ProtocolDataRate,
			}),
		{ errorCode: ZWaveErrorCodes.PacketFormat_InvalidPayload },
	);
});

test("MPDU.parse() uses the data rate to detect Long Range frames", () => {
	// A Long Range singlecast frame received on channel 0, as used by the
	// end device channel configurations
	const frame = Bytes.from([
		// home ID
		0xde,
		0xad,
		0xbe,
		0xef,
		// source node 1, destination node 2
		0x00,
		0x10,
		0x02,
		// length
		0x0f,
		// frame control: ack requested, singlecast
		0x81,
		// sequence number
		0x05,
		// noise floor
		0xa0,
		// TX power
		0x0e,
		// payload
		0x01,
	]);

	const parsed = MPDU.parse(frame, {
		channel: 0,
		region: RFRegion["USA (Long Range)"],
		protocolDataRate: ProtocolDataRate.LongRange_100k,
	});

	expect(parsed.sourceNodeId).toBe(1);
	expect(parsed.sequenceNumber).toBe(5);
	expect([...parsed.payload]).toStrictEqual([0x01]);
});
