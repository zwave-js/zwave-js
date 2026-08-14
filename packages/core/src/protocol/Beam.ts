import { Bytes } from "@zwave-js/shared";
import { ZWaveError, ZWaveErrorCodes } from "../error/ZWaveError.js";
import { longRangeBeamPowerToIndex } from "./utils.js";

// ITU-T G.9959 (01/2015), Table 8-17: "The Beam Tag value 0x55 shall advertise
// the presence of a NodeID field and an optional HomeID Hash field"
const BEAM_TAG = 0x55;

function assertNodeIdFits(
	nodeId: number,
	max: number,
	protocol: string,
): void {
	if (!Number.isInteger(nodeId) || nodeId < 1 || nodeId > max) {
		throw new ZWaveError(
			`${nodeId} is not a valid ${protocol} node ID for a beam frame`,
			ZWaveErrorCodes.Argument_Invalid,
		);
	}
}

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

	// Hash computation according to ITU-T G.9959 (01/2015), §8.1.3.10:
	if (hash === 0x0a || hash === 0x4a || hash === 0x55) {
		return hash + 1;
	}

	return hash;
}

/** Computes the 8-bit home ID hash carried in Z-Wave Long Range beam frames */
export function longRangeHomeIdHash(homeId: number): number {
	// Hash computation according to Z-Wave Long Range PHY and MAC Layer
	// Specification (2023.07.03), §6.3.6.4
	return xorHomeIdBytes(homeId);
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
	assertNodeIdFits(options.destinationNodeId, 0xff, "Z-Wave classic");

	const bytes = [BEAM_TAG, options.destinationNodeId];
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
	assertNodeIdFits(options.destinationNodeId, 0xfff, "Z-Wave Long Range");
	const destinationNodeId = options.destinationNodeId;

	return Bytes.from([
		BEAM_TAG,
		(txPowerIndex << 4) | (destinationNodeId >>> 8),
		destinationNodeId & 0xff,
		options.homeIdHash & 0xff,
	]);
}
