import {
	AckLongRangeMPDU,
	AckZWaveMPDU,
	type LogConfig,
	type LogContainer,
	LongRangeMPDU,
	MAX_NODES,
	type MPDU,
	type MPDUEncodingContext,
	MPDUHeaderType,
	type MPDULogContext,
	NODE_ID_BROADCAST,
	NODE_ID_BROADCAST_LR,
	ProtocolDataRate,
	ProtocolHeaderFormat,
	Protocols,
	type RSSI,
	RoutedZWaveMPDU,
	RssiError,
	SinglecastLongRangeMPDU,
	SinglecastZWaveMPDU,
	ZWaveError,
	ZWaveErrorCodes,
	getProtocolHeaderFormatForDataRate,
	isRssiError,
} from "@zwave-js/core";
import {
	type ChannelInfo,
	TransmitCallbackStatus,
	TransmitResponseStatus,
} from "@zwave-js/serial";
import {
	type AwaitedThing,
	Bytes,
	type BytesView,
	TypedEventTarget,
	getEnumMemberName,
	getErrorMessage,
	setTimer,
} from "@zwave-js/shared";
import { wait } from "alcalzone-shared/async";
import {
	type DeferredPromise,
	createDeferredPromise,
} from "alcalzone-shared/deferred-promise";
import type { ZWaveOptions } from "../driver/ZWaveOptions.js";
import { ProtocolLogger } from "../log/Protocol.js";
import type { MACLayer } from "./MACLayer.js";
import {
	type MpduRxInfo,
	type PHYLayer,
	type PHYLayerFactory,
	getProtocolDataRateOrThrow,
} from "./PHYLayer.js";
import {
	type MACTransmitAckOptions,
	MACTransmitKind,
	type MACTransmitOptions,
	type MACTransmitReport,
	MACTransmitResult,
} from "./_Types.js";

type AwaitedMPDUEntry = AwaitedThing<MPDU>;

interface TransmitAttempt {
	/**
	 * Resolved when the attempt is made, so an LR primary channel change during
	 * an ongoing transmission takes effect
	 */
	channel: () => ChannelInfo;
	speedModified: boolean;
}

// ITU-T G.9959 (01/2015), Table 8-19
// Lower bound of the random backoff before a retransmission (exclusive)
const MAC_MIN_RETRANSMIT_DELAY_MS = 10;
// Upper bound of the random backoff before a retransmission (exclusive)
const MAC_MAX_RETRANSMIT_DELAY_MS = 40;

// ITU-T G.9959 (01/2015), Table 7-27
// aPhyTurnaroundTimerRXTX, "RX-to-TX minimum turnaround time"
const PHY_TURNAROUND_TIME_RX_TX_MS = 1;

// ITU-T G.9959 (01/2015), Table 8-18
// Number of retries after a failed transmission
const MAC_MAX_FRAME_RETRIES = 2;

// Z-Wave Long Range PHY and MAC Layer Specification (2023.07.03), Table 6-33
// Lower bound of the random backoff before a retransmission (exclusive)
const LR_MIN_RETRANSMIT_DELAY_MS = 10;
// Upper bound of the random backoff before a retransmission (exclusive)
const LR_MAX_RETRANSMIT_DELAY_MS = 40;

// Z-Wave Long Range PHY and MAC Layer Specification (2023.07.03), Table 6-32
// Number of retries after a failed transmission
const MAC_LR_MAX_FRAME_RETRIES = 2;
// Number of retries on the secondary channel in channel configuration 3
const MAC_LR_MAX_FRAME_RETRIES_SECONDARY = 1;

// Z-Wave Long Range PHY and MAC Layer Specification (2023.07.03), Table 6-27
// Bounds of the RSSI an MPDU field can carry
const LR_RSSI_MIN_DBM = -120;
const LR_RSSI_MAX_DBM = 30;

// Extra time each hop gets on top of the frame duration, covering repeater
// processing and turnaround
const ROUTED_HOP_MARGIN_MS = 10;

// Extra time the host grants an ack on top of the MAC ack wait duration. The
// MAC timings assume the radio itself decides, while our transmit command and
// the ack each have to cross the serial connection. This covers both round
// trips and is tuned empirically
const ACK_HOST_TRANSPORT_ALLOWANCE_MS = 20;

// TX power used for LR transmissions when the caller does not specify one
const LR_DEFAULT_TX_POWER_DBM = 14;

// Bounds of an int8 field
const INT8_MIN = -128;
const INT8_MAX = 127;

/** The RSSI to advertise for a received frame, clamped into the range the MPDU field allows */
function advertisedRSSI(rssi: RSSI): number {
	if (isRssiError(rssi)) return RssiError.NotAvailable;
	return Math.max(
		LR_RSSI_MIN_DBM,
		Math.min(LR_RSSI_MAX_DBM, Math.round(rssi)),
	);
}

function assertInt8(value: number | undefined, name: string): void {
	if (value == undefined) return;
	if (!Number.isInteger(value) || value < INT8_MIN || value > INT8_MAX) {
		throw new ZWaveError(
			`${name} must be an integer between ${INT8_MIN} and ${INT8_MAX}`,
			ZWaveErrorCodes.Argument_Invalid,
		);
	}
}

// Bounds of the radio TX power the API accepts. They match the range the serial
// layer accepts
const RADIO_TX_POWER_MIN_DBM = -10;
const RADIO_TX_POWER_MAX_DBM = 30;

/** Reject a radio TX power outside the range the API accepts, before any frame goes out */
function assertRadioTXPower(txPower: number | undefined): void {
	if (txPower == undefined) return;
	if (
		!Number.isFinite(txPower)
		|| txPower < RADIO_TX_POWER_MIN_DBM
		|| txPower > RADIO_TX_POWER_MAX_DBM
	) {
		throw new ZWaveError(
			`The TX power must be between ${RADIO_TX_POWER_MIN_DBM} and ${RADIO_TX_POWER_MAX_DBM} dBm`,
			ZWaveErrorCodes.Argument_Invalid,
		);
	}
}

/** The bit rate a data rate transmits at, in bits per second */
function bitsPerSecond(dataRate: ProtocolDataRate): number {
	switch (dataRate) {
		case ProtocolDataRate.ZWave_9k6:
			return 9600;
		case ProtocolDataRate.ZWave_40k:
			return 40000;
		default:
			return 100000;
	}
}

