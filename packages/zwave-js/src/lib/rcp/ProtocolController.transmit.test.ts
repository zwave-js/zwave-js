import {
	AckZWaveMPDU,
	ChannelConfiguration,
	MPDU,
	MPDUHeaderType,
	ProtocolDataRate,
	Protocols,
	RFRegion,
	RoutedZWaveMPDU,
	RssiError,
} from "@zwave-js/core";
import { type ChannelInfo, TransmitCallbackStatus } from "@zwave-js/serial";
import { Bytes, type BytesView, TypedEventTarget } from "@zwave-js/shared";
import { wait } from "alcalzone-shared/async";
import { afterEach, expect, test, vi } from "vitest";
import type {
	MpduRxInfo,
	PHYLayer,
	PHYLayerEventCallbacks,
	RegionConfig,
	TransmitBeamOptions,
	TransmitOptions,
	TransmitResult,
	TxPowerRange,
} from "./PHYLayer.js";
import { ProtocolController } from "./ProtocolController.js";
import { MACTransmitKind, MACTransmitResult } from "./_Types.js";

const HOME_ID = 0xdeadbeef;
const OWN_NODE_ID = 1;
const DESTINATION = 2;

// USA, channel configuration 2: R3 on channel A, R2 and R1 on channel B
const CHANNELS: ChannelInfo[] = [
	{ channel: 0, frequency: 916e6, dataRate: ProtocolDataRate.ZWave_100k },
	{ channel: 1, frequency: 908e6, dataRate: ProtocolDataRate.ZWave_40k },
	{ channel: 2, frequency: 908e6, dataRate: ProtocolDataRate.ZWave_9k6 },
];

interface FakePHYOptions {
	/** Called for each transmit, before the returned result is reported */
	onTransmit?: (frame: BytesView, options: TransmitOptions) => void;
	/** How long a transmit occupies the radio, standing in for the air time */
	transmitDurationMs?: number;
	/** One result per transmit. Anything past the end reports `Completed` */
	results?: TransmitResult[];
}

/** A PHY layer that records transmits for the test to inspect */
class FakePHY extends TypedEventTarget<PHYLayerEventCallbacks>
	implements PHYLayer
{
	public constructor(private options: FakePHYOptions = {}) {
		super();
	}

	/** One entry per transmit, in the order they were handed to the radio */
	public readonly transmits: BytesView[] = [];
	/** How many transmits are executing right now */
	public concurrent = 0;
	public maxConcurrent = 0;

	public queryRegion(): Promise<RegionConfig> {
		return Promise.resolve(this.regionConfig);
	}

	public get regionConfig(): RegionConfig {
		return {
			region: RFRegion.USA,
			channelConfig: ChannelConfiguration.Classic,
			channels: CHANNELS,
		};
	}

	public get txPowerRange(): TxPowerRange {
		return { min: -10, max: 30 };
	}

	public setRegion(): Promise<ChannelInfo[]> {
		return Promise.resolve(CHANNELS);
	}

	public async transmit(
		frame: BytesView,
		options: TransmitOptions,
	): Promise<TransmitResult> {
		const attempt = this.transmits.length;
		this.concurrent++;
		this.maxConcurrent = Math.max(this.maxConcurrent, this.concurrent);
		this.transmits.push(frame);
		try {
			// Stand in for the serial round trip and the air time
			if (this.options.transmitDurationMs) {
				await wait(this.options.transmitDurationMs);
			} else {
				await Promise.resolve();
			}
			this.options.onTransmit?.(frame, options);
			return this.options.results?.[attempt]
				?? TransmitCallbackStatus.Completed;
		} finally {
			this.concurrent--;
		}
	}

	public transmitBeam(
		_options: TransmitBeamOptions,
	): Promise<TransmitResult> {
		return Promise.resolve(TransmitCallbackStatus.Completed);
	}

	public abortBeam(): Promise<void> {
		return Promise.resolve();
	}

	public get supportsAbortBeam(): boolean {
		return true;
	}

	public measureNoiseFloor(): Promise<number> {
		return Promise.resolve(-100);
	}

	public get supportsMeasureNoiseFloor(): boolean {
		return true;
	}

	public get supportsTransmitReplacements(): boolean {
		return false;
	}

	public destroy(): Promise<void> {
		return Promise.resolve();
	}

	/** Hand an MPDU to the MAC layer as if the radio had received it */
	public receive(mpdu: MPDU, info?: Partial<MpduRxInfo>): void {
		this.emit("mpdu received", mpdu, {
			channel: 0,
			rssi: RssiError.NotAvailable,
			protocolDataRate: ProtocolDataRate.ZWave_100k,
			...info,
		});
	}
}

