import type { Firmware, FirmwareFileFormat } from "./_Types.js";
/**
 * Guess the firmware format based on filename and firmware buffer
 *
 * @param filename The firmware filename
 * @param rawData A buffer containing the original firmware update file
 */
export declare function guessFirmwareFileFormat(filename: string, rawData: Uint8Array): FirmwareFileFormat;
/**
 * Given the contents of a ZIP archive with a compatible firmware file,
 * this function extracts the firmware data and guesses the firmware format
 * using {@link guessFirmwareFileFormat}.
 *
 * @returns An object containing the filename, guessed format and unzipped data
 * of the firmware file from the ZIP archive, or `undefined` if no compatible
 * firmware file could be extracted.
 */
export declare function tryUnzipFirmwareFile(zipData: Uint8Array): {
    filename: string;
    format: FirmwareFileFormat;
    rawData: Uint8Array;
} | undefined;
/**
 * Extracts the firmware data from a file. The following formats are available:
 * - `"aeotec"` - A Windows executable (.exe or .ex_) that contains Aeotec's upload tool
 * - `"otz"` - A compressed firmware file in Intel HEX format
 * - `"ota"` or `"hex"` - An uncompressed firmware file in Intel HEX format
 * - `"hec"` - An encrypted Intel HEX firmware file
 * - `"gecko"` - A binary gecko bootloader firmware file with `.gbl` extension
 *
 * The returned firmware data and target can be used to start a firmware update process with `node.beginFirmwareUpdate`
 */
export declare function extractFirmware(rawData: Uint8Array, format: FirmwareFileFormat): Promise<Firmware>;
//# sourceMappingURL=firmware.d.ts.map