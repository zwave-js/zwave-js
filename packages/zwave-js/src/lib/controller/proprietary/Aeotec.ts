import {
	BinarySwitchCCValues,
	ConfigurationCCValues,
	type SetValueResult,
	SetValueStatus,
} from "@zwave-js/cc";
import {
	ConfigValueFormat,
	type ConfigurationMetadata,
	MessagePriority,
	type TranslatedValueID,
	type ValueDB,
	type ValueID,
	ZWaveError,
	ZWaveErrorCodes,
	getCCName,
} from "@zwave-js/core";
import { FunctionType, Message, MessageType } from "@zwave-js/serial";
import { Bytes } from "@zwave-js/shared";
import type { Driver } from "../../driver/Driver.js";
import type { ZWaveController } from "../Controller.js";
import type { ControllerProprietaryCommon } from "../Proprietary.js";

// The Aeotec Z-Stick Gen5 exposes its configuration through two proprietary
// Serial API commands. Set uses 0xF2, get uses 0xF3.
export const FUNC_ID_AEOTEC_CONFIG_SET = FunctionType.Proprietary_F2;
export const FUNC_ID_AEOTEC_CONFIG_GET = FunctionType.Proprietary_F3;

export enum AeotecConfigParam {
	LEDIndicator = 0x51,
	RFPowerLevel = 0xdc,
	SecurityNetworkEnabled = 0xf2,
	SecurityNetworkKey = 0xf3,
	ConfigurationLocked = 0xfc,
}

const SECURITY_NETWORK_KEY_SIZE = 16;

function configValueId(param: AeotecConfigParam): ValueID {
	return ConfigurationCCValues.paramInformation(param).id;
}

function translateValueID(
	id: ValueID,
	propertyName: string,
): TranslatedValueID {
	return {
		...id,
		commandClassName: getCCName(id.commandClass),
		propertyName,
	};
}

const binarySwitchCurrentValueTranslated = translateValueID(
	BinarySwitchCCValues.currentValue.id,
	"Current value",
);
const binarySwitchTargetValueTranslated = translateValueID(
	BinarySwitchCCValues.targetValue.id,
	"Target value",
);

const rfPowerLevelMeta: ConfigurationMetadata = {
	type: "number",
	readable: true,
	writeable: true,
	min: 1,
	max: 10,
	allowManualEntry: true,
	default: 10,
	format: ConfigValueFormat.UnsignedInteger,
	label: "RF Power Level",
	valueSize: 1,
};
const configurationLockedMeta: ConfigurationMetadata = {
	type: "number",
	readable: true,
	writeable: true,
	min: 0,
	max: 1,
	allowManualEntry: false,
	default: 0,
	format: ConfigValueFormat.UnsignedInteger,
	label: "Lock Configuration",
	states: { 0: "Disable", 1: "Enable" },
	valueSize: 1,
};

// Parameters exposed as writable Configuration CC values
const CONFIGURABLE_PARAMS = new Map<AeotecConfigParam, ConfigurationMetadata>([
	[AeotecConfigParam.RFPowerLevel, rfPowerLevelMeta],
	[AeotecConfigParam.ConfigurationLocked, configurationLockedMeta],
]);

