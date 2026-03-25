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
