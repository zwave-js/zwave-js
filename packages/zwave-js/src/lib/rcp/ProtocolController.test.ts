import {
	ProtocolDataRate,
	ProtocolHeaderFormat,
	RoutedZWaveMPDU,
	SinglecastZWaveMPDU,
} from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { describe, expect, test } from "vitest";
import {
	frameDuration,
	isFinalHopOfRoutedFrame,
	routedAckTimeout,
} from "./ProtocolController.js";

function createRoutedMPDU(
	options: Partial<{
		direction: "outbound" | "inbound";
		hop: number;
		repeaters: number[];
	}> = {},
): RoutedZWaveMPDU {
	return new RoutedZWaveMPDU({
		homeId: 0xdeadbeef,
		sourceNodeId: 1,
		destinationNodeId: 4,
		ackRequested: false,
		sequenceNumber: 1,
		direction: options.direction ?? "outbound",
		routedAck: false,
		routedError: false,
		hop: options.hop ?? 0,
		repeaters: options.repeaters ?? [2, 3],
		destinationWakeup: false,
		speedModified: false,
		payload: Bytes.from([]),
	});
}

describe("frameDuration()", () => {
	// G.9959 Table 7-10: 10 byte preamble for R1 and R2
	test("adds the 10 byte preamble at 9k6 and 40k", () => {
		expect(
			frameDuration(
				10,
				ProtocolDataRate.ZWave_9k6,
				ProtocolHeaderFormat.Classic2Channel,
			),
		).toBe((10 + 10) * 8 * 1000 / 9600);
		expect(
			frameDuration(
				10,
				ProtocolDataRate.ZWave_40k,
				ProtocolHeaderFormat.Classic2Channel,
			),
		).toBe((10 + 10) * 8 * 1000 / 40000);
	});

	// G.9959 Table 7-10: 40 bytes in channel configuration 2, 24 in configuration 3
	test("uses the channel-configuration-specific preamble at 100k", () => {
		expect(
			frameDuration(
				10,
				ProtocolDataRate.ZWave_100k,
				ProtocolHeaderFormat.Classic2Channel,
			),
		).toBe((10 + 40) * 8 * 1000 / 100000);
		expect(
			frameDuration(
				10,
				ProtocolDataRate.ZWave_100k,
				ProtocolHeaderFormat.Classic3Channel,
			),
		).toBe((10 + 24) * 8 * 1000 / 100000);
	});

	test("scales with the frame length", () => {
		const short = frameDuration(
			10,
			ProtocolDataRate.ZWave_100k,
			ProtocolHeaderFormat.Classic2Channel,
		);
		const long = frameDuration(
			20,
			ProtocolDataRate.ZWave_100k,
			ProtocolHeaderFormat.Classic2Channel,
		);
		expect(long - short).toBeCloseTo(10 * 8 * 1000 / 100000, 10);
	});
});

describe("routedAckTimeout()", () => {
	test("covers both directions of every hop", () => {
		// 2 repeaters, 100 ms per frame: 4 hops of (100 + 10 ms margin)
		expect(routedAckTimeout(2, 100)).toBe(440);
	});

	// NWK Table 4.28: aNwkRoutedAckTimeout ranges from 18 ms to 1000 ms
	test("clamps to the range the spec allows", () => {
		expect(routedAckTimeout(1, 0)).toBe(20);
		expect(routedAckTimeout(0, 0)).toBe(18);
		expect(routedAckTimeout(4, 10000)).toBe(1000);
	});
});

describe("isFinalHopOfRoutedFrame()", () => {
	test("is true when the last repeater has delivered the frame", () => {
		expect(
			isFinalHopOfRoutedFrame(
				createRoutedMPDU({ hop: 2, repeaters: [2, 3] }),
			),
		).toBe(true);
	});

	test("is false on earlier hops", () => {
		expect(
			isFinalHopOfRoutedFrame(
				createRoutedMPDU({ hop: 0, repeaters: [2, 3] }),
			),
		).toBe(false);
		expect(
			isFinalHopOfRoutedFrame(
				createRoutedMPDU({ hop: 1, repeaters: [2, 3] }),
			),
		).toBe(false);
	});

	test("is false for the return path", () => {
		expect(
			isFinalHopOfRoutedFrame(
				createRoutedMPDU({
					direction: "inbound",
					hop: 2,
					repeaters: [2, 3],
				}),
			),
		).toBe(false);
	});

	test("is false for a frame that is not routed", () => {
		const singlecast = new SinglecastZWaveMPDU({
			homeId: 0xdeadbeef,
			sourceNodeId: 1,
			destinationNodeId: 4,
			ackRequested: true,
			sequenceNumber: 1,
			speedModified: false,
			payload: Bytes.from([]),
		});
		expect(isFinalHopOfRoutedFrame(singlecast)).toBe(false);
	});
});
