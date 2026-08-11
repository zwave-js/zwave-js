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
	channel: ChannelInfo;
	speedModified: boolean;
}

/** ITU-T G.9959 (01/2015), Table 8-19: aMacMinRetransmitDelay, "Random backoff shall be higher than this value" */
const MAC_MIN_RETRANSMIT_DELAY = 10;

/** ITU-T G.9959 (01/2015), Table 8-19: aMacMaxRetransmitDelay, "Random backoff shall be lower than this value" */
const MAC_MAX_RETRANSMIT_DELAY = 40;

/** Extra time each hop gets on top of the frame duration, covering repeater processing and turnaround */
const ROUTED_HOP_MARGIN = 10;

/** ITU-T G.9959 (01/2015), Table 7-27: aPhyTurnaroundTimerRXTX, "RX-to-TX minimum turnaround time" */
const PHY_TURNAROUND_TIME_RX_TX = 1;

/**
 * Extra time the host grants an ack on top of the MAC ack wait duration. The
 * spec assumes the radio itself decides, while an ack seen by the RCP firmware
 * still has to travel over the serial connection before we can match it
 */
const ACK_HOST_TRANSPORT_ALLOWANCE = 10;

/** TX power advertised in LR MPDUs when the caller does not specify one */
const LR_DEFAULT_TX_POWER = 14;

/** Noise floor advertised in LR MPDUs. Placeholder until the firmware can measure it */
const LR_DEFAULT_NOISE_FLOOR = -110;

/** Incoming RSSI advertised in LR ack MPDUs when the frame arrived without a usable measurement */
const LR_DEFAULT_INCOMING_RSSI = -80;

/** ITU-T G.9959 (01/2015), Table 8-18: aMacMaxFrameRetries, "The number of retries after a transmission failure" */
const MAC_MAX_FRAME_RETRIES = 2;

/**
 * Z-Wave Long Range PHY and MAC Layer Specification (2023.07.03), Table 6-32:
 * aMacLRMaxFrameRetries, "The number of retries after a transmission failure"
 */
const MAC_LR_MAX_FRAME_RETRIES = 2;

/**
 * Z-Wave Long Range PHY and MAC Layer Specification (2023.07.03), Table 6-32:
 * aMacLRMaxFrameRetriesSecondary, "The number of retries on the secondary
 * channel when running channel configuration 3"
 */
const MAC_LR_MAX_FRAME_RETRIES_SECONDARY = 1;

/** How long to wait for an ack after a transmission, in milliseconds */
function ackWaitDuration(
	dataRate: ProtocolDataRate,
	headerFormat: ProtocolHeaderFormat,
): number {
	// ITU-T G.9959 (01/2015), Table 8-19 and Z-Wave Long Range PHY and MAC Layer
	// Specification (2023.07.03), Table 6-33: "The number of symbols of an ACK
	// MPDU; including preamble"
	let ackBits: number;
	let bitrate: number;
	switch (dataRate) {
		case ProtocolDataRate.ZWave_9k6:
			ackBits = 168;
			bitrate = 9600;
			break;
		case ProtocolDataRate.ZWave_40k:
			ackBits = 248;
			bitrate = 40000;
			break;
		case ProtocolDataRate.LongRange_100k:
			ackBits = 448;
			bitrate = 100000;
			break;
		default:
			ackBits = headerFormat === ProtocolHeaderFormat.Classic3Channel
				? 296
				: 416;
			bitrate = 100000;
			break;
	}

	// ITU-T G.9959 (01/2015), Table 8-18: aMacMinAckWaitDuration is
	// "aPhyTurnaroundTimeRxTx + (aMacTransferAckTimeTX * (1/data rate))".
	// The LR spec defines aMacLRMinAckWaitDuration the same way in Table 6-32
	return PHY_TURNAROUND_TIME_RX_TX
		+ ackBits * 1000 / bitrate
		+ ACK_HOST_TRANSPORT_ALLOWANCE;
}

/**
 * ITU-T G.9959 (01/2015), §8.1.5.1.4.4: "The random delay shall be calculated as
 * a period in the interval aMacMinRetransmitDelay .. aMacMaxRetransmitDelay"
 */
function randomRetransmitDelay(): number {
	return MAC_MIN_RETRANSMIT_DELAY
		+ Math.round(
			Math.random()
				* (MAC_MAX_RETRANSMIT_DELAY - MAC_MIN_RETRANSMIT_DELAY),
		);
}

