import {
	BinarySwitchCCValues,
	WindowCoveringCCValues,
	WindowCoveringParameter,
} from "@zwave-js/cc";
import { BasicDeviceClass, CommandClasses, NOT_KNOWN } from "@zwave-js/core";
import { ccCaps } from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import { cacheKeys } from "../../driver/NetworkCache.js";
import { DeviceClass } from "../../node/DeviceClass.js";
import { integrationTest } from "../integrationTestSuiteMulti.js";

integrationTest(
	"setValue: no optimistic value update for slow device classes",
	{
		nodeCapabilities: [
			{
				id: 2,
				capabilities: {
					basicDeviceClass: BasicDeviceClass["End Node"],
					genericDeviceClass: 0x09, // Window Covering
					specificDeviceClass: 0x01, // Simple Window Covering Control
					commandClasses: [
						ccCaps({
							ccId: CommandClasses["Window Covering"],
							isSupported: true,
						}),
					],
				},
			},
			{
				id: 3,
				capabilities: {
					basicDeviceClass: BasicDeviceClass["End Node"],
					genericDeviceClass: 0x11, // Multilevel Switch
					specificDeviceClass: 0x05, // Motor Control Class A
					commandClasses: [
						ccCaps({
							ccId: CommandClasses["Binary Switch"],
							isSupported: true,
							defaultValue: NOT_KNOWN,
						}),
					],
				},
			},
			{
				id: 4,
				capabilities: {
					basicDeviceClass: BasicDeviceClass["End Node"],
					genericDeviceClass: 0x10, // Binary Switch (fast)
					specificDeviceClass: 0x01, // Binary Power Switch
					commandClasses: [
						ccCaps({
							ccId: CommandClasses["Binary Switch"],
							isSupported: true,
							defaultValue: NOT_KNOWN,
						}),
					],
				},
			},
		],

		additionalDriverOptions: {
			testingHooks: {
				skipNodeInterview: true,
			},
		},

		customSetup: async (driver, controller, mockNodes) => {
			// Set initial state for all nodes directly on MockNode state
			for (const mockNode of mockNodes) {
				// Set the initial currentValue state to false for Binary Switch CC
				mockNode.state.set("BinarySwitch_currentValue", false);
			}
		},

		testBody: async (t, driver, nodes, mockController, mockNodes) => {
			const [windowCoverNode, motorControlNode, binarySwitchNode] = nodes;

			// Assign device classes to the real nodes using the driver cache
			driver.cacheSet(
				cacheKeys.node(windowCoverNode.id).deviceClass,
				new DeviceClass(
					BasicDeviceClass["End Node"],
					0x09, // Window Covering
					0x01, // Simple Window Covering Control
				),
			);

			driver.cacheSet(
				cacheKeys.node(motorControlNode.id).deviceClass,
				new DeviceClass(
					BasicDeviceClass["End Node"],
					0x11, // Multilevel Switch
					0x05, // Motor Control Class A
				),
			);

			driver.cacheSet(
				cacheKeys.node(binarySwitchNode.id).deviceClass,
				new DeviceClass(
					BasicDeviceClass["End Node"],
					0x10, // Binary Switch
					0x01, // Binary Power Switch
				),
			);

			// Since we skipped interview, manually add the supported CCs to each node
			// Window Covering node (node 2)
			windowCoverNode.addCC(CommandClasses["Window Covering"], {
				isSupported: true,
				version: 1,
			});

			// Motor Control node (node 3) - uses Binary Switch CC because it's a motor control
			motorControlNode.addCC(CommandClasses["Binary Switch"], {
				isSupported: true,
				version: 2,
			});
			motorControlNode.valueDB.setValue(
				BinarySwitchCCValues.currentValue.id,
				false,
			);

			// Binary Switch node (node 4)
			binarySwitchNode.addCC(CommandClasses["Binary Switch"], {
				isSupported: true,
				version: 2,
			});
			binarySwitchNode.valueDB.setValue(
				BinarySwitchCCValues.currentValue.id,
				false,
			);

			// Test Window Covering (slow device class) - Node 2
			// Set initial value for Window Covering
			windowCoverNode.valueDB.setValue(
				WindowCoveringCCValues.currentValue(
					WindowCoveringParameter["Outbound Left"],
				).id,
				50, // Initial position at 50%
			);

			const windowCoveringPromise = windowCoverNode.setValue(
				WindowCoveringCCValues.targetValue(
					WindowCoveringParameter["Outbound Left"],
				).id, // Use odd parameter (position support)
				75, // Target position
			);

			await wait(50);

			// Verify that the current value is NOT optimistically updated for slow device classes
			const windowCoveringCurrentValue = windowCoverNode.getValue(
				WindowCoveringCCValues.currentValue(
					WindowCoveringParameter["Outbound Left"],
				).id,
			);
			t.expect(windowCoveringCurrentValue).toBe(50); // Should remain at initial value for slow device classes

			await windowCoveringPromise;

			// Clear frames for next test
			mockNodes[0].clearReceivedControllerFrames();

			// Test Motor Control Class A (slow device class) - Node 3
			const motorControlPromise = motorControlNode.setValue(
				BinarySwitchCCValues.targetValue.id,
				true,
			);

			await wait(50);

			// Verify that the current value is NOT optimistically updated for slow device
			t.expect(
				motorControlNode.getValue(BinarySwitchCCValues.currentValue.id),
			).toBe(false); // Should remain false for slow device classes

			await motorControlPromise;

			// Clear frames for next test
			mockNodes[1].clearReceivedControllerFrames();

			// Test Binary Switch (fast device class) - Node 4
			const binarySwitchPromise = binarySwitchNode.setValue(
				BinarySwitchCCValues.targetValue.id,
				true,
			);

			await wait(50);

			// Verify that the current value IS optimistically updated for fast devices
			const binarySwitchCurrentValue = binarySwitchNode.getValue(
				BinarySwitchCCValues.currentValue.id,
			);
			t.expect(binarySwitchCurrentValue).toBe(true); // Should be optimistically updated to true

			await binarySwitchPromise;
		},
	},
);
