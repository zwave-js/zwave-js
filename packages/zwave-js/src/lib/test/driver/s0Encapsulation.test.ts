import {
	BasicCCGet,
	BasicCCReport,
	SecurityCC,
	SecurityCCCommandEncapsulation,
	SecurityCCCommandsSupportedGet,
	SecurityCCCommandsSupportedReport,
	SecurityCCNonceGet,
	SecurityCCNonceReport,
} from "@zwave-js/cc";
import { CommandClasses, SecurityClass, SecurityManager } from "@zwave-js/core";
import {
	type MockNodeBehavior,
	type MockZWaveFrame,
	MockZWaveFrameType,
	createMockZWaveRequestFrame,
} from "@zwave-js/testing";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest("Communication via Security S0 works", {
	// debug: true,

	nodeCapabilities: {
		commandClasses: [
			CommandClasses.Version,
			CommandClasses.Security,
			{
				ccId: CommandClasses.Basic,
				secure: true,
			},
		],
		securityClasses: new Set([SecurityClass.S0_Legacy]),
	},

	customSetup: async (driver, controller, mockNode) => {
		// Respond to Basic Get with a level that increases with each request
		let queryCount = 0;
		const respondToBasicGet: MockNodeBehavior = {
			async handleCC(controller, self, receivedCC) {
				if (
					receivedCC instanceof BasicCCGet
				) {
					const response = new BasicCCReport({
						nodeId: controller.ownNodeId,
						currentValue: ++queryCount,
					});

					return { action: "sendCC", cc: response };
				}
			},
		};
		mockNode.defineBehavior(respondToBasicGet);
	},

	testBody: async (t, driver, node, mockController, mockNode) => {
		const result = await node.commandClasses.Basic.get();

		t.expect(result?.currentValue).toBe(2);
	},
});
