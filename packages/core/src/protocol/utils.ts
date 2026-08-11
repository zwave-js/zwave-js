import { type RSSI } from "../definitions/RSSI.js";
import { ChannelConfiguration } from "./_Types.js";

/**
 * The TX power levels in dBm a Z-Wave Long Range beam frame can advertise,
 * indexed by its 4-bit Tx Power field. Z-Wave Long Range PHY and MAC Layer
 * Specification (2023.07.03), Table 6-31.
 */
// dprint-ignore
export const longRangeBeamPowers = [
	-6, -2,  2,  6,
	10, 13, 16, 19,
	21, 23, 25, 26,
	27, 28, 29, 30,
];

export function longRangeBeamPowerToDBm(power: number): number {
	return longRangeBeamPowers[power];
}

export function padNodeId(nodeId: number): string {
	return nodeId.toString().padStart(3, "0");
}

export function getRouteTag(
	source: number,
	repeaters: readonly number[],
	destination: number,
	direction: "outbound" | "inbound",
	currentHop: number,
	failedHop?: number,
): string {
	return [
		direction === "outbound"
			? padNodeId(source)
			: padNodeId(destination),
		...repeaters.map(padNodeId),
		direction === "outbound"
			? padNodeId(destination)
			: padNodeId(source),
	].map((id, i) => {
		if (i === 0) return id;
		if (i - 1 === failedHop) return " × " + id;
		if (i - 1 === currentHop) {
			return (direction === "outbound" ? " » " : " « ") + id;
		}
		return (direction === "outbound" ? " › " : " ‹ ") + id;
	})
		.join("");
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
	if (rssi >= 15) return rssi - 20;
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
