import { test } from "vitest";
import { EndDeviceCLI } from "./EndDeviceCLI.js";

test("executeCommand accepts supported commands with arguments", async (t) => {
	let written: string | undefined;
	const cli = new EndDeviceCLI(
		async (data) => {
			written = Buffer.from(data).toString("ascii");
		},
		async () => "set_region EU\r\n[I] OK",
	);

	(cli as any)._commands = new Map([
		["get_region", "Read the current region"],
		["set_region", "Set the current region"],
	]);

	const response = await cli.executeCommand("set_region EU");

	t.expect(written).toBe("set_region EU\r\n");
	t.expect(response).toBe("OK");
});

test("executeCommand trims the command before validating and matching echoes", async (t) => {
	let written: string | undefined;
	const cli = new EndDeviceCLI(
		async (data) => {
			written = Buffer.from(data).toString("ascii");
		},
		async () => "set_region EU\r\n[I] OK",
	);

	(cli as any)._commands = new Map([[
		"set_region",
		"Set the current region",
	]]);

	const response = await cli.executeCommand("  set_region EU  ");

	t.expect(written).toBe("set_region EU\r\n");
	t.expect(response).toBe("OK");
});

test("detectCommands ignores wrapped descriptions and arguments", async (t) => {
	let written: string | undefined;
	const cli = new EndDeviceCLI(
		async (data) => {
			written = Buffer.from(data).toString("ascii");
		},
		async () =>
			`help\r
set_learn_mode                Include / exclude the device into / from a z-w\r
                              ave network\r
set_region                    Set the current region\r
                              [string] <region>\r
bootloader                    Restart into bootloader`,
	);

	await cli.detectCommands();

	t.expect(written).toBe("help\r\n");
	t.expect([...cli.commands.entries()]).toStrictEqual([
		[
			"set_learn_mode",
			"Include / exclude the device into / from a z-wave network",
		],
		["set_region", "Set the current region [string] <region>"],
		["bootloader", "Restart into bootloader"],
	]);
});
