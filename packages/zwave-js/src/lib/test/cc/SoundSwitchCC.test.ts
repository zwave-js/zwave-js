import {
	CommandClass,
	SoundSwitchCCConfigurationSet,
	SoundSwitchCommand,
} from "@zwave-js/cc";
import { CommandClasses } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { test } from "vitest";

function buildCCBuffer(payload: Uint8Array): Uint8Array {
	return Bytes.concat([
		Uint8Array.from([
			CommandClasses["Sound Switch"], // CC
		]),
		payload,
	]);
}

test("the ConfigurationSet command should serialize correctly with both parameters", async (t) => {
	const cc = new SoundSwitchCCConfigurationSet({
		nodeId: 1,
		defaultToneId: 5,
		defaultVolume: 50,
	});
	const expected = buildCCBuffer(
		Uint8Array.from([
			SoundSwitchCommand.ConfigurationSet, // CC Command
			50, // default volume
			5, // default tone id
		]),
	);
	await t.expect(cc.serialize({} as any)).resolves.toStrictEqual(
		expected,
	);
});

test("the ConfigurationSet command should use sentinel value 0xff for volume when only toneId is provided", async (t) => {
	const cc = new SoundSwitchCCConfigurationSet({
		nodeId: 1,
		defaultToneId: 5,
	});
	const expected = buildCCBuffer(
		Uint8Array.from([
			SoundSwitchCommand.ConfigurationSet, // CC Command
			0xff, // default volume (sentinel value = keep current)
			5, // default tone id
		]),
	);
	await t.expect(cc.serialize({} as any)).resolves.toStrictEqual(
		expected,
	);
});

test("the ConfigurationSet command should use sentinel value 0x00 for toneId when only volume is provided", async (t) => {
	const cc = new SoundSwitchCCConfigurationSet({
		nodeId: 1,
		defaultVolume: 50,
	});
	const expected = buildCCBuffer(
		Uint8Array.from([
			SoundSwitchCommand.ConfigurationSet, // CC Command
			50, // default volume
			0x00, // default tone id (sentinel value = keep current)
		]),
	);
	await t.expect(cc.serialize({} as any)).resolves.toStrictEqual(
		expected,
	);
});

test("the ConfigurationSet command should use both sentinel values when neither parameter is provided", async (t) => {
	const cc = new SoundSwitchCCConfigurationSet({
		nodeId: 1,
	});
	const expected = buildCCBuffer(
		Uint8Array.from([
			SoundSwitchCommand.ConfigurationSet, // CC Command
			0xff, // default volume (sentinel value = keep current)
			0x00, // default tone id (sentinel value = keep current)
		]),
	);
	await t.expect(cc.serialize({} as any)).resolves.toStrictEqual(
		expected,
	);
});
