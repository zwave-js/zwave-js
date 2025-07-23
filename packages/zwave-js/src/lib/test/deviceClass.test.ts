import { BasicDeviceClass } from "@zwave-js/core";
import { test } from "vitest";
import { DeviceClass } from "../node/DeviceClass.js";

test("DeviceClass creation with slow device classes", (t) => {
	// Test Window Covering device class
	const windowCoveringClass = new DeviceClass(
		BasicDeviceClass["End Node"],
		0x09, // Window Covering
		0x01, // Simple Window Covering Control
	);

	t.expect(windowCoveringClass.generic.supportsOptimisticValueUpdate).toBe(
		false,
	);
	t.expect(windowCoveringClass.specific.supportsOptimisticValueUpdate).toBe(
		false,
	);

	// Test Motor Control Class A
	const motorControlClass = new DeviceClass(
		BasicDeviceClass["End Node"],
		0x11, // Multilevel Switch
		0x05, // Motor Control Class A
	);

	t.expect(motorControlClass.generic.supportsOptimisticValueUpdate).toBe(
		true,
	); // Generic is fast
	t.expect(motorControlClass.specific.supportsOptimisticValueUpdate).toBe(
		false,
	); // Specific is slow

	// Test Binary Power Switch (fast)
	const binaryPowerSwitchClass = new DeviceClass(
		BasicDeviceClass["End Node"],
		0x10, // Binary Switch
		0x01, // Binary Power Switch
	);

	t.expect(binaryPowerSwitchClass.generic.supportsOptimisticValueUpdate).toBe(
		true,
	);
	t.expect(binaryPowerSwitchClass.specific.supportsOptimisticValueUpdate)
		.toBe(true);
});
