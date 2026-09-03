import {
	getCachedConfigParamValue,
	refreshConfigParamMetadataFromConfigFile,
} from "@zwave-js/cc/ConfigurationCC";
import {
	type ConditionalConfigContext,
	type ConditionalDeviceConfig,
	DeviceConfig,
	type ParamInfoMap,
	parseDeviceConfigHash,
} from "@zwave-js/config";
import {
	CommandClasses,
	InterviewStage,
	type MaybeNotKnown,
	MessagePriority,
	NOT_KNOWN,
	NodeStatus,
	type ValueDB,
	type ValueID,
} from "@zwave-js/core";
import {
	Bytes,
	type BytesView,
	formatId,
	getErrorMessage,
} from "@zwave-js/shared";
import type { Driver } from "../../driver/Driver.js";
import { cacheKeys } from "../../driver/NetworkCache.js";
import type { DeviceClass } from "../DeviceClass.js";
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
	 * Returns whether the device config for this node has changed since the last interview
	 * in a way that affects interview behavior (compat flags, association settings, proprietary config).
	 * Changes to configuration parameter metadata are applied dynamically and do not require re-interview.
	 */
	hasDeviceConfigChanged(): MaybeNotKnown<boolean>;

	/**
	 * @internal
	 * The hash of the device config that was applied during the last interview.
	 */
	get cachedDeviceConfigHash(): BytesView | undefined;

	/**
	 * @internal
	 * The hash of the currently used device config
	 */
	get currentDeviceConfigHash(): BytesView | undefined;
}

