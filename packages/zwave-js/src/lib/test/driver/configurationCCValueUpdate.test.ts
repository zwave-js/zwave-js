import {
	ConfigurationCCReport,
	ConfigurationCCSet,
	ConfigurationCCValues,
} from "@zwave-js/cc/ConfigurationCC";
import { CommandClasses, ConfigValueFormat } from "@zwave-js/core";
import {
	type MockNodeBehavior,
	ccCaps,
	createMockZWaveRequestFrame,
} from "@zwave-js/testing";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"disableOptimisticValueUpdate is respected when deciding to update the value DB after a successful setValue",
	{
		// Repro for #8059
		// debug: true,

		nodeCapabilities: {
			commandClasses: [
				ccCaps({
					ccId: CommandClasses.Configuration,
					isSupported: true,
					version: 1,
					parameters: [
						{
							"#": 2,
							valueSize: 1,
							name: "Auto Relock",
							format: ConfigValueFormat.UnsignedInteger,
							minValue: 0,
							maxValue: 255,
							defaultValue: 255,
						},
					],
				}),
			],
		},

		additionalDriverOptions: {
			disableOptimisticValueUpdate: true,
		},

		async customSetup(driver, mockController, mockNode) {
			// Automatically respond to ConfigurationCCSet with ConfigurationCCReport after a short delay
			const respondWithReport: MockNodeBehavior = {
				async handleCC(controller, self, receivedCC) {
					if (receivedCC instanceof ConfigurationCCSet) {
						const report = new ConfigurationCCReport({
							nodeId: controller.ownNodeId,
							parameter: receivedCC.parameter,
							value: receivedCC.value!,
							valueSize: receivedCC.valueSize!,
							valueFormat: receivedCC.valueFormat!,
						});

						setTimeout(() => {
							self.sendToController(
								createMockZWaveRequestFrame(report, {
									ackRequested: false,
								}),
							);
						}, 100);
					}
					// Defer to the original behavior
					return undefined;
				},
			};

			mockNode.defineBehavior(respondWithReport);
		},

		async testBody(t, driver, node, mockController, mockNode) {
			// Set up a promise that will resolve when the "value updated" event is received
			const valueUpdatedPromise = new Promise<{
				prevValue: number;
				newValue: number;
			}>((resolve) => {
				node.on("value updated", (node, args) => {
					if (
						args.commandClass === CommandClasses.Configuration
						&& args.property === 2
					) {
						resolve({
							prevValue: args.prevValue as number,
							newValue: args.newValue as number,
						});
					}
				});
			});

			// Set the config parameter to a different value
			const configValue = ConfigurationCCValues.paramInformation(2).id;
			await node.setValue(configValue, 0);

			// Wait for the value updated event
			const { prevValue, newValue } = await valueUpdatedPromise;

			// The prevValue should be the original value (0)
			// and the newValue should be the newly set value (255)
			t.expect(prevValue, "prevValue should be the original value").toBe(
				255,
			);
			t.expect(newValue, "newValue should be the new value").toBe(0);
		},
	},
);
