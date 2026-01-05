import { UserCodeCCValues, UserIDStatus } from "@zwave-js/cc";
import { NotificationCCReport } from "@zwave-js/cc/NotificationCC";
import { CommandClasses } from "@zwave-js/core";
import { ccCaps, createMockZWaveRequestFrame } from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"When receiving a NotificationCC::Report with 'All user codes deleted' event, all user codes should be cleared from the cache",
	{
		// debug: true,

		nodeCapabilities: {
			commandClasses: [
				ccCaps({
					ccId: CommandClasses["User Code"],
					numUsers: 2,
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Set up some user codes in the cache
			const userCode1ValueId = UserCodeCCValues.userCode(1).endpoint(0);
			const userIdStatus1ValueId = UserCodeCCValues.userIdStatus(1)
				.endpoint(0);
			const userCode2ValueId = UserCodeCCValues.userCode(2).endpoint(0);
			const userIdStatus2ValueId = UserCodeCCValues.userIdStatus(2)
				.endpoint(0);

			// Manually set user codes in the cache (simulating a previous state)
			node.valueDB.setValue(userCode1ValueId, "1234");
			node.valueDB.setValue(userIdStatus1ValueId, UserIDStatus.Enabled);
			node.valueDB.setValue(userCode2ValueId, "5678");
			node.valueDB.setValue(userIdStatus2ValueId, UserIDStatus.Enabled);

			// Verify the user codes exist
			t.expect(node.getValue(userCode1ValueId)).toBe("1234");
			t.expect(node.getValue(userIdStatus1ValueId)).toBe(
				UserIDStatus.Enabled,
			);
			t.expect(node.getValue(userCode2ValueId)).toBe("5678");
			t.expect(node.getValue(userIdStatus2ValueId)).toBe(
				UserIDStatus.Enabled,
			);

			// Send the "All user codes deleted" notification
			const cc = new NotificationCCReport({
				nodeId: mockController.ownNodeId,
				notificationType: 0x06, // Access Control
				notificationEvent: 0x0c, // All user codes deleted
			});
			await mockNode.sendToController(
				createMockZWaveRequestFrame(cc, {
					ackRequested: false,
				}),
			);
			// wait a bit for the values to be updated
			await wait(100);

			// Verify all user codes are cleared (set to Available and empty string)
			t.expect(node.getValue(userCode1ValueId)).toBe("");
			t.expect(node.getValue(userIdStatus1ValueId)).toBe(
				UserIDStatus.Available,
			);
			t.expect(node.getValue(userCode2ValueId)).toBe("");
			t.expect(node.getValue(userIdStatus2ValueId)).toBe(
				UserIDStatus.Available,
			);
		},
	},
);
