import { MessagePriority, parseBitMask } from "@zwave-js/core";
import { FunctionType, Message, MessageType } from "@zwave-js/serial";
import { Bytes } from "@zwave-js/shared";
import { type Driver } from "../../driver/Driver.js";

export const FUNC_ID_NABUCASA = FunctionType.Proprietary_F0;

export enum NabuCasaCommand {
	GetSupportedCommands = 0x00,
	GetLED = 0x01,
	SetLED = 0x02,
	ReadGyro = 0x03,
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

export class ControllerProprietary_NabuCasa {
	constructor(
		driver: Driver,
		// controller: ZWaveController,
	) {
		this.driver = driver;
		// this.controller = controller;
	}

	private driver: Driver;
	// private controller: ZWaveController;

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
		// HOST->ZW: NABU_CASA_LED_SET | r | g | b |
		// ZW->HOST: NABU_CASA_LED_SET | success

		const payload = Bytes.from([
			NabuCasaCommand.SetLED,
			rgb.r,
			rgb.g,
			rgb.b,
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

		const x = callback.payload.readInt16BE(1);
		const y = callback.payload.readInt16BE(3);
		const z = callback.payload.readInt16BE(5);

		return { x, y, z };
	}
}
