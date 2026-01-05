import { SecurityCCNonceGet, SecurityCCNonceReport } from "@zwave-js/cc";
import { CommandClasses, SecurityClass } from "@zwave-js/core";
import {
	MOCK_FRAME_ACK_TIMEOUT,
	MockZWaveFrameType,
	type MockZWaveRequestFrame,
	createMockZWaveRequestFrame,
} from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import path from "node:path";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"when a NonceReport does not get delivered, it does not block further nonce requests",
	{
		// debug: true,

		provisioningDirectory: path.join(
			__dirname,
			"fixtures/nodeAsleepBlockNonceReport",
		),

		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Basic,
				CommandClasses["Wake Up"],
				CommandClasses.Security,
			],
			securityClasses: new Set([SecurityClass.S0_Legacy]),
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// The node requests a nonce while asleep, but the ACK gets lost
			node.markAsAsleep();
			mockNode.autoAckControllerFrames = false;

			let nonceRequest = new SecurityCCNonceGet({
				nodeId: mockController.ownNodeId,
			});
			await mockNode.sendToController(
				createMockZWaveRequestFrame(nonceRequest, {
					ackRequested: false,
				}),
			);

			// The driver should send a Nonce Report command
			await mockNode.expectControllerFrame(
				(f): f is MockZWaveRequestFrame =>
					f.type === MockZWaveFrameType.Request
					&& f.payload instanceof SecurityCCNonceReport,
				{
					timeout: 200,
					errorMessage: "Expected a Nonce Report to be sent",
				},
			);

			mockNode.clearReceivedControllerFrames();
			await wait(MOCK_FRAME_ACK_TIMEOUT);

			// No further Nonce Report should have been sent
			mockNode.assertReceivedControllerFrame(
				(f) =>
					f.type === MockZWaveFrameType.Request
					&& f.payload instanceof SecurityCCNonceReport,
				{
					noMatch: true,
					errorMessage: "Expected NO further Nonce Report to be sent",
				},
			);

			// The node's ACK will now be received again
			mockNode.autoAckControllerFrames = true;

			// And subsequent requests must be answered
			nonceRequest = new SecurityCCNonceGet({
				nodeId: mockController.ownNodeId,
			});
			await mockNode.sendToController(
				createMockZWaveRequestFrame(nonceRequest, {
					ackRequested: false,
				}),
			);

			await mockNode.expectControllerFrame(
				(f): f is MockZWaveRequestFrame =>
					f.type === MockZWaveFrameType.Request
					&& f.payload instanceof SecurityCCNonceReport,
				{
					timeout: 200,
					errorMessage: "Expected a Nonce Report to be sent",
				},
			);
		},
	},
);
