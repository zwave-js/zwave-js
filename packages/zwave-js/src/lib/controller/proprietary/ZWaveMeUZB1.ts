import {
	MessagePriority,
	RFRegion,
	type TranslatedValueID,
	type ValueID,
} from "@zwave-js/core";
import { FunctionType, Message, MessageType } from "@zwave-js/serial";
import { Bytes } from "@zwave-js/shared";
import type { Driver } from "../../driver/Driver.js";
import type { ZWaveController } from "../Controller.js";
import type { ControllerProprietaryCommon } from "../Proprietary.js";

export const FUNC_ID_ZME_SET_REGION = FunctionType.Proprietary_F2;

/**
 * Mapping from standard RFRegion enum to Z-Wave.me UZB1 frequency bytes
 * Based on Z-Wave.me UZB1 documentation
 */
const UZB1_FREQUENCY_MAPPING = new Map<RFRegion, number>([
	[RFRegion.Europe, 0x00],
	[RFRegion.Russia, 0x01],
	[RFRegion.India, 0x02],
	[RFRegion.USA, 0x03],
	[RFRegion["Australia/New Zealand"], 0x04],
	[RFRegion["Hong Kong"], 0x05],
	[RFRegion.Japan, 0x07],
	[RFRegion.Korea, 0x08],
	[RFRegion.Israel, 0x09],
]);

/**
 * Proprietary controller implementation for Z-Wave.me UZB1
 */
export class ControllerProprietary_ZWaveMeUZB1
	implements ControllerProprietaryCommon
{
	public constructor(
		private readonly driver: Driver,
		private readonly controller: ZWaveController,
	) {}

	public async interview(): Promise<void> {
		// Nothing to do
	}

	public getDefinedValueIDs(): TranslatedValueID[] {
		// None
		return [];
	}

	public pollValue(_valueId: ValueID): Promise<unknown> {
		throw new Error("Polling values is not supported for Z-Wave.me UZB1");
	}

	public setValue(_valueId: ValueID, _value: unknown): Promise<any> {
		throw new Error("Setting values is not supported for Z-Wave.me UZB1");
	}

	public handleUnsolicited(_msg: Message): Promise<boolean> {
		// Nothing to handle
		return Promise.resolve(false);
	}

	public async setRFRegion(region: RFRegion): Promise<boolean> {
		const frequencyByte = UZB1_FREQUENCY_MAPPING.get(region);
		if (frequencyByte == undefined) {
			throw new Error(
				`RF region ${
					RFRegion[region]
				} (${region}) is not supported by Z-Wave.me UZB1`,
			);
		}

		// Create the proprietary command message directly following NabuCasa pattern
		const setRFRegionCmd = new Message({
			type: MessageType.Request,
			functionType: FUNC_ID_ZME_SET_REGION,
			payload: Bytes.from([frequencyByte]),
			// UZB1 command is fire-and-forget (does not expect a response)
		});

		try {
			await this.driver.sendMessage(
				setRFRegionCmd,
				{
					priority: MessagePriority.Controller,
					supportCheck: true,
				},
			);
			return true;
		} catch (error) {
			this.driver.controllerLog.print(
				`Error setting RF region to ${RFRegion[region]}: ${
					String(error)
				}`,
				"error",
			);
			return false;
		}
	}
}
