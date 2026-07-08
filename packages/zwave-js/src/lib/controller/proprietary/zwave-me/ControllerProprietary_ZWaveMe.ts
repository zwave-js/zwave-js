import { type SetValueResult, SetValueStatus } from "@zwave-js/cc";
import {
	MessagePriority,
	RFRegion,
	type TranslatedValueID,
	type ValueID,
	ZWaveError,
	ZWaveErrorCodes,
} from "@zwave-js/core";
import { FunctionType, Message, MessageType } from "@zwave-js/serial";
import { Bytes, getEnumMemberName } from "@zwave-js/shared";
import type { Driver } from "../../../driver/Driver.js";
import type { ZWaveController } from "../../Controller.js";
import type { ControllerProprietaryCommon } from "../../Proprietary.js";

// Configuration of the RF region uses a proprietary command with a region-ID
// table that differs from the standard RF_REGION encoding.
const FUNC_ID_ZWAVEME_REGION = FunctionType.Proprietary_F2;

// Passing 0xFF as the region reads the current value instead of setting one
const REGION_READ_SENTINEL = 0xff;
const SERIAL_API_STARTED_TIMEOUT = 20_000;

export enum ZWaveMeRegion {
	EU = 0x00,
	RU = 0x01,
	IN = 0x02,
	US = 0x03,
	ANZ = 0x04,
	HK = 0x05,
	CN = 0x06,
	JP = 0x07,
	KR = 0x08,
	IL = 0x09,
	MY = 0x0a,
	US_LR = 0x0b,
	EU_LR = 0x0c,
}

const zwaveMeToRFRegion = new Map<ZWaveMeRegion, RFRegion>([
	[ZWaveMeRegion.EU, RFRegion.Europe],
	[ZWaveMeRegion.RU, RFRegion.Russia],
	[ZWaveMeRegion.IN, RFRegion.India],
	[ZWaveMeRegion.US, RFRegion.USA],
	[ZWaveMeRegion.ANZ, RFRegion["Australia/New Zealand"]],
	[ZWaveMeRegion.HK, RFRegion["Hong Kong"]],
	[ZWaveMeRegion.CN, RFRegion.China],
	[ZWaveMeRegion.JP, RFRegion.Japan],
	[ZWaveMeRegion.KR, RFRegion.Korea],
	[ZWaveMeRegion.IL, RFRegion.Israel],
	[ZWaveMeRegion.US_LR, RFRegion["USA (Long Range)"]],
	[ZWaveMeRegion.EU_LR, RFRegion["Europe (Long Range)"]],
]);
const rfRegionToZWaveMe = new Map<RFRegion, ZWaveMeRegion>(
	[...zwaveMeToRFRegion].map(([k, v]) => [v, k]),
);

export function zwaveMeRegionToRFRegion(
	region: ZWaveMeRegion,
): RFRegion | undefined {
	return zwaveMeToRFRegion.get(region);
}

export function rfRegionToZWaveMeRegion(
	region: RFRegion,
): ZWaveMeRegion | undefined {
	return rfRegionToZWaveMe.get(region);
}

/**
 * Proprietary Serial API support for Z-Wave.me controllers (UZB / Razberry up to Gen 5).
 */
export class ControllerProprietary_ZWaveMe
	implements ControllerProprietaryCommon
{
	constructor(
		driver: Driver,
		controller: ZWaveController,
	) {
		this.driver = driver;
		this.controller = controller;
	}

	protected driver: Driver;
	protected controller: ZWaveController;

	public async interview(): Promise<void> {
		try {
			const region = await this.getRegionProprietary();
			const rfRegion = zwaveMeRegionToRFRegion(region);
			if (rfRegion != undefined) {
				this.controller.setCachedRFRegion(rfRegion);
			}
			this.driver.controllerLog.print(
				`Z-Wave.me controller RF region: ${
					getEnumMemberName(ZWaveMeRegion, region)
				}`,
			);
		} catch {
			this.driver.controllerLog.print(
				`Querying the Z-Wave.me RF region failed!`,
				"warn",
			);
		}
	}

	/** Reads the currently configured RF region */
	public async getRegionProprietary(): Promise<ZWaveMeRegion> {
		const cmd = new Message({
			type: MessageType.Request,
			functionType: FUNC_ID_ZWAVEME_REGION,
			payload: Bytes.from([REGION_READ_SENTINEL]),
			expectedResponse: (self, msg) =>
				msg.functionType === FUNC_ID_ZWAVEME_REGION
				&& msg.type === MessageType.Response,
		});
		const result = await this.driver.sendMessage(cmd, {
			priority: MessagePriority.Controller,
			supportCheck: false,
		});
		return result.payload[0];
	}

	/**
	 * Configures the RF region. The controller restarts itself afterwards,
	 * so a short delay is expected before it becomes responsive again.
	 */
	public async setRegionProprietary(region: ZWaveMeRegion): Promise<void> {
		const started = this.driver.waitForMessage(
			(msg) => msg.functionType === FunctionType.SerialAPIStarted,
			SERIAL_API_STARTED_TIMEOUT,
		).catch(() => undefined);

		const cmd = new Message({
			type: MessageType.Request,
			functionType: FUNC_ID_ZWAVEME_REGION,
			payload: Bytes.from([region]),
		});
		await this.driver.sendMessage(cmd, {
			priority: MessagePriority.Controller,
			supportCheck: false,
		});

		await started;
	}

	/**
	 * Reads the RF region using the standard {@link RFRegion} encoding.
	 * Used as a fallback by the controller's `getRFRegion`.
	 */
	public async getRFRegion(): Promise<RFRegion> {
		const region = zwaveMeRegionToRFRegion(
			await this.getRegionProprietary(),
		);
		if (region == undefined) {
			throw new ZWaveError(
				`The controller is set to a region with no standard equivalent!`,
				ZWaveErrorCodes.Driver_NotSupported,
			);
		}
		return region;
	}

	/**
	 * Configures the RF region using the standard {@link RFRegion} encoding.
	 * Used as a fallback by the controller's `setRFRegion`.
	 */
	public async setRFRegion(region: RFRegion): Promise<void> {
		const zwRegion = rfRegionToZWaveMeRegion(region);
		if (zwRegion == undefined) {
			throw new ZWaveError(
				`The region ${
					getEnumMemberName(RFRegion, region)
				} is not supported by this controller!`,
				ZWaveErrorCodes.Driver_NotSupported,
			);
		}
		await this.setRegionProprietary(zwRegion);
	}

	public getDefinedValueIDs(): TranslatedValueID[] {
		return [];
	}

	public pollValue(_valueId: ValueID): Promise<unknown> {
		return Promise.resolve(undefined);
	}

	public setValue(
		_valueId: ValueID,
		_value: unknown,
	): Promise<SetValueResult> {
		return Promise.resolve({ status: SetValueStatus.NoDeviceSupport });
	}

	public handleUnsolicited(_msg: Message): Promise<boolean> {
		return Promise.resolve(false);
	}
}
