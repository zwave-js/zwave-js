import {
	ApplicationStatusCCRejectedRequest,
	NotificationCCSet,
} from "@zwave-js/cc";
import { CommandClasses, SupervisionStatus } from "@zwave-js/core";
import { type MockNodeBehavior, MockZWaveFrameType } from "@zwave-js/testing";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"Application Rejected Request should be converted to SupervisionResult with Fail status",
	{
		// debug: true,

		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Notification,
				CommandClasses["Application Status"],
			],
		},

		customSetup: async (_driver, _controller, mockNode) => {
			// Have the node respond to NotificationCCSet with Application Rejected Request
			const respondToNotificationSet: MockNodeBehavior = {
				handleCC(controller, _self, receivedCC) {
					if (
						receivedCC instanceof NotificationCCSet
						&& receivedCC.notificationStatus === false
					) {
						const cc = new ApplicationStatusCCRejectedRequest({
							nodeId: controller.ownNodeId,
						});
						return { action: "sendCC", cc };
					}
				},
			};

			mockNode.defineBehavior(respondToNotificationSet);
		},

		testBody: async (t, driver, node, _mockController, mockNode) => {
			const command = new NotificationCCSet({
				nodeId: node.id,
				notificationType: 1,
				notificationStatus: false,
			});

			const result = await driver.sendCommand(command, {
				// Disable supervision so we can test ApplicationStatusCCRejectedRequest
				useSupervision: false,
			});

			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof NotificationCCSet
					&& frame.payload.notificationStatus === false,
				{
					errorMessage:
						"Node should have received a NotificationCCSet with notificationStatus false",
				},
			);

			mockNode.assertSentControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload
						instanceof ApplicationStatusCCRejectedRequest,
				{
					errorMessage:
						"Node should have sent an ApplicationStatusCCRejectedRequest",
				},
			);

			t.expect(result).toBeDefined();
			t.expect(result).toHaveProperty("status");
			t.expect(result!.status).toBe(SupervisionStatus.Fail);
		},
	},
);
