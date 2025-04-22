import {
	ColorComponent,
	ColorSwitchCCValues,
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
	getCCName,
	parseBitMask,
} from "@zwave-js/core";
import { FunctionType, Message, MessageType } from "@zwave-js/serial";
import { Bytes } from "@zwave-js/shared";
import { roundTo } from "alcalzone-shared/math";
import { type Driver } from "../../driver/Driver.js";
import { type ZWaveController } from "../Controller.js";
import { type ControllerProprietaryCommon } from "../Proprietary.js";

export const FUNC_ID_NABUCASA = FunctionType.Proprietary_F0;

export enum NabuCasaCommand {
	GetSupportedCommands = 0x00,
	GetLED = 0x01,
	SetLED = 0x02,
	ReadGyro = 0x03,
	SetSystemIndication = 0x04,
	GetConfig = 0x05,
	SetConfig = 0x06,
}

export interface RGB {
	r: number;
	g: number;
	b: number;
}

export interface Vector {
	x: number;
	y: number;
	z: number;
}

export enum NabuCasaIndicationSeverity {
	None,
	Warning,
	Error,
}

export enum NabuCasaConfigKey {
	EnableTiltIndicator = 0,
}

const colorSwitchCurrentColorRed =
	ColorSwitchCCValues.currentColorChannel(ColorComponent.Red).id;
const colorSwitchCurrentColorRedTranslated = {
	...colorSwitchCurrentColorRed,
	commandClassName: getCCName(colorSwitchCurrentColorRed.commandClass),
	propertyName: colorSwitchCurrentColorRed.property,
	propertyKeyName: "Red",
};

const colorSwitchCurrentColorGreen =
	ColorSwitchCCValues.currentColorChannel(ColorComponent.Green).id;
const colorSwitchCurrentColorGreenTranslated = {
	...colorSwitchCurrentColorGreen,
	commandClassName: getCCName(colorSwitchCurrentColorGreen.commandClass),
	propertyName: colorSwitchCurrentColorGreen.property,
	propertyKeyName: "Green",
};

const colorSwitchCurrentColorBlue =
	ColorSwitchCCValues.currentColorChannel(ColorComponent.Blue).id;
const colorSwitchCurrentColorBlueTranslated = {
	...colorSwitchCurrentColorBlue,
	commandClassName: getCCName(colorSwitchCurrentColorBlue.commandClass),
	propertyName: colorSwitchCurrentColorBlue.property,
	propertyKeyName: "Blue",
};

const colorSwitchCurrentColor = ColorSwitchCCValues.currentColor.id;
const colorSwitchCurrentColorTranslated = {
	...colorSwitchCurrentColor,
	commandClassName: getCCName(colorSwitchCurrentColor.commandClass),
	propertyName: colorSwitchCurrentColor.property,
};

const colorSwitchTargetColor = ColorSwitchCCValues.targetColor.id;
const colorSwitchTargetColorTranslated = {
	...colorSwitchTargetColor,
	commandClassName: getCCName(colorSwitchTargetColor.commandClass),
	propertyName: colorSwitchTargetColor.property,
};

const colorSwitchHexColor = ColorSwitchCCValues.hexColor.id;
const colorSwitchHexColorTranslated = {
	...colorSwitchHexColor,
	commandClassName: getCCName(colorSwitchHexColor.commandClass),
	propertyName: colorSwitchHexColor.property,
};

// const multilevelSensorX =
// 	MultilevelSensorCCValues.value("Acceleration X-axis").id;
// const multilevelSensorXTranslated = {
// 	...multilevelSensorX,
// 	commandClassName: getCCName(multilevelSensorX.commandClass),
// 	propertyName: multilevelSensorX.property,
// };

// const multilevelSensorY =
// 	MultilevelSensorCCValues.value("Acceleration Y-axis").id;
// const multilevelSensorYTranslated = {
// 	...multilevelSensorY,
// 	commandClassName: getCCName(multilevelSensorY.commandClass),
// 	propertyName: multilevelSensorY.property,
// };

// const multilevelSensorZ =
// 	MultilevelSensorCCValues.value("Acceleration Z-axis").id;
// const multilevelSensorZTranslated = {
// 	...multilevelSensorZ,
// 	commandClassName: getCCName(multilevelSensorZ.commandClass),
// 	propertyName: multilevelSensorZ.property,
// };

