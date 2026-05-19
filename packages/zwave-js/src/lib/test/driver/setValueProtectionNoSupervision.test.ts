import {
	LocalProtectionState,
	RFProtectionState,
} from "@zwave-js/cc";
import {
	ProtectionCCGet,
	ProtectionCCReport,
	ProtectionCCSet,
	ProtectionCCSupportedGet,
	ProtectionCCSupportedReport,
	ProtectionCCValues,
} from "@zwave-js/cc/ProtectionCC";
import { CommandClasses } from "@zwave-js/core";
import { type MockNodeBehavior, MockZWaveFrameType } from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"Protection setValue without supervision: expect immediate validation GET",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				{
					ccId: CommandClasses.Protection,
					isSupported: true,
					version: 2,
				},
			],
		},

		additionalDriverOptions: {
			timeouts: {
				response: 2000,
				refreshValueAfterTransition: 100,
			},
		},

		customSetup: async (_driver, _controller, mockNode) => {
			const currentState = {
				local: LocalProtectionState.Unprotected,
				rf: RFProtectionState.Unprotected,
			};

			const respondToProtectionCommands: MockNodeBehavior = {
				handleCC(controller, _self, receivedCC) {
					if (receivedCC instanceof ProtectionCCSupportedGet) {
						const cc = new ProtectionCCSupportedReport({
							nodeId: controller.ownNodeId,
							supportsExclusiveControl: false,
							supportsTimeout: false,
							supportedLocalStates: [
								LocalProtectionState.Unprotected,
								LocalProtectionState.NoOperationPossible,
							],
							supportedRFStates: [
								RFProtectionState.Unprotected,
								RFProtectionState.NoControl,
							],
						});
						return { action: "sendCC", cc };
					}

					if (receivedCC instanceof ProtectionCCGet) {
						const cc = new ProtectionCCReport({
							nodeId: controller.ownNodeId,
							local: currentState.local,
							rf: currentState.rf,
						});
						return { action: "sendCC", cc };
					}

					if (receivedCC instanceof ProtectionCCSet) {
						currentState.local = receivedCC.local;
						currentState.rf =
							receivedCC.rf ?? RFProtectionState.Unprotected;
						return { action: "stop" };
					}
				},
			};

			mockNode.defineBehavior(respondToProtectionCommands);
		},

		testBody: async (t, _driver, node, _mockController, mockNode) => {
			const startedAt = Date.now();
			await node.setValue(
				ProtectionCCValues.rfProtectionState.id,
				RFProtectionState.NoControl,
			);
			const elapsed = Date.now() - startedAt;

			t.expect(elapsed).toBeLessThan(1000);

			await wait(1000);

			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof ProtectionCCSet,
				{
					errorMessage: "Node should have received a ProtectionCCSet",
				},
			);

			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof ProtectionCCGet,
				{
					errorMessage:
						"Node should have received a ProtectionCCGet right after ProtectionCCSet",
				},
			);

			mockNode.assertSentControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof ProtectionCCReport
					&& frame.payload.rf === RFProtectionState.NoControl,
				{
					errorMessage:
						"Node should have sent a ProtectionCCReport with the updated RF state",
				},
			);
		},
	},
);
