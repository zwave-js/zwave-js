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
	getProtocolHeaderFormat,
	rfRegionToRadioProtocolMode,
} from "@zwave-js/core";
import {
	TransmitCallbackStatus,
	TransmitResponseStatus,
} from "@zwave-js/serial";
import {
	type AwaitedThing,
	Bytes,
	type BytesView,
	TypedEventTarget,
	getErrorMessage,
	setTimer,
} from "@zwave-js/shared";
import {
	type DeferredPromise,
	createDeferredPromise,
} from "alcalzone-shared/deferred-promise";
import type { ZWaveOptions } from "../driver/ZWaveOptions.js";
import { ProtocolLogger } from "../log/Protocol.js";
import type { MACLayer } from "./MACLayer.js";
import type { MpduRxInfo, PHYLayer, PHYLayerFactory } from "./PHYLayer.js";
import {
	type MACTransmitAckOptions,
	MACTransmitKind,
	type MACTransmitOptions,
	type MACTransmitReport,
	MACTransmitResult,
} from "./_Types.js";

type AwaitedMPDUEntry = AwaitedThing<MPDU>;

/** ITU-T G.9959 (01/2015), Table 8-18: aMacMaxFrameRetries, "The number of retries after a transmission failure" */
const MAC_MAX_FRAME_RETRIES = 2;

/** Upper end of the random backoff period a node waits for an MPDU ack */
const MAC_MAX_ACK_WAIT_TIME = 40;

/**
 * Time to wait for a routed acknowledgement or routed error, measured from the moment
 * repeater 0 has repeated the frame.
 */