const configEnableTiltIndicator = ConfigurationCCValues.paramInformation(
	NabuCasaConfigKey.EnableTiltIndicator,
).id;
const configEnableTiltIndicatorTranslated = {
	...configEnableTiltIndicator,
	commandClassName: getCCName(configEnableTiltIndicator.commandClass),
	propertyName: "enableTiltIndicator",
};
const configEnableTiltIndicatorMeta: ConfigurationMetadata = {
	type: "number",
	readable: true,
	writeable: true,
	min: 0,
	max: 1,
	allowManualEntry: false,
	default: 1,
	format: ConfigValueFormat.UnsignedInteger,
	label: "Enable Tilt Indicator",
	states: {
		0: "Disable",
		1: "Enable",
	},
	valueSize: 1,
};

function parseGyro(msg: Message): Vector {
	// According to datasheet: 8g range => 977 µg/LSB
	const x = roundTo(msg.payload.readInt16BE(1) / 1024 * 9.77, 2);
	const y = roundTo(msg.payload.readInt16BE(3) / 1024 * 9.77, 2);
	const z = roundTo(msg.payload.readInt16BE(5) / 1024 * 9.77, 2);

	return { x, y, z };
}

const hexColorRegex =
	/^#?(?<red>[0-9a-f]{2})(?<green>[0-9a-f]{2})(?<blue>[0-9a-f]{2})$/i;