export class ControllerProprietary_Aeotec
	implements ControllerProprietaryCommon
{
	constructor(
		driver: Driver,
		controller: ZWaveController,
	) {
		this.driver = driver;
		this.controller = controller;
	}

	private driver: Driver;
	private controller: ZWaveController;

	public async interview(): Promise<void> {
		const valueDB = this.controller.valueDB;

		const config = await this.getConfig([
			AeotecConfigParam.LEDIndicator,
			AeotecConfigParam.RFPowerLevel,
			AeotecConfigParam.ConfigurationLocked,
		]);

		const led = config.get(AeotecConfigParam.LEDIndicator);
		if (led?.length) {
			valueDB.setMetadata(
				BinarySwitchCCValues.currentValue.id,
				BinarySwitchCCValues.currentValue.meta,
			);
			valueDB.setMetadata(
				BinarySwitchCCValues.targetValue.id,
				BinarySwitchCCValues.targetValue.meta,
			);
			this.persistLEDState(valueDB, !!led[0]);
		}

		for (const [param, meta] of CONFIGURABLE_PARAMS) {
			const raw = config.get(param);
			if (!raw?.length) continue;
			valueDB.setMetadata(configValueId(param), meta);
			valueDB.setValue(
				configValueId(param),
				raw.readUIntBE(0, raw.length),
			);
		}
	}

	private persistLEDState(valueDB: ValueDB, state: boolean) {
		valueDB.setValue(BinarySwitchCCValues.currentValue.id, state);
		valueDB.setValue(BinarySwitchCCValues.targetValue.id, state);
	}

	/** Reads one or more configuration parameters in a single request */
	public async getConfig(
		params: AeotecConfigParam[],
	): Promise<Map<AeotecConfigParam, Bytes>> {
		// HOST->ZW (REQ): 0xF3 | param1 | ... | paramN
		// ZW->HOST (RES): 0xF3 | param1 | size1 | value1... | ...

		const getConfigCmd = new Message({
			type: MessageType.Request,
			functionType: FUNC_ID_AEOTEC_CONFIG_GET,
			payload: Bytes.from(params),
			expectedResponse: (self, msg) => {
				return (
					msg.functionType === FUNC_ID_AEOTEC_CONFIG_GET
					&& msg.type === MessageType.Response
				);
			},
		});

		const result = await this.driver.sendMessage(getConfigCmd, {
			priority: MessagePriority.Controller,
			supportCheck: false,
		});

		const ret = new Map<AeotecConfigParam, Bytes>();
		const payload = result.payload;
		let offset = 0;
		while (offset + 2 <= payload.length) {
			const param = payload[offset];
			const size = payload[offset + 1];
			offset += 2;
			if (offset + size > payload.length) break;
			ret.set(param, Bytes.view(payload.subarray(offset, offset + size)));
			offset += size;
		}
		return ret;
	}

	/** Sets a single configuration parameter */
	public async setConfig(
		param: AeotecConfigParam,
		value: number | Uint8Array,
	): Promise<boolean> {
		const valueBytes = typeof value === "number"
			? Bytes.from([value])
			: Bytes.view(value);
		return this.setConfigInternal(param, valueBytes, false);
	}

	/** Resets a single configuration parameter to its factory default */
	public async resetConfig(param: AeotecConfigParam): Promise<boolean> {
		return this.setConfigInternal(param, new Bytes(0), true);
	}

	private async setConfigInternal(
		param: AeotecConfigParam,
		value: Bytes,
		useDefault: boolean,
	): Promise<boolean> {
		// HOST->ZW (REQ): 0xF2 | param | (default << 7 | size) | value (MSB first)
		// ZW->HOST (RES): 0xF2 | retVal

		// The largest value we need to support is the 16-byte S0 security key
		if (value.length > 16) {
			throw new ZWaveError(
				`Aeotec configuration values must not exceed 16 bytes`,
				ZWaveErrorCodes.Argument_Invalid,
			);
		}

		// The top bit of the size field requests a reset to factory default
		const sizeField = (useDefault ? 0x80 : 0x00) | value.length;
		const payload = Bytes.concat([
			[param, sizeField],
			value,
		]);

		const setConfigCmd = new Message({
			type: MessageType.Request,
			functionType: FUNC_ID_AEOTEC_CONFIG_SET,
			payload,
			expectedResponse: (self, msg) => {
				return (
					msg.functionType === FUNC_ID_AEOTEC_CONFIG_SET
					&& msg.type === MessageType.Response
				);
			},
		});

		const result = await this.driver.sendMessage(setConfigCmd, {
			priority: MessagePriority.Controller,
			supportCheck: false,
		});
		return !!result.payload[0];
	}

	/** Reads a single-byte configuration parameter */
	private async getConfigByte(
		param: AeotecConfigParam,
	): Promise<number | undefined> {
		const raw = (await this.getConfig([param])).get(param);
		return raw?.length ? raw[0] : undefined;
	}

	public async getLED(): Promise<boolean> {
		return !!(await this.getConfigByte(AeotecConfigParam.LEDIndicator));
	}

	public setLED(enabled: boolean): Promise<boolean> {
		return this.setConfig(AeotecConfigParam.LEDIndicator, enabled ? 1 : 0);
	}

	public async getRFPowerLevel(): Promise<number> {
		return (await this.getConfigByte(AeotecConfigParam.RFPowerLevel)) ?? 0;
	}

	public setRFPowerLevel(level: number): Promise<boolean> {
		return this.setConfig(AeotecConfigParam.RFPowerLevel, level);
	}

	public async getSecurityNetworkEnabled(): Promise<boolean> {
		return !!(await this.getConfigByte(
			AeotecConfigParam.SecurityNetworkEnabled,
		));
	}

	public setSecurityNetworkEnabled(enabled: boolean): Promise<boolean> {
		return this.setConfig(
			AeotecConfigParam.SecurityNetworkEnabled,
			enabled ? 1 : 0,
		);
	}

	public async getSecurityNetworkKey(): Promise<Uint8Array> {
		const config = await this.getConfig([
			AeotecConfigParam.SecurityNetworkKey,
		]);
		return config.get(AeotecConfigParam.SecurityNetworkKey) ?? new Bytes(0);
	}

	public setSecurityNetworkKey(key: Uint8Array): Promise<boolean> {
		if (key.length !== SECURITY_NETWORK_KEY_SIZE) {
			throw new Error(
				`The security network key must be ${SECURITY_NETWORK_KEY_SIZE} bytes long`,
			);
		}
		return this.setConfig(AeotecConfigParam.SecurityNetworkKey, key);
	}

	public async getConfigurationLocked(): Promise<boolean> {
		return !!(await this.getConfigByte(
			AeotecConfigParam.ConfigurationLocked,
		));
	}

	public setConfigurationLocked(locked: boolean): Promise<boolean> {
		return this.setConfig(
			AeotecConfigParam.ConfigurationLocked,
			locked ? 1 : 0,
		);
	}

	public getDefinedValueIDs(): TranslatedValueID[] {
		return [
			binarySwitchCurrentValueTranslated,
			binarySwitchTargetValueTranslated,
			...[...CONFIGURABLE_PARAMS].map(([param, meta]) =>
				translateValueID(configValueId(param), meta.label!)
			),
		];
	}

	public async pollValue(valueId: ValueID): Promise<unknown> {
		if (
			BinarySwitchCCValues.targetValue.is(valueId)
			|| BinarySwitchCCValues.currentValue.is(valueId)
		) {
			const state = await this.getLED();
			this.persistLEDState(this.controller.valueDB, state);
			return state;
		}

		if (
			ConfigurationCCValues.paramInformation.is(valueId)
			&& valueId.propertyKey == undefined
		) {
			const param = valueId.property as AeotecConfigParam;
			if (!CONFIGURABLE_PARAMS.has(param)) return undefined;
			const config = await this.getConfig([param]);
			const raw = config.get(param);
			if (raw?.length) {
				const value = raw.readUIntBE(0, raw.length);
				this.controller.valueDB.setValue(valueId, value);
				return value;
			}
		}
	}

	public async setValue(
		valueId: ValueID,
		value: unknown,
	): Promise<SetValueResult> {
		if (
			BinarySwitchCCValues.targetValue.is(valueId)
			&& typeof value === "boolean"
		) {
			await this.setLED(value);
			this.persistLEDState(this.controller.valueDB, value);
			return { status: SetValueStatus.Success };
		}

		if (
			ConfigurationCCValues.paramInformation.is(valueId)
			&& valueId.propertyKey == undefined
			&& typeof value === "number"
			&& CONFIGURABLE_PARAMS.has(valueId.property as AeotecConfigParam)
		) {
			await this.setConfig(valueId.property as AeotecConfigParam, value);
			this.controller.valueDB.setValue(valueId, value);
			return { status: SetValueStatus.Success };
		}

		return { status: SetValueStatus.NoDeviceSupport };
	}

	handleUnsolicited(_msg: Message): Promise<boolean> {
		return Promise.resolve(false);
	}
}
