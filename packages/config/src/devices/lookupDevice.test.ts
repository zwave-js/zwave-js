import { test } from "vitest";

import { ConfigManager } from "../ConfigManager.js";

test("Z-TRM3 with commandClasses.add compat should work", async (t) => {
	const configManager = new ConfigManager();
	const config = await configManager.lookupDevice(
		0x019b,
		0x0003,
		0x0203,
		"4.0",
	);
	t.expect(config).toBeDefined();
	t.expect(config?.compat?.addCCs?.get(49)?.endpoints.size).toBe(3);
}, 60000); // This test might take a while

test("European ZW111 overrides the Meter version without changing other variants", async (t) => {
	const configManager = new ConfigManager();
	const european = await configManager.lookupDevice(
		0x0086,
		0x0003,
		0x006f,
		"2.4",
	);
	const other = await configManager.lookupDevice(
		0x0086,
		0x0103,
		0x006f,
		"2.4",
	);

	t.expect(european?.compat?.addCCs?.get(0x32)?.endpoints.get(0)).toEqual({
		version: 3,
	});
	t.expect(other?.compat?.addCCs?.get(0x32)).toBeUndefined();
	for (const config of [european, other]) {
		t.expect(config?.compat?.mapBasicSet).toBe("event");
		t.expect(config?.compat?.treatMultilevelSwitchSetAsEvent).toBe(true);
	}
}, 60000);

test("Associations on endpoints should work - including imports", async (t) => {
	// Logic Group ZDB5100

	const configManager = new ConfigManager();
	const config = await configManager.lookupDevice(
		0x0234,
		0x0003,
		0x0121,
		"0.0",
	);
	t.expect(config).toBeDefined();
	t.expect(config?.endpoints?.get(0)?.associations?.get(2)).toMatchObject({
		label: "Button 1 (Basic Report)",
		maxNodes: 5,
	});
	t.expect(config?.endpoints?.get(1)?.associations?.get(1)).toMatchObject({
		label: "Lifeline",
		maxNodes: 5,
		isLifeline: false,
	});
	t.expect(config?.endpoints?.get(4)?.associations?.get(3)).toMatchObject({
		label: "Button 4 (Binary Switch Set)",
		maxNodes: 5,
	});
}, 60000); // This test might take a while
