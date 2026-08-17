import {
	ProtocolDataRate,
	ProtocolHeaderFormat,
	RoutedZWaveMPDU,
	SinglecastZWaveMPDU,
	ZWaveErrorCodes,
	assertZWaveError,
} from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { describe, expect, test } from "vitest";
import {
	ackWaitDuration,
	classic2ChannelAttemptSchedule,
	frameDuration,
	getBeamParameters,
	isFinalHopOfRoutedFrame,
	randomRetransmitDelay,
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

describe("classic2ChannelAttemptSchedule()", () => {
	const r1 = { channel: 2, dataRate: ProtocolDataRate.ZWave_9k6 };
	const r2 = { channel: 1, dataRate: ProtocolDataRate.ZWave_40k };
	const r3 = { channel: 0, dataRate: ProtocolDataRate.ZWave_100k };

	// G.9959 §8.1.5.2: a frame gets 1 + aMacMaxFrameRetries (2) attempts
	test.each([
		["all three rates", [r3, r2, r1]],
		["two rates", [r2, r1]],
		["a single rate", [r2]],
	])("plans exactly 3 attempts with %s", (_name, channels) => {
		expect(classic2ChannelAttemptSchedule(channels)).toHaveLength(3);
	});

	test("sends the fastest rate twice, then falls back", () => {
		const schedule = classic2ChannelAttemptSchedule([r3, r2, r1]);
		expect(schedule.map((a) => a.channel().dataRate)).toStrictEqual([
			ProtocolDataRate.ZWave_100k,
			ProtocolDataRate.ZWave_100k,
			ProtocolDataRate.ZWave_40k,
		]);
	});

	test("flags only the attempts slower than the first one", () => {
		const schedule = classic2ChannelAttemptSchedule([r3, r2, r1]);
		expect(schedule.map((a) => a.speedModified)).toStrictEqual([
			false,
			false,
			true,
		]);
	});

	test("repeats the only rate a single-rate region has", () => {
		const schedule = classic2ChannelAttemptSchedule([r2]);
		expect(schedule.map((a) => a.channel().dataRate)).toStrictEqual([
			ProtocolDataRate.ZWave_40k,
			ProtocolDataRate.ZWave_40k,
			ProtocolDataRate.ZWave_40k,
		]);
		expect(schedule.every((a) => !a.speedModified)).toBe(true);
	});
});

describe("ackWaitDuration()", () => {
	// aPhyTurnaroundTimeRxTx (1 ms) + aMacTransferAckTimeTX / data rate,
	// plus the 20 ms host transport allowance
	test.each([
		[
			ProtocolDataRate.ZWave_9k6,
			ProtocolHeaderFormat.Classic2Channel,
			168,
			9600,
		],
		[
			ProtocolDataRate.ZWave_40k,
			ProtocolHeaderFormat.Classic2Channel,
			248,
			40000,
		],
		[
			ProtocolDataRate.ZWave_100k,
			ProtocolHeaderFormat.Classic2Channel,
			416,
			100000,
		],
		[
			ProtocolDataRate.ZWave_100k,
			ProtocolHeaderFormat.Classic3Channel,
			296,
			100000,
		],
		[
			ProtocolDataRate.LongRange_100k,
			ProtocolHeaderFormat.LongRange,
			448,
			100000,
		],
	])(
		"data rate %i with header format %i waits for %i ack bits",
		(dataRate, headerFormat, ackBits, bitrate) => {
			expect(ackWaitDuration(dataRate, headerFormat)).toBeCloseTo(
				1 + ackBits * 1000 / bitrate + 20,
				10,
			);
		},
	);

	// R3 needs fewer ack bits in channel configuration 3 than in 1 and 2
	test("100k waits longer in a 2-channel region than in a 3-channel one", () => {
		expect(
			ackWaitDuration(
				ProtocolDataRate.ZWave_100k,
				ProtocolHeaderFormat.Classic2Channel,
			),
		).toBeGreaterThan(
			ackWaitDuration(
				ProtocolDataRate.ZWave_100k,
				ProtocolHeaderFormat.Classic3Channel,
			),
		);
	});
});

describe("randomRetransmitDelay()", () => {
	// G.9959 Table 8-19: the backoff must be higher than aMacMinRetransmitDelay
	// (10 ms) and lower than aMacMaxRetransmitDelay (40 ms)
	test.each([[false], [true]])(
		"stays strictly inside the spec bounds (long range: %s)",
		(isLongRange) => {
			for (let i = 0; i < 1000; i++) {
				const delay = randomRetransmitDelay(isLongRange);
				expect(delay).toBeGreaterThan(10);
				expect(delay).toBeLessThan(40);
				expect(Number.isInteger(delay)).toBe(true);
			}
		},
	);
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

describe("getBeamParameters()", () => {
	// G.9959 §8.1.3.12: "The recommended duration is 1 100 ms for a long
	// continuous beam and 275 ms for a short continuous beam."
	test("a 250ms destination is beamed with a short continuous beam", () => {
		expect(
			getBeamParameters("250ms", ProtocolHeaderFormat.Classic2Channel),
		).toStrictEqual({
			continuous: true,
			numFragments: 1,
			fragmentDurationMs: 275,
			fragmentPeriodMs: 275,
		});
	});

	test("a 1000ms destination is beamed with a long continuous beam", () => {
		expect(
			getBeamParameters("1000ms", ProtocolHeaderFormat.Classic2Channel),
		).toStrictEqual({
			continuous: true,
			numFragments: 1,
			fragmentDurationMs: 1100,
			fragmentPeriodMs: 1100,
		});
	});

	test.each([
		[ProtocolHeaderFormat.Classic3Channel],
		[ProtocolHeaderFormat.LongRange],
	])("header format %i uses the fragmented beam", (headerFormat) => {
		expect(getBeamParameters("fragmented", headerFormat)).toStrictEqual({
			continuous: false,
			numFragments: 16,
			fragmentDurationMs: 112,
			fragmentPeriodMs: 200,
		});
	});

	// The literals above are the contract. These bounds are what the spec
	// requires of them, so a future retune cannot silently leave the window
	test("the fragmented beam parameters stay inside the spec bounds", () => {
		const beam = getBeamParameters(
			"fragmented",
			ProtocolHeaderFormat.LongRange,
		);

		// §8.1.3.11: "The beam fragment duration shall be in the range 110-115 ms."
		expect(beam.fragmentDurationMs).toBeGreaterThanOrEqual(110);
		expect(beam.fragmentDurationMs).toBeLessThanOrEqual(115);

		// §8.1.3.11: "The next beam fragment shall begin in the range 190-200 ms
		// measured from the beginning of the previous beam fragment."
		expect(beam.fragmentPeriodMs).toBeGreaterThanOrEqual(190);
		expect(beam.fragmentPeriodMs).toBeLessThanOrEqual(200);

		// §8.1.3.11: "A full fragmented beam shall span 3 000 ms." An integer
		// number of fragments cannot land on exactly 3000 ms, so the beam covers
		// the window and overshoots by less than one period
		const span = (beam.numFragments - 1) * beam.fragmentPeriodMs
			+ beam.fragmentDurationMs;
		expect(span).toBeGreaterThanOrEqual(3000);
		expect(span).toBeLessThan(3000 + beam.fragmentPeriodMs);
	});

	test.each([
		[ProtocolHeaderFormat.Classic3Channel],
		[ProtocolHeaderFormat.LongRange],
	])("continuous beams are rejected in header format %i", (headerFormat) => {
		for (const wakeup of ["250ms", "1000ms"] as const) {
			assertZWaveError(
				expect,
				() => getBeamParameters(wakeup, headerFormat),
				{ errorCode: ZWaveErrorCodes.Argument_Invalid },
			);
		}
	});

	test("fragmented beams are rejected in channel configurations 1 and 2", () => {
		assertZWaveError(
			expect,
			() =>
				getBeamParameters(
					"fragmented",
					ProtocolHeaderFormat.Classic2Channel,
				),
			{ errorCode: ZWaveErrorCodes.Argument_Invalid },
		);
	});
});
