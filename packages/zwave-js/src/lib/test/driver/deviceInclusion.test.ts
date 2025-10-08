import { CommandClasses } from "@zwave-js/core";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"Device inclusion process should emit 'node added' event",
	{
		// debug: true,

		additionalDriverOptions: {
			testingHooks: {
				skipNodeInterview: true,
			},
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Set up a promise to wait for the "node added" event
			const nodeAddedPromise = new Promise<void>((resolve) => {
				driver.controller.once("node added", (addedNode, result) => {
					t.expect(addedNode.id).toBe(3);
					t.expect(result).toBeDefined();
					resolve();
				});
			});

			// Set up the node that will be included
			mockController.nodePendingInclusion = {
				id: 3,
				capabilities: {
					basicDeviceClass: 0x04,
					genericDeviceClass: 0x10,
					specificDeviceClass: 0x01,
					commandClasses: [
						CommandClasses["Z-Wave Plus Info"],
						CommandClasses["Manufacturer Specific"],
						CommandClasses["Device Reset Locally"],
						CommandClasses.Security,
						CommandClasses.Powerlevel,
						CommandClasses["Firmware Update Meta Data"],
					],
				},
			};

			// Start the inclusion process
			await driver.controller.beginInclusion({
				strategy: 0, // Default strategy
			});

			// Wait for the "node added" event
			await nodeAddedPromise;

			// Verify that the node was added to the controller's nodes map
			const addedNode = driver.controller.nodes.get(3);
			t.expect(addedNode).toBeDefined();
			t.expect(addedNode?.id).toBe(3);
		},
	},
);
