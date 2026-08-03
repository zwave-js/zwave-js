import { SupervisionCC, SupervisionCCReport } from "@zwave-js/cc";
import { NotificationCCReport } from "@zwave-js/cc/NotificationCC";
import { CommandClasses, SupervisionStatus } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import {
	MockZWaveFrameType,
	type MockZWaveRequestFrame,
	createMockZWaveRequestFrame,
} from "@zwave-js/testing";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"Notification Reports with unparsable event parameters received via Supervision are answered",
	{
		// debug: true,

		nodeCapabilities: {
			commandClasses: [
				{
					ccId: CommandClasses.Supervision,
					version: 2,
					isSupported: true,
				},
				{
					ccId: CommandClasses.Notification,
					version: 8,
					isSupported: true,
				},
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			const notification = new NotificationCCReport({
				nodeId: mockController.ownNodeId,
				notificationType: 0x06, // Access Control
				notificationEvent: 0x0e, // New user code added
				// Some locks send only the user ID instead of the CC payload
				// the spec requires. User IDs in the range of extended CC ids
				// cannot be parsed as a CC at all.
				eventParameters: Bytes.from([0xf5]),
			});
			const cc = SupervisionCC.encapsulate(
				notification,
				driver.getNextSupervisionSessionId(mockNode.id),
			);

			await mockNode.sendToController(createMockZWaveRequestFrame(cc));

			const { payload: response } = await mockNode.expectControllerFrame<
				MockZWaveRequestFrame
			>(
				(msg): msg is MockZWaveRequestFrame =>
					msg.type === MockZWaveFrameType.Request
					&& msg.payload instanceof SupervisionCCReport,
				{ timeout: 1000 },
			);

			t.expect((response as SupervisionCCReport).status).toBe(
				SupervisionStatus.Success,
			);
		},
	},
);
