import { DoorLockMode } from "@zwave-js/cc";
import { DoorLockCCValues } from "@zwave-js/cc/DoorLockCC";
import {
	NotificationCCReport,
	NotificationCCValues,
} from "@zwave-js/cc/NotificationCC";
import { CommandClasses } from "@zwave-js/core";
import { createMockZWaveRequestFrame } from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import path from "node:path";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest.sequential(
	"remapNotifications ignore discards matching notifications without updating Door Lock state",
	{
		// debug: true,

		nodeCapabilities: {
			manufacturerId: 0xdead,
			productType: 0xbeef,
			productId: 0xcafe,

			commandClasses: [
				{
					ccId: CommandClasses.Notification,
					isSupported: true,
					version: 8,
					supportsV1Alarm: false,
					notificationTypesAndEvents: {
						// Access Control - Manual lock/unlock and Keypad lock/unlock
						[0x06]: [0x01, 0x02, 0x05, 0x06],
					},
				},
				CommandClasses["Door Lock"],
				CommandClasses["Manufacturer Specific"],
				CommandClasses.Version,
			],
		},

		additionalDriverOptions: {
			storage: {
				deviceConfigPriorityDir: path.join(
					__dirname,
					"fixtures/remapNotificationsIgnore",
				),
			},
		},

		async testBody(t, driver, node, mockController, mockNode) {
			t.expect(node.deviceConfig?.compat?.remapNotifications)
				.toBeDefined();

			const supportedAccessControlEvents: number[] | undefined = node
				.getValue(
					NotificationCCValues.supportedNotificationEvents(0x06).id,
				);

			t.expect(supportedAccessControlEvents).toBeDefined();
			// Ignored events are removed from the supported list
			t.expect(supportedAccessControlEvents).not.toContain(0x01);
			t.expect(supportedAccessControlEvents).not.toContain(0x02);
			// Other events remain supported
			t.expect(supportedAccessControlEvents).toContain(0x06);

			const valueId = DoorLockCCValues.currentMode.id;

			// Establish lock state via a non-ignored notification
			let cc = new NotificationCCReport({
				nodeId: mockNode.id,
				notificationType: 0x06,
				notificationEvent: 0x05, // Keypad lock operation
			});
			await mockNode.sendToController(
				createMockZWaveRequestFrame(cc, {
					ackRequested: false,
				}),
			);
			await wait(100);
			t.expect(node.getValue(valueId)).toBe(DoorLockMode.Secured);

			// Manual unlock should be ignored and leave the Door Lock state alone
			cc = new NotificationCCReport({
				nodeId: mockNode.id,
				notificationType: 0x06,
				notificationEvent: 0x02,
			});
			await mockNode.sendToController(
				createMockZWaveRequestFrame(cc, {
					ackRequested: false,
				}),
			);
			await wait(100);
			t.expect(node.getValue(valueId)).toBe(DoorLockMode.Secured);

			// Manual lock should likewise be ignored
			cc = new NotificationCCReport({
				nodeId: mockNode.id,
				notificationType: 0x06,
				notificationEvent: 0x01,
			});
			await mockNode.sendToController(
				createMockZWaveRequestFrame(cc, {
					ackRequested: false,
				}),
			);
			await wait(100);
			t.expect(node.getValue(valueId)).toBe(DoorLockMode.Secured);

			// Keypad unlock is not ignored and should still update Door Lock state
			cc = new NotificationCCReport({
				nodeId: mockNode.id,
				notificationType: 0x06,
				notificationEvent: 0x06,
			});
			await mockNode.sendToController(
				createMockZWaveRequestFrame(cc, {
					ackRequested: false,
				}),
			);
			await wait(100);
			t.expect(node.getValue(valueId)).toBe(DoorLockMode.Unsecured);
		},
	},
);
