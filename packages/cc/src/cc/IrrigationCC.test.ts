import { test } from "vitest";

import { IrrigationSensorPolarity } from "../lib/_Types.js";

import {
	IrrigationCCAPI,
	IrrigationCCSystemConfigSet,
	type IrrigationCCSystemConfigSetOptions,
} from "./IrrigationCC.js";

test("SystemConfigSet should encode sensor polarity correctly", async (t) => {
	const baseConfig: IrrigationCCSystemConfigSetOptions = {
		masterValveDelay: 7,
		highPressureThreshold: 800,
		lowPressureThreshold: 300,
	};
	const ccWithoutPolarityUpdate = new IrrigationCCSystemConfigSet({
		nodeId: 2,
		...baseConfig,
	});
	const serializedWithoutPolarityUpdate =
		await ccWithoutPolarityUpdate.serialize({} as any);
	t.expect(serializedWithoutPolarityUpdate.at(-1)).toBe(0x00);

	const prefix = serializedWithoutPolarityUpdate.subarray(
		0,
		serializedWithoutPolarityUpdate.length - 1,
	);

	for (const [rain, moisture, expectedPolarity] of [
		[IrrigationSensorPolarity.Low, IrrigationSensorPolarity.Low, 0x80],
		[IrrigationSensorPolarity.High, IrrigationSensorPolarity.Low, 0x81],
		[IrrigationSensorPolarity.Low, IrrigationSensorPolarity.High, 0x82],
		[IrrigationSensorPolarity.High, IrrigationSensorPolarity.High, 0x83],
	] as const) {
		const cc = new IrrigationCCSystemConfigSet({
			nodeId: 2,
			...baseConfig,
			rainSensorPolarity: rain,
			moistureSensorPolarity: moisture,
		});
		const serialized = await cc.serialize({} as any);
		t.expect(serialized.at(-1)).toBe(expectedPolarity);
		t.expect(serialized.subarray(0, serialized.length - 1)).toStrictEqual(
			prefix,
		);
	}
});

test("setSystemConfig should preserve known polarity for single-polarity updates", async (t) => {
	let sent: unknown;
	const api = {
		endpoint: { nodeId: 2, index: 0 },
		commandOptions: {},
		assertSupportsCommand: () => {},
		getValueDB: () => ({
			getValue: (valueId: { property: string }) => {
				if (valueId.property === "rainSensorPolarity") {
					return IrrigationSensorPolarity.Low;
				} else if (valueId.property === "moistureSensorPolarity") {
					return IrrigationSensorPolarity.High;
				}
			},
		}),
		host: {
			sendCommand: async (cc: unknown) => {
				sent = cc;
				return undefined;
			},
		},
	};

	await IrrigationCCAPI.prototype.setSystemConfig.call(api as any, {
		masterValveDelay: 7,
		highPressureThreshold: 800,
		lowPressureThreshold: 300,
		rainSensorPolarity: IrrigationSensorPolarity.High,
	});

	const cc = sent as IrrigationCCSystemConfigSet;
	t.expect(cc).toBeInstanceOf(IrrigationCCSystemConfigSet);
	t.expect(cc.rainSensorPolarity).toBe(IrrigationSensorPolarity.High);
	t.expect(cc.moistureSensorPolarity).toBe(IrrigationSensorPolarity.High);
});

test("setSystemConfig should reject single-polarity updates when the other polarity is unknown", async (t) => {
	const api = {
		endpoint: { nodeId: 2, index: 0 },
		commandOptions: {},
		assertSupportsCommand: () => {},
		getValueDB: () => ({
			getValue: (valueId: { property: string }) => {
				if (valueId.property === "rainSensorPolarity") {
					return IrrigationSensorPolarity.Low;
				}
			},
		}),
		host: {
			sendCommand: async (cc: unknown) => cc,
		},
	};

	await t
		.expect(
			IrrigationCCAPI.prototype.setSystemConfig.call(api as any, {
				masterValveDelay: 7,
				highPressureThreshold: 800,
				lowPressureThreshold: 300,
				rainSensorPolarity: IrrigationSensorPolarity.High,
			}),
		)
		.rejects.toThrow(
			"Cannot set rain sensor polarity before the moisture sensor polarity is known!",
		);
});
