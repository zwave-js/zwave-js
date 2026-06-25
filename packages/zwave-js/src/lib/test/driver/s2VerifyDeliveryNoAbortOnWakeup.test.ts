import {
	BasicCCReport,
	Security2CC,
	Security2CCMessageEncapsulation,
	Security2Command,
	WakeUpCCNoMoreInformation,
	WakeUpCCWakeUpNotification,
} from "@zwave-js/cc";
import {
	type CCId,
	CommandClasses,
	MessagePriority,
	SecurityClass,
	TransmitOptions,
} from "@zwave-js/core";
import { FunctionType, SendDataBridgeRequest } from "@zwave-js/serial";
import {
	type MockNodeBehavior,
	type MockZWaveFrame,
	MockZWaveFrameType,
	createMockZWaveRequestFrame,
} from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import path from "node:path";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"When a sleeping node wakes up while we're busy verifying S2 delivery, do not execute SendDataAbort",
	{
		// debug: true,

		provisioningDirectory: path.join(
			__dirname,
			"fixtures/s2AndSupervisionWakeup",
		),

		nodeCapabilities: {
			isListening: false,
			isFrequentListening: false,
			securityClasses: new Set([SecurityClass.S2_Unauthenticated]),
			commandClasses: [
				CommandClasses.Basic,
				CommandClasses["Wake Up"],
				CommandClasses.Supervision,
			],
		},

		customSetup: async (_driver, _mockController, mockNode) => {
			// After the node receives a BasicCCReport, send WakeUpNotification
			const sendWakeUpOnBasicReport: MockNodeBehavior = {
				async handleCC(controller, self, receivedCC) {
					if (receivedCC instanceof BasicCCReport) {
						const cc = Security2CC.encapsulate(
							new WakeUpCCWakeUpNotification({
								nodeId: controller.ownNodeId,
							}),
							self.id,
							self.securityManagers,
						);
						await self.sendToController(
							createMockZWaveRequestFrame(cc, {
								ackRequested: false,
							}),
						);
						return { action: "stop" };
					}
				},
			};
			mockNode.defineBehavior(sendWakeUpOnBasicReport);
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Sync the SPAN by sending a command to the node
			node.markAsAwake();
			mockNode.autoAckControllerFrames = true;
			await node.commandClasses.Basic
				.withOptions({ useSupervision: false })
				.set(0);
			node.markAsAsleep();
			mockNode.autoAckControllerFrames = false;

			mockController.clearReceivedHostMessages();

			// This test is a bit contrived, but it attempts to test the combination of:
			// - S2 delivery verification
			// - of a command sent to a sleeping node with NO_ACK
			// - to a sleeping node
			// - that is not a SupervisionReport

			const cc = new BasicCCReport({
				nodeId: node.id,
				currentValue: 99,
			});
			driver.sendCommand(cc, {
				priority: MessagePriority.Immediate,
				maxSendAttempts: 1,
				transmitOptions: TransmitOptions.DEFAULT_NOACK,
			}).catch(() => {});

			// Wait for the driver to process everything
			// (S2 verify delivery + wakeup notification)
			await mockController.expectNodeCC(
				mockNode,
				(cc): cc is CCId =>
					cc.ccId === CommandClasses["Security 2"]
					&& cc.ccCommand === Security2Command.MessageEncapsulation
					&& (cc as Security2CCMessageEncapsulation).encapsulated
						instanceof WakeUpCCWakeUpNotification,
				{
					timeout: 1000,
					preventDefault: false,
				},
			);

			const expectNoMoreInformation = mockNode.expectControllerFrame(
				(msg): msg is MockZWaveFrame =>
					msg.type === MockZWaveFrameType.Request
					&& msg.payload instanceof Security2CCMessageEncapsulation
					&& msg.payload.encapsulated
						instanceof WakeUpCCNoMoreInformation,
				{
					timeout: 2000,
					errorMessage: "The node was not sent back to sleep",
				},
			);

			await wait(500);

			// Assert: No SendDataAbort should have been sent
			const abortMessages = mockController.receivedHostMessages.filter(
				(msg) => msg.functionType === FunctionType.SendDataAbort,
			);
			t.expect(abortMessages.length).toBe(0);

			// Assert: The BasicCCReport should not be re-transmitted.
			const basicReports = mockController.receivedHostMessages
				.filter(
					(msg) =>
						msg instanceof SendDataBridgeRequest
						&& (msg.command instanceof BasicCCReport
							|| (msg.command
									instanceof Security2CCMessageEncapsulation
								&& msg.command
										.encapsulated
									instanceof BasicCCReport)),
				);
			t.expect(basicReports.length).toBe(1);

			// The node should be sent to sleep again
			await expectNoMoreInformation;
		},
	},
);
