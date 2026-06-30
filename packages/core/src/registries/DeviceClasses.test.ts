import { getGenericDeviceClass, getSpecificDeviceClass } from "@zwave-js/core";
import { test } from "vitest";

test("device classes with slow actuators should be marked as such", (t) => {
	// Test Window Covering (0x09)
	const windowCoveringGeneric = getGenericDeviceClass(0x09);
	t.expect(windowCoveringGeneric.isSlowActuator).toBe(true);

	const windowCoveringSpecific = getSpecificDeviceClass(0x09, 0x01);
	t.expect(windowCoveringSpecific.isSlowActuator).toBe(true);

	// Test Multilevel Switch Motor Control classes
	const multilevelSwitchGeneric = getGenericDeviceClass(0x11);
	t.expect(multilevelSwitchGeneric.isSlowActuator).toBe(false); // Generic should be false

	// Multiposition Motor (0x11:0x03)
	const multipositionMotor = getSpecificDeviceClass(0x11, 0x03);
	t.expect(multipositionMotor.isSlowActuator).toBe(true);

	// Motor Control Class A (0x11:0x05)
	const motorControlA = getSpecificDeviceClass(0x11, 0x05);
	t.expect(motorControlA.isSlowActuator).toBe(true);

	// Motor Control Class B (0x11:0x06)
	const motorControlB = getSpecificDeviceClass(0x11, 0x06);
	t.expect(motorControlB.isSlowActuator).toBe(true);

	// Motor Control Class C (0x11:0x07)
	const motorControlC = getSpecificDeviceClass(0x11, 0x07);
	t.expect(motorControlC.isSlowActuator).toBe(true);
});

test("device classes without slow actuators should not be marked as such", (t) => {
	// Test Binary Switch (0x10)
	const binarySwitchGeneric = getGenericDeviceClass(0x10);
	t.expect(binarySwitchGeneric.isSlowActuator).toBe(false);

	const binaryPowerSwitch = getSpecificDeviceClass(0x10, 0x01);
	t.expect(binaryPowerSwitch.isSlowActuator).toBe(false);

	// Test Multilevel Switch - Light Dimmer (0x11:0x01)
	const lightDimmer = getSpecificDeviceClass(0x11, 0x01);
	t.expect(lightDimmer.isSlowActuator).toBe(false);

	// Test Fan Switch (0x11:0x08)
	const fanSwitch = getSpecificDeviceClass(0x11, 0x08);
	t.expect(fanSwitch.isSlowActuator).toBe(false);
});

test("unknown device classes should default to not being slow actuators", (t) => {
	// Test unknown generic class
	const unknownGeneric = getGenericDeviceClass(0xFF);
	t.expect(unknownGeneric.isSlowActuator).toBe(false);

	// Test unknown specific class
	const unknownSpecific = getSpecificDeviceClass(0x10, 0xFF);
	t.expect(unknownSpecific.isSlowActuator).toBe(false);
});
