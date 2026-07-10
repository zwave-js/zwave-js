import {
	MessagePriority,
	ZWaveError,
	ZWaveErrorCodes,
	randomBytes,
} from "@zwave-js/core";
import { FunctionType, Message, MessageType } from "@zwave-js/serial";
import {
	Bytes,
	createWrappingCounter,
	getEnumMemberName,
} from "@zwave-js/shared";
import { ControllerProprietary_ZWaveMe } from "./ControllerProprietary_ZWaveMe.js";
import {
	LICENSE_STATUS_OK,
	type ZWaveMeLicense,
	ZWaveMeLicenseFlag,
	ZWaveMeLicenseSubcommand,
	buildCommandBlock,
	buildLicenseBlob,
	decryptLicenseBlock,
	encryptLicenseBlock,
	parseCommandBlock,
	parseLicenseBlob,
} from "./License.js";

const FUNC_ID_ZWAVEME_BOOTLOADER_UPDATE = FunctionType.Proprietary_F4;
const FUNC_ID_ZWAVEME_LICENSE = FunctionType.Proprietary_F5;
const FUNC_ID_ZWAVEME_SERIALAPI_MODE = FunctionType.Proprietary_F8;

// The firmware intercepts these NVM addresses instead of treating them as real memory
const BOARD_INFO_ADDRESS = 0xffff00;
const FIRMWARE_STAGING_ADDRESS = 0x3a000;
const NVM_CHUNK_SIZE = 0xa0; // 160 bytes

const FIRMWARE_STARTED_TIMEOUT = 30_000;

export enum ZWaveMeSerialAPIMode {
	Bridge = 0,
	Static = 1,
}

export interface ZWaveMeBoardInfo {
	coreVersion: number;
	buildNumber: number;
	buildTimestamp: number;
	hardwareRevision: number;
	sdkVersion: number;
	chipUUID: Bytes;
	serialNumber: Bytes;
	bootloaderVersion: string;
	bootloaderCRC32: number;
	lockStatus: number;
	seVersion?: number;
	chipFamily?: number;
	chipType?: number;
	keysHash?: number;
}

/**
 * Proprietary Serial API support for 700-series Z-Wave.me controllers
 * (RaZberry 7, RaZberry 7 Pro, Z-Station)
 */