export class ControllerProprietary_NabuCasa
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

		const supported = await this.getSupportedCommands();

		if (supported.includes(NabuCasaCommand.GetLED)) {
			const rgb = await this.getLED();

			valueDB.setMetadata(
				ColorSwitchCCValues.currentColor.id,
				ColorSwitchCCValues.currentColor.meta,
			);
			valueDB.setMetadata(
				ColorSwitchCCValues.targetColor.id,
				ColorSwitchCCValues.targetColor.meta,
			);
			valueDB.setMetadata(
				ColorSwitchCCValues
					.currentColorChannel(ColorComponent.Red).id,
				ColorSwitchCCValues
					.currentColorChannel(ColorComponent.Red).meta,
			);
			valueDB.setMetadata(
				ColorSwitchCCValues
					.currentColorChannel(ColorComponent.Green).id,
				ColorSwitchCCValues
					.currentColorChannel(ColorComponent.Green).meta,
			);
			valueDB.setMetadata(
				ColorSwitchCCValues
					.currentColorChannel(ColorComponent.Blue).id,
				ColorSwitchCCValues
					.currentColorChannel(ColorComponent.Blue).meta,
			);
			valueDB.setMetadata(
				ColorSwitchCCValues.hexColor.id,
				ColorSwitchCCValues.hexColor.meta,
			);

			this.persistRGBValue(valueDB, rgb);
		}

		// if (supported.includes(NabuCasaCommand.ReadGyro)) {
		// 	this.readGyro().then((gyro) => {
		// 		if (gyro) {
		// 			for (const sensorType of [0x34, 0x35, 0x36]) {
		// 				const sensor = getSensor(sensorType)!;
		// 				const scale = getSensorScale(
		// 					sensorType,
		// 					0x00,
		// 				)!;
		// 				const sensorName = sensor.label;
		// 				const sensorValue = MultilevelSensorCCValues.value(
		// 					sensorName,
		// 				);

		// 				valueDB.setMetadata(sensorValue.id, {
		// 					...sensorValue.meta,
		// 					unit: scale.unit,
		// 					ccSpecific: {
		// 						sensorType,
		// 						scale: scale.key,
		// 					},
		// 				});
		// 			}

		// 			this.persistGyroValues(valueDB, gyro);
		// 		}
		// 	}).catch(noop);
		// }

		if (supported.includes(NabuCasaCommand.GetConfig)) {
			const enableTiltIndicator = await this.getConfig(
				NabuCasaConfigKey.EnableTiltIndicator,
			);

			valueDB.setMetadata(
				configEnableTiltIndicator,
				configEnableTiltIndicatorMeta,
			);
			valueDB.setValue(
				configEnableTiltIndicator,
				enableTiltIndicator,
			);
		}
	}

	private persistRGBValue(
		valueDB: ValueDB,
		rgb: RGB,
	) {
		valueDB.setValue(colorSwitchCurrentColorRed, rgb.r);
		valueDB.setValue(colorSwitchCurrentColorBlue, rgb.b);
		valueDB.setValue(colorSwitchCurrentColorGreen, rgb.g);
		valueDB.setValue(colorSwitchCurrentColor, {
			red: rgb.r,
			green: rgb.g,
			blue: rgb.b,
		});
		const hexValue = (rgb.r << 16) | (rgb.g << 8) | rgb.b;
		valueDB.setValue(
			colorSwitchHexColor,
			hexValue.toString(16).padStart(6, "0"),
		);
	}

	// private persistGyroValues(
	// 	valueDB: ValueDB,
	// 	gyro: Vector,
	// ) {
	// 	valueDB.setValue(multilevelSensorX, gyro.x);
	// 	valueDB.setValue(multilevelSensorY, gyro.y);
	// 	valueDB.setValue(multilevelSensorZ, gyro.z);
	// }

	public async getSupportedCommands(): Promise<NabuCasaCommand[]> {
		// HOST->ZW: NABU_CASA_CMD_SUPPORTED
		// ZW->HOST: NABU_CASA_CMD_SUPPORTED | supportedBitmask

		const getSupportedCmd = new Message({
			type: MessageType.Request,
			functionType: FUNC_ID_NABUCASA,
			payload: Bytes.from([NabuCasaCommand.GetSupportedCommands]),
			expectedResponse: (self, msg) => {
				return (
					msg.functionType === FUNC_ID_NABUCASA
					&& msg.type === MessageType.Response
					&& msg.payload[0] === NabuCasaCommand.GetSupportedCommands
				);
			},
		});

		const result = await this.driver.sendMessage(
			getSupportedCmd,
			{
				priority: MessagePriority.Controller,
				supportCheck: false,
			},
		);
		const supported = result.payload.subarray(1);

		return parseBitMask(supported, NabuCasaCommand.GetSupportedCommands);
	}

	public async getLED(): Promise<RGB> {
		// HOST->ZW: NABU_CASA_LED_GET
		// ZW->HOST: NABU_CASA_LED_GET | r | g | b |

		const getLEDStateCmd = new Message({
			type: MessageType.Request,
			functionType: FUNC_ID_NABUCASA,
			payload: Bytes.from([NabuCasaCommand.GetLED]),
			expectedResponse: (self, msg) => {
				return (
					msg.functionType === FUNC_ID_NABUCASA
					&& msg.type === MessageType.Response
					&& msg.payload[0] === NabuCasaCommand.GetLED
				);
			},
		});

		const resultPromise = this.driver.sendMessage(getLEDStateCmd, {
			priority: MessagePriority.Controller,
			supportCheck: false,
		});
		const { payload: result } = await resultPromise;

		return {
			r: result[1],
			g: result[2],
			b: result[3],
		};
	}

	public async setLED(rgb: RGB): Promise<boolean> {
		// HOST->ZW: NABU_CASA_LED_SET | r | g | b | [ effect | [ speed ]]
		// ZW->HOST: NABU_CASA_LED_SET | success

		const payload = Bytes.from([
			NabuCasaCommand.SetLED,
			rgb.r,
			rgb.g,
			rgb.b,
			1, // SOLID
		]);

		const setLEDStateCmd = new Message({
			type: MessageType.Request,
			functionType: FUNC_ID_NABUCASA,
			payload,
			expectedResponse: (self, msg) => {
				return (
					msg.functionType === FUNC_ID_NABUCASA
					&& msg.type === MessageType.Response
					&& msg.payload[0] === NabuCasaCommand.SetLED
				);
			},
		});
		const result = await this.driver.sendMessage(setLEDStateCmd, {
			priority: MessagePriority.Controller,
			supportCheck: false,
		});
		const success = !!result.payload[1];

		return success;
	}

	public async readGyro(): Promise<Vector | undefined> {
		// HOST->ZW (REQ): NABU_CASA_GYRO_MEASURE
		// ZW->HOST (RES): NABU_CASA_GYRO_MEASURE | success
		// later
		// ZW->HOST (CB):  NABU_CASA_GYRO_MEASURE
		//           | accel_x (MSB) | accel_x (LSB)
		//           | accel_y (MSB) | accel_y (LSB)
		//           | accel_z (MSB) | accel_z (LSB)

		const readGyroCmd = new Message({
			type: MessageType.Request,
			functionType: FUNC_ID_NABUCASA,
			payload: Bytes.from([NabuCasaCommand.ReadGyro]),
			expectedResponse: (self, msg) => {
				return (
					msg.functionType === FUNC_ID_NABUCASA
					&& msg.type === MessageType.Response
					&& msg.payload[0] === NabuCasaCommand.ReadGyro
				);
			},
		});

		const callbackPromise = this.driver.waitForMessage((msg) => {
			return (
				msg.functionType === FUNC_ID_NABUCASA
				&& msg.type === MessageType.Request
				&& msg.payload[0] === NabuCasaCommand.ReadGyro
			);
		}, 1000);

		const response = await this.driver.sendMessage(readGyroCmd, {
			priority: MessagePriority.Controller,
			supportCheck: false,
		});
		if (!response.payload[0]) {
			return;
		}

		const callback = await callbackPromise;

		// According to datasheet: 8g range => 977 µg/LSB
		return parseGyro(callback);
	}

	public async setSystemIndication(
		severity: NabuCasaIndicationSeverity,
	): Promise<boolean> {
		// HOST->ZW: NABU_CASA_SET_SYSTEM_INDICATION | severity
		// ZW->HOST: NABU_CASA_SET_SYSTEM_INDICATION | success

		const payload = Bytes.from([
			NabuCasaCommand.SetSystemIndication,
			severity,
		]);

		const systemIndicationCmd = new Message({
			type: MessageType.Request,
			functionType: FUNC_ID_NABUCASA,
			payload,
			expectedResponse: (self, msg) => {
				return (
					msg.functionType === FUNC_ID_NABUCASA
					&& msg.type === MessageType.Response
					&& msg.payload[0] === NabuCasaCommand.SetSystemIndication
				);
			},
		});
		const result = await this.driver.sendMessage(systemIndicationCmd, {
			priority: MessagePriority.Controller,
			supportCheck: false,
		});
		const success = !!result.payload[1];

		return success;
	}

	public async getConfig(key: NabuCasaConfigKey): Promise<number> {
		// HOST->ZW (REQ): NABU_CASA_CONFIG_GET | key
		// ZW->HOST (RES): NABU_CASA_CONFIG_GET | key | size | value...

		const payload = Bytes.from([
			NabuCasaCommand.GetConfig,
			key,
		]);

		const getConfigCmd = new Message({
			type: MessageType.Request,
			functionType: FUNC_ID_NABUCASA,
			payload,
			expectedResponse: (self, msg) => {
				return (
					msg.functionType === FUNC_ID_NABUCASA
					&& msg.type === MessageType.Response
					&& msg.payload[0] === NabuCasaCommand.GetConfig
					&& msg.payload[1] === key
				);
			},
		});

		const resultPromise = this.driver.sendMessage(getConfigCmd, {
			priority: MessagePriority.Controller,
			supportCheck: false,
		});
		const { payload: result } = await resultPromise;

		const size = result[2];
		if (result.length > 3 + size) {
			// TODO: Decide what to do when the response is invalid
			return Number.NEGATIVE_INFINITY;
		} else {
			return result.readIntBE(3, size);
		}
	}

	public async setConfig(
		key: NabuCasaConfigKey,
		value: number,
	): Promise<boolean> {
		// HOST->ZW (REQ): NABU_CASA_CONFIG_SET | key | size | value...
		// ZW->HOST (RES): NABU_CASA_CONFIG_SET | success

		const payload = Bytes.from([
			NabuCasaCommand.SetConfig,
			key,
			// For now, only 1 byte is supported
			1,
			value,
		]);

		const setConfigCmd = new Message({
			type: MessageType.Request,
			functionType: FUNC_ID_NABUCASA,
			payload,
			expectedResponse: (self, msg) => {
				return (
					msg.functionType === FUNC_ID_NABUCASA
					&& msg.type === MessageType.Response
					&& msg.payload[0] === NabuCasaCommand.SetConfig
				);
			},
		});
		const result = await this.driver.sendMessage(setConfigCmd, {
			priority: MessagePriority.Controller,
			supportCheck: false,
		});
		const success = !!result.payload[1];

		return success;
	}

	public getDefinedValueIDs(): TranslatedValueID[] {
		// TODO: Make dynamic

		return [
			// RGB light: Color Switch
			colorSwitchCurrentColorRedTranslated,
			colorSwitchCurrentColorGreenTranslated,
			colorSwitchCurrentColorBlueTranslated,
			colorSwitchCurrentColorTranslated,
			colorSwitchTargetColorTranslated,
			colorSwitchHexColorTranslated,
			// // Gyro: Multilevel Sensor (X, Y, Z accel)
			// multilevelSensorXTranslated,
			// multilevelSensorYTranslated,
			// multilevelSensorZTranslated,
			// Configuration
			configEnableTiltIndicatorTranslated,
		];
	}

	public async pollValue(valueId: ValueID): Promise<unknown> {
		if (
			ColorSwitchCCValues.targetColor.is(valueId)
			|| ColorSwitchCCValues.currentColor.is(valueId)
			|| ColorSwitchCCValues.hexColor.is(valueId)
		) {
			const rgb = await this.getLED();
			this.persistRGBValue(this.controller.valueDB, rgb);
			return rgb;
		}

		if (
			ColorSwitchCCValues.currentColorChannel.is(valueId)
			|| ColorSwitchCCValues.targetColorChannel.is(valueId)
		) {
			const rgb = await this.getLED();
			this.persistRGBValue(this.controller.valueDB, rgb);
			switch (valueId.propertyKey as ColorComponent) {
				case ColorComponent.Red:
					return rgb.r;
				case ColorComponent.Green:
					return rgb.g;
				case ColorComponent.Blue:
					return rgb.b;
			}
			return undefined;
		}

		// if (MultilevelSensorCCValues.value.is(valueId)) {
		// 	switch (valueId.property) {
		// 		case "Acceleration X-axis":
		// 		case "Acceleration Y-axis":
		// 		case "Acceleration Z-axis":
		// 			// OK
		// 			break;
		// 		default:
		// 			return undefined;
		// 	}
		// 	const gyro = await this.readGyro();
		// 	if (gyro) {
		// 		this.persistGyroValues(this.controller.valueDB, gyro);
		// 		switch (valueId.property) {
		// 			case "Acceleration X-axis":
		// 				return gyro.x;
		// 			case "Acceleration Y-axis":
		// 				return gyro.y;
		// 			case "Acceleration Z-axis":
		// 				return gyro.z;
		// 		}
		// 	}
		// }

		if (
			ConfigurationCCValues.paramInformation.is(valueId)
			&& valueId.propertyKey == undefined
		) {
			switch (valueId.property) {
				case NabuCasaConfigKey.EnableTiltIndicator:
					// OK
					break;
				default:
					return undefined;
			}

			const value = await this.getConfig(valueId.property as number);
			if (value != undefined) {
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
			ColorSwitchCCValues.targetColor.is(valueId)
			&& typeof value === "object"
			&& value !== null
		) {
			if (typeof value !== "object" || value === null) {
				return {
					status: SetValueStatus.InvalidValue,
					message: "The value must be an object",
				};
			}
			const rgb: RGB = {
				r: (value as any).red ?? 0,
				g: (value as any).green ?? 0,
				b: (value as any).blue ?? 0,
			};
			await this.setLED(rgb);
			this.persistRGBValue(this.controller.valueDB, rgb);

			return { status: SetValueStatus.Success };
		}

		if (ColorSwitchCCValues.hexColor.is(valueId)) {
			if (typeof value !== "string") {
				return {
					status: SetValueStatus.InvalidValue,
					message: `The value must be a string`,
				};
			}

			const match = hexColorRegex.exec(value);
			if (!match) {
				return {
					status: SetValueStatus.InvalidValue,
					message: `${value} is not a valid HEX color string`,
				};
			}
			const rgb: RGB = {
				r: parseInt(match.groups!.red, 16),
				g: parseInt(match.groups!.green, 16),
				b: parseInt(match.groups!.blue, 16),
			};

			await this.setLED(rgb);
			this.persistRGBValue(this.controller.valueDB, rgb);

			return { status: SetValueStatus.Success };
		}

		if (
			ConfigurationCCValues.paramInformation.is(valueId)
			&& valueId.propertyKey == undefined
			&& typeof value === "number"
			&& [
				NabuCasaConfigKey.EnableTiltIndicator,
			].includes(valueId.property as any)
		) {
			await this.setConfig(
				valueId.property as NabuCasaConfigKey,
				value,
			);
			this.controller.valueDB.setValue(valueId, value);

			return { status: SetValueStatus.Success };
		}

		return { status: SetValueStatus.NoDeviceSupport };
	}

	// eslint-disable-next-line @typescript-eslint/require-await
	async handleUnsolicited(_msg: Message): Promise<boolean> {
		// 	if (
		// 		msg.functionType === FUNC_ID_NABUCASA
		// 		&& msg.type === MessageType.Request
		// 	) {
		// 		const command = msg.payload[0];
		// 		if (
		// 			command === NabuCasaCommand.ReadGyro && msg.payload.length >= 7
		// 		) {
		// 			const gyro = parseGyro(msg);
		// 			this.persistGyroValues(this.controller.valueDB, gyro);
		// 			return true;
		// 		}
		// 	}
		return false;
	}
}
