import {
	BasicCCValues,
	ZWaveProtocolCCNodeInformationFrame,
	ZWaveProtocolCCRequestNodeInformationFrame,
} from "@zwave-js/cc";
import { CommandClasses } from "@zwave-js/core";
import { type MockNodeBehavior } from "@zwave-js/testing";
import path from "node:path";
import { InclusionStrategy } from "../../controller/Inclusion.js";
import { type ZWaveNode } from "../../node/Node.js";
import { integrationTest } from "../integrationTestSuite.js";
import { integrationTest as integrationTestMulti } from "../integrationTestSuiteMulti.js";

integrationTest(
	"On devices that MUST not support Basic CC, and treat Basic Set as a report, ONLY currentValue should be exposed",
	{
		// debug: true,

		nodeCapabilities: {
			manufacturerId: 0xdead,
			productType: 0xbeef,
			productId: 0xcafe,

			// Routing Multilevel Sensor, MUST not support Basic CC
			genericDeviceClass: 0x21,
			specificDeviceClass: 0x01,
			commandClasses: [
				CommandClasses["Manufacturer Specific"],
				CommandClasses.Version,
				// But it reports support if asked
				CommandClasses.Basic,
			],
		},

		additionalDriverOptions: {
			storage: {
				deviceConfigPriorityDir: path.join(
					__dirname,
					"fixtures/mapBasicSetReport",
				),
			},
		},

		async testBody(t, driver, node, mockController, mockNode) {
			const valueIDs = node.getDefinedValueIDs();
			t.expect(
				valueIDs.some((v) => BasicCCValues.currentValue.is(v)),
				"Did not find Basic CC currentValue although it should be exposed",
			).toBe(true);
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
		},
	},
);

integrationTest(
	"On devices that MUST not support Basic CC, and map Basic Set to a different CC, NO Basic CC values should be exposed",
	{
		// debug: true,

		nodeCapabilities: {
			manufacturerId: 0xdead,
			productType: 0xbeef,
			productId: 0xcafe,

			// Routing Multilevel Sensor, MUST not support Basic CC
			genericDeviceClass: 0x21,
			specificDeviceClass: 0x01,
			commandClasses: [
				CommandClasses["Manufacturer Specific"],
				CommandClasses.Version,
				// But it reports support if asked
				CommandClasses.Basic,
			],
		},

		additionalDriverOptions: {
			storage: {
				deviceConfigPriorityDir: path.join(
					__dirname,
					"fixtures/mapBasicSetBinarySensor",
				),
			},
		},

		async testBody(t, driver, node, mockController, mockNode) {
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
		},
	},
);

integrationTestMulti(
	"After including a device with support for an actuator CC, NO Basic CC values should be exposed, even if it is explicitly listed in the NIF",
	{
		// Repro for #8408
		// debug: true,

		async testBody(t, driver, nodes, mockController, mockNodes) {
			mockController.nodePendingInclusion = {
				id: 2,
				capabilities: {
					manufacturerId: 0xdead,
					productType: 0xbeef,
					productId: 0xcafe,

					commandClasses: [
						CommandClasses["Binary Switch"],
						CommandClasses.Version,
						CommandClasses["Manufacturer Specific"],
						CommandClasses.Basic,
					],
				},

				setup(node) {
					// Override the node's behavior to include Basic CC in the NIF
					const respondToRequestNodeInfoWithBasicCC:
						MockNodeBehavior = {
							handleCC(controller, self, receivedCC) {
								if (
									receivedCC
										instanceof ZWaveProtocolCCRequestNodeInformationFrame
								) {
									const cc =
										new ZWaveProtocolCCNodeInformationFrame(
											{
												// eslint-disable-next-line @zwave-js/consistent-mock-node-behaviors
												nodeId: self.id, // We actually need to set this like this for the NIF
												...self.capabilities,
												supportedCCs: [
													...self.implementedCCs,
												]
													// Only include supported CCs
													.filter(([, info]) =>
														info.isSupported
													)
													// FIXME: Filter out secure CCs if the node isn't secure
													.map(([ccId]) => ccId),
											},
										);
									return { action: "sendCC", cc };
								}
							},
						};
					node.defineBehavior(
						respondToRequestNodeInfoWithBasicCC,
					);
				},
			};

			// Set up a promise to wait for the "node added" event
			let includedNode: ZWaveNode | undefined;
			const nodeAddedPromise = new Promise<void>((resolve) => {
				driver.controller.once("node added", (node) => {
					includedNode = node;
					resolve();
				});
			});

			// Start the inclusion process with S2
			await driver.controller.beginInclusion({
				strategy: InclusionStrategy.Insecure,
			});

			// Wait for the "node added" event
			await nodeAddedPromise;

			// Wait for the interview to complete
			const interviewCompletePromise = new Promise<void>((resolve) => {
				includedNode!.once("interview completed", () => {
					resolve();
				});
			});
			await interviewCompletePromise;

			t.expect(includedNode).toBeDefined();

			const valueIDs = includedNode!.getDefinedValueIDs();
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
		},
	},
);
