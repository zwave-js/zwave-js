import { type DeviceConfig } from "@zwave-js/config";
import { InterviewStage, type MaybeNotKnown, NOT_KNOWN } from "@zwave-js/core";
import { Bytes, formatId } from "@zwave-js/shared";
import { cacheKeys } from "../../driver/NetworkCache.js";
import { FirmwareUpdateMixin } from "./70_FirmwareUpdate.js";

export interface NodeDeviceConfig {
	/**
	 * Contains additional information about this node, loaded from a config file
	 */
	get deviceConfig(): MaybeNotKnown<DeviceConfig>;

	/**
	 * Returns the manufacturer/brand name defined in the device configuration,
	 * or looks it up from the manufacturer database if no config is available
	 */
	get manufacturer(): MaybeNotKnown<string>;

	/**
	 * Returns the device label defined in the device configuration.
	 */
	get label(): MaybeNotKnown<string>;

	get deviceDatabaseUrl(): MaybeNotKnown<string>;

	/**
	 * Returns whether the device config for this node has changed since the last interview.
	 * If it has, the node likely needs to be re-interviewed for the changes to be picked up.
	 */
	hasDeviceConfigChanged(): MaybeNotKnown<boolean>;

	/**
	 * @internal
	 * The hash of the device config that was applied during the last interview.
	 */
	get cachedDeviceConfigHash(): Uint8Array | undefined;

	/**
	 * @internal
	 * The hash of the currently used device config
	 */
	get currentDeviceConfigHash(): Uint8Array | undefined;
}

export abstract class DeviceConfigMixin extends FirmwareUpdateMixin
	implements NodeDeviceConfig
{
	private _deviceConfig: DeviceConfig | undefined;
	/**
	 * Contains additional information about this node, loaded from a config file
	 */
	public get deviceConfig(): MaybeNotKnown<DeviceConfig> {
		return this._deviceConfig;
	}
	protected set deviceConfig(value: MaybeNotKnown<DeviceConfig>) {
		this._deviceConfig = value;
	}

	/**
	 * Returns the manufacturer/brand name defined in the device configuration,
	 * or looks it up from the manufacturer database if no config is available
	 */
	public get manufacturer(): MaybeNotKnown<string> {
		if (this._deviceConfig) return this._deviceConfig.manufacturer;
		if (this.manufacturerId != undefined) {
			return this.driver.lookupManufacturer(this.manufacturerId);
		}
	}

	/**
	 * Returns the device label defined in the device configuration.
	 */
	public get label(): MaybeNotKnown<string> {
		return this._deviceConfig?.label;
	}

	public get deviceDatabaseUrl(): MaybeNotKnown<string> {
		if (
			this.manufacturerId != undefined
			&& this.productType != undefined
			&& this.productId != undefined
		) {
			const manufacturerId = formatId(this.manufacturerId);
			const productType = formatId(this.productType);
			const productId = formatId(this.productId);
			const firmwareVersion = this.firmwareVersion || "0.0";
			return `https://devices.zwave-js.io/?jumpTo=${manufacturerId}:${productType}:${productId}:${firmwareVersion}`;
		}
	}

	/**
	 * Returns whether the device config for this node has changed since the last interview.
	 * If it has, the node likely needs to be re-interviewed for the changes to be picked up.
	 */
	public hasDeviceConfigChanged(): MaybeNotKnown<boolean> {
		// We can't know if the node is not fully interviewed
		if (this.interviewStage !== InterviewStage.Complete) return NOT_KNOWN;

		// The controller cannot be re-interviewed
		if (this.isControllerNode) return false;

		// If the hash was never stored, we can only (very likely) know if the config has not changed
		if (this.cachedDeviceConfigHash == undefined) {
			return this.deviceConfig == undefined ? false : NOT_KNOWN;
		}

		// If it was, a change in hash means the config has changed
		if (this._currentDeviceConfigHash) {
			return !Bytes.view(this._currentDeviceConfigHash).equals(
				this.cachedDeviceConfigHash,
			);
		}
		return true;
	}

	/**
	 * @internal
	 * The hash of the device config that was applied during the last interview.
	 */
	public get cachedDeviceConfigHash(): Uint8Array | undefined {
		return this.driver.cacheGet(cacheKeys.node(this.id).deviceConfigHash);
	}

	protected set cachedDeviceConfigHash(value: Uint8Array | undefined) {
		this.driver.cacheSet(cacheKeys.node(this.id).deviceConfigHash, value);
	}

	private _currentDeviceConfigHash: Uint8Array | undefined;
	/**
	 * @internal
	 * The hash of the currently used device config
	 */
	public get currentDeviceConfigHash(): Uint8Array | undefined {
		return this._currentDeviceConfigHash;
	}
	protected set currentDeviceConfigHash(value: Uint8Array | undefined) {
		this._currentDeviceConfigHash = value;
	}

	/**
	 * Loads the device configuration for this node from a config file
	 */
	protected async loadDeviceConfig(): Promise<void> {
		// But the configuration definitions might change
		if (
			this.manufacturerId != undefined
			&& this.productType != undefined
			&& this.productId != undefined
		) {
			// Try to load the config file
			this.deviceConfig = await this.driver.configManager.lookupDevice(
				this.manufacturerId,
				this.productType,
				this.productId,
				this.firmwareVersion,
			);
			if (this.deviceConfig) {
				// Also remember the current hash of the device config
				if (this.cachedDeviceConfigHash?.length === 16) {
					// legacy hash using MD5
					this._currentDeviceConfigHash = await this.deviceConfig
						.getHash("md5");
				} else {
					this._currentDeviceConfigHash = await this.deviceConfig
						.getHash();
				}
				this.driver.controllerLog.logNode(
					this.id,
					`${
						this.deviceConfig.isEmbedded
							? "Embedded"
							: "User-provided"
					} device config loaded`,
				);
			} else {
				this.driver.controllerLog.logNode(
					this.id,
					"No device config found",
					"warn",
				);
			}
		}
	}
}
