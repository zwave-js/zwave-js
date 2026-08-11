import { Bytes } from "@zwave-js/shared";
import { expect, test } from "vitest";
import { MPDUHeaderType } from "../definitions/Frame.js";
import { ProtocolDataRate } from "../definitions/Protocol.js";
import { RFRegion } from "../definitions/RFRegion.js";
import {
	MPDU,
	type MPDUEncodingContext,
	RoutedZWaveMPDU,
	type RoutedZWaveMPDUOptions,
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
