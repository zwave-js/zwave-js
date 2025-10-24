import {
	VersionCCCommandClassGet,
	VersionCCCommandClassReport,
} from "@zwave-js/cc";
import { CommandClasses } from "@zwave-js/core";
import {
	MockZWaveFrameType,
	type MockZWaveRequestFrame,
	createMockZWaveRequestFrame,
} from "@zwave-js/testing";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"Respond to CC version queries for disabled CCs with version 0",
	{
		// debug: true,

		additionalDriverOptions: {
			features: {
				disableCommandClasses: [
					CommandClasses["Binary Switch"],
				],
			},
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			const ccGet = new VersionCCCommandClassGet({
				nodeId: node.id,
				requestedCC: CommandClasses["Binary Switch"],
			});
			await mockNode.sendToController(createMockZWaveRequestFrame(ccGet, {
				ackRequested: false,
			}));

			await mockNode.expectControllerFrame(
				(frame): frame is MockZWaveRequestFrame =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof VersionCCCommandClassReport
					&& frame.payload.requestedCC
						=== CommandClasses["Binary Switch"]
					&& frame.payload.ccVersion === 0,
				{ timeout: 100 },
			);
		},
	},
);
