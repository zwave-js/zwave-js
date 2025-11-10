import { test } from "vitest";
import { getNotification, getNotificationEventName } from "./Notifications.js";

test(
	"getNotification() returns the notification definition if it is defined",
	async (t) => {
		const emergencyAlarm = getNotification(0x0a);
		t.expect(emergencyAlarm?.name).toBe("Emergency Alarm");

		t.expect(getNotification(0xff)).toBeUndefined();
	},
);

test(
	"getNotificationEventName() returns the event name for Emergency Alarm panic alert",
	async (t) => {
		const eventName = getNotificationEventName(0x0a, 0x04);
		t.expect(eventName).toBe("Panic alert");
	},
);

test(
	"Emergency Alarm notification contains all expected events",
	async (t) => {
		const emergencyAlarm = getNotification(0x0a);
		t.expect(emergencyAlarm).toBeDefined();
		
		// Check that all events are present
		t.expect(emergencyAlarm?.events.has(0x01)).toBe(true);
		t.expect(emergencyAlarm?.events.has(0x02)).toBe(true);
		t.expect(emergencyAlarm?.events.has(0x03)).toBe(true);
		t.expect(emergencyAlarm?.events.has(0x04)).toBe(true);
		
		// Verify event labels
		t.expect(emergencyAlarm?.events.get(0x01)?.label).toBe("Contact police");
		t.expect(emergencyAlarm?.events.get(0x02)?.label).toBe("Contact fire service");
		t.expect(emergencyAlarm?.events.get(0x03)?.label).toBe("Contact medical service");
		t.expect(emergencyAlarm?.events.get(0x04)?.label).toBe("Panic alert");
	},
);
