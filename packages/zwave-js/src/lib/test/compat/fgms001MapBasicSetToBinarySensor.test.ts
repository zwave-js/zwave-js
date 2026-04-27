import {
	BasicCCSet,
	BasicCCValues,
	BinarySensorCCValues,
	BinarySensorType,
} from "@zwave-js/cc";
import { CommandClasses } from "@zwave-js/core";
import { ccCaps, createMockZWaveRequestFrame } from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"Fibaro FGMS001 firmware 2.8: Basic Set commands are mapped to Binary Sensor CC, no Basic CC values exposed",
	{
		// debug: true,

		nodeCapabilities: {
			manufacturerId: 0x010f,
			productType: 0x0800,
			productId: 0x1001,
			firmwareVersion: "2.8",

			// Routing Sensor / Notification Sensor — but the firmware does not
			// implement Notification CC yet, so values are reported via Basic Set
			genericDeviceClass: 0x07,
			specificDeviceClass: 0x01,
			commandClasses: [
				CommandClasses.Version,
				CommandClasses["Manufacturer Specific"],
				CommandClasses.Basic,
				ccCaps({
					ccId: CommandClasses["Binary Sensor"],
					isSupported: true,
					version: 1,
					supportedSensorTypes: [],
				}),
			],
		},

		async testBody(t, driver, node, mockController, mockNode) {
			// The correct device config must be loaded
			t.expect(node.deviceConfig?.label).toBe("FGMS001");

			// No Basic CC values should be exposed after the interview
			const valueIDs = node.getDefinedValueIDs();
			t.expect(
				valueIDs.some((v) => BasicCCValues.currentValue.is(v)),
				"Found Basic CC currentValue although it shouldn't be exposed",
			).toBe(false);
			t.expect(
				valueIDs.some((v) => BasicCCValues.targetValue.is(v)),
				"Found Basic CC targetValue although it shouldn't be exposed",
			).toBe(false);
			t.expect(
				valueIDs.some((v) => BasicCCValues.compatEvent.is(v)),
				"Found Basic CC compatEvent although it shouldn't be exposed",
			).toBe(false);

			// Send a Basic Set from the device — should be mapped to Binary Sensor
			const onCC = new BasicCCSet({
				nodeId: mockNode.id,
				targetValue: 0xff,
			});
			await mockNode.sendToController(
				createMockZWaveRequestFrame(onCC, { ackRequested: false }),
			);
			await wait(100);

			t.expect(
				node.getValue(
					BinarySensorCCValues.state(BinarySensorType.Any).id,
				),
			).toBe(true);

			// And no Basic CC values should appear after receiving Basic Set
			const valueIDsAfterOn = node.getDefinedValueIDs();
			t.expect(
				valueIDsAfterOn.some((v) => BasicCCValues.currentValue.is(v)),
				"Found Basic CC currentValue after receiving Basic Set",
			).toBe(false);

			// Repeat with off value
			const offCC = new BasicCCSet({
				nodeId: mockNode.id,
				targetValue: 0x00,
			});
			await mockNode.sendToController(
				createMockZWaveRequestFrame(offCC, { ackRequested: false }),
			);
			await wait(100);

			t.expect(
				node.getValue(
					BinarySensorCCValues.state(BinarySensorType.Any).id,
				),
			).toBe(false);

			const valueIDsAfterOff = node.getDefinedValueIDs();
			t.expect(
				valueIDsAfterOff.some((v) => BasicCCValues.currentValue.is(v)),
				"Found Basic CC currentValue after receiving Basic Set",
			).toBe(false);
		},
	},
);
