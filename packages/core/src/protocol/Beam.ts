import { Bytes } from "@zwave-js/shared";
import { longRangeBeamPowers } from "./utils.js";

// ITU-T G.9959 (01/2015), Table 8-17: "The Beam Tag value 0x55 shall advertise
// the presence of a NodeID field and an optional HomeID Hash field"
const BEAM_TAG = 0x55;

function xorHomeIdBytes(homeId: number): number {
	let hash = 0xff;
	for (let shift = 24; shift >= 0; shift -= 8) {
		hash ^= (homeId >>> shift) & 0xff;
	}
	return hash;
}

/** Computes the 8-bit home ID hash carried in Z-Wave classic beam frames */
export function zwaveHomeIdHash(homeId: number): number {
	const hash = xorHomeIdBytes(homeId);

	// ITU-T G.9959 (01/2015), §8.1.3.10: "A FL node receiving one of the HomeID
	// hash values 0x0A, 0x4A or 0x55 shall accept the value as a potential
	// match to the actual HomeID". GenerateHomeIdHash increments past these
	// three wildcards, so the emitted hash identifies exactly one domain
	if (hash === 0x0a || hash === 0x4a || hash === 0x55) {
		return hash + 1;
	}

	return hash;
}

/** Computes the 8-bit home ID hash carried in Z-Wave Long Range beam frames */
export function longRangeHomeIdHash(homeId: number): number {
	// GenerateHomeIdHash in the Z-Wave Long Range PHY and MAC Layer
	// Specification (2023.07.03), §6.3.6.4 must stay a plain XOR of the four
	// home ID bytes. The wildcard adjustment of ITU-T G.9959 applies to Z-Wave
	// classic only
	return xorHomeIdBytes(homeId);
}

/**
 * Converts a TX power in dBm to the 4-bit Tx Power field of a Z-Wave Long Range
 * beam frame, rounding up to the nearest representable level.
 */
export function longRangeBeamPowerToIndex(dBm: number): number {
	const index = longRangeBeamPowers.findIndex((level) => level >= dBm);
	return index === -1 ? longRangeBeamPowers.length - 1 : index;
}

export interface ZWaveBeamFrameOptions {
	destinationNodeId: number;
	homeIdHash?: number;
}

/**
 * Encodes the body of a Z-Wave classic beam frame. The PHY prepends the
 * preamble and SOF, and the firmware repeats the body for the duration of the
 * beam. A beam frame carries no length field and no FCS.
 */
export function encodeZWaveBeamFrame(options: ZWaveBeamFrameOptions): Bytes {
	// ITU-T G.9959 (01/2015), §8.1.3.10: "Each beam frame shall carry the Beam
	// Tag and NodeID fields. The NodeID field should be followed by the
	// optional HomeID Hash field."
	const bytes = [BEAM_TAG, options.destinationNodeId & 0xff];
	if (options.homeIdHash != undefined) {
		bytes.push(options.homeIdHash & 0xff);
	}
	return Bytes.from(bytes);
}

export interface LongRangeBeamFrameOptions {
	destinationNodeId: number;
	/** The TX power in dBm the beam frame is transmitted with */
	txPower: number;
	homeIdHash: number;
}

/**
 * Encodes the body of a Z-Wave Long Range beam frame. The PHY prepends the
 * preamble and SOF, and the firmware repeats the body for the duration of the
 * beam. A beam frame carries no length field and no FCS.
 */
export function encodeLongRangeBeamFrame(
	options: LongRangeBeamFrameOptions,
): Bytes {
	// Z-Wave Long Range PHY and MAC Layer Specification (2023.07.03), §6.3.6:
	// "The SOF is followed by four bytes, replacing the HomeID field found in a
	// general MPDU."
	const txPowerIndex = longRangeBeamPowerToIndex(options.txPower);
	// §6.3.6.3: "The Destination NodeID is a 12 bit field identifying the
	// destination of the beam frame."
	const destinationNodeId = options.destinationNodeId & 0xfff;

	return Bytes.from([
		BEAM_TAG,
		(txPowerIndex << 4) | (destinationNodeId >>> 8),
		destinationNodeId & 0xff,
		options.homeIdHash & 0xff,
	]);
}
