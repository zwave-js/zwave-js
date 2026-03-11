import {
	NotificationCCReport,
	NotificationCCValues,
} from "@zwave-js/cc/NotificationCC";
import { CommandClasses, UNKNOWN_STATE } from "@zwave-js/core";
import { createMockZWaveRequestFrame } from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import path from "node:path";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"remapNotifications compat flag syncs doorStateSimple when remapping to/clearing door open/closed events",
	{
		// debug: true,

		nodeCapabilities: {
			manufacturerId: 0xdead,
			productType: 0xbeef,
			productId: 0xcaff,

			commandClasses: [
				{
					ccId: CommandClasses.Notification,
					isSupported: true,
					version: 8,
					supportsV1Alarm: false,
					notificationTypesAndEvents: {
						// Access Control - Manual lock events remapped to door open/closed
						[0x06]: [0x01, 0x02],
					},
				},
				CommandClasses["Manufacturer Specific"],
				CommandClasses.Version,
			],
		},

		additionalDriverOptions: {
			storage: {
				deviceConfigPriorityDir: path.join(
					__dirname,
					"fixtures/remapNotificationsDoorState",
				),
			},
		},

		async testBody(t, driver, node, mockController, mockNode) {
			const doorStateSimpleId =
				NotificationCCValues.deprecated_doorStateSimple.id;

			// Send event 0x01 - should be remapped to door open (0x16) and sync doorStateSimple
			let cc = new NotificationCCReport({
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

			t.expect(node.getValue(doorStateSimpleId)).toBe(0x16);

			// Send event 0x02 - should be remapped to door closed (0x17) and sync doorStateSimple
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

			t.expect(node.getValue(doorStateSimpleId)).toBe(0x17);

			// Send event 0xfe - should clear door open/closed and set doorStateSimple to UNKNOWN_STATE
			cc = new NotificationCCReport({
				nodeId: mockNode.id,
				notificationType: 0x06,
				notificationEvent: 0xfe,
			});

			await mockNode.sendToController(
				createMockZWaveRequestFrame(cc, {
					ackRequested: false,
				}),
			);
			await wait(100);

			t.expect(node.getValue(doorStateSimpleId)).toBe(UNKNOWN_STATE);
		},
	},
);
