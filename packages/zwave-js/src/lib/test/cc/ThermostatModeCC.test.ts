import {
	CommandClass,
	ThermostatMode,
	ThermostatModeCCSet,
	ThermostatModeCommand,
} from "@zwave-js/cc";
import { ThermostatModeCCAPI } from "@zwave-js/cc/ThermostatModeCC";
import {
	assertZWaveError,
	CommandClasses,
	ZWaveErrorCodes,
} from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { test, vi } from "vitest";

const nodeId = 5;

function buildCCBuffer(payload: BytesView): BytesView {
	return Bytes.concat([
		Uint8Array.from([
			CommandClasses["Thermostat Mode"], // CC
		]),
		payload,
	]);
}

test("the Set command should serialize correctly for ordinary modes", async (t) => {
	const cc = new ThermostatModeCCSet({
		nodeId,
		mode: ThermostatMode.Off,
	});
	const expected = buildCCBuffer(
		Uint8Array.from([
			ThermostatModeCommand.Set, // CC Command
			ThermostatMode.Off,
		]),
	);
	await t.expect(cc.serialize({} as any)).resolves.toStrictEqual(expected);
});

test("the Set command should serialize correctly for manufacturer specific mode without data", async (t) => {
	const cc = new ThermostatModeCCSet({
		nodeId,
		mode: ThermostatMode["Manufacturer specific"],
		manufacturerData: new Uint8Array(),
	});
	const expected = buildCCBuffer(
		Uint8Array.from([
			ThermostatModeCommand.Set, // CC Command
			ThermostatMode["Manufacturer specific"],
		]),
	);
	await t.expect(cc.serialize({} as any)).resolves.toStrictEqual(expected);
});

test("the Set command should serialize correctly for manufacturer specific mode with 7 bytes of data", async (t) => {
	const manufacturerData = Uint8Array.from([1, 2, 3, 4, 5, 6, 7]);
	const cc = new ThermostatModeCCSet({
		nodeId,
		mode: ThermostatMode["Manufacturer specific"],
		manufacturerData,
	});
	const expected = buildCCBuffer(
		Uint8Array.from([
			ThermostatModeCommand.Set, // CC Command
			(7 << 5) | ThermostatMode["Manufacturer specific"],
			...manufacturerData,
		]),
	);
	await t.expect(cc.serialize({} as any)).resolves.toStrictEqual(expected);
});

test("the Set command should reject manufacturer specific mode with more than 7 bytes of data", (t) => {
	assertZWaveError(
		t.expect,
		() =>
			new ThermostatModeCCSet({
				nodeId,
				mode: ThermostatMode["Manufacturer specific"],
				manufacturerData: Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8]),
			}),
		{
			errorCode: ZWaveErrorCodes.Argument_Invalid,
			messageMatches: /must not exceed 7 bytes/i,
		},
	);
});

test("the Thermostat Mode API should reject hexadecimal manufacturer data that decodes to more than 7 bytes", async (t) => {
	const sendCommand = vi.fn();
	const api = new ThermostatModeCCAPI(
		{
			sendCommand,
		} as any,
		{
			nodeId,
			index: 0,
			supportsCC: () => true,
		} as any,
	);

	await assertZWaveError(
		t.expect,
		() =>
			api.set(
				ThermostatMode["Manufacturer specific"],
				"0011223344556677",
			),
		{
			errorCode: ZWaveErrorCodes.Argument_Invalid,
			messageMatches: /must not exceed 7 bytes/i,
		},
	);
	t.expect(sendCommand).not.toHaveBeenCalled();
});

test("the Thermostat Mode API should pass through accepted hexadecimal manufacturer data", async (t) => {
	const sendCommand = vi.fn(async (cc: ThermostatModeCCSet) => cc);
	const api = new ThermostatModeCCAPI(
		{
			sendCommand,
		} as any,
		{
			nodeId,
			index: 0,
			supportsCC: () => true,
		} as any,
	);

	await api.set(ThermostatMode["Manufacturer specific"], "00112233445566");
	t.expect(sendCommand).toHaveBeenCalledOnce();

	const [cc] = sendCommand.mock.calls[0]!;
	t.expect(cc).toBeInstanceOf(ThermostatModeCCSet);
	await t
		.expect((cc as CommandClass).serialize({} as any))
		.resolves.toStrictEqual(
			buildCCBuffer(
				Uint8Array.from([
					ThermostatModeCommand.Set, // CC Command
					(7 << 5) | ThermostatMode["Manufacturer specific"],
					0x00,
					0x11,
					0x22,
					0x33,
					0x44,
					0x55,
					0x66,
				]),
			),
		);
});
