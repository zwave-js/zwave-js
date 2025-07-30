/**
 * Tests if the given message contains a CC
 */
export function isNotificationEventPayload(msg) {
    return typeof msg.toNotificationEventParameters === "function";
}
//# sourceMappingURL=NotificationEventPayload.js.map