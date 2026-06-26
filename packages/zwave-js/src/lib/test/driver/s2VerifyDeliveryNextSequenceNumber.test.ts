import {
	Security2CC,
	Security2CCMessageEncapsulation,
	VersionCCCommandClassGet,
	VersionCCCommandClassReport,
} from "@zwave-js/cc";
import { CommandClasses, SecurityClass } from "@zwave-js/core";
import {
	MockZWaveFrameType,
	type MockZWaveRequestFrame,
	createMockZWaveRequestFrame,
} from "@zwave-js/testing";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"S2: The node's next encrypted command counts as verified delivery and does not delay subsequent responses",
	{
		// debug: true,

		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				CommandClasses["Security 2"],
				{
					ccId: CommandClasses.Basic,
					secure: true,
				},
			],
			securityClasses: new Set([SecurityClass.S2_Unauthenticated]),
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// The interview has established a shared SPAN, so the node can send
			// encrypted commands the controller can decrypt.

			// Build an S2-encapsulated Version CC Command Class Get from the node.
			// Each call uses the next sequence number automatically.
			const makeVersionGet = (requestedCC: CommandClasses) =>
				Security2CC.encapsulate(
					new VersionCCCommandClassGet({
						nodeId: mockController.ownNodeId,
						requestedCC,
					}),
					mockNode.id,
					mockNode.securityManagers,
				);

			// 1. The node queries the version of a CC.
			await mockNode.sendToController(
				createMockZWaveRequestFrame(
					makeVersionGet(CommandClasses.Supervision),
					{ ackRequested: true },
				),
			);

			// 2. zwave-js answers with a secure, unsupervised Report. Since the report
			//    is not supervised and does not expect a response, zwave-js then enters
			//    the 500ms "verify delivery" window, waiting for a possible Nonce Report.
			await mockNode.expectControllerFrame(
				(frame): frame is MockZWaveRequestFrame =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof Security2CCMessageEncapsulation
					&& frame.payload.encapsulated
						instanceof VersionCCCommandClassReport
					&& frame.payload.encapsulated.requestedCC
						=== CommandClasses.Supervision,
				{ timeout: 1000 },
			);

			// 3. While zwave-js is still inside the verify-delivery window, the node
			//    sends its next encrypted command (with the next sequence number).
			//    Receiving it proves the previous command was delivered, so the
			//    response to this second query must NOT be delayed by the full
			//    verify-delivery timeout.
			const secondReport = mockNode.expectControllerFrame(
				(frame): frame is MockZWaveRequestFrame =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof Security2CCMessageEncapsulation
					&& frame.payload.encapsulated
						instanceof VersionCCCommandClassReport
					&& frame.payload.encapsulated.requestedCC
						=== CommandClasses["Humidity Control Mode"],
				{
					timeout: 250,
					errorMessage:
						"The response to the second query was delayed by the S2 verify-delivery timeout",
				},
			);

			await mockNode.sendToController(
				createMockZWaveRequestFrame(
					makeVersionGet(CommandClasses["Humidity Control Mode"]),
					{ ackRequested: true },
				),
			);

			await secondReport;
		},
	},
);
