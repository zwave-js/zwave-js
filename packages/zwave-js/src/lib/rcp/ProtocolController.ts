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
	type ProtocolDataRate,
	ProtocolHeaderFormat,
	Protocols,
	RoutedZWaveMPDU,
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
import { Bytes, TypedEventTarget, setTimer } from "@zwave-js/shared";
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
	MACTransmitResult,
} from "./_Types.js";
import type { AwaitedThing } from "./util.js";

type AwaitedMPDUEntry = AwaitedThing<MPDU>;

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

	// host?: ZWaveOptions["host"];

	// /** Specify timeouts in milliseconds */
	// timeouts: {
	// 	/** how long to wait for an ACK */
	// 	ack: number; // >=1, default: 500 ms

	// 	/**
	// 	 * How long to wait for a controller response. Usually this should never elapse, but when it does,
	// 	 * the driver will abort the transmission and try to recover the controller if it is unresponsive.
	// 	 */
	// 	response: number; // [100...10000], default: 1000 ms

	// 	callback: number; // [500...10000], default: 2000 ms
	// };
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
			// fs: this._options.host?.fs
			// 	?? (await import("@zwave-js/core/bindings/fs/node")).fs,
			// serial: this._options.host?.serial
			// 	?? (await import("@zwave-js/serial/bindings/node")).serial,
			log: this._options.host?.log
				?? (await import("@zwave-js/core/bindings/log/node")).log,
		};

		// Initialize logging
		this._logContainer = this.bindings.log(this._options.logConfig);
		this.protocolLog = new ProtocolLogger(this._logContainer);

		this.phyLayer = await this._options.phy();
		this.phyLayer.on("mpdu received", (mpdu, info) => {
			void this.handleReceivedMPDU(mpdu, info);
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
		data: Uint8Array,
		options: MACTransmitOptions,
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
					mpdu = new SinglecastZWaveMPDU({
						homeId: options.homeId,
						ackRequested: options.ackRequested ?? true,
						sourceNodeId: options.sourceNodeId,
						destinationNodeId: options.destination.nodeId,
						sequenceNumber,
						speedModified: false,
					});
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
				// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
				throw new Error(`Unsupported header format ${headerFormat}`);
		}

		attempts: for (let attempt = 0; attempt < maxAttempts; attempt++) {
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
				channel,
			);

			switch (result) {
				case TransmitCallbackStatus.Completed:
					// Wait for ACK
					break;

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

			// Transmit was successful
			if (!mpdu.ackRequested) return MACTransmitResult.OK;

			// Wait for the ACK.
			// If an Ack MPDU is received within the random backoﬀ period (10..40ms)
			// and contains the correct HomeID, source NodeID and a matching sequence number,
			// the transmission is considered successful.
			const ackTimeout = 10 + Math.round(Math.random() * 30);

			const ack = await this.waitForMPDU(
				(m) =>
					m.headerType === MPDUHeaderType.Acknowledgement
					&& m.homeId === mpdu.homeId
					// TODO: This cast is not sound
					&& m.sourceNodeId
						=== (mpdu as SinglecastZWaveMPDU).destinationNodeId
					&& (m.sequenceNumber === mpdu.sequenceNumber
						// For 2-channel configurations, seq-no 0 must also be accepted
						|| (m.sequenceNumber === 0
							&& headerFormat
								=== ProtocolHeaderFormat.Classic2Channel)),
				ackTimeout,
			).then(() => true, () => false);

			if (ack) return MACTransmitResult.OK;
		}

		return MACTransmitResult.NoAck;
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

				// FIXME: Measure these:
				txPower: -6,
				incomingRSSI: -80,
				noiseFloor: -110,
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
			channel,
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
				if (mpdu.ackRequested) {
					// We need to send an ACK
					this.protocolLog.print(
						"Acknowledging incoming frame",
						"verbose",
					);
					void this.transmitACK({
						homeId: mpdu.homeId,
						destinationNodeId: mpdu.sourceNodeId,
						sourceNodeId: this.ownNodeId,
						channel: info.channel,
						sequenceNumber: mpdu.sequenceNumber,
						protocol: mpdu instanceof LongRangeMPDU
							? Protocols.ZWaveLongRange
							: Protocols.ZWave,
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
		for (
			const timeout of [
				...this.awaitedMPDUs.map((m) => m.timeout),
			]
		) {
			timeout?.clear();
		}

		this.protocolLog.print("protocol controller destroyed");

		// destroy loggers as the very last thing
		this._logContainer.destroy();

		this._destroyPromise.resolve();
	}
}
