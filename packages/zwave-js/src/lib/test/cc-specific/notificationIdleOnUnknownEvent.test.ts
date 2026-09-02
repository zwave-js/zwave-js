import {
	NotificationCCGet,
	NotificationCCReport,
	NotificationCCValues,
} from "@zwave-js/cc/NotificationCC";
import { CommandClasses } from "@zwave-js/core";
import {
	type MockNodeBehavior,
	ccCaps,
	createMockZWaveRequestFrame,
} from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import { integrationTest } from "../integrationTestSuite.js";

// Heat Alarm, events 2 (Overheat) and 6 (Underheat) map to the idle-able
// "Heat sensor status" variable.
const HEAT_ALARM = 0x04;

const heatSensorStatus = NotificationCCValues
	.notificationVariable("Heat Alarm", "Heat sensor status")
	.endpoint(0);
const unknownHeatAlarm = NotificationCCValues
	.unknownNotificationVariable(HEAT_ALARM, "Heat Alarm")
	.endpoint(0);

const nodeCapabilities = {
	commandClasses: [
		CommandClasses.Version,
		ccCaps({
			ccId: CommandClasses.Notification,
			version: 2,
			notificationTypesAndEvents: {
				[HEAT_ALARM]: [0x02, 0x06],
			},
		}),
	],
};

// Every Get for the notification status is answered with event 0xfe, mimicking
// a node that reports no active notification for the queried type.
const respondToNotificationGetWithUnknownEvent: MockNodeBehavior = {
	handleCC(controller, self, receivedCC) {
		if (receivedCC instanceof NotificationCCGet) {
			const cc = new NotificationCCReport({
				nodeId: controller.ownNodeId,
				notificationType: receivedCC.notificationType ?? HEAT_ALARM,
				notificationEvent: 0xfe,
			});
			return { action: "sendCC", cc };
		}
	},
};

integrationTest(
	"Notification CC: a Get answered with event 0xfe idles the notification variable",
	{
		nodeCapabilities,

		customSetup: async (driver, controller, mockNode) => {
			mockNode.defineBehavior(respondToNotificationGetWithUnknownEvent);
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Pretend the variable currently reflects an active overheat alarm
			node.valueDB.setValue(heatSensorStatus, 0x02);

			// Querying the status returns event 0xfe
			await node.refreshCCValues(CommandClasses.Notification);

			// The idle-able variable was reset to idle, without storing an
			// "unknown" value
			t.expect(node.getValue(heatSensorStatus)).toBe(0);
			t.expect(node.getValue(unknownHeatAlarm)).toBeUndefined();
		},
	},
);

integrationTest(
	"Notification CC: get() persists the idle state but returns the raw 0xfe event",
	{
		nodeCapabilities,

		customSetup: async (driver, controller, mockNode) => {
			mockNode.defineBehavior(respondToNotificationGetWithUnknownEvent);
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Pretend the variable currently reflects an active overheat alarm
			node.valueDB.setValue(heatSensorStatus, 0x02);

			const result = await node.commandClasses.Notification.get({
				notificationType: HEAT_ALARM,
			});

			// The API response reflects the raw event reported by the node
			t.expect(result?.notificationEvent).toBe(0xfe);
			// ... while the persisted state was idled, without an unknown value
			t.expect(node.getValue(heatSensorStatus)).toBe(0);
			t.expect(node.getValue(unknownHeatAlarm)).toBeUndefined();
		},
	},
);

integrationTest(
	"Notification CC: an unsolicited report with event 0xfe is kept as an unknown value",
	{
		nodeCapabilities,

		customSetup: async (driver, controller, mockNode) => {
			mockNode.defineBehavior(respondToNotificationGetWithUnknownEvent);
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Pretend the variable currently reflects an active overheat alarm
			node.valueDB.setValue(heatSensorStatus, 0x02);

			const report = new NotificationCCReport({
				nodeId: mockController.ownNodeId,
				notificationType: HEAT_ALARM,
				notificationEvent: 0xfe,
			});
			await mockNode.sendToController(
				createMockZWaveRequestFrame(report, {
					ackRequested: false,
				}),
			);
			await wait(100);

			// The active variable is left untouched, and 0xfe is stored as an
			// unknown value
			t.expect(node.getValue(heatSensorStatus)).toBe(0x02);
			t.expect(node.getValue(unknownHeatAlarm)).toBe(0xfe);
		},
	},
);
