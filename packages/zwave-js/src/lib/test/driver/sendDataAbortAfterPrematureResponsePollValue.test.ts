import { BasicCCGet, BasicCCReport, BasicCCValues } from "@zwave-js/cc";
import { NodeStatus, SecurityClass, TransmitStatus } from "@zwave-js/core";
import {
	FunctionType,
	SendDataAbort,
	SendDataBridgeRequest,
	SendDataBridgeRequestTransmitReport,
} from "@zwave-js/serial";
import {
	type MockControllerBehavior,
	type MockNodeBehavior,
} from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import path from "node:path";
import {
	MockControllerCommunicationState,
	MockControllerStateKeys,
} from "../../controller/MockControllerState.js";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"When aborting after the expected response to pollValue is received prematurely, the node should not be marked dead",
	{
		// debug: true,

		provisioningDirectory: path.join(
			__dirname,
			"fixtures/s0AndS2Encapsulation",
		),

		nodeCapabilities: {
			securityClasses: new Set([SecurityClass.S2_Unauthenticated]),
		},

		async customSetup(driver, mockController, mockNode) {
			let lastCallbackId: number | undefined;
			const handleSendDataAbort: MockControllerBehavior = {
				onHostMessage(controller, msg) {
					if (msg instanceof SendDataBridgeRequest) {
						// Remember the last callback ID
						lastCallbackId = msg.callbackId;
						return false;
					}
					if (msg instanceof SendDataAbort && lastCallbackId) {
						// Finish the transmission by sending the callback
						const cb = new SendDataBridgeRequestTransmitReport({
							callbackId: lastCallbackId,
							transmitStatus: TransmitStatus.NoAck,
						});

						setTimeout(() => {
							controller.sendMessageToHost(cb);
						}, 100);

						// Put the controller into idle state
						controller.state.set(
							MockControllerStateKeys.CommunicationState,
							MockControllerCommunicationState.Idle,
						);

						return true;
					}
				},
			};
			mockController.defineBehavior(handleSendDataAbort);

			const respondToBasicGet: MockNodeBehavior = {
				async handleCC(controller, _self, receivedCC) {
					if (receivedCC instanceof BasicCCGet) {
						const cc = new BasicCCReport({
							nodeId: controller.ownNodeId,
							currentValue: 42,
						});
						return { action: "sendCC", cc };
					}
				},
			};
			mockNode.defineBehavior(respondToBasicGet);
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			const currentValueId = BasicCCValues.currentValue.endpoint(0);

			// Send a Basic CC Get to synchronize the SPAN state
			await node.pollValue(currentValueId);

			// Disable automatic ACKs to simulate poor connectivity
			mockNode.autoAckControllerFrames = false;

			// Send a Basic CC Get by polling the value, this should resolve due to premature response
			const result = await node.pollValue(currentValueId);
			t.expect(result).toBe(42);

			// Assert that the controller received a SendDataAbort
			await mockController.expectHostMessage(
				(msg) => msg.functionType === FunctionType.SendDataAbort,
				{ timeout: 500 },
			);

			// Clear received messages and wait to check for retransmissions
			mockController.clearReceivedHostMessages();
			await wait(200);

			// Verify that no retransmission happened
			const retransmissions = mockController.receivedHostMessages.filter(
				(msg) => msg instanceof SendDataBridgeRequest,
			);
			t.expect(retransmissions.length).toBe(0);

			// The node should NOT be marked as dead after abortion
			t.expect(node.status).not.toBe(NodeStatus.Dead);
		},
	},
);
