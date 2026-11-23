import { CRC16_CCITT, ZWaveError, ZWaveErrorCodes } from "@zwave-js/core";
import { XModemMessageHeaders } from "@zwave-js/serial";
import { Bytes, type BytesView } from "@zwave-js/shared";

export enum BootloaderState {
	Menu,
	UploadingFirmware,
}

/** Encapsulates information about the currently active bootloader */
export class Bootloader {
	public constructor(
		writeSerial: (data: BytesView) => Promise<void>,
		version: string,
		options: { num: number; option: string }[],
	) {
		this.writeSerial = writeSerial;
		this.version = version;
		this.options = new Map(options.map((o) => [o.num, o.option]));

		const uploadOption = options.find(
			(o) => o.option === "upload gbl",
		)?.num;
		if (!uploadOption) {
			throw new ZWaveError(
				"The bootloader does not support uploading a GBL file!",
				ZWaveErrorCodes.Driver_NotSupported,
			);
		}
		this.uploadOption = uploadOption;

		const runOption = options.find((o) => o.option === "run")?.num;
		if (!runOption) {
			throw new ZWaveError(
				"Could not find run option in bootloader menu!",
				ZWaveErrorCodes.Driver_NotSupported,
			);
		}
		this.runOption = runOption;
	}

	public readonly writeSerial: (data: BytesView) => Promise<void>;
	public state: BootloaderState = BootloaderState.Menu;
	public readonly version: string;

	public readonly options: ReadonlyMap<number, string>;

	public readonly uploadOption: number;
	public readonly runOption: number;

	public async selectOption(option: number): Promise<boolean> {
		if (!this.options.has(option)) return false;
		await this.writeSerial(Bytes.from(option.toString(), "ascii"));
		return true;
	}

	public findOption(
		predicate: (option: string) => boolean,
	): number | undefined {
		return [...this.options.entries()].find(([, option]) =>
			predicate(option),
		)?.[0];
	}

	public async beginUpload(): Promise<void> {
		await this.selectOption(this.uploadOption);
	}

	public async runApplication(): Promise<void> {
		await this.selectOption(this.runOption);
	}

	public async uploadFragment(
		fragmentNumber: number,
		data: BytesView,
	): Promise<void> {
		const command = Bytes.concat([
			[
				XModemMessageHeaders.SOF,
				fragmentNumber & 0xff,
				0xff - (fragmentNumber & 0xff),
			],
			data,
			new Bytes(2),
		]);
		command.writeUInt16BE(CRC16_CCITT(data, 0x0000), command.length - 2);

		await this.writeSerial(command);
	}

	public async cancelUpload(): Promise<void> {
		await this.writeSerial(Bytes.from([XModemMessageHeaders.CAN]));
	}

	public async finishUpload(): Promise<void> {
		await this.writeSerial(Bytes.from([XModemMessageHeaders.EOT]));
	}
}

/**
 * Explains the code the Gecko bootloader prints after "block error 0x" or "file error 0x" when it aborts an upload.
 * Returns `undefined` for unknown codes.
 */
export function explainBootloaderError(
	kind: "block" | "file",
	errorCode: number,
): string | undefined {
	// The mapping follows btl_comm_xmodem_common.c from Simplicity SDK 2024.12.2.
	// Parser results without their own code are reported as 0x18.
	if (kind === "block") {
		switch (errorCode) {
			case 0x21:
				return "A block did not start with the expected header. The transfer got out of sync.";
			case 0x22:
				return "A block had an invalid block number. The transfer got out of sync.";
			case 0x23:
			case 0x24:
				return "A block failed its checksum. The data got corrupted on the serial connection.";
			case 0x25:
				return "A block arrived out of order. A block got lost on the serial connection.";
			case 0x27:
				return "A block arrived twice.";
			case 0x18:
				return "The transfer was canceled, or the file ended before it held a complete and verified image.";
		}
		return undefined;
	}

	switch (errorCode) {
		case 0x41:
			return "The firmware file uses a GBL format version this bootloader does not support.";
		case 0x43:
			return "The firmware file failed its checksum. It is corrupt or incomplete.";
		case 0x44:
			return "The bootloader found data it cannot parse. For an encrypted file, the file was encrypted with a key that does not match this controller, or the controller's encryption key is blank.";
		case 0x45:
			return "The signature of the firmware file does not match the signing key of this controller. The file is not meant for this controller.";
		case 0x4f:
			return "The firmware file is not a valid upgrade image for this bootloader. It may lack a signature or encryption the bootloader requires, be truncated, or not be a GBL file.";
		case 0x50:
			return "The bootloader has no valid key for this file.";
		case 0x18:
			return "The bootloader rejected the image for another reason, like a downgrade blocked by rollback protection or an image that overlaps the bootloader.";
	}
	return undefined;
}
