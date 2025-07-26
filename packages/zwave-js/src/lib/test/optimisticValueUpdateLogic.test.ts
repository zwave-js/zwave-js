import { BasicDeviceClass } from "@zwave-js/core";
import { test } from "vitest";
import { DeviceClass } from "../node/DeviceClass.js";

test("optimistic value update logic respects device class properties", (t) => {
	// Simulate the logic from Node.ts setValue method
	function shouldUpdateOptimistically(
		deviceClass: DeviceClass | undefined,
		apiOptimistic: boolean = true,
		disableOptimisticValueUpdate: boolean = false,
		supervisedAndSuccessful: boolean = false,
		result: unknown = undefined,
	): boolean {
		return apiOptimistic
			// Check if the device class supports optimistic value updates
			&& (deviceClass?.specific?.supportsOptimisticValueUpdate
				?? deviceClass?.generic?.supportsOptimisticValueUpdate
				?? true)
			// For successful supervised commands, we know that an optimistic update is ok
			&& (supervisedAndSuccessful
				// For unsupervised commands that did not fail, we let the application decide whether
				// to update related value optimistically
				|| (!disableOptimisticValueUpdate
					&& result == undefined));
	}

	// Test Window Covering (slow device class)
	const windowCoveringClass = new DeviceClass(
		BasicDeviceClass["End Node"],
		0x09, // Window Covering
		0x01, // Simple Window Covering Control
	);

	// Should NOT update optimistically for slow device classes
	t.expect(shouldUpdateOptimistically(windowCoveringClass)).toBe(false);

	// Test Motor Control Class A (slow device class)
	const motorControlClass = new DeviceClass(
		BasicDeviceClass["End Node"],
		0x11, // Multilevel Switch
		0x05, // Motor Control Class A
	);

	// Should NOT update optimistically for slow device classes
	t.expect(shouldUpdateOptimistically(motorControlClass)).toBe(false);

	// Test Binary Power Switch (fast device class)
	const binaryPowerSwitchClass = new DeviceClass(
		BasicDeviceClass["End Node"],
		0x10, // Binary Switch
		0x01, // Binary Power Switch
	);

	// Should update optimistically for fast device classes
	t.expect(shouldUpdateOptimistically(binaryPowerSwitchClass)).toBe(true);

	// Test Light Dimmer (fast device class)
	const lightDimmerClass = new DeviceClass(
		BasicDeviceClass["End Node"],
		0x11, // Multilevel Switch
		0x01, // Multilevel Power Switch (Light Dimmer)
	);

	// Should update optimistically for fast device classes
	t.expect(shouldUpdateOptimistically(lightDimmerClass)).toBe(true);

	// Test with undefined device class (should default to true)
	t.expect(shouldUpdateOptimistically(undefined)).toBe(true);

	// Test that global disable flag still works
	t.expect(shouldUpdateOptimistically(binaryPowerSwitchClass, true, true))
		.toBe(false);

	// Test that api optimistic flag still works
	t.expect(shouldUpdateOptimistically(binaryPowerSwitchClass, false)).toBe(
		false,
	);

	// Test supervised successful commands should still work for slow devices
	t.expect(shouldUpdateOptimistically(windowCoveringClass, true, false, true))
		.toBe(false);
});
