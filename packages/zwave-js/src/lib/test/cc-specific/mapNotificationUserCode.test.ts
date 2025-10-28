import { CommandClasses } from "@zwave-js/core";
import { NotificationCCReport } from "@zwave-js/cc/NotificationCC";
import { UserCodeCCValues } from "@zwave-js/cc/UserCodeCC";
import { createMockZWaveRequestFrame } from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import path from "node:path";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"When receiving a NotificationCC::Report with 'All user codes deleted' event, all user codes should be removed from the cache",
	{
		// debug: true,
		provisioningDirectory: path.join(
			__dirname,
			"fixtures/notificationAndUserCodeCC",
		),

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
			node.valueDB.setValue(userIdStatus1ValueId, 1); // Enabled
			node.valueDB.setValue(userCode2ValueId, "5678");
			node.valueDB.setValue(userIdStatus2ValueId, 1); // Enabled

			// Verify the user codes exist
			t.expect(node.getValue(userCode1ValueId)).toBe("1234");
			t.expect(node.getValue(userIdStatus1ValueId)).toBe(1);
			t.expect(node.getValue(userCode2ValueId)).toBe("5678");
			t.expect(node.getValue(userIdStatus2ValueId)).toBe(1);

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

			// Verify all user codes are removed
			t.expect(node.getValue(userCode1ValueId)).toBeUndefined();
			t.expect(node.getValue(userIdStatus1ValueId)).toBeUndefined();
			t.expect(node.getValue(userCode2ValueId)).toBeUndefined();
			t.expect(node.getValue(userIdStatus2ValueId)).toBeUndefined();

			// Verify no User Code CC values remain
			const remainingUserCodes = node.valueDB.getValues(
				CommandClasses["User Code"],
			).filter(
				(v) =>
					v.property === "userCode" || v.property === "userIdStatus",
			);
			t.expect(remainingUserCodes.length).toBe(0);
		},
	},
);
