import {
	type ChannelConfiguration,
	type MPDU,
	type MaybeNotKnown,
	type ProtocolDataRate,
	type RFRegion,
	type RSSI,
	ZWaveError,
	ZWaveErrorCodes,
} from "@zwave-js/core";
import type {
	ChannelInfo,
	TransmitCallbackStatus,
	TransmitResponseStatus,
} from "@zwave-js/serial";
import type {
	BytesView,
	EventListener,
	TypedEventTarget,
} from "@zwave-js/shared";

export interface RegionConfig {
	region: RFRegion;
	channelConfig: ChannelConfiguration;
	channels: ChannelInfo[];
}

export type TransmitResult = TransmitResponseStatus | TransmitCallbackStatus;

/** Look up the data rate of a channel, throwing if the current region does not have it */
export function getProtocolDataRateOrThrow(
	channels: MaybeNotKnown<readonly ChannelInfo[]>,
	channel: number,
): ProtocolDataRate {
	const protocolDataRate = channels?.find((ch) => ch.channel === channel)
		?.dataRate;
	if (protocolDataRate == undefined) {
		throw new ZWaveError(
			`The channel ${channel} is not supported in the current region`,
			ZWaveErrorCodes.Driver_NotSupported,
		);
	}
	return protocolDataRate;
}

export interface TransmitOptions {
	channel: number;
	/**
	 * The transmit power in dBm, in steps of 0.1 dBm.
	 * If omitted, the firmware keeps its current setting.
	 */
	txPower?: number;
	/**
	 * Whether to perform clear channel assessment before transmitting.
	 * Required, so that omitting it cannot silently skip CCA
	 */
	withCCA: boolean;
}

export interface TransmitBeamOptions {
	/**
	 * The transmit power in dBm, in steps of 0.1 dBm.
	 * If omitted, the firmware keeps its current setting.
	 */
	txPower?: number;
	numFragments: number;
	fragmentDurationMs: number;
	fragmentPeriodMs: number;
	/** The channels the beam fragments are transmitted on, in order */
	channels: number[];
	data: BytesView;
}

export interface MpduRxInfo {
	channel: number;
	rssi: RSSI;
	protocolDataRate: ProtocolDataRate;
}

export interface PHYLayerEventCallbacks {
	"mpdu received": (mpdu: MPDU, info: MpduRxInfo) => void;
	[others: string]: EventListener;
}

export type PHYLayerEvents = Extract<keyof PHYLayerEventCallbacks, string>;

/** Defines functionality that must be provided by the PHY layer */
export interface PHYLayer extends TypedEventTarget<PHYLayerEventCallbacks> {
	/** Query the currently configured region settings and capabilities */
	queryRegion(): Promise<RegionConfig>;

	/** Return cached information about the current region settings */
	get regionConfig(): MaybeNotKnown<RegionConfig>;

	/** Configure the region and channel config, returning the capabilities of the newly configured region */
	setRegion(
		region: RFRegion,
		channelConfig: ChannelConfiguration,
	): Promise<ChannelInfo[]>;

	/** Transmit an MPDU on the given channel and return the result of this transmit attempt */
	transmit(
		mpdu: BytesView,
		options: TransmitOptions,
	): Promise<TransmitResult>;

	/**
	 * Transmit a beam and return the result of this transmit attempt.
	 * The firmware executes the beam autonomously and only reports back when it is done or was aborted.
	 */
	transmitBeam(options: TransmitBeamOptions): Promise<TransmitResult>;

	/** Stop an ongoing beam transmission */
	abortBeam(): Promise<void>;

	/** Destroys this PHY layer instance */
	destroy(): Promise<void>;
}

export type PHYLayerFactory = () => Promise<PHYLayer>;