/** How long a frame of the given length occupies the channel, in milliseconds */
export function frameDuration(
	frameLength: number,
	dataRate: ProtocolDataRate,
	headerFormat: ProtocolHeaderFormat,
): number {
	let bitrate: number;
	// ITU-T G.9959 (01/2015), Table 7-10: the minimum singlecast preamble is 10 bytes
	// for R1 and R2. R3 uses 40 bytes in channel configuration 2 and 24 bytes in
	// channel configuration 3
	let preambleLength: number;
	switch (dataRate) {
		case ProtocolDataRate.ZWave_9k6:
			bitrate = 9600;
			preambleLength = 10;
			break;
		case ProtocolDataRate.ZWave_40k:
			bitrate = 40000;
			preambleLength = 10;
			break;
		default:
			bitrate = 100000;
			preambleLength =
				headerFormat === ProtocolHeaderFormat.Classic3Channel ? 24 : 40;
			break;
	}

	return (frameLength + preambleLength) * 8 * 1000 / bitrate;
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
	const timeout = numHops * (frameDurationMs + ROUTED_HOP_MARGIN);

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

	/**
	 * The LR channel this node transmits on, per Z-Wave Long Range PHY and MAC
	 * Layer Specification (2023.07.03), §6.5.1.4: "When a node receives a frame
	 * on channel X and the MAC layer has validated the frame, and has a match on
	 * HomeID and NodeID then the node shall set its Primary channel to channel X."
	 */
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

	/** Split the channels of the current region into the protocols they carry */
	private classifyChannels(): {
		classic: ChannelInfo[];
		longRange: ChannelInfo[];
	} {
		const channels = this.phyLayer?.regionConfig?.channels ?? [];
		return {
			classic: channels.filter((ch) =>
				ch.dataRate === ProtocolDataRate.ZWave_9k6
				|| ch.dataRate === ProtocolDataRate.ZWave_40k
				|| ch.dataRate === ProtocolDataRate.ZWave_100k
			),
			longRange: channels.filter((ch) =>
				ch.dataRate === ProtocolDataRate.LongRange_100k
			),
		};
	}

	private getChannelsForProtocolOrThrow(protocol: Protocols): ChannelInfo[] {
		const { classic, longRange } = this.classifyChannels();
		const channels = protocol === Protocols.ZWave ? classic : longRange;
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
				const primary = this.getPrimaryLongRangeChannel();
				const attempts: TransmitAttempt[] = Array.from(
					{ length: 1 + MAC_LR_MAX_FRAME_RETRIES },
					() => ({ channel: primary, speedModified: false }),
				);

				// The two-LR-channel end device configuration is LR channel
				// configuration 3. §6.5.1.5.4: "If an Ack MPDU is still not received
				// after aMacLRMaxFrameRetries retransmissions, the MAC layer shall
				// switch to the Secondary channel and and repeat the process of
				// transmitting the MPDU and waiting for the Ack MPDU up to
				// aMacLRMaxFrameRetriesSecondary times."
				const secondary = channels.find((ch) => ch !== primary);
				if (secondary) {
					for (
						let i = 0;
						i < MAC_LR_MAX_FRAME_RETRIES_SECONDARY;
						i++
					) {
						attempts.push({
							channel: secondary,
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
					(_, i) => ({
						channel: channels[i % channels.length],
						speedModified: false,
					}),
				);

			case ProtocolHeaderFormat.Classic2Channel: {
				const byDataRate = (dataRate: ProtocolDataRate) =>
					channels.find((ch) => ch.dataRate === dataRate);
				const r3 = byDataRate(ProtocolDataRate.ZWave_100k);
				const r2 = byDataRate(ProtocolDataRate.ZWave_40k);
				const r1 = byDataRate(ProtocolDataRate.ZWave_9k6);

				// Channel configurations 1 and 2 pair each channel with a data rate, so
				// a retry can fall back to a slower and more robust one. Trying the
				// fastest channel twice before falling back is Z-Wave practice layered
				// over the 1 + aMacMaxFrameRetries attempts G.9959 mandates
				return [
					{ channel: r3, speedModified: false },
					{ channel: r3, speedModified: false },
					{ channel: r2, speedModified: true },
					{ channel: r1, speedModified: true },
				].filter((a): a is TransmitAttempt => a.channel != undefined);
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

		const advertisedTXPower = options.advertised?.txPower
			?? options.txPower
			?? LR_DEFAULT_TX_POWER;
		const advertisedNoiseFloor = options.advertised?.noiseFloor
			?? LR_DEFAULT_NOISE_FLOOR;

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

		for (let attempt = 0; attempt < attempts.length; attempt++) {
			sawSilentAck = false;

			// G.9959 §8.1.5.1.4.3: "Before retransmitting, the node shall wait for a
			// random backoff period"
			if (attempt > 0) await wait(randomRetransmitDelay());

			// Serializing an MPDU changes its payload property, so we set it here
			// to the original data
			mpdu.payload = Bytes.view(data);

			// Update MPDU settings if necessary
			const { speedModified, channel } = attempts[attempt];
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
					txPower: options.txPower,
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
			// received."
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

			// §8.1.5.1.4.3: "If an ACK MPDU is received within aMacMinAckWaitDuration
			// symbols and contains the correct HomeID and source NodeID, the
			// transmission is considered successful"
			const ack = await this.waitForMPDU(
				(m) =>
					m.headerType === MPDUHeaderType.Acknowledgement
					&& m.homeId === mpdu.homeId
					// TODO: This cast is not sound
					&& m.sourceNodeId
						=== (mpdu as SinglecastZWaveMPDU).destinationNodeId
					&& ackSequenceNumberMatches(m),
				ackTimeout,
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
				txPower: options.advertised?.txPower
					?? options.txPower
					?? LR_DEFAULT_TX_POWER,
				incomingRSSI: options.advertised?.incomingRSSI
					?? LR_DEFAULT_INCOMING_RSSI,
				noiseFloor: options.advertised?.noiseFloor
					?? LR_DEFAULT_NOISE_FLOOR,
			});
		}

		const txPower = options.protocol === Protocols.ZWaveLongRange
			? options.txPower
			: undefined;

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
			// Acks are exempt from CCA to meet the turnaround timing
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
						advertised: {
							// The sender's own power is the best estimate we have until
							// the firmware reports the power it transmitted with
							txPower: mpdu.txPower,
							incomingRSSI: isRssiError(info.rssi)
								? LR_DEFAULT_INCOMING_RSSI
								: info.rssi,
						},
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
			if (
				this.ownNodeId != undefined
				&& (mpdu instanceof SinglecastZWaveMPDU
					|| mpdu instanceof RoutedZWaveMPDU
					|| mpdu instanceof SinglecastLongRangeMPDU)
				&& mpdu.destinationNodeId === this.ownNodeId
			) {
				// This is a frame addressed to us
				if (info.protocolDataRate === ProtocolDataRate.LongRange_100k) {
					this.primaryLongRangeChannel = info.channel;
				}

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
