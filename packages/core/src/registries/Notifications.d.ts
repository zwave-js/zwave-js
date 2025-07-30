export interface Notification {
    readonly type: number;
    readonly name: string;
    readonly variables: readonly NotificationVariable[];
    readonly events: ReadonlyMap<number, NotificationEvent>;
}
export interface NotificationValueBase {
    readonly label: string;
    readonly description?: string;
    readonly parameter?: NotificationParameter;
    readonly idleVariables?: readonly number[];
}
export interface NotificationState extends NotificationValueBase {
    readonly type: "state";
    readonly variableName: string;
    /** Whether the variable may be reset to idle */
    readonly idle: boolean;
    readonly value: number;
}
export interface NotificationEvent extends NotificationValueBase {
    readonly type: "event";
    readonly value: number;
}
export type NotificationValue = NotificationState | NotificationEvent;
/** A group of notification states with different values that refer to the same logical variable */
export interface NotificationVariable {
    readonly name: string;
    /** Whether the variable may be reset to idle */
    readonly idle: boolean;
    readonly states: ReadonlyMap<number, NotificationState>;
}
/** Marks a notification that contains a duration */
export interface NotificationParameterWithDuration {
    readonly type: "duration";
}
/** Marks a notification that contains a CC */
export interface NotificationParameterWithCommandClass {
    readonly type: "commandclass";
}
/** Marks a notification that contains a named value */
export interface NotificationParameterWithValue {
    readonly type: "value";
    readonly propertyName: string;
}
/** Marks a notification that contains an enumeration of values */
export interface NotificationParameterWithEnum {
    readonly type: "enum";
    readonly values: Record<number, string>;
    readonly default?: number;
}
export type NotificationParameter = NotificationParameterWithDuration | NotificationParameterWithCommandClass | NotificationParameterWithValue | NotificationParameterWithEnum;
/** Returns the notification definition for the given notification type */
export declare function getNotification(type: number): Notification | undefined;
export declare function getNotificationName(type: number): string;
/** Returns all defined notifications */
export declare function getAllNotifications(): readonly Notification[];
/** Returns a notification's event or state with the given value */
export declare function getNotificationValue(notification: Notification, value: number): NotificationValue | undefined;
/** Returns the name of a given notification event (stateless only), or a default string */
export declare function getNotificationEventName(type: number, event: number): string;
/** Returns the name of a given notification state or event, or a default string */
export declare function getNotificationValueName(type: number, event: number): string;
//# sourceMappingURL=Notifications.d.ts.map