/**
 * How long to wait for an ack after a transmission, in milliseconds. The result
 * includes the host transport allowance on top of the duration the MAC mandates
 */
function ackWaitDuration(
	dataRate: ProtocolDataRate,
	headerFormat: ProtocolHeaderFormat,
): number {
	let ackBits: number;
	if (dataRate === ProtocolDataRate.LongRange_100k) {
		// Z-Wave Long Range PHY and MAC Layer Specification (2023.07.03),
		// Table 6-33: aMacLRTransferAckTimeTX, "The number of symbols of an Ack
		// MPDU; including preamble"
		ackBits = 448;
	} else {
		// ITU-T G.9959 (01/2015), Table 8-19: aMacTransferAckTimeTX (ch), "The
		// number of symbols of an ACK MPDU; including preamble". R3 needs fewer in
		// channel configuration 3 than in configurations 1 and 2
		switch (dataRate) {
			case ProtocolDataRate.ZWave_9k6:
				ackBits = 168;
				break;
			case ProtocolDataRate.ZWave_40k:
				ackBits = 248;
				break;
			default:
				ackBits = headerFormat === ProtocolHeaderFormat.Classic3Channel
					? 296
					: 416;
				break;
		}
	}

	// ITU-T G.9959 (01/2015), Table 8-18: aMacMinAckWaitDuration is
	// "aPhyTurnaroundTimeRxTx + (aMacTransferAckTimeTX * (1/data rate))".
	// The LR spec defines aMacLRMinAckWaitDuration the same way in Table 6-32
	return PHY_TURNAROUND_TIME_RX_TX_MS
		+ ackBits * 1000 / bitsPerSecond(dataRate)
		+ ACK_HOST_TRANSPORT_ALLOWANCE_MS;
}

/** The random backoff to wait before a retransmission, in milliseconds */
function randomRetransmitDelay(isLongRange: boolean): number {
	// ITU-T G.9959 (01/2015), §8.1.5.1.4.4: "The random delay shall be calculated
	// as a period in the interval aMacMinRetransmitDelay .. aMacMaxRetransmitDelay".
	// Both bounds are exclusive, since the tables call for a backoff higher than
	// the minimum and lower than the maximum
	const min = isLongRange
		? LR_MIN_RETRANSMIT_DELAY_MS
		: MAC_MIN_RETRANSMIT_DELAY_MS;
	const max = isLongRange
		? LR_MAX_RETRANSMIT_DELAY_MS
		: MAC_MAX_RETRANSMIT_DELAY_MS;
	return min + 1 + Math.floor(Math.random() * (max - min - 1));
}

/** How long a frame of the given length occupies the channel, in milliseconds */
export function frameDuration(
	frameLength: number,
	dataRate: ProtocolDataRate,
	headerFormat: ProtocolHeaderFormat,
): number {
	// ITU-T G.9959 (01/2015), Table 7-10: the minimum singlecast preamble is 10 bytes
	// for R1 and R2. R3 uses 40 bytes in channel configuration 2 and 24 bytes in
	// channel configuration 3
	let preambleLength: number;
	switch (dataRate) {
		case ProtocolDataRate.ZWave_9k6:
		case ProtocolDataRate.ZWave_40k:
			preambleLength = 10;
			break;
		default:
			preambleLength =
				headerFormat === ProtocolHeaderFormat.Classic3Channel ? 24 : 40;
			break;
	}

	return (frameLength + preambleLength) * 8 * 1000 / bitsPerSecond(dataRate);
}

/**
 * Time to wait for a routed acknowledgement or routed error, measured from the moment
 * repeater 0 has repeated the frame.
 */
export function routedAckTimeout(
	numRepeaters: number,
	frameDurationMs: number,
): number {
	// Repeater 0 has already repeated the frame, so numRepeaters - 1 hops remain until
	// it reaches the destination, and numRepeaters + 1 hops bring the routed ack back.
	// Routed frames go out with Ack Req = 0, so no hop is retransmitted by the MAC layer
	const numHops = 2 * numRepeaters;
	const timeout = numHops * (frameDurationMs + ROUTED_HOP_MARGIN_MS);

	// Z-Wave and Z-Wave Long Range Network Layer Specification (2023.05.26),
	// Table 4.28: aNwkRoutedAckTimeout is the "Timeout for considering that a
	// particular Routed Frame has been lost and will not return any Routed
	// Acknowledgement or Routed Error." with a range of 18ms..1000ms
	return Math.min(1000, Math.max(18, Math.ceil(timeout)));
}

/** Whether the frame is a routed frame that its last repeater has delivered to the destination */
export function isFinalHopOfRoutedFrame(mpdu: MPDU): mpdu is RoutedZWaveMPDU {
	return mpdu instanceof RoutedZWaveMPDU
		&& mpdu.direction === "outbound"
		&& mpdu.hop === mpdu.repeaters.length;
}

export interface ProtocolControllerOptions {
	/**
	 * Optional log configuration
	 */
	logConfig?: Partial<LogConfig>;

	host?: Pick<
		Required<
			NonNullable<ZWaveOptions["host"]>
		>,
		"log"
	>;

	phy: PHYLayerFactory;
}

export interface ProtocolControllerEventCallbacks {
	ready: () => void;
	error: (err: Error) => void;
}

export type ProtocolControllerEvents = Extract<
	keyof ProtocolControllerEventCallbacks,
	string
>;

