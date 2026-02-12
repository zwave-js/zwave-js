import {
	BasicCCReport,
	Security2CC,
	Security2CCMessageEncapsulation,
	Security2Command,
	SupervisionCCGet,
	SupervisionCCReport,
	WakeUpCCNoMoreInformation,
	WakeUpCCWakeUpNotification,
	WakeUpCommand,
} from "@zwave-js/cc";
import { type CCId, CommandClasses, SecurityClass } from "@zwave-js/core";
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
	"When a sleeping node sends a wakeup notification after a supervision report, no SendDataAbort should be sent",
	{
		debug: true,

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
			// When the node receives a SupervisionCCReport, send an
			// S2-encrypted WakeUpNotification
			const sendWakeUpOnSupervisionReport: MockNodeBehavior = {
				async handleCC(controller, self, receivedCC) {
					if (receivedCC instanceof SupervisionCCReport) {
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
			mockNode.defineBehavior(sendWakeUpOnSupervisionReport);
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

			// The node sends an S2-encrypted supervised Basic Report
			const nodeToHost = Security2CC.encapsulate(
				new SupervisionCCGet({
					nodeId: mockController.ownNodeId,
					requestStatusUpdates: false,
					encapsulated: new BasicCCReport({
						nodeId: mockController.ownNodeId,
						currentValue: 55,
					}),
					sessionId: 1,
				}),
				mockNode.id,
				mockNode.securityManagers,
			);
			mockNode.sendToController(
				createMockZWaveRequestFrame(nodeToHost, {
					ackRequested: false,
				}),
			);

			// Wait for the driver to process everything
			// (supervision report + S2 verify delivery + wakeup notification)
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
					timeout: 1500,
					errorMessage: "The node was not sent back to sleep",
				},
			);

			await wait(750);

			// Assert: No SendDataAbort should have been sent
			const abortMessages = mockController.receivedHostMessages.filter(
				(msg) => msg.functionType === FunctionType.SendDataAbort,
			);
			t.expect(abortMessages.length).toBe(0);

			// Assert: The SupervisionCCReport should not be re-transmitted.
			// The command is S2-wrapped, so check for the inner CC.
			const supervisionReports = mockController.receivedHostMessages
				.filter(
					(msg) =>
						msg instanceof SendDataBridgeRequest
						&& (msg.command instanceof SupervisionCCReport
							|| msg.command
									?.encapsulated
								instanceof SupervisionCCReport),
				);
			t.expect(supervisionReports.length).toBe(1);

			// The node should be sent to sleep again
			await expectNoMoreInformation;
		},
	},
);
