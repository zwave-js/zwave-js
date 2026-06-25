import {
	BasicCCSet,
	BasicCCValues,
	BinarySensorCCValues,
	BinarySensorType,
} from "@zwave-js/cc";
import { CommandClasses } from "@zwave-js/core";
import { ccCaps, createMockZWaveRequestFrame } from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import path from "node:path";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"With mapBasicSet auto and a Binary Sensor device class, no Basic CC values should be exposed",
	{
		// debug: true,

		nodeCapabilities: {
			manufacturerId: 0xdead,
			productType: 0xbeef,
			productId: 0xcafe,

			// Binary Sensor generic device class
			genericDeviceClass: 0x20,
			specificDeviceClass: 0x01,
			commandClasses: [
				CommandClasses["Manufacturer Specific"],
				CommandClasses.Version,
				CommandClasses.Basic,
				ccCaps({
					ccId: CommandClasses["Binary Sensor"],
					supportedSensorTypes: [BinarySensorType.Motion],
				}),
			],
		},

		additionalDriverOptions: {
			storage: {
				deviceConfigPriorityDir: path.join(
					__dirname,
					"fixtures/mapBasicSetAuto",
				),
			},
		},

		async testBody(t, driver, node, mockController, mockNode) {
			// Make sure the custom config is loaded
			t.expect(node.deviceConfig?.compat?.mapBasicSet).toBe("auto");

			// No Basic CC values should be exposed since the mapping will succeed
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
				valueIDs.some((v) => BasicCCValues.duration.is(v)),
				"Found Basic CC duration although it shouldn't be exposed",
			).toBe(false);
			t.expect(
				valueIDs.some((v) => BasicCCValues.restorePrevious.is(v)),
				"Found Basic CC restorePrevious although it shouldn't be exposed",
			).toBe(false);
			t.expect(
				valueIDs.some((v) => BasicCCValues.compatEvent.is(v)),
				"Found Basic CC compatEvent although it shouldn't be exposed",
			).toBe(false);

			// Send a Basic Set from the device and verify it updates Binary Sensor CC
			const cc = new BasicCCSet({
				nodeId: mockNode.id,
				targetValue: 0xff,
			});

			await mockNode.sendToController(
				createMockZWaveRequestFrame(cc, {
					ackRequested: false,
				}),
			);
			await wait(100);

			const sensorValue = node.getValue(
				BinarySensorCCValues.state(BinarySensorType.Motion).id,
			);
			t.expect(sensorValue).toBe(true);

			// Send a Basic Set with value 0 and verify it maps to false
			const ccOff = new BasicCCSet({
				nodeId: mockNode.id,
				targetValue: 0x00,
			});

			await mockNode.sendToController(
				createMockZWaveRequestFrame(ccOff, {
					ackRequested: false,
				}),
			);
			await wait(100);

			const sensorValueOff = node.getValue(
				BinarySensorCCValues.state(BinarySensorType.Motion).id,
			);
			t.expect(sensorValueOff).toBe(false);

			// Receiving Basic Set should not cause Basic CC values to appear
			const valueIDsAfter = node.getDefinedValueIDs();
			t.expect(
				valueIDsAfter.some((v) => BasicCCValues.currentValue.is(v)),
				"Found Basic CC currentValue after receiving Basic Set",
			).toBe(false);
		},
	},
);
