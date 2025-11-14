import {
	type CommandClass,
	InvalidCC,
	Security2CC,
	Security2CCCommandsSupportedGet,
	Security2CCCommandsSupportedReport,
	Security2CCMessageEncapsulation,
	Security2CCNonceGet,
	Security2CCNonceReport,
	SecurityCC,
	SecurityCCCommandEncapsulation,
	SecurityCCCommandsSupportedGet,
	SecurityCCCommandsSupportedReport,
	SecurityCCNonceGet,
	SecurityCCNonceReport,
	VersionCCCommandClassGet,
	VersionCCCommandClassReport,
} from "@zwave-js/cc";
import {
	CommandClasses,
	SecurityClass,
	SecurityManager,
	SecurityManager2,
	ZWaveErrorCodes,
} from "@zwave-js/core";
import {
	type MockNodeBehavior,
	type MockZWaveFrame,
	MockZWaveFrameType,
	createMockZWaveRequestFrame,
} from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import { integrationTest } from "../integrationTestSuite.js";

// Repro for https://github.com/zwave-js/zwave-js/issues/6305

integrationTest(
	"CC Version 0 is ignored for known supported CCs: Security S2",
	{
		// debug: true,

		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				CommandClasses["Security 2"],
			],
			securityClasses: new Set([SecurityClass.S2_Unauthenticated]),
		},

		customSetup: async (driver, controller, mockNode) => {
			const respondWithInvalidVersionReport: MockNodeBehavior = {
				handleCC(controller, self, receivedCC) {
					if (
						receivedCC instanceof VersionCCCommandClassGet
						&& receivedCC.requestedCC
							=== CommandClasses["Security 2"]
					) {
						let cc: CommandClass = new VersionCCCommandClassReport({
							nodeId: controller.ownNodeId,
							requestedCC: receivedCC.requestedCC,
							ccVersion: 0,
						});
						return { action: "sendCC", cc };
					}
				},
			};
			mockNode.defineBehavior(respondWithInvalidVersionReport);
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			t.expect(node.supportsCC(CommandClasses["Security 2"])).toBe(true);
		},
	},
);

integrationTest(
	"CC Version 0 is ignored for known supported CCs: Security S0",
	{
		// debug: true,

		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Security,
				{
					ccId: CommandClasses.Version,
					secure: true,
				},
			],
			securityClasses: new Set([SecurityClass.S0_Legacy]),
		},

		customSetup: async (driver, controller, mockNode) => {
			const respondWithInvalidVersionReport: MockNodeBehavior = {
				async handleCC(controller, self, receivedCC) {
					if (
						receivedCC instanceof VersionCCCommandClassGet
						&& receivedCC.requestedCC
							=== CommandClasses.Security
					) {
						await wait(100);

						const response = new VersionCCCommandClassReport({
							nodeId: controller.ownNodeId,
							requestedCC: receivedCC.requestedCC,
							ccVersion: 0,
						});

						return { action: "sendCC", cc: response };
					}
				},
			};
			mockNode.defineBehavior(respondWithInvalidVersionReport);
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			t.expect(node.supportsCC(CommandClasses["Security"])).toBe(true);
		},
	},
);
