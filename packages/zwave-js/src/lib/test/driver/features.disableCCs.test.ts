import {
	VersionCCCommandClassGet,
	VersionCCCommandClassReport,
} from "@zwave-js/cc";
import { CommandClasses } from "@zwave-js/core";
import {
	MockZWaveFrameType,
	createMockZWaveRequestFrame,
} from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
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

			await wait(100);

			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof VersionCCCommandClassReport
					&& frame.payload.requestedCC
						=== CommandClasses["Binary Switch"]
					&& frame.payload.ccVersion === 0,
			);
		},
	},
);
