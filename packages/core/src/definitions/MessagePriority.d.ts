/** The priority of messages, sorted from high (0) to low (>0) */
export declare enum MessagePriority {
    ControllerImmediate = 0,
    Controller = 1,
    Immediate = 2,
    ImmediateLow = 3,
    Ping = 4,
    WakeUp = 5,
    Normal = 6,
    NodeQuery = 7,
    Poll = 8
}
export declare function isMessagePriority(val: unknown): val is MessagePriority;
//# sourceMappingURL=MessagePriority.d.ts.map