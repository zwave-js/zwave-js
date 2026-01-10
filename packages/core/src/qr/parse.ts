import { Bytes } from "@zwave-js/shared";
import { digest } from "../crypto/index.js";
import { SecurityClass } from "../definitions/SecurityClass.js";
import { dskToString } from "../dsk/index.js";
import { ZWaveError, ZWaveErrorCodes } from "../error/ZWaveError.js";
import { parseBitMask } from "../values/Primitive.js";
import {
	ProvisioningInformationType,
	QRCodeVersion,
	type QRProvisioningInformation,
	minQRCodeLength,
	onlyDigitsRegex,
} from "./definitions.js";
import { fail, parseTLV, readLevel, readUInt16, readUInt8 } from "./utils.js";

// Regex to find "90" followed by at least (minQRCodeLength - 2) digits
const qrCodeCandidateRegex = new RegExp(`90\\d{${minQRCodeLength - 2},}`, "g");

/** Parses a string that has been decoded from a Z-Wave (S2 or SmartStart) QR code */
export async function parseQRCodeString(
	qr: string,
): Promise<QRProvisioningInformation> {
	// Trim off whitespace that might have been copied by accident
	qr = qr.trim();
	// Validate the QR code
	if (!qr.startsWith("90")) fail("must start with 90");
	if (qr.length < minQRCodeLength) fail("too short");
	if (!onlyDigitsRegex.test(qr)) fail("contains invalid characters");

	const version = readLevel(qr, 2);
	if (version > QRCodeVersion.SmartStart) fail("invalid version");

	const checksum = readUInt16(qr, 4);
	// The checksum covers the remaining data
	const checksumInput = new TextEncoder().encode(qr.slice(9));

	const hashResult = await digest("sha-1", checksumInput);
	const expectedChecksum = Bytes.view(hashResult).readUInt16BE(0);
	if (checksum !== expectedChecksum) fail("invalid checksum");

	const requestedKeysBitmask = readUInt8(qr, 9);
	const requestedSecurityClasses = parseBitMask(
		[requestedKeysBitmask],
		SecurityClass.S2_Unauthenticated,
	);
	if (!requestedSecurityClasses.every((k) => k in SecurityClass)) {
		fail("invalid security class requested");
	}

	let offset = 12;
	const dsk = new Bytes(16);
	for (let dskBlock = 0; dskBlock < 8; dskBlock++) {
		const block = readUInt16(qr, offset);
		dsk.writeUInt16BE(block, dskBlock * 2);
		offset += 5;
	}

	const ret = {
		version,
		// This seems like a duplication, but it's more convenient for applications to not have to copy this field over
		requestedSecurityClasses,
		securityClasses: [...requestedSecurityClasses],
		dsk: dskToString(dsk),
	} as QRProvisioningInformation;

	let hasProductID = false;
	let hasProductType = false;

	while (offset < qr.length) {
		const {
			entry: { type, ...data },
			charsRead,
		} = parseTLV(qr.slice(offset));
		offset += charsRead;

		if (type === ProvisioningInformationType.ProductId) {
			hasProductID = true;
		} else if (type === ProvisioningInformationType.ProductType) {
			hasProductType = true;
		}
		Object.assign(ret, data);
	}

	// Ensure the required fields are present
	if (!hasProductID || !hasProductType) {
		fail("missing required fields");
	}

	return ret;
}

/**
 * Tries to find the length of a valid QR code string starting at position 0.
 * Returns the length if found, or undefined if not valid.
 *
 * The QR code structure is:
 * - 2 digits: "90" (Z indicator)
 * - 2 digits: version
 * - 5 digits: checksum
 * - 3 digits: requested keys
 * - 40 digits: DSK (8 blocks of 5)
 * - Variable: TLV blocks (each has 2-digit type, 2-digit length, then data)
 */
function tryDetermineQRCodeLength(candidate: string): number | undefined {
	// Must start with 90 and have minimum length
	if (!candidate.startsWith("90") || candidate.length < minQRCodeLength) {
		return undefined;
	}

	// Version must be valid (0 or 1)
	const version = parseInt(candidate.slice(2, 4), 10);
	if (version > QRCodeVersion.SmartStart) {
		return undefined;
	}

	// Start after the fixed portion (90 + version + checksum + keys + DSK = 52 chars)
	let offset = minQRCodeLength;

	// Walk through TLV blocks to find the end
	while (offset < candidate.length) {
		// Need at least 4 chars for type (2) and length (2)
		if (candidate.length - offset < 4) {
			// Not enough for another TLV block, this is the end
			break;
		}

		const typeStr = candidate.slice(offset, offset + 2);
		const lengthStr = candidate.slice(offset + 2, offset + 4);

		// Validate that type and length are valid 2-digit numbers
		if (!/^\d{2}$/.test(typeStr) || !/^\d{2}$/.test(lengthStr)) {
			break;
		}

		const tlvLength = parseInt(lengthStr, 10);

		// Check if we have enough data for this TLV block
		if (candidate.length - offset - 4 < tlvLength) {
			// Not enough data for this TLV block, this is the end
			break;
		}

		// Validate that the TLV data contains only digits
		const tlvData = candidate.slice(offset + 4, offset + 4 + tlvLength);
		if (!/^\d*$/.test(tlvData)) {
			break;
		}

		offset += 4 + tlvLength;
	}

	return offset;
}

/**
 * Tries to extract and parse a Z-Wave QR code string from within a longer string.
 * This is useful when a QR code string has been copied with extraneous characters.
 *
 * @param input The input string that may contain a QR code
 * @returns The parsed QR code information, or undefined if no valid QR code was found
 */
export async function tryExtractQRCodeString(
	input: string,
): Promise<QRProvisioningInformation | undefined> {
	// Find all potential QR code candidates (sequences starting with 90 followed by enough digits)
	const candidates = input.matchAll(qrCodeCandidateRegex);

	for (const match of candidates) {
		const candidate = match[0];

		// Try to determine where this QR code ends based on its structure
		const qrLength = tryDetermineQRCodeLength(candidate);
		if (qrLength === undefined) {
			continue;
		}

		const qrCode = candidate.slice(0, qrLength);

		try {
			// Try to parse this candidate
			const result = await parseQRCodeString(qrCode);
			return result;
		} catch (e) {
			// If it's not a valid QR code (checksum failed, etc.), continue searching
			if (
				e instanceof ZWaveError
				&& e.code === ZWaveErrorCodes.Security2CC_InvalidQRCode
			) {
				continue;
			}
			// Re-throw unexpected errors
			throw e;
		}
	}

	// No valid QR code found
	return undefined;
}