export abstract class DeviceConfigMixin extends FirmwareUpdateMixin
	implements NodeDeviceConfig
{
	public constructor(
		nodeId: number,
		driver: Driver,
		endpointIndex: number,
		deviceClass?: DeviceClass,
		supportedCCs?: CommandClasses[],
		valueDB?: ValueDB,
	) {
		super(
			nodeId,
			driver,
			endpointIndex,
			deviceClass,
			supportedCCs,
			valueDB,
		);

		// React to changes of config parameter values which conditions in the config file depend on
		const onValueEvent = (arg: ValueID) =>
			this.handleConfigParamValueEvent(arg);
		for (
			const event of [
				"value added",
				"value updated",
				"value removed",
			] as const
		) {
			this.valueDB.on(event, onValueEvent);
		}
	}

	private _deviceConfig: DeviceConfig | undefined;
	private _conditionalDeviceConfig: ConditionalDeviceConfig | undefined;
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
	 * Returns whether the device config for this node has changed since the last interview
	 * in a way that affects interview behavior (compat flags, association settings, proprietary config).
	 * Changes to configuration parameter metadata are applied dynamically and do not require re-interview.
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

		// If it was, a change in hash means the config has changed.
		// We handle the different hash versions when loading the config already.
		if (this._currentDeviceConfigHash) {
			return !DeviceConfig.areHashesEqual(
				this._currentDeviceConfigHash,
				this.cachedDeviceConfigHash,
			);
		}
		return true;
	}

	/**
	 * @internal
	 * The hash of the device config that was applied during the last interview.
	 */
	public get cachedDeviceConfigHash(): BytesView | undefined {
		return this.driver.cacheGet(cacheKeys.node(this.id).deviceConfigHash);
	}

	protected set cachedDeviceConfigHash(value: BytesView | undefined) {
		this.driver.cacheSet(cacheKeys.node(this.id).deviceConfigHash, value);
	}

	private _currentDeviceConfigHash: BytesView | undefined;
	/**
	 * @internal
	 * The hash of the currently used device config
	 */
	public get currentDeviceConfigHash(): BytesView | undefined {
		return this._currentDeviceConfigHash;
	}
	protected set currentDeviceConfigHash(value: BytesView | undefined) {
		this._currentDeviceConfigHash = value;
	}

	/** The hash version _currentDeviceConfigHash was computed with. undefined = the most recent version */
	private _currentDeviceConfigHashVersion: 0 | 1 | undefined;

	/** Builds the context to evaluate device config conditions against */
	private getConditionalConfigContext():
		| ConditionalConfigContext
		| undefined
	{
		if (
			this.manufacturerId == undefined
			|| this.productType == undefined
			|| this.productId == undefined
		) {
			return;
		}
		return {
			manufacturerId: this.manufacturerId,
			productType: this.productType,
			productId: this.productId,
			firmwareVersion: this.firmwareVersion,
			sdkVersion: this.sdkVersion,
			getCachedParamValue: (endpoint, parameter, bitMask) =>
				getCachedConfigParamValue(
					this.driver,
					this.id,
					endpoint,
					parameter,
					bitMask,
				),
		};
	}

	/**
	 * Loads the device configuration for this node from a config file
	 */
	protected async loadDeviceConfig(): Promise<void> {
		// But the configuration definitions might change
		if (
			this.manufacturerId == undefined
			|| this.productType == undefined
			|| this.productId == undefined
		) {
			return;
		}

		// Try to load the config file. The conditional variant is kept, so changes
		// of referenced config parameter values can be re-evaluated without file I/O
		this._conditionalDeviceConfig = await this.driver.configManager
			.lookupDevicePreserveConditions(
				this.manufacturerId,
				this.productType,
				this.productId,
				this.firmwareVersion,
			);
		this._lastReferencedParamValues = this
			.snapshotReferencedParamValues();
		this.deviceConfig = this._conditionalDeviceConfig?.evaluate(
			this.getConditionalConfigContext(),
		);

		if (!this.deviceConfig) {
			this.driver.controllerLog.logNode(
				this.id,
				"No device config found",
				"warn",
			);
			return;
		}

		// We need to remember the hash of the device config here, because we're in an async context
		// and later comparisons are sync.

		// There are two legacy versions of the device config hash:
		// - 16 byte MD5 hash
		// - 32 byte SHA-256 hash
		// Both only support checking for exact equality of the config hashable.
		// To be able to compare those stored hashes with the current config,
		// we need to figure out the stored version now and hash the config using
		// the same version.
		// New "hashes" are variable length, contain a condensed version of the device config and are prefixed with a version number.

		const versionPrefix = Bytes.from("$v", "utf8");
		const hasVersionPrefix = !!this.cachedDeviceConfigHash
			&& Bytes
				.view(this.cachedDeviceConfigHash.subarray(0, 2))
				.equals(versionPrefix);
		let cachedHashVersion: number | undefined;

		if (
			this.cachedDeviceConfigHash?.length === 16
			&& !hasVersionPrefix
		) {
			// MD5 = version 0
			cachedHashVersion = 0;
			this._currentDeviceConfigHashVersion = 0;
			this._currentDeviceConfigHash = await this.deviceConfig
				.getHash(0);
		} else if (
			this.cachedDeviceConfigHash?.length === 32
			&& !hasVersionPrefix
		) {
			// SHA-256 = version 1
			cachedHashVersion = 1;
			this._currentDeviceConfigHashVersion = 1;
			this._currentDeviceConfigHash = await this.deviceConfig
				.getHash(1);
		} else {
			// Variable length prefixed hash - determine the hash version from the cache
			if (this.cachedDeviceConfigHash) {
				const parsed = parseDeviceConfigHash(
					this.cachedDeviceConfigHash,
				);
				if (parsed) {
					cachedHashVersion = parsed.version;
				}
			}
			// Use that version for comparison purposes if possible
			this._currentDeviceConfigHashVersion = undefined;
			this._currentDeviceConfigHash = await this.deviceConfig.getHash();
			// and default to requiring an upgrade if the version could not be parsed
			cachedHashVersion ??= 0;
		}

		// Update the cached device config hash to the most recent version upon restoring,
		// if the node was previously interviewed and the device config has not changed
		// since then.
		if (this.interviewStage === InterviewStage.Complete) {
			if (
				cachedHashVersion < DeviceConfig.maxHashVersion
				&& this.hasDeviceConfigChanged() === false
			) {
				this.cachedDeviceConfigHash = await this.deviceConfig.getHash();
				// Also update the current hash to the new version, in case
				// it was previously generated with an older version
				this._currentDeviceConfigHash = this.cachedDeviceConfigHash;
				this._currentDeviceConfigHashVersion = undefined;
			}

			// Apply all param metadata from the device config dynamically.
			// This handles updates to existing params, addition of new params,
			// and removal/hiding of old params.
			for (const ep of this.getAllEndpoints()) {
				refreshConfigParamMetadataFromConfigFile(
					this.driver,
					this.id,
					ep.index,
				);
			}
		}

		this.driver.controllerLog.logNode(
			this.id,
			`${
				this.deviceConfig.isEmbedded
					? "Embedded"
					: "User-provided"
			} device config loaded`,
		);
	}

	/** The values of the referenced config parameters used for the last evaluation, keyed by `endpoint:parameter` */
	private _lastReferencedParamValues:
		| Map<string, number | undefined>
		| undefined;

	private snapshotReferencedParamValues():
		| Map<string, number | undefined>
		| undefined
	{
		const refs = this._conditionalDeviceConfig?.referencedParamValues;
		if (!refs?.size) return;
		const ret = new Map<string, number | undefined>();
		for (const [endpoint, params] of refs) {
			for (const parameter of params) {
				ret.set(
					`${endpoint}:${parameter}`,
					getCachedConfigParamValue(
						this.driver,
						this.id,
						endpoint,
						parameter,
					),
				);
			}
		}
		return ret;
	}

	private handleConfigParamValueEvent(arg: ValueID): void {
		const refs = this._conditionalDeviceConfig?.referencedParamValues;
		if (!refs?.size) return;
		if (arg.commandClass !== CommandClasses.Configuration) return;
		if (typeof arg.property !== "number") return;
		if (!refs.get(arg.endpoint ?? 0)?.has(arg.property)) return;
		this.reevaluateDeviceConfig();
	}

	private _reevaluatingDeviceConfig = false;
	private _reevaluateDeviceConfigAgain = false;

	/**
	 * Re-evaluates the conditional device config against the current parameter
	 * values and applies the result if they changed since the last evaluation
	 */
	private reevaluateDeviceConfig(): void {
		// Defer re-entrant calls, e.g. caused by removing the value of a no-longer-defined param
		if (this._reevaluatingDeviceConfig) {
			this._reevaluateDeviceConfigAgain = true;
			return;
		}
		this._reevaluatingDeviceConfig = true;
		try {
			do {
				this._reevaluateDeviceConfigAgain = false;
				this.doReevaluateDeviceConfig();
			} while (this._reevaluateDeviceConfigAgain);
		} catch (e) {
			// This runs inside a value DB event listener, so errors must not propagate
			this.driver.controllerLog.logNode(
				this.id,
				`Failed to re-evaluate the device config: ${
					getErrorMessage(e)
				}`,
				"error",
			);
		} finally {
			this._reevaluatingDeviceConfig = false;
		}
	}

	private doReevaluateDeviceConfig(): void {
		const conditionalConfig = this._conditionalDeviceConfig;
		if (!conditionalConfig) return;
		const context = this.getConditionalConfigContext();
		if (!context) return;

		const snapshot = this.snapshotReferencedParamValues();
		if (!snapshot) return;
		// The value DB also emits events when a value did not actually change
		const changedEndpoints = new Set<number>();
		const changes: string[] = [];
		for (const [key, value] of snapshot) {
			const oldValue = this._lastReferencedParamValues?.get(key);
			if (this._lastReferencedParamValues && oldValue === value) continue;
			const [endpoint, parameter] = key.split(":").map(Number);
			changedEndpoints.add(endpoint);
			changes.push(
				`${
					endpoint !== 0
						? `endpoint ${endpoint}, `
						: ""
				}#${parameter}: ${oldValue} => ${value}`,
			);
		}
		if (this._lastReferencedParamValues && changes.length === 0) return;
		this._lastReferencedParamValues = snapshot;

		this.driver.controllerLog.logNode(
			this.id,
			`Re-evaluating device config, because referenced config parameter values changed: ${
				changes.join(", ")
			}`,
			"debug",
		);

		this.deviceConfig = conditionalConfig.evaluate(context);

		// Apply changed param metadata. References only resolve within their own
		// endpoint scope, so only the endpoints with changed values are affected.
		// Compat flags are read on access and need no further action.
		for (const ep of this.getAllEndpoints()) {
			if (!changedEndpoints.has(ep.index)) continue;
			refreshConfigParamMetadataFromConfigFile(
				this.driver,
				this.id,
				ep.index,
			);
		}

		// During the interview, values of newly appearing params are queried by
		// the Configuration CC interview
		if (this.interviewStage === InterviewStage.Complete) {
			this.queryUnknownConfigParamValues();
		}

		void this.updateCurrentDeviceConfigHash(changes).catch((e) =>
			this.driver.controllerLog.logNode(
				this.id,
				`Failed to update the device config hash: ${
					getErrorMessage(e)
				}`,
				"error",
			)
		);
	}

	/** Queries the values of readable config params that have no cached value yet */
	private queryUnknownConfigParamValues(): void {
		if (
			this.status === NodeStatus.Asleep
			|| this.status === NodeStatus.Dead
		) {
			return;
		}
		const config = this._deviceConfig;
		if (!config) return;

		const queries: { endpointIndex: number; parameter: number }[] = [];
		const collect = (
			endpointIndex: number,
			paramInfo: ParamInfoMap | undefined,
		): void => {
			if (!paramInfo) return;
			for (const [key, info] of paramInfo) {
				if (info.hidden || info.writeOnly) continue;
				if (
					getCachedConfigParamValue(
						this.driver,
						this.id,
						endpointIndex,
						key.parameter,
					) != undefined
				) {
					continue;
				}
				if (
					!queries.some((q) =>
						q.endpointIndex === endpointIndex
						&& q.parameter === key.parameter
					)
				) {
					queries.push({ endpointIndex, parameter: key.parameter });
				}
			}
		};
		collect(
			0,
			config.paramInformation
				?? config.endpoints?.get(0)?.paramInformation,
		);
		if (config.endpoints) {
			for (const [index, ep] of config.endpoints) {
				if (index === 0) continue;
				collect(index, ep.paramInformation);
			}
		}
		if (queries.length === 0) return;

		void (async () => {
			for (const { endpointIndex, parameter } of queries) {
				const endpoint = this.getEndpoint(endpointIndex);
				if (!endpoint?.supportsCC(CommandClasses.Configuration)) {
					continue;
				}
				this.driver.logNode(this.id, {
					endpoint: endpointIndex,
					message:
						`querying parameter #${parameter}, which appeared after re-evaluating the device config...`,
					direction: "outbound",
				});
				// Poll priority would enforce the spec-mandated polling delays,
				// but these are one-shot catch-up queries like during the interview
				const value = await endpoint.commandClasses.Configuration
					.withOptions({ priority: MessagePriority.NodeQuery })
					.get(parameter)
					.catch(
						// A missing response means the value stays unknown
						() => undefined,
					);
				if (value == undefined) {
					this.driver.logNode(this.id, {
						endpoint: endpointIndex,
						message:
							`received no value for parameter #${parameter}`,
						direction: "inbound",
						level: "warn",
					});
				}
			}
		})().catch(() => {
			// The individual queries handle their own errors
		});
	}

	private async updateCurrentDeviceConfigHash(
		changes: readonly string[],
	): Promise<void> {
		const config = this._deviceConfig;
		if (!config) return;
		const oldHash = this._currentDeviceConfigHash;
		const newHash = await config.getHash(
			this._currentDeviceConfigHashVersion,
		);
		this._currentDeviceConfigHash = newHash;
		if (oldHash && !DeviceConfig.areHashesEqual(oldHash, newHash)) {
			// The lint forbids gating interview-relevant settings with parameter
			// values, but user-provided configs may do it anyway
			this.driver.controllerLog.logNode(
				this.id,
				`A config parameter change (${
					changes.join(", ")
				}) altered device config settings that only take effect after a re-interview. Re-interview the node to apply them.`,
				"warn",
			);
		}
	}
}
