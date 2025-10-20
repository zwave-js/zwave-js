import { BasicCCGet, BasicCCReport } from "@zwave-js/cc";
import { TransmitStatus } from "@zwave-js/core";
import {
	FunctionType,
	SendDataAbort,
	SendDataBridgeRequest,
	SendDataRequestTransmitReport,
} from "@zwave-js/serial";
import type {
	MockControllerBehavior,
	MockNodeBehavior,
} from "@zwave-js/testing";
import path from "node:path";
import {
	MockControllerCommunicationState,
	MockControllerStateKeys,
} from "../../controller/MockControllerState.js";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"Abort SendData transaction when expected response is received prematurely",
	{
		// debug: true,

		provisioningDirectory: path.join(__dirname, "fixtures/base_2_nodes"),

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
						const cb = new SendDataRequestTransmitReport({
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
				async handleCC(controller, self, receivedCC) {
					if (receivedCC instanceof BasicCCGet) {
						const cc = new BasicCCReport({
							nodeId: self.id,
							currentValue: 42,
						});
						return { action: "sendCC", cc };
					}
				},
			};
			mockNode.defineBehavior(respondToBasicGet);
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Disable automatic ACKs to simulate poor connectivity
			mockNode.autoAckControllerFrames = false;

			// Send Basic CC Get - this should resolve due to premature response
			const result = await node.commandClasses.Basic.get();
			t.expect(result?.currentValue).toBe(42);

			// Assert that the controller received a SendDataAbort
			// This proves that the ongoing transaction was aborted when the
			// premature response arrived
			await mockController.expectHostMessage(
				(msg) => msg.functionType === FunctionType.SendDataAbort,
				{ timeout: 500 },
			);
		},
	},
);