/**
 * G.9959 lets a transmitter accept sequence number 0 on an ACK MPDU in the
 * 2-channel configurations, so this matches whatever went out
 */
function ack(): AckZWaveMPDU {
	return new AckZWaveMPDU({
		homeId: HOME_ID,
		sourceNodeId: DESTINATION,
		destinationNodeId: OWN_NODE_ID,
		sequenceNumber: 0,
	});
}

const ROUTE = [3];

/** Read back a frame the fake radio recorded, to answer its sequence number */
function parseOutbound(frame: BytesView): MPDU {
	return MPDU.parse(Bytes.view(frame), {
		channel: 0,
		protocolDataRate: ProtocolDataRate.ZWave_100k,
		region: RFRegion.USA,
	});
}

/** Repeater 0 repeating our frame towards the next hop */
function silentAck(sequenceNumber: number): RoutedZWaveMPDU {
	return new RoutedZWaveMPDU({
		homeId: HOME_ID,
		headerType: MPDUHeaderType.Singlecast,
		routed: true,
		ackRequested: false,
		sourceNodeId: OWN_NODE_ID,
		destinationNodeId: DESTINATION,
		sequenceNumber,
		direction: "outbound",
		routedAck: false,
		routedError: false,
		hop: 1,
		repeaters: ROUTE,
		speedModified: false,
	});
}

/** The destination's routed acknowledgement, travelling back to us */
function routedAck(sequenceNumber: number): RoutedZWaveMPDU {
	return new RoutedZWaveMPDU({
		homeId: HOME_ID,
		headerType: MPDUHeaderType.Singlecast,
		routed: true,
		ackRequested: false,
		sourceNodeId: DESTINATION,
		destinationNodeId: OWN_NODE_ID,
		sequenceNumber,
		direction: "inbound",
		routedAck: true,
		routedError: false,
		hop: 0,
		repeaters: ROUTE,
		speedModified: false,
	});
}

async function createController(
	phy: FakePHY,
): Promise<ProtocolController> {
	const controller = new ProtocolController({
		phy: () => Promise.resolve(phy),
		logConfig: { enabled: false },
	});
	await controller.start();
	controller.ownHomeId = HOME_ID;
	controller.ownNodeId = OWN_NODE_ID;
	// The controller must not answer the frames these tests send
	controller.autoAck = false;
	return controller;
}

let controller: ProtocolController | undefined;

afterEach(async () => {
	await controller?.destroy();
	controller = undefined;
});

const singlecast = {
	homeId: HOME_ID,
	sourceNodeId: OWN_NODE_ID,
	protocol: Protocols.ZWave,
	destination: {
		kind: MACTransmitKind.Singlecast as const,
		nodeId: DESTINATION,
	},
	txPower: 0,
} as const;

test("an ack that arrives during the transmit is not missed", async () => {
	// The ack crosses the same connection as the transmit callback, so it can
	// land before the transmit promise has resolved
	const phy = new FakePHY({
		onTransmit: () => {
			phy.receive(ack());
		},
	});
	controller = await createController(phy);

	const report = await controller.transmitData(
		Uint8Array.from([1, 2, 3]),
		singlecast,
	);

	expect(report.result).toBe(MACTransmitResult.OK);
	// One attempt was enough, so the ack was matched
	expect(phy.transmits).toHaveLength(1);
});

test("a frame with no ack in the window is retried and then reported", async () => {
	const phy = new FakePHY();
	controller = await createController(phy);

	const report = await controller.transmitData(
		Uint8Array.from([1, 2, 3]),
		singlecast,
	);

	expect(report.result).toBe(MACTransmitResult.NoAck);
	// G.9959 §8.1.5.2: 1 + aMacMaxFrameRetries attempts
	expect(phy.transmits).toHaveLength(3);
});

