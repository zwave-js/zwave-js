import type { Duration } from "@zwave-js/core";
import type { BytesView } from "@zwave-js/shared";
import type { CommandClass } from "./CommandClass.js";

export interface NotificationEventPayload {
	toNotificationEventParameters():
		| BytesView
		| Duration
		| Record<string, number>;
}

/**
 * Tests if the given message contains a CC
 */
export function isNotificationEventPayload<T extends CommandClass>(
	msg: T,
): msg is T & NotificationEventPayload {
	return typeof (msg as any).toNotificationEventParameters === "function";
}
