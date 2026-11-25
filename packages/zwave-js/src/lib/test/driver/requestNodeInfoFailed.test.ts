import { ZWaveProtocolCCRequestNodeInformationFrame } from "@zwave-js/cc";
import { ZWaveErrorCodes, assertZWaveError } from "@zwave-js/core";
import { type MockNodeBehavior } from "@zwave-js/testing";

import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"When a node does not respond to a node info request, requestNodeInfo() fails without waiting for the callback timeout",
	{
		// debug: true,

		async testBody(t, driver, node, mockController, mockNode) {
			const ignoreNIFRequest: MockNodeBehavior = {
				handleCC(controller, self, receivedCC) {
					if (
						receivedCC
						instanceof ZWaveProtocolCCRequestNodeInformationFrame
					) {
						return { action: "stop" };
					}
				},
			};
			mockNode.defineBehavior(ignoreNIFRequest);

			const start = Date.now();
			await assertZWaveError(t.expect, () => node.requestNodeInfo(), {
				errorCode: ZWaveErrorCodes.Controller_CallbackNOK,
			});
			// The mock controller gives up after MOCK_FRAME_ACK_TIMEOUT (1 s)
			t.expect(Date.now() - start).toBeLessThan(5000);
		},
	},
);