function routedAckTimeout(
	numRepeaters: number,
	dataRate: ProtocolDataRate,
	frameLength: number,
): number {
	let bitrate: number;
	// ITU-T G.9959 (01/2015), Table 7-10: the minimum preamble length is 10 bytes
	// for R1 and R2, and 40 bytes for R3 in channel configuration 2
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
			preambleLength = 40;
			break;
	}

	const frameDuration = (frameLength + preambleLength) * 8 * 1000 / bitrate;
	// Each hop may be transmitted (1 + aMacMaxFrameRetries) times, with a backoff between attempts
	const hopDuration = (1 + MAC_MAX_FRAME_RETRIES) * frameDuration
		+ MAC_MAX_FRAME_RETRIES * MAC_MAX_ACK_WAIT_TIME;
	// The frame travels over the remaining hops to the destination, the routed
	// acknowledgement over the entire route back
	const numHops = 2 * numRepeaters + 1;

	// Z-Wave and Z-Wave Long Range Network Layer Specification (2023.05.26),
	// Table 4.28: aNwkRoutedAckTimeout is the "Timeout for considering that a
	// particular Routed Frame has been lost and will not return any Routed
	// Acknowledgement or Routed Error." with a range of 18ms..1000ms
	return Math.min(1000, Math.max(18, Math.ceil(numHops * hopDuration)));
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
		const protocolDataRate = this.phyLayer?.regionConfig?.channels?.find((
			ch,
		) => ch.channel === channel)?.dataRate;
		if (protocolDataRate == undefined) {
			throw new ZWaveError(
				`The channel ${channel} is not supported in the current region`,
				ZWaveErrorCodes.Driver_NotSupported,
			);
		}
		return protocolDataRate;
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
			if (route.repeaters.length < 1 || route.repeaters.length > 4) {
				throw new ZWaveError(
					`A route must contain between 1 and 4 repeaters, got ${route.repeaters.length}`,
					ZWaveErrorCodes.Argument_Invalid,
				);
			}
		}

		let initialChannel: number;
		if (protocol === Protocols.ZWave) {
			initialChannel = 0;
		} else {
			// TODO: Figure out if this is correct for LR-only configurations
			initialChannel = 3;
		}

		const headerFormat = getProtocolHeaderFormat(
			rfRegionToRadioProtocolMode(this.phyLayer.regionConfig.region),
			initialChannel,
		);

		const sequenceNumber = this.nextSequenceNumber(headerFormat);

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
							ackRequested: false,
							sourceNodeId: options.sourceNodeId,
							destinationNodeId: options.destination.nodeId,
							sequenceNumber,
							speedModified: false,
							direction: "outbound",
							routedAck: false,
							routedError: false,
							hop: 0,
							repeaters: route.repeaters,
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

						// FIXME: Measure those:
						txPower: -6,
						noiseFloor: -110,
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

						// FIXME: Measure those:
						txPower: -6,
						noiseFloor: -110,
					});
					break;
				}
			}
		}

		// FIXME: Find a good heuristic
		let maxAttempts: number;
		let settingsForAttempt: {
			channel: number;
			speedModified: boolean;
		}[] | undefined;
		switch (headerFormat) {
			case ProtocolHeaderFormat.Classic2Channel:
				// FIXME: aMacMaxFrameRetries = 2, we retry 3x
				// Try twice on channel 0,
				// once with speed modified (ch. 1)
				// once with speed modified (ch. 2)
				// FIXME: Skip attempts if we start on another channel
				maxAttempts = 4;
				settingsForAttempt = [
					{
						channel: 0,
						speedModified: false,
					},
					{
						channel: 0,
						speedModified: false,
					},
					{
						channel: 1,
						speedModified: true,
					},
					{
						channel: 2,
						speedModified: true,
					},
				];
				break;
			case ProtocolHeaderFormat.Classic3Channel:
				throw new Error("3-channel regions are not supported yet");
			case ProtocolHeaderFormat.LongRange:
				// Try 3 times on the same channel
				maxAttempts = 3;
				break;
			default:
				// oxlint-disable-next-line typescript/restrict-template-expressions
				throw new Error(`Unsupported header format ${headerFormat}`);
		}

		const sequenceNumberMatches = (m: MPDU) =>
			m.sequenceNumber === mpdu.sequenceNumber
			// For 2-channel configurations, seq-no 0 must also be accepted
			|| (m.sequenceNumber === 0
				&& headerFormat === ProtocolHeaderFormat.Classic2Channel);

		let busyAttempts = 0;
		let sawSilentAck = false;

		for (let attempt = 0; attempt < maxAttempts; attempt++) {
			// Serializing an MPDU changes its payload property, so we set it here
			// to the original data
			mpdu.payload = Bytes.view(data);

			// Update MPDU settings if necessary
			const { speedModified, channel } = settingsForAttempt?.[attempt]
				?? {
					channel: initialChannel,
					speedModified: false,
				};
			if ("speedModified" in mpdu) {
				mpdu.speedModified = speedModified;
			}

			const ctx: MPDUEncodingContext = {
				channel,
				protocolDataRate: this.getProtocolDataRateOrThrow(channel),
				region: this.phyLayer.regionConfig.region,
			};
			const serializedMPDU = mpdu.serialize(ctx);

			this.protocolLog.mpdu(mpdu, ctx, "outbound");

			const result = await this.phyLayer.transmit(
				serializedMPDU,
				// G.9959 §8.1.5.1.2 requires clear channel assessment before transmitting a data frame
				{ channel, withCCA: options.withCCA ?? true },
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

			// An Ack MPDU or a repeat is expected within the random backoff period (10..40ms)
			const ackTimeout = 10 + Math.round(Math.random() * 30);

			if (mpdu instanceof RoutedZWaveMPDU) {
				const routedMPDU = mpdu;

				// NWK:0180.1: repeater 0 repeating the frame is the silent acknowledgement
				// of our transmission. Its repeat carries our source and destination, and
				// travels between repeater 0 and the next hop
				const silentAck = await this.waitForMPDU(
					(m) =>
						m instanceof RoutedZWaveMPDU
						&& m.homeId === routedMPDU.homeId
						&& m.direction === "outbound"
						&& m.sourceNodeId === routedMPDU.sourceNodeId
						&& m.destinationNodeId === routedMPDU.destinationNodeId
						&& m.hop === 1
						&& sequenceNumberMatches(m),
					ackTimeout,
				).then(() => true, () => false);

				if (!silentAck) continue;
				sawSilentAck = true;

				// The frame is on its way. Wait for the destination to answer with a routed
				// acknowledgement, or for a repeater to report that the route is broken
				const outcome = await this.waitForMPDU<RoutedZWaveMPDU>(
					(m) =>
						m instanceof RoutedZWaveMPDU
						&& m.homeId === routedMPDU.homeId
						&& (m.routedAck || m.routedError)
						&& m.destinationNodeId === routedMPDU.sourceNodeId
						// NWK:0190.1: "The repeater node sending the Routed Error Frame shall
						// set the Source NodeID of the frame as the value of the Destination
						// NodeID of the Routed Frame which delivery failed."
						&& m.sourceNodeId === routedMPDU.destinationNodeId
						&& sequenceNumberMatches(m),
					routedAckTimeout(
						routedMPDU.repeaters.length,
						ctx.protocolDataRate,
						serializedMPDU.length,
					),
				).then((m) => m, () => undefined);

				if (!outcome) continue;

				if (outcome.routedError) {
					// Retrying over a route a repeater just reported as broken is pointless
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

			// If an Ack MPDU is received within the backoff period and contains the correct
			// HomeID, source NodeID and a matching sequence number, the transmission is
			// considered successful.
			const ack = await this.waitForMPDU(
				(m) =>
					m.headerType === MPDUHeaderType.Acknowledgement
					&& m.homeId === mpdu.homeId
					// TODO: This cast is not sound
					&& m.sourceNodeId
						=== (mpdu as SinglecastZWaveMPDU).destinationNodeId
					&& sequenceNumberMatches(m),
				ackTimeout,
			).then(() => true, () => false);

			if (ack) return { result: MACTransmitResult.OK };
		}

		if (busyAttempts === maxAttempts) {
			return { result: MACTransmitResult.ChannelBusy };
		}

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
			// FIXME: Measure these:
			const incomingRSSI = -80;
			const noiseFloor = -110;

			mpdu = new AckLongRangeMPDU({
				homeId: options.homeId,
				sourceNodeId: options.sourceNodeId,
				destinationNodeId: options.destinationNodeId,
				sequenceNumber: options.sequenceNumber,

				// FIXME: Dynamically decide on the TX power and actually use it in firmware
				txPower: options.senderTXPower,
				incomingRSSI,
				noiseFloor,
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
			// Acks are exempt from CCA to meet the turnaround timing
			{ channel, withCCA: false },
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
		const headerFormat = getProtocolHeaderFormat(
			rfRegionToRadioProtocolMode(region),
			channel,
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
			speedModified: false,
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
			protocolDataRate: this.getProtocolDataRateOrThrow(channel),
			region,
		};
		const serializedMPDU = mpdu.serialize(ctx);

		this.protocolLog.mpdu(mpdu, ctx, "outbound");

		const result = await this.phyLayer.transmit(
			serializedMPDU,
			// The routed ack has to be sent within the route timing, so it skips
			// clear channel assessment like an MPDU ack does
			{ channel, withCCA: false },
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
				if (
					// The last repeater of a route has delivered the frame to us
					this.autoAck
					&& mpdu instanceof RoutedZWaveMPDU
					&& mpdu.direction === "outbound"
					&& mpdu.hop === mpdu.repeaters.length
				) {
					this.protocolLog.print(
						"Acknowledging incoming routed frame",
						"verbose",
					);
					// A failed ACK behaves like a lost ACK, so it only needs to be logged
					this.transmitRoutedAck(mpdu, info.channel).catch((e) => {
						this.protocolLog.print(
							`Failed to acknowledge incoming routed frame: ${
								getErrorMessage(e)
							}`,
							"error",
						);
					});
				} else if (this.autoAck && mpdu.ackRequested) {
					// We need to send an ACK. NWK:0182.1: "The repeater 0 node
					// shall request an ACK MPDU to the destination NodeID when
					// it repeats a Routed NPDU with the Direction field set to 1
					// (Routed Error or Routed Acknowledgement frame)."
					this.protocolLog.print(
						"Acknowledging incoming frame",
						"verbose",
					);
					// A failed ACK behaves like a lost ACK, so it only needs to be logged
					this.transmitACK({
						homeId: mpdu.homeId,
						// For a routed ack or error, this is the spoofed source of the frame,
						// which repeater 0 accepts as the address of its own repeat
						destinationNodeId: mpdu.sourceNodeId,
						sourceNodeId: this.ownNodeId,
						channel: info.channel,
						sequenceNumber: mpdu.sequenceNumber,
						...(mpdu instanceof LongRangeMPDU
							? {
								protocol: Protocols.ZWaveLongRange,
								senderTXPower: mpdu.txPower,
								senderNoiseFloor: mpdu.noiseFloor,
							}
							: {
								protocol: Protocols.ZWave,
							}),
					}).catch((e) => {
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