export class ControllerProprietary_ZWaveMe700
	extends ControllerProprietary_ZWaveMe
{
	// Matches license and bootloader-update requests to their callbacks
	private nextSeq = createWrappingCounter(0xff);

	public async interview(): Promise<void> {
		await super.interview();

		const license = await this.getLicense().catch(() => undefined);
		if (license?.flags.length) {
			this.driver.controllerLog.print(
				`Z-Wave.me license enables: ${
					license.flags
						.map((f) =>
							`\n  · ${getEnumMemberName(ZWaveMeLicenseFlag, f)}`
						)
						.join("")
				}`,
			);
		}
	}

	/** Reads board information (versions, serial number, bootloader) */
	public async getBoardInfo(): Promise<ZWaveMeBoardInfo> {
		const buf = Bytes.view(
			await this.controller.externalNVMReadBuffer(
				BOARD_INFO_ADDRESS,
				0x31,
			),
		);
		// The requested size (0x31) is only a hint — firmware returns the whole struct.
		if (buf.length < 49) {
			throw new ZWaveError(
				`The controller returned an unexpected board info length`,
				ZWaveErrorCodes.Controller_CommandError,
			);
		}

		const bootloaderVersion = buf.subarray(40, 44).join(".");

		const info: ZWaveMeBoardInfo = {
			coreVersion: buf.readUInt16BE(0),
			buildNumber: buf.readUInt32BE(2),
			buildTimestamp: buf.readUInt32BE(6),
			hardwareRevision: buf.readUInt16BE(10),
			sdkVersion: buf.readUInt32BE(12),
			chipUUID: buf.subarray(16, 24),
			serialNumber: buf.subarray(24, 40),
			bootloaderVersion,
			bootloaderCRC32: buf.readUInt32BE(44),
			lockStatus: buf[48],
		};

		// Fields beyond offset 49 are only present on newer firmware
		if (buf.length >= 53) info.seVersion = buf.readUInt32BE(49);
		if (buf.length >= 54) info.chipFamily = buf[53];
		if (buf.length >= 55) info.chipType = buf[54];
		if (buf.length >= 59) info.keysHash = buf.readUInt32BE(55);

		return info;
	}

	/** Reads and decodes the feature license */
	public async getLicense(): Promise<ZWaveMeLicense> {
		const blob = await this.licenseCommand(ZWaveMeLicenseSubcommand.Get);
		return parseLicenseBlob(blob.subarray(0, 32));
	}

	/** Writes a raw 32-byte license blob to the controller */
	public async setLicense(blob: Uint8Array): Promise<void> {
		await this.licenseCommand(ZWaveMeLicenseSubcommand.Set, blob);
	}

	/**
	 * Builds a license blob unlocking the given capabilities.
	 * The blob is only CRC-protected, so it can be generated host-side.
	 */
	public buildLicense(opts: {
		vendorId: number;
		maxNodes: number;
		flags: ZWaveMeLicenseFlag[];
		countSupport?: number;
	}): Bytes {
		return buildLicenseBlob(opts);
	}

	/**
	 * Enables the given license flags in addition to those already set,
	 * then writes the updated license back to the controller.
	 */
	public async setLicenseFlags(flags: ZWaveMeLicenseFlag[]): Promise<void> {
		const current = await this.getLicense();
		const merged = [...new Set([...current.flags, ...flags])];
		const blob = buildLicenseBlob({
			vendorId: current.vendorId,
			maxNodes: current.maxNodes,
			flags: merged,
			countSupport: current.countSupport,
		});
		await this.setLicense(blob);
	}

	/** Performs a full license GET/SET, handling the nonce handshake and encryption */
	private async licenseCommand(
		subCommand: ZWaveMeLicenseSubcommand,
		data?: Uint8Array,
	): Promise<Bytes> {
		// Exchange 1: the device delivers a fresh nonce that seeds the command IV
		const nonceResponse = await this.licenseExchange(new Bytes(0));
		if (nonceResponse.length < 64) {
			throw new ZWaveError(
				`Z-Wave.me license nonce response too short`,
				ZWaveErrorCodes.Controller_CommandError,
			);
		}
		const nonceCiphertext = nonceResponse.subarray(0, 48);
		const nonceIV = nonceResponse.subarray(48, 64);
		const nonceBlock = parseCommandBlock(
			await decryptLicenseBlock(nonceCiphertext, nonceIV),
		);
		if (
			nonceBlock.subCommand !== ZWaveMeLicenseSubcommand.Nonce
			|| nonceBlock.status !== LICENSE_STATUS_OK
		) {
			throw new ZWaveError(
				`Z-Wave.me license nonce handshake failed`,
				ZWaveErrorCodes.Controller_CommandError,
			);
		}
		const nonce = nonceBlock.payload.subarray(0, 8);

		// Exchange 2: encrypt with IV = device nonce followed by 8 host-random bytes
		const ivY = randomBytes(8);
		const iv = Bytes.concat([nonce, ivY]);
		const ciphertext = await encryptLicenseBlock(
			buildCommandBlock(subCommand, data && Bytes.view(data)),
			iv,
		);
		const response = await this.licenseExchange(
			Bytes.concat([ciphertext, ivY]),
		);
		const block = parseCommandBlock(
			await decryptLicenseBlock(response, iv),
		);
		if (
			block.subCommand !== subCommand
			|| block.status !== LICENSE_STATUS_OK
		) {
			throw new ZWaveError(
				`Z-Wave.me license command failed`,
				ZWaveErrorCodes.Controller_CommandError,
			);
		}
		return block.payload;
	}

	/** Sends a single 0xF5 request and awaits the matching callback payload */
	private async licenseExchange(body: Bytes): Promise<Bytes> {
		const seq = this.nextSeq();
		const callbackPromise = this.driver.waitForMessage<Message>(
			(msg) =>
				msg.functionType === FUNC_ID_ZWAVEME_LICENSE
				&& msg.type === MessageType.Request
				&& msg.payload[0] === seq,
			5000,
		);

		const cmd = new Message({
			type: MessageType.Request,
			functionType: FUNC_ID_ZWAVEME_LICENSE,
			payload: Bytes.concat([body, [seq]]),
			expectedResponse: (self, msg) =>
				msg.functionType === FUNC_ID_ZWAVEME_LICENSE
				&& msg.type === MessageType.Response,
		});
		const response = await this.driver.sendMessage(cmd, {
			priority: MessagePriority.Controller,
			supportCheck: false,
		});
		if (response.payload[0] !== LICENSE_STATUS_OK) {
			throw new ZWaveError(
				`Z-Wave.me license command was rejected`,
				ZWaveErrorCodes.Controller_CommandError,
			);
		}

		const callback = await callbackPromise;
		return Bytes.view(callback.payload.subarray(1));
	}

	/**
	 * Switches the controller between bridge and static Serial API mode.
	 * Requires the ControllerStaticAPI license flag. The controller restarts and
	 * changes its library type, so the driver must be restarted afterwards.
	 */
	public async setSerialAPIMode(mode: ZWaveMeSerialAPIMode): Promise<void> {
		const cmd = new Message({
			type: MessageType.Request,
			functionType: FUNC_ID_ZWAVEME_SERIALAPI_MODE,
			payload: Bytes.from([0x04, 0x01, mode]),
		});
		await this.driver.sendMessage(cmd, {
			priority: MessagePriority.Controller,
			supportCheck: false,
		});
		await this.driver.trySoftReset();
	}

	/** Updates the controller firmware from a Z-Wave.me firmware image */
	public async updateFirmware(
		data: Uint8Array,
		onProgress?: (progress: { sent: number; total: number }) => void,
	): Promise<void> {
		await this.stageImage(data, onProgress);
		// The bootloader validates and installs the staged image on the next reset
		await this.driver.trySoftReset();
	}

	/** Updates the controller bootloader from a Z-Wave.me bootloader image */
	public async updateBootloader(
		data: Uint8Array,
		onProgress?: (progress: { sent: number; total: number }) => void,
	): Promise<void> {
		await this.stageImage(data, onProgress);

		// The running app flashes the bootloader itself (it cannot reset into the
		// bootloader to overwrite it), so trigger via 0xF4 and await the callback
		const seq = this.nextSeq();
		const callbackPromise = this.driver.waitForMessage<Message>(
			(msg) =>
				msg.functionType === FUNC_ID_ZWAVEME_BOOTLOADER_UPDATE
				&& msg.type === MessageType.Request
				&& msg.payload[0] === seq,
			FIRMWARE_STARTED_TIMEOUT,
		);
		const cmd = new Message({
			type: MessageType.Request,
			functionType: FUNC_ID_ZWAVEME_BOOTLOADER_UPDATE,
			payload: Bytes.from([seq]),
			expectedResponse: (self, msg) =>
				msg.functionType === FUNC_ID_ZWAVEME_BOOTLOADER_UPDATE
				&& msg.type === MessageType.Response,
		});
		const response = await this.driver.sendMessage(cmd, {
			priority: MessagePriority.Controller,
			supportCheck: false,
		});
		if (response.payload[0] !== 0x00) {
			throw new ZWaveError(
				`The controller rejected the bootloader update`,
				ZWaveErrorCodes.Controller_CommandError,
			);
		}
		const callback = await callbackPromise;
		if (callback.payload[1] !== 0x00) {
			throw new ZWaveError(
				`The bootloader update failed`,
				ZWaveErrorCodes.Controller_CommandError,
			);
		}
	}

	/** Streams an image verbatim into the NVM staging area */
	private async stageImage(
		data: Uint8Array,
		onProgress?: (progress: { sent: number; total: number }) => void,
	): Promise<void> {
		// The image is a proprietary Z-Wave.me container (not a GBL) that the
		// device's own updater parses, so stream it verbatim without converting it
		const image = Bytes.view(data);
		for (let offset = 0; offset < image.length; offset += NVM_CHUNK_SIZE) {
			const chunk = image.subarray(offset, offset + NVM_CHUNK_SIZE);
			const success = await this.controller.externalNVMWriteBuffer(
				FIRMWARE_STAGING_ADDRESS + offset,
				chunk,
			);
			if (!success) {
				throw new ZWaveError(
					`Staging the image to NVM failed at offset ${offset}`,
					ZWaveErrorCodes.Controller_CommandError,
				);
			}
			onProgress?.({
				sent: Math.min(offset + chunk.length, image.length),
				total: image.length,
			});
		}
	}
}
