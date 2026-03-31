import { BasicCCGet, BasicCCReport, BasicCCValues } from "@zwave-js/cc";
import { type MockNodeBehavior } from "@zwave-js/testing";
import path from "node:path";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"Node.pollValue should not wait more than a few milliseconds before sending the command",
	{
		// debug: true,

		provisioningDirectory: path.join(__dirname, "fixtures/basicCC"),

		async customSetup(_driver, _mockController, mockNode) {
			const respondToBasicGet: MockNodeBehavior = {
				async handleCC(controller, _self, receivedCC) {
					if (receivedCC instanceof BasicCCGet) {
						const cc = new BasicCCReport({
							nodeId: controller.ownNodeId,
							currentValue: 42,
						});
						return { action: "sendCC", cc };
					}
				},
			};
			mockNode.defineBehavior(respondToBasicGet);
		},

		testBody: async (t, _driver, node, _mockController, _mockNode) => {
			const currentValueId = BasicCCValues.currentValue.endpoint(0);

			// Measure how long it takes for pollValue to send the command
			const start = Date.now();
			await node.pollValue(currentValueId);
			const elapsed = Date.now() - start;

			// The command should be sent and completed very quickly (within a few milliseconds)
			// This test verifies that pollValue does not add unnecessary delays
			t.expect(elapsed).toBeLessThan(100);
		},
	},
);
