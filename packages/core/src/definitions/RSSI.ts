import { Bytes } from "@zwave-js/shared";
import { ChannelConfiguration } from "../protocol/_Types.js";

/** A number between -128 and +124 dBm or one of the special values in {@link RssiError} indicating an error */
export type RSSI = number | RssiError;

export enum RssiError {
	NotAvailable = 127,
	ReceiverSaturated = 126,
	NoSignalDetected = 125,
}

export function parseRSSI(payload: Uint8Array, offset: number = 0): RSSI {
	const ret = Bytes.view(payload).readInt8(offset);
	// Filter out reserved values
	// TODO: Figure out for which controllers this is relevant
	// if (
	// 	ret >= RSSI_RESERVED_START &&
	// 	ret < RssiError.NoSignalDetected
	// ) {
	// 	ret = RssiError.NotAvailable;
	// }
	return ret;
}

export function tryParseRSSI(
	payload: Uint8Array,
	offset: number = 0,
): RSSI | undefined {
	if (payload.length <= offset) return;
	return parseRSSI(payload, offset);
}

export function isRssiError(rssi: RSSI): rssi is RssiError {
	return rssi >= RssiError.NoSignalDetected;
}

/** Averages RSSI measurements using an exponential moving average with the given weight for the accumulator */
export function averageRSSI(
	acc: number | undefined,
	rssi: RSSI,
	weight: number,
): number {
	if (isRssiError(rssi)) {
		switch (rssi) {
			case RssiError.NotAvailable:
				// If we don't have a value yet, return 0
				return acc ?? 0;
			case RssiError.ReceiverSaturated:
				// Assume rssi is 0 dBm
				rssi = 0;
				break;
			case RssiError.NoSignalDetected:
				// Assume rssi is -128 dBm
				rssi = -128;
				break;
		}
	}

	if (acc == undefined) return rssi;
	return Math.round(acc * weight + rssi * (1 - weight));
}

/**
 * Converts an RSSI value to a human readable format, i.e. the measurement including the unit or the corresponding error message.
 */
export function rssiToString(rssi: RSSI): string {
	switch (rssi) {
		case RssiError.NotAvailable:
			return "N/A";
		case RssiError.ReceiverSaturated:
			return "Receiver saturated";
		case RssiError.NoSignalDetected:
			return "No signal detected";
		default:
			return `${rssi} dBm`;
	}
}

// The following conversion routines were Given to us by a helpful green dragon
// who looked at compiled Z-Wave binaries for us:

// dprint-ignore
const rssiConversionTable_Classic = [
	-110, -108, -107, -105, -104, -103, -102, -101, -100, -99, -98,
	 -97,  -96,  -95,  -94,  -93,  -93,  -92,  -92,  -92, -91, -91,
	 -91,  -90,  -90,  -89,  -89,  -88,  -88,  -87,  -87, -86, -86,
	 -85,  -84,  -83,  -83,  -82,  -81,  -80,  -79,  -79, -78, -77,
	 -78,  -75,  -74,  -73,  -72,  -71,  -70,  -69,  -69, -68, -67,
	 -66,  -65,  -64,  -63,  -62,  -61,  -60,  -59,  -58, -57, -56,
	 -55,  -54,  -53,  -52,  -51,  -50,  -49,  -48,  -47, -46, -45,
	 -44,  -43,  -42,  -41,  -41,  -40,  -39,  -38,  -37, -36, -35,
	 -34,  -33,  -32,  -31,  -30,  -29,  -28,  -27,  -26, -25, -24,
	 -23,  -22,  -21,  -20,  -19,  -18,  -17,  -15,  -14, -13, -13,
	 -12,  -10,   -9,   -8,   -7,   -6,   -5,   -4,   -3,  -2,  -1,
];

// dprint-ignore
const rssiConversionTable_LROnly = [
	-60, -60, -59, -58, -57, -56,
	-55, -54, -53, -52, -52, -52,
	-51, -51, -51, -51, -51, -50,
];

// dprint-ignore
const rssiConversionTable_ClassicPlusLR_40k_9k6 = [
	-99, -98, -98, -97, -96, -94, -93,
	-92, -91, -90, -90, -89, -89, -89,
	-89, -88, -87, -86, -85, -85, -84,
	-83, -81, -80, -79, -78, -78, -78,
	-77, -77, -77, -77, -76, -76, -75
];

// dprint-ignore
const rssiConversionTable_ClassicPlusLR_100k = [
	-88, -87, -87, -86, -86,
	-85, -85, -84, -84, -83,
	-83, -83, -82, -81, -81,
	-80, -79, -78, -78, -77,
	-76
];

/** Converts raw RSSI values into dBm */
export function convertRawRSSI(
	rssi: number,
	channelConfig: ChannelConfiguration,
	channel: number,
): RSSI {
	if (rssi >= 31) return rssi;

	if (channelConfig === ChannelConfiguration.Classic) {
		// Classic only
		return convertRawRSSI_Classic(rssi);
	}

	if (
		channelConfig === ChannelConfiguration["LR A & B"]
		|| (channelConfig > ChannelConfiguration.Classic && channel >= 3)
	) {
		// LR only
		return convertRawRSSI_LR(rssi);
	}

	// LR + Classic
	switch (channel) {
		case 0:
			return convertRawRSSI_ClassicPlusLR_100k(rssi);
		case 1:
		case 2:
			return convertRawRSSI_ClassicPlusLR_40k_9k6(rssi);
		default:
			return convertRawRSSI_LR(rssi);
	}
}

function convertRawRSSI_LR(rssi: number): RSSI {
	if (rssi < -52) return rssi - 7;
	if (rssi >= -34) return rssi - 17;
	return rssiConversionTable_LROnly[rssi + 52];
}

function convertRawRSSI_Classic(rssi: number): RSSI {
	if (rssi < -100) return rssi - 10;
	if (rssi >= +15) return rssi - 20;
	return rssiConversionTable_Classic[rssi + 100];
}

function convertRawRSSI_ClassicPlusLR_100k(rssi: number): RSSI {
	if (rssi < -80) return rssi - 8;
	if (rssi >= -59) return rssi - 20;
	return rssiConversionTable_ClassicPlusLR_100k[rssi + 80];
}

function convertRawRSSI_ClassicPlusLR_40k_9k6(rssi: number): RSSI {
	if (rssi < -94) return rssi - 4;
	if (rssi >= -59) return rssi - 20;
	return rssiConversionTable_ClassicPlusLR_40k_9k6[rssi + 94];
}
