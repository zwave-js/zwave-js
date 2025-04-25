import type {
	ChannelConfiguration,
	MPDU,
	MaybeNotKnown,
	ProtocolDataRate,
	RFRegion,
	RSSI,
} from "@zwave-js/core";
import type { ChannelInfo } from "@zwave-js/serial";
import type { EventListener, TypedEventTarget } from "@zwave-js/shared";

export interface RegionConfig {
	region: RFRegion;
	channelConfig: ChannelConfiguration;
	channels: ChannelInfo[];
}

export type TransmitResult = unknown;

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
	transmit(mpdu: Uint8Array, channel: number): Promise<TransmitResult>;

	/** Destroys this PHY layer instance */
	destroy(): Promise<void>;
}

export type PHYLayerFactory = () => Promise<PHYLayer>;