export class ProtocolController
	extends TypedEventTarget<ProtocolControllerEventCallbacks>
	implements MACLayer
{
	public constructor(options: ProtocolControllerOptions) {
		super();

		// TODO: When extending the options further, use clone and deep merge with defaults
		this._options = options;
	}

	private _options: ProtocolControllerOptions;

	/**
	 * The host bindings used to access file system etc.
	 */
	// This is set during `start()` and should not be accessed before
	private bindings!: Pick<
		Required<
			NonNullable<ZWaveOptions["host"]>
		>,
		"log"
	>;

	private phyLayer: PHYLayer | undefined;

	// This is set during `start()` and should not be accessed before
	private _logContainer!: LogContainer;
	// This is set during `start()` and should not be accessed before
	private protocolLog!: ProtocolLogger;

	public ownHomeId: number | undefined;
	public ownNodeId: number | undefined;
	public autoAck: boolean = true;

	/** A list of awaited MPDUs */
	private awaitedMPDUs: AwaitedMPDUEntry[] = [];

	private sequenceNumber: number | undefined;

	/** The LR channel this node transmits on */
	private primaryLongRangeChannel: number | undefined;

	private _destroyPromise: DeferredPromise<void> | undefined;
	private get wasDestroyed(): boolean {
		return !!this._destroyPromise;
	}

	public async start(): Promise<void> {
		if (this.wasDestroyed) {
			throw new ZWaveError(
				"The protocol controller was destroyed. Create a new instance and initialize that one.",
				ZWaveErrorCodes.Driver_Destroyed,
			);
		}

		// Populate default bindings. This has to happen asynchronously, so the driver does not have a hard dependency
		// on Node.js internals
		this.bindings = {
			log: this._options.host?.log
				?? (await import("@zwave-js/core/bindings/log/node")).log,
		};

		// Initialize logging
		this._logContainer = this.bindings.log(this._options.logConfig);
		this.protocolLog = new ProtocolLogger(this._logContainer);

		this.phyLayer = await this._options.phy();
		this.phyLayer.on("mpdu received", (mpdu, info) => {
			try {
				this.handleReceivedMPDU(mpdu, info);
			} catch (e) {
				this.emit(
					"error",
					e instanceof Error ? e : new Error(getErrorMessage(e)),
				);
			}
		});

		this.emit("ready");
	}

	private nextSequenceNumber(headerFormat: ProtocolHeaderFormat): number {
		if (headerFormat === ProtocolHeaderFormat.Classic2Channel) {
			// 4 bits, 0x01..0x0f
			this.sequenceNumber ??= 0x00;
			this.sequenceNumber++;
			if (this.sequenceNumber > 0x0f) {
				this.sequenceNumber = 0x01;
			}
			return this.sequenceNumber;
		} else {
			// 8 bits, 0x00..0xff
			this.sequenceNumber ??= 0xff;
			this.sequenceNumber = (this.sequenceNumber + 1) & 0xff;
			return this.sequenceNumber;
		}
	}

	private getProtocolDataRateOrThrow(channel: number): ProtocolDataRate {
		return getProtocolDataRateOrThrow(
			this.phyLayer?.regionConfig?.channels,
			channel,
		);
	}

	private getChannelsForProtocolOrThrow(protocol: Protocols): ChannelInfo[] {
		const allChannels = this.phyLayer?.regionConfig?.channels ?? [];
		const channels = allChannels.filter((ch) =>
			protocol === Protocols.ZWave
				? ch.dataRate === ProtocolDataRate.ZWave_9k6
					|| ch.dataRate === ProtocolDataRate.ZWave_40k
					|| ch.dataRate === ProtocolDataRate.ZWave_100k
				: ch.dataRate === ProtocolDataRate.LongRange_100k
		);
		if (channels.length === 0) {
			throw new ZWaveError(
				`The current region has no ${
					protocol === Protocols.ZWave
						? "classic Z-Wave"
						: "Z-Wave Long Range"
				} channels`,
				ZWaveErrorCodes.Driver_NotSupported,
			);
		}
		return channels;
	}

	private getPrimaryLongRangeChannel(): ChannelInfo {
		const channels = this.getChannelsForProtocolOrThrow(
			Protocols.ZWaveLongRange,
		);
		return channels.find((ch) =>
			ch.channel === this.primaryLongRangeChannel
		)
			?? channels[0];
	}

	private getSecondaryLongRangeChannel(): ChannelInfo {
		const channels = this.getChannelsForProtocolOrThrow(
			Protocols.ZWaveLongRange,
		);
		const primary = this.getPrimaryLongRangeChannel();
		return channels.find((ch) => ch !== primary) ?? primary;
	}

	/** The channel the first transmit attempt of a frame goes out on */
	private getInitialChannel(protocol: Protocols): ChannelInfo {
		if (protocol === Protocols.ZWaveLongRange) {
			return this.getPrimaryLongRangeChannel();
		}
		const channels = this.getChannelsForProtocolOrThrow(protocol);
		return channels.find((ch) =>
			ch.dataRate === ProtocolDataRate.ZWave_100k
		) ?? channels[0];
	}

	/**
	 * Plan the transmit attempts of a frame, in order. G.9959 mandates the number
	 * of attempts, the channel each retry uses is left to the implementation
	 */
	private getAttemptSchedule(
		protocol: Protocols,
		headerFormat: ProtocolHeaderFormat,
	): TransmitAttempt[] {
		const channels = this.getChannelsForProtocolOrThrow(protocol);

		switch (headerFormat) {
			case ProtocolHeaderFormat.LongRange: {
				const attempts: TransmitAttempt[] = Array.from(
					{ length: 1 + MAC_LR_MAX_FRAME_RETRIES },
					() => ({
						channel: () => this.getPrimaryLongRangeChannel(),
						speedModified: false,
					}),
				);

				// The two-LR-channel end device configuration is LR channel
				// configuration 3. §6.5.1.5.4: "If an Ack MPDU is still not received
				// after aMacLRMaxFrameRetries retransmissions, the MAC layer shall
				// switch to the Secondary channel and and repeat the process of
				// transmitting the MPDU and waiting for the Ack MPDU up to
				// aMacLRMaxFrameRetriesSecondary times."
				if (channels.length >= 2) {
					for (
						let i = 0;
						i < MAC_LR_MAX_FRAME_RETRIES_SECONDARY;
						i++
					) {
						attempts.push({
							channel: () => this.getSecondaryLongRangeChannel(),
							speedModified: false,
						});
					}
				}
				return attempts;
			}

			case ProtocolHeaderFormat.Classic3Channel:
				// All three channels of channel configuration 3 run at R3, so there is
				// no speed to fall back to. G.9959 leaves the channel of each retry to
				// the implementation, and we rotate through the channels
				return Array.from(
					{ length: 1 + MAC_MAX_FRAME_RETRIES },
					(_, i) => {
						const channel = channels[i % channels.length];
						return {
							channel: () => channel,
							speedModified: false,
						};
					},
				);

			case ProtocolHeaderFormat.Classic2Channel: {
				const byDataRate = (dataRate: ProtocolDataRate) =>
					channels.find((ch) => ch.dataRate === dataRate);
				const r3 = byDataRate(ProtocolDataRate.ZWave_100k);
				const r2 = byDataRate(ProtocolDataRate.ZWave_40k);
				const r1 = byDataRate(ProtocolDataRate.ZWave_9k6);

				// G.9959 Table 7-3: configuration 1 carries R1 and R2 on its single
				// channel, configuration 2 adds R3 on channel A. A retry can therefore
				// fall back to a slower and more robust rate
				const availableChannels = [r3, r2, r1].filter((ch) =>
					ch != undefined
				);

				// Send the fastest rate twice, then fall back to the slower rates.
				// G.9959 asks for 1 + aMacMaxFrameRetries attempts, so repeat the
				// fastest rate again if the region has fewer rates
				const scheduled = [availableChannels[0], ...availableChannels];
				while (scheduled.length < 1 + MAC_MAX_FRAME_RETRIES) {
					scheduled.unshift(availableChannels[0]);
				}

				const initialBitrate = bitsPerSecond(scheduled[0].dataRate);

				return scheduled.map((ch) => ({
					channel: () => ch,
					// The flag tells the receiver that the frame goes out slower than
					// the rate this transmission started at
					speedModified: bitsPerSecond(ch.dataRate) < initialBitrate,
				}));
			}

			default:
				// oxlint-disable-next-line typescript/restrict-template-expressions
				throw new Error(`Unsupported header format ${headerFormat}`);
		}
	}

	public async transmitData(
		data: BytesView,
		options: MACTransmitOptions,
	): Promise<MACTransmitReport> {
		if (this.phyLayer == undefined) {
			throw new ZWaveError(
				`The PHY layer has not been initialized yet!`,
				ZWaveErrorCodes.Driver_NotReady,
			);
		}

		if (this.phyLayer.regionConfig == undefined) {
			throw new ZWaveError(
				`The current region is not known yet`,
				ZWaveErrorCodes.Driver_NotReady,
			);
		}

		assertRadioTXPower(options.txPower);
		assertInt8(options.lrMpduOverrides?.txPower, "The advertised TX power");
		assertInt8(
			options.lrMpduOverrides?.noiseFloor,
			"The advertised noise floor",
		);

		// If no protocol is specified, make an assumption based on the node ID
		let protocol: Protocols | undefined = options.protocol;
		if (protocol == undefined) {
			switch (options.destination.kind) {
				case MACTransmitKind.Singlecast: {
					const nodeId = options.destination.nodeId;
					if (nodeId <= MAX_NODES || nodeId === NODE_ID_BROADCAST) {
						protocol = Protocols.ZWave;
					} else if (nodeId >= 256) {
						protocol = Protocols.ZWaveLongRange;
					} else {
						throw new ZWaveError(
							`Unable to determine protocol for node ID ${nodeId}`,
							ZWaveErrorCodes.Argument_Invalid,
						);
					}
					break;
				}
				case MACTransmitKind.Multicast: {
					throw new Error("No multicast support yet!");
				}
				case MACTransmitKind.Broadcast: {
					throw new ZWaveError(
						`The protocol must be specified for broadcast transmissions`,
						ZWaveErrorCodes.Argument_Invalid,
					);
				}
			}
		}

		const route = options.route;
		if (route) {
			if (protocol !== Protocols.ZWave) {
				throw new ZWaveError(
					`Source routing is only supported for classic Z-Wave`,
					ZWaveErrorCodes.Argument_Invalid,
				);
			}
			if (options.destination.kind !== MACTransmitKind.Singlecast) {
				throw new ZWaveError(
					`Source routing is only supported for singlecast transmissions`,
					ZWaveErrorCodes.Argument_Invalid,
				);
			}
			// Z-Wave and Z-Wave Long Range Network Layer Specification
			// (2023.05.26), NWK:0019.1: "This field shall be in the range 1…4."
			if (route.length < 1 || route.length > 4) {
				throw new ZWaveError(
					`A route must contain between 1 and 4 repeaters, got ${route.length}`,
					ZWaveErrorCodes.Argument_Invalid,
				);
			}
			for (const repeater of route) {
				// The routing header encodes each repeater in a single byte
				if (
					!Number.isInteger(repeater)
					|| repeater < 1
					|| repeater > MAX_NODES
				) {
					throw new ZWaveError(
						`A repeater must be a node ID between 1 and ${MAX_NODES}, got ${repeater}`,
						ZWaveErrorCodes.Argument_Invalid,
					);
				}
			}
		}

		const initialChannel = this.getInitialChannel(protocol);
		const headerFormat = getProtocolHeaderFormatForDataRate(
			this.phyLayer.regionConfig.region,
			initialChannel.dataRate,
		);
		const attempts = this.getAttemptSchedule(protocol, headerFormat);

		const sequenceNumber = this.nextSequenceNumber(headerFormat);

		// LR frames advertise the power they were sent with, so the radio has to use
		// a known power. Classic frames carry no such field and leave the radio's
		// setting alone
		const radioTXPower = protocol === Protocols.ZWaveLongRange
			? options.txPower ?? LR_DEFAULT_TX_POWER_DBM
			: options.txPower;
		// The MPDU TX Power field is an int8, while the radio accepts 0.1 dBm steps
		const advertisedTXPower = options.lrMpduOverrides?.txPower
			?? Math.round(radioTXPower ?? LR_DEFAULT_TX_POWER_DBM);
		const advertisedNoiseFloor = options.lrMpduOverrides?.noiseFloor
			?? RssiError.NotAvailable;

		let mpdu: MPDU;
		if (protocol == Protocols.ZWave) {
			switch (options.destination.kind) {
				case MACTransmitKind.Singlecast: {
					if (route) {
						mpdu = new RoutedZWaveMPDU({
							homeId: options.homeId,
							// ITU-T G.9959 (01/2015), §9.3: "MPDUs may carry mesh routing
							// information when the "Routed" flag of the frame control field
							// is set or if the "Routed Frame" header type is used."
							// The 3-channel frame control has no routed flag
							headerType: headerFormat
									=== ProtocolHeaderFormat.Classic3Channel
								? MPDUHeaderType.Routed
								: MPDUHeaderType.Singlecast,
							routed: true,
							// Z-Wave and Z-Wave Long Range Network Layer Specification
							// (2023.05.26), NWK:0180.1: "A node sending or repeating a
							// routing frame should not request a MPDU Acknowledgement (ACK
							// Req subfield set to 0 in the MPDU Frame Control). The sending
							// node should instead listen for the next repeater repeat frame
							// and use this as a silent acknowledgement."
							// This is a should, so a caller may still ask for one
							ackRequested: options.ackRequested ?? false,
							sourceNodeId: options.sourceNodeId,
							destinationNodeId: options.destination.nodeId,
							sequenceNumber,
							speedModified: false,
							direction: "outbound",
							routedAck: false,
							routedError: false,
							hop: 0,
							repeaters: [...route],
							// NWK:018E.1: "A node using Channel Configuration 3 shall set the
							// Destination Wake Up field to 0 when transmitting to an AL node."
							// Beaming to FLiRS destinations is not implemented yet
							destinationWakeup: false,
						});
					} else {
						mpdu = new SinglecastZWaveMPDU({
							homeId: options.homeId,
							ackRequested: options.ackRequested ?? true,
							sourceNodeId: options.sourceNodeId,
							destinationNodeId: options.destination.nodeId,
							sequenceNumber,
							speedModified: false,
						});
					}
					break;
				}
				case MACTransmitKind.Multicast: {
					throw new Error("No multicast support yet!");
				}
				case MACTransmitKind.Broadcast: {
					mpdu = new SinglecastZWaveMPDU({
						homeId: options.homeId,
						ackRequested: false,
						sourceNodeId: options.sourceNodeId,
						destinationNodeId: NODE_ID_BROADCAST,
						sequenceNumber,
						speedModified: false,
					});
					break;
				}
			}
		} else {
			// Long Range
			switch (options.destination.kind) {
				case MACTransmitKind.Singlecast: {
					mpdu = new SinglecastLongRangeMPDU({
						homeId: options.homeId,
						ackRequested: options.ackRequested ?? true,
						sourceNodeId: options.sourceNodeId,
						destinationNodeId: options.destination.nodeId,
						sequenceNumber,
						txPower: advertisedTXPower,
						noiseFloor: advertisedNoiseFloor,
					});
					break;
				}
				case MACTransmitKind.Multicast: {
					throw new Error("No multicast support yet!");
				}
				case MACTransmitKind.Broadcast: {
					mpdu = new SinglecastLongRangeMPDU({
						homeId: options.homeId,
						ackRequested: false,
						sourceNodeId: options.sourceNodeId,
						destinationNodeId: NODE_ID_BROADCAST_LR,
						sequenceNumber,
						txPower: advertisedTXPower,
						noiseFloor: advertisedNoiseFloor,
					});
					break;
				}
			}
		}

		// ITU-T G.9959 (01/2015): a transmitting node which receives an ACK MPDU shall
		// accept the sequence number value zero in 2-channel configurations. This
		// exception covers ACK MPDUs, so other frames must match the exact number
		const ackSequenceNumberMatches = (m: MPDU) =>
			m.sequenceNumber === mpdu.sequenceNumber
			|| (m.sequenceNumber === 0
				&& headerFormat === ProtocolHeaderFormat.Classic2Channel);

		let busyAttempts = 0;
		let sawSilentAck = false;
		const isLongRange = headerFormat === ProtocolHeaderFormat.LongRange;
		// How long to back off before the next transmit attempt. Classic Z-Wave
		// waits this long between attempts. Long Range continues the ack wait
		// during the backoff
		let backoff = 0;

		for (let attempt = 0; attempt < attempts.length; attempt++) {
			sawSilentAck = false;

			if (backoff > 0) {
				// G.9959 §8.1.5.1.4.3: "Before retransmitting, the node shall wait for
				// a random backoff period"
				await wait(backoff);
				if (this.wasDestroyed) {
					return { result: MACTransmitResult.Error_Aborted };
				}
			}
			backoff = randomRetransmitDelay(isLongRange);

			// Serializing an MPDU changes its payload property, so we set it here
			// to the original data
			mpdu.payload = Bytes.view(data);

			// Update MPDU settings if necessary
			const { speedModified, channel: getChannel } = attempts[attempt];
			const channel = getChannel();
			if ("speedModified" in mpdu) {
				mpdu.speedModified = speedModified;
			}

			const ctx: MPDUEncodingContext = {
				channel: channel.channel,
				protocolDataRate: channel.dataRate,
				region: this.phyLayer.regionConfig.region,
			};
			const serializedMPDU = mpdu.serialize(ctx);

			this.protocolLog.mpdu(mpdu, ctx, "outbound");

			const result = await this.phyLayer.transmit(
				serializedMPDU,
				// G.9959 §8.1.5.1.2 requires clear channel assessment before transmitting a data frame
				{
					channel: channel.channel,
					txPower: radioTXPower,
					withCCA: options.withCCA ?? true,
				},
			);

			switch (result) {
				case TransmitCallbackStatus.Completed:
					// Wait for ACK
					break;

				case TransmitCallbackStatus.ChannelBusy:
					// TODO: Wait for channel to be free before retrying
					busyAttempts++;
					continue;

				case TransmitResponseStatus.Busy:
					return { result: MACTransmitResult.Error_QueueBusy };

				case TransmitResponseStatus.Overflow:
				case TransmitCallbackStatus.Underflow:
					return { result: MACTransmitResult.Error_FrameLength };

				case TransmitCallbackStatus.Aborted:
					return { result: MACTransmitResult.Error_Aborted };

				case TransmitCallbackStatus.Blocked:
					// This one should not happen, since we're not blocking TX
				case TransmitResponseStatus.InvalidChannel:
				case TransmitResponseStatus.InvalidParam:
					// These two should not happen, since we're checking it all beforehand
				case TransmitCallbackStatus.UnknownError:
				default:
					return { result: MACTransmitResult.Error_Unknown };
			}

			// Transmit was successful

			// G.9959 §8.1.5.1.4.3: "A node that sends a singlecast MPDU with its ACK
			// request subfield set to 1 shall wait for a minimum of
			// aMacMinAckWaitDuration symbols for the corresponding ACK MPDU to be
			// received." The LR spec requires the same in §6.5.1.5.3 with
			// aMacLRMinAckWaitDuration
			const ackTimeout = ackWaitDuration(channel.dataRate, headerFormat);

			if (mpdu instanceof RoutedZWaveMPDU) {
				const routedMPDU = mpdu;

				// NWK:0180.1: repeater 0 repeating the frame is the silent acknowledgement
				// of our transmission. Its repeat carries our source and destination, and
				// travels between repeater 0 and the next hop
				const isSilentAck = (m: MPDU) =>
					m instanceof RoutedZWaveMPDU
					&& m.homeId === routedMPDU.homeId
					&& m.direction === "outbound"
					&& m.sourceNodeId === routedMPDU.sourceNodeId
					&& m.destinationNodeId === routedMPDU.destinationNodeId
					&& m.hop === 1
					&& m.repeaters.length === routedMPDU.repeaters.length
					&& m.repeaters.every((r, i) =>
						r === routedMPDU.repeaters[i]
					)
					&& m.sequenceNumber === routedMPDU.sequenceNumber;

				const isRouteOutcome = (m: MPDU) =>
					m instanceof RoutedZWaveMPDU
					&& m.homeId === routedMPDU.homeId
					&& (m.routedAck || m.routedError)
					// Any hop > 0 is meant for a repeater
					&& m.hop === 0
					&& m.destinationNodeId === routedMPDU.sourceNodeId
					// NWK:0190.1: "The repeater node sending the Routed Error Frame shall
					// set the Source NodeID of the frame as the value of the Destination
					// NodeID of the Routed Frame which delivery failed."
					&& m.sourceNodeId === routedMPDU.destinationNodeId
					&& m.sequenceNumber === routedMPDU.sequenceNumber;

				const duration = frameDuration(
					serializedMPDU.length,
					ctx.protocolDataRate,
					headerFormat,
				);
				// The silent ack is a full repeat of the frame, so it needs the air time of
				// one frame on top of the ack wait duration
				const silentAckTimeout = ackTimeout + duration;
				// A routed ack can arrive without us having seen the silent ack, so both are
				// awaited together until the entire route budget has elapsed
				const deadline = Date.now()
					+ silentAckTimeout
					+ routedAckTimeout(routedMPDU.repeaters.length, duration);

				let outcome = await this.waitForMPDU<RoutedZWaveMPDU>(
					(m) => isSilentAck(m) || isRouteOutcome(m),
					deadline - Date.now(),
				).then((m) => m, () => undefined);

				if (outcome && isSilentAck(outcome)) {
					sawSilentAck = true;
					// The frame is on its way. Wait for the destination to answer with a routed
					// acknowledgement, or for a repeater to report that the route is broken
					outcome = await this.waitForMPDU<RoutedZWaveMPDU>(
						isRouteOutcome,
						Math.max(0, deadline - Date.now()),
					).then((m) => m, () => undefined);
				}

				if (!outcome) continue;

				if (outcome.routedError) {
					// Attempts on a route a repeater just reported as broken are unlikely to
					// succeed, so we let the caller pick a different route
					return {
						result: MACTransmitResult.RoutedError,
						failedHop: outcome.failedHop,
					};
				}

				return {
					result: MACTransmitResult.OK,
					repeaterRSSI: outcome.repeaterRSSI,
				};
			}

			if (!mpdu.ackRequested) return { result: MACTransmitResult.OK };

			// LR §6.5.1.5.5: "If an Ack MPDU is received within the random backoff
			// period and contains the correct HomeID, source NodeID and a matching
			// sequence number, the transmission is considered successful." So LR keeps
			// listening through the backoff, which then no longer delays the retry
			const ackWindow = isLongRange ? ackTimeout + backoff : ackTimeout;
			if (isLongRange) backoff = 0;

			// G.9959 §8.1.5.1.4.3: "If an ACK MPDU is received within
			// aMacMinAckWaitDuration symbols and contains the correct HomeID and
			// source NodeID, the transmission is considered successful"
			const ack = await this.waitForMPDU(
				(m) =>
					m.headerType === MPDUHeaderType.Acknowledgement
					&& m.homeId === mpdu.homeId
					// TODO: This cast is not sound
					&& m.sourceNodeId
						=== (mpdu as SinglecastZWaveMPDU).destinationNodeId
					&& ackSequenceNumberMatches(m),
				ackWindow,
			).then(() => true, () => false);

			if (ack) return { result: MACTransmitResult.OK };
		}

		if (busyAttempts === attempts.length) {
			return { result: MACTransmitResult.ChannelBusy };
		}

		// The last attempt reached the route, so the destination or a repeater dropped it
		if (sawSilentAck) return { result: MACTransmitResult.NoRoutedAck };

		return { result: MACTransmitResult.NoAck };
	}

	// FIXME: Merge logic with transmit()
	public async transmitACK(
		options: MACTransmitAckOptions,
	): Promise<MACTransmitResult> {
		if (this.phyLayer == undefined) {
			throw new ZWaveError(
				`The PHY layer has not been initialized yet!`,
				ZWaveErrorCodes.Driver_NotReady,
			);
		}

		if (this.phyLayer.regionConfig == undefined) {
			throw new ZWaveError(
				`The current region is not known yet`,
				ZWaveErrorCodes.Driver_NotReady,
			);
		}

		// Classic acks carry no radio information, so the radio keeps its power there
		let txPower: number | undefined;
		if (options.protocol === Protocols.ZWaveLongRange) {
			assertRadioTXPower(options.txPower);
			assertInt8(
				options.lrMpduOverrides?.txPower,
				"The advertised TX power",
			);
			assertInt8(options.incomingRSSI, "The incoming RSSI");
			assertInt8(
				options.lrMpduOverrides?.noiseFloor,
				"The advertised noise floor",
			);
			txPower = options.txPower ?? LR_DEFAULT_TX_POWER_DBM;
		}

		let mpdu: MPDU;
		if (options.protocol === Protocols.ZWave) {
			mpdu = new AckZWaveMPDU({
				homeId: options.homeId,
				sourceNodeId: options.sourceNodeId,
				destinationNodeId: options.destinationNodeId,
				sequenceNumber: options.sequenceNumber,
			});
		} else {
			mpdu = new AckLongRangeMPDU({
				homeId: options.homeId,
				sourceNodeId: options.sourceNodeId,
				destinationNodeId: options.destinationNodeId,
				sequenceNumber: options.sequenceNumber,
				// The MPDU TX Power field is an int8, while the radio accepts
				// 0.1 dBm steps
				txPower: options.lrMpduOverrides?.txPower
					?? Math.round(txPower ?? LR_DEFAULT_TX_POWER_DBM),
				incomingRSSI: options.incomingRSSI ?? RssiError.NotAvailable,
				noiseFloor: options.lrMpduOverrides?.noiseFloor
					?? RssiError.NotAvailable,
			});
		}

		const channel = options.channel;
		const ctx: MPDUEncodingContext = {
			channel,
			protocolDataRate: this.getProtocolDataRateOrThrow(channel),
			region: this.phyLayer.regionConfig.region,
		};
		const serializedMPDU = mpdu.serialize(ctx);

		this.protocolLog.mpdu(mpdu, ctx, "outbound");

		const result = await this.phyLayer.transmit(
			serializedMPDU,
			// Acks are exempt from clear channel assessment, so they can be sent
			// within the turnaround time
			{ channel, txPower, withCCA: false },
		);

		switch (result) {
			case TransmitCallbackStatus.Completed:
				return MACTransmitResult.OK;

			case TransmitCallbackStatus.ChannelBusy:
				// TODO: Wait for channel to be free, try again
				return MACTransmitResult.ChannelBusy;

			case TransmitResponseStatus.Busy:
				return MACTransmitResult.Error_QueueBusy;

			case TransmitResponseStatus.Overflow:
			case TransmitCallbackStatus.Underflow:
				return MACTransmitResult.Error_FrameLength;

			case TransmitCallbackStatus.Aborted:
				return MACTransmitResult.Error_Aborted;

			case TransmitCallbackStatus.Blocked:
				// This one should not happen, since we're not blocking TX
			case TransmitResponseStatus.InvalidChannel:
			case TransmitResponseStatus.InvalidParam:
				// These two should not happen, since we're checking it all beforehand
			case TransmitCallbackStatus.UnknownError:
			default:
				return MACTransmitResult.Error_Unknown;
		}
	}

	/** Send the acknowledgements a received frame asks for, in the order they have to go out */
	private async acknowledgeReceivedFrame(
		mpdu: SinglecastZWaveMPDU | RoutedZWaveMPDU | SinglecastLongRangeMPDU,
		info: MpduRxInfo,
		ownNodeId: number,
	): Promise<void> {
		// ITU-T G.9959 (01/2015), §8.1.3.3.2: "A receiving node shall return an ACK MPDU
		// in response to the ACK request." This includes the last hop of a routed frame,
		// where NWK:0180.1 only recommends that the repeater leaves ACK Req clear.
		// NWK:0182.1: "The repeater 0 node shall request an ACK MPDU to the destination
		// NodeID when it repeats a Routed NPDU with the Direction field set to 1 (Routed
		// Error or Routed Acknowledgement frame)."
		if (mpdu.ackRequested) {
			this.protocolLog.print("Acknowledging incoming frame", "verbose");

			await this.transmitACK({
				homeId: mpdu.homeId,
				// For a routed ack or error, this is the spoofed source of the frame,
				// which repeater 0 accepts as the address of its own repeat
				destinationNodeId: mpdu.sourceNodeId,
				sourceNodeId: ownNodeId,
				channel: info.channel,
				sequenceNumber: mpdu.sequenceNumber,
				...(mpdu instanceof LongRangeMPDU
					? {
						protocol: Protocols.ZWaveLongRange,
						incomingRSSI: advertisedRSSI(info.rssi),
					}
					: {
						protocol: Protocols.ZWave,
					}),
			});
		}

		if (isFinalHopOfRoutedFrame(mpdu)) {
			this.protocolLog.print(
				"Acknowledging incoming routed frame",
				"verbose",
			);

			const result = await this.transmitRoutedAck(mpdu, info.channel);
			if (result !== MACTransmitResult.OK) {
				// The originator reports NoRoutedAck when this does not go out,
				// so log why it failed on this end
				this.protocolLog.print(
					`Failed to acknowledge incoming routed frame: ${
						getEnumMemberName(MACTransmitResult, result)
					}`,
					"warn",
				);
			}
		}
	}

	/**
	 * Answer a routed frame that has reached us with a routed acknowledgement.
	 * Must only be called for a frame whose last repeater has transmitted to us.
	 */
	private async transmitRoutedAck(
		frame: RoutedZWaveMPDU,
		channel: number,
	): Promise<MACTransmitResult> {
		if (this.phyLayer?.regionConfig == undefined) {
			throw new ZWaveError(
				`The current region is not known yet`,
				ZWaveErrorCodes.Driver_NotReady,
			);
		}

		if (this.ownNodeId == undefined) {
			throw new ZWaveError(
				`The own node ID is not known yet`,
				ZWaveErrorCodes.Driver_NotReady,
			);
		}

		const region = this.phyLayer.regionConfig.region;
		const protocolDataRate = this.getProtocolDataRateOrThrow(channel);
		const headerFormat = getProtocolHeaderFormatForDataRate(
			region,
			protocolDataRate,
		);

		// Z-Wave and Z-Wave Long Range Network Layer Specification (2023.05.26),
		// NWK:0183.1: "A node receiving a Routed Frame shall return a Routed
		// Acknowledgement using the same route as in the received Routed Frame."
		const mpdu = new RoutedZWaveMPDU({
			homeId: frame.homeId,
			headerType: headerFormat === ProtocolHeaderFormat.Classic3Channel
				? MPDUHeaderType.Routed
				: MPDUHeaderType.Singlecast,
			routed: true,
			// NWK:0180.1 applies to the routed ack too, the last repeater's repeat
			// serves as the silent acknowledgement
			ackRequested: false,
			sourceNodeId: this.ownNodeId,
			destinationNodeId: frame.sourceNodeId,
			sequenceNumber: frame.sequenceNumber,
			// NWK:000D.1: "The 'Speed Modified' subfield from the MPDU Frame Control
			// [G.9959] shall be ignored and this field shall be used instead when a
			// routing header is present." The return path runs at the speed the frame
			// arrived with
			speedModified: frame.speedModified,
			direction: "inbound",
			routedAck: true,
			routedError: false,
			repeaters: frame.repeaters,
			// The ack travels back over the hop the frame just arrived on
			hop: frame.repeaters.length,
			// NWK:0037.1: "A Routed Acknowledgement frame shall not comprise a DLPDU
			// data payload."
			payload: undefined,
			// NWK:018E.1: "A node using Channel Configuration 3 shall set the
			// Destination Wake Up field to 0 when transmitting to an AL node."
			// NWK:0038.1: "A node returning a Routed Acknowledgement shall not include
			// the Destination Wake Up Extension."
			destinationWakeup: false,
			// NWK:0039.1: "A node returning a Routed Acknowledgement should include the
			// Incoming Routed RSSI Extension. If using the Incoming Routed RSSI
			// Extension, a sending node shall set the repeater 0..4 values to 0x7F."
			repeaterRSSI: [
				RssiError.NotAvailable,
				RssiError.NotAvailable,
				RssiError.NotAvailable,
				RssiError.NotAvailable,
			],
		});

		const ctx: MPDUEncodingContext = {
			channel,
			protocolDataRate,
			region,
		};
		const serializedMPDU = mpdu.serialize(ctx);

		this.protocolLog.mpdu(mpdu, ctx, "outbound");

		const result = await this.phyLayer.transmit(
			serializedMPDU,
			// G.9959 §8.1.5.1.2 requires clear channel assessment before transmitting a data frame
			{ channel, withCCA: true },
		);

		switch (result) {
			case TransmitCallbackStatus.Completed:
				return MACTransmitResult.OK;

			case TransmitCallbackStatus.ChannelBusy:
				return MACTransmitResult.ChannelBusy;

			case TransmitResponseStatus.Busy:
				return MACTransmitResult.Error_QueueBusy;

			case TransmitResponseStatus.Overflow:
			case TransmitCallbackStatus.Underflow:
				return MACTransmitResult.Error_FrameLength;

			case TransmitCallbackStatus.Aborted:
				return MACTransmitResult.Error_Aborted;

			default:
				return MACTransmitResult.Error_Unknown;
		}
	}

	private handleReceivedMPDU(mpdu: MPDU, info: MpduRxInfo): void {
		if (this.phyLayer == undefined) {
			throw new ZWaveError(
				`The PHY layer has not been initialized yet!`,
				ZWaveErrorCodes.Driver_NotReady,
			);
		}

		if (this.phyLayer.regionConfig == undefined) {
			throw new ZWaveError(
				`The current region is not known yet`,
				ZWaveErrorCodes.Driver_NotReady,
			);
		}

		const logContext: MPDULogContext = {
			region: this.phyLayer.regionConfig.region,
			...info,
		};

		this.protocolLog.mpdu(mpdu, logContext, "inbound");

		let mustHandle = false;

		// Check if this is a frame we need to acknowledge
		if (mpdu.homeId === this.ownHomeId) {
			// This is a frame from our network

			// Any valid LR frame addressed to us updates the primary channel, acks
			// included. Z-Wave Long Range PHY and MAC Layer Specification
			// (2023.07.03), §6.5.1.4: "When a node receives a frame on channel X and
			// the MAC layer has validated the frame, and has a match on HomeID and
			// NodeID then the node shall set its Primary channel to channel X."
			if (
				this.ownNodeId != undefined
				&& mpdu instanceof LongRangeMPDU
				&& mpdu.destinationNodeId === this.ownNodeId
			) {
				this.primaryLongRangeChannel = info.channel;
			}

			if (
				this.ownNodeId != undefined
				&& (mpdu instanceof SinglecastZWaveMPDU
					|| mpdu instanceof RoutedZWaveMPDU
					|| mpdu instanceof SinglecastLongRangeMPDU)
				&& mpdu.destinationNodeId === this.ownNodeId
			) {
				// This is a frame addressed to us
				if (
					this.autoAck
					&& (mpdu.ackRequested || isFinalHopOfRoutedFrame(mpdu))
				) {
					// A failed ACK behaves like a lost ACK, so it only needs to be logged
					this.acknowledgeReceivedFrame(
						mpdu,
						info,
						this.ownNodeId,
					).catch((e) => {
						this.protocolLog.print(
							`Failed to acknowledge incoming frame: ${
								getErrorMessage(e)
							}`,
							"error",
						);
					});
				} else {
					mustHandle = true;
				}
			}
		}

		// Check if we have a dynamic handler waiting for this mpdu
		for (const entry of this.awaitedMPDUs) {
			if (entry.predicate(mpdu)) {
				// We do
				entry.handler(mpdu);
				return;
			}
		}

		// We don't...
		if (mustHandle) {
			this.protocolLog.print(
				`TODO: No handler for received frame`,
				"warn",
			);
		}
	}

	/**
	 * Waits until an MPDU matching the predicate is received or a timeout has elapsed. Returns the received message.
	 * @param timeout The number of milliseconds to wait. If the timeout elapses, the returned promise will be rejected
	 * @param predicate A predicate function to test all incoming messages.
	 * @param refreshPredicate A predicate function to test partial messages. If this returns `true` for a message, the timer will be restarted.
	 */
	public waitForMPDU<T extends MPDU>(
		predicate: (mpdu: MPDU) => boolean,
		timeout: number,
		abortSignal?: AbortSignal,
	): Promise<T> {
		return new Promise<T>((resolve, reject) => {
			const promise = createDeferredPromise<MPDU>();
			const entry: AwaitedMPDUEntry = {
				predicate,
				handler: (msg) => promise.resolve(msg),
				timeout: undefined,
			};
			this.awaitedMPDUs.push(entry);
			const removeEntry = () => {
				entry.timeout?.clear();
				const index = this.awaitedMPDUs.indexOf(entry);
				if (index !== -1) this.awaitedMPDUs.splice(index, 1);
			};
			// When the timeout elapses, remove the wait entry and reject the returned Promise
			entry.timeout = setTimer(() => {
				removeEntry();
				reject(
					new ZWaveError(
						`Received no matching message within the provided timeout!`,
						ZWaveErrorCodes.Controller_Timeout,
					),
				);
			}, timeout);
			// When the promise is resolved, remove the wait entry and resolve the returned Promise
			void promise.then((cc) => {
				removeEntry();
				resolve(cc as T);
			});
			// When the abort signal is used, silently remove the wait entry
			abortSignal?.addEventListener("abort", () => {
				removeEntry();
			});
		});
	}

	public async destroy(): Promise<void> {
		// Ensure this is only called once and all subsequent calls block
		if (this._destroyPromise) return this._destroyPromise;
		this._destroyPromise = createDeferredPromise();

		this.protocolLog.print("Destroying protocol controller...");

		if (this.phyLayer) {
			this.phyLayer.removeAllListeners();
			await this.phyLayer.destroy();
			this.phyLayer = undefined;
		}

		// Remove all timeouts
		for (const timeout of this.awaitedMPDUs.map((m) => m.timeout)) {
			timeout?.clear();
		}

		this.protocolLog.print("protocol controller destroyed");

		// destroy loggers as the very last thing
		this._logContainer.destroy();

		this._destroyPromise.resolve();
	}
}
