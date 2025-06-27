import { RemoveFailedNodeRequest } from "@zwave-js/serial";
import { noop } from "@zwave-js/shared";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"AddNodeDSK and RemoveFailedNode should not be interleaved",
	{
		// Repro for #7902
		// debug: true,

		customSetup: async (driver, controller, mockNode) => {
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			mockNode.autoAckControllerFrames = false;

			// These two commands should not be interleaved
			const expectation = mockController.expectHostMessage(
				500,
				(msg) => msg instanceof RemoveFailedNodeRequest,
			).then(() => "FAIL").catch(() => "PASS");

			void driver.controller["beginInclusionSmartStart"]({
				dsk: "11111-22222-33333-44444-11111-22222-33333-44444",
				securityClasses: [],
			}).catch(noop);

			void driver.controller.removeFailedNode(2).catch(noop);

			await t.expect(
				expectation,
				"RemoveFailedNodeRequest should not be interleaved",
			).resolves.toBe("PASS");

			// TODO: The test case is a bit hacky, but it currently works for what it's supposed to do
			// We should properly support the commands in mocks.
		},
	},
);
