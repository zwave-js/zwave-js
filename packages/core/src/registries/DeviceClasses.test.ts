import { getGenericDeviceClass, getSpecificDeviceClass } from "./DeviceClasses.js";
import { test } from "vitest";

test("device classes marked as slow should not support optimistic value updates", (t) => {
	// Test Window Covering (0x09)
	const windowCoveringGeneric = getGenericDeviceClass(0x09);
	t.expect(windowCoveringGeneric.supportsOptimisticValueUpdate).toBe(false);

	const windowCoveringSpecific = getSpecificDeviceClass(0x09, 0x01);
	t.expect(windowCoveringSpecific.supportsOptimisticValueUpdate).toBe(false);

	// Test Multilevel Switch Motor Control classes
	const multilevelSwitchGeneric = getGenericDeviceClass(0x11);
	t.expect(multilevelSwitchGeneric.supportsOptimisticValueUpdate).toBe(true); // Generic should be true

	// Multiposition Motor (0x11:0x03)
	const multipositionMotor = getSpecificDeviceClass(0x11, 0x03);
	t.expect(multipositionMotor.supportsOptimisticValueUpdate).toBe(false);

	// Motor Control Class A (0x11:0x05)
	const motorControlA = getSpecificDeviceClass(0x11, 0x05);
	t.expect(motorControlA.supportsOptimisticValueUpdate).toBe(false);

	// Motor Control Class B (0x11:0x06)
	const motorControlB = getSpecificDeviceClass(0x11, 0x06);
	t.expect(motorControlB.supportsOptimisticValueUpdate).toBe(false);

	// Motor Control Class C (0x11:0x07)
	const motorControlC = getSpecificDeviceClass(0x11, 0x07);
	t.expect(motorControlC.supportsOptimisticValueUpdate).toBe(false);
});

test("device classes marked as fast should support optimistic value updates", (t) => {
	// Test Binary Switch (0x10)
	const binarySwitchGeneric = getGenericDeviceClass(0x10);
	t.expect(binarySwitchGeneric.supportsOptimisticValueUpdate).toBe(true);

	const binaryPowerSwitch = getSpecificDeviceClass(0x10, 0x01);
	t.expect(binaryPowerSwitch.supportsOptimisticValueUpdate).toBe(true);

	// Test Multilevel Switch - Light Dimmer (0x11:0x01)
	const lightDimmer = getSpecificDeviceClass(0x11, 0x01);
	t.expect(lightDimmer.supportsOptimisticValueUpdate).toBe(true);

	// Test Fan Switch (0x11:0x08)
	const fanSwitch = getSpecificDeviceClass(0x11, 0x08);
	t.expect(fanSwitch.supportsOptimisticValueUpdate).toBe(true);
});

test("unknown device classes should default to supporting optimistic value updates", (t) => {
	// Test unknown generic class
	const unknownGeneric = getGenericDeviceClass(0xFF);
	t.expect(unknownGeneric.supportsOptimisticValueUpdate).toBe(true);

	// Test unknown specific class
	const unknownSpecific = getSpecificDeviceClass(0x10, 0xFF);
	t.expect(unknownSpecific.supportsOptimisticValueUpdate).toBe(true);
});
