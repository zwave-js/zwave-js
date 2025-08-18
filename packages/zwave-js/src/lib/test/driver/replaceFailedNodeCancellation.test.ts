import { ReplaceFailedNodeRequest } from "@zwave-js/serial";
import { noop } from "@zwave-js/shared";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"After cancelled replace failed node, driver should respond to subsequent API calls",
	{
		// Reproduction test for #8083
		// debug: true,

		customSetup: async (driver, controller, mockNode) => {
			// Mark the mock node as failed so replace can proceed
			mockNode.autoAckControllerFrames = false;
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Step 1: Start replace failed node process
			const replacePromise = driver.controller.replaceFailedNode(node.id).catch(noop);

			// Wait a bit for the replace process to start
			await new Promise<void>(resolve => setTimeout(resolve, 100));

			// Step 2: Cancel the replace process by calling stopInclusion
			await driver.controller.stopInclusion();

			// Step 3: Verify that subsequent replaceFailedNode calls are not ignored
			const expectation = mockController.expectHostMessage(
				1000,
				(msg) => msg instanceof ReplaceFailedNodeRequest,
			).then(() => "SUCCESS").catch(() => "TIMEOUT");

			// Try to start another replace failed node process
			void driver.controller.replaceFailedNode(node.id).catch(noop);

			// This should succeed if the driver state is properly reset
			await t.expect(
				expectation,
				"Driver should respond to subsequent replaceFailedNode calls after cancellation",
			).resolves.toBe("SUCCESS");
		},
	},
);