test("concurrent transmits do not interleave on air", async () => {
	const phy = new FakePHY({
		onTransmit: () => {
			phy.receive(ack());
		},
	});
	controller = await createController(phy);

	const reports = await Promise.all([
		controller.transmitData(Uint8Array.from([1]), singlecast),
		controller.transmitData(Uint8Array.from([2]), singlecast),
		controller.transmitData(Uint8Array.from([3]), singlecast),
	]);

	expect(reports.map((r) => r.result)).toStrictEqual([
		MACTransmitResult.OK,
		MACTransmitResult.OK,
		MACTransmitResult.OK,
	]);
	expect(phy.transmits).toHaveLength(3);
	expect(phy.maxConcurrent).toBe(1);
	// The frames must go out in the order they were queued
	expect(phy.transmits.map((f) => f.at(-1))).toStrictEqual([1, 2, 3]);
});

test("the radio is released when an exchange throws", async () => {
	const phy = new FakePHY({
		onTransmit: () => {
			phy.receive(ack());
		},
	});
	controller = await createController(phy);

	const transmit = vi.spyOn(phy, "transmit");
	transmit.mockRejectedValueOnce(new Error("the radio fell over"));

	await expect(
		controller.transmitData(Uint8Array.from([1]), singlecast),
	).rejects.toThrow("the radio fell over");

	// The lock is free again, so this does not hang
	const report = await controller.transmitData(
		Uint8Array.from([2]),
		singlecast,
	);
	expect(report.result).toBe(MACTransmitResult.OK);
});

test("a busy channel is retried and reported", async () => {
	const phy = new FakePHY({
		results: [
			TransmitCallbackStatus.ChannelBusy,
			TransmitCallbackStatus.ChannelBusy,
			TransmitCallbackStatus.ChannelBusy,
		],
	});
	controller = await createController(phy);

	const report = await controller.transmitData(
		Uint8Array.from([1, 2, 3]),
		singlecast,
	);

	expect(report.result).toBe(MACTransmitResult.ChannelBusy);
	expect(phy.transmits).toHaveLength(3);
});

test("a channel that frees up before the last attempt still succeeds", async () => {
	const phy = new FakePHY({
		results: [TransmitCallbackStatus.ChannelBusy],
		onTransmit: () => {
			phy.receive(ack());
		},
	});
	controller = await createController(phy);

	const report = await controller.transmitData(
		Uint8Array.from([1, 2, 3]),
		singlecast,
	);

	// ChannelBusy is only reported when every attempt found the channel busy
	expect(report.result).toBe(MACTransmitResult.OK);
	expect(phy.transmits).toHaveLength(2);
});

test("the ack window starts when the radio reports the frame was sent", async () => {
	// R3's ack wait duration is ~25 ms, less than this frame occupies the radio
	const phy = new FakePHY({
		transmitDurationMs: 40,
		onTransmit: () => {
			void wait(5).then(() => phy.receive(ack()));
		},
	});
	controller = await createController(phy);

	const report = await controller.transmitData(
		Uint8Array.from([1, 2, 3]),
		singlecast,
	);

	expect(report.result).toBe(MACTransmitResult.OK);
	// The window covered the ack, so one attempt was enough
	expect(phy.transmits).toHaveLength(1);
});

test("a routed frame is acknowledged by the silent ack and the routed ack", async () => {
	const phy = new FakePHY({
		onTransmit: (frame) => {
			const sent = parseOutbound(frame);
			// NWK:0180.1: repeater 0 repeating the frame is the silent ack
			phy.receive(silentAck(sent.sequenceNumber));
			// The destination answers once the frame has travelled the route
			void wait(5).then(() =>
				phy.receive(routedAck(sent.sequenceNumber))
			);
		},
	});
	controller = await createController(phy);

	const report = await controller.transmitData(Uint8Array.from([1, 2, 3]), {
		...singlecast,
		route: ROUTE,
	});

	expect(report.result).toBe(MACTransmitResult.OK);
	expect(phy.transmits).toHaveLength(1);
});

test("a routed frame whose route stays silent is retried and reported", async () => {
	const phy = new FakePHY();
	controller = await createController(phy);

	const report = await controller.transmitData(Uint8Array.from([1, 2, 3]), {
		...singlecast,
		route: ROUTE,
	});

	expect(report.result).toBe(MACTransmitResult.NoAck);
	expect(phy.transmits).toHaveLength(3);
});

test("a transmit rejected by the radio does not wait out the ack window", async () => {
	const phy = new FakePHY();
	vi.spyOn(phy, "transmit").mockResolvedValue(
		TransmitCallbackStatus.Underflow,
	);
	controller = await createController(phy);

	const report = await controller.transmitData(
		Uint8Array.from([1, 2, 3]),
		singlecast,
	);

	expect(report.result).toBe(MACTransmitResult.Error_FrameLength);
});
