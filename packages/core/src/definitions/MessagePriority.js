/** The priority of messages, sorted from high (0) to low (>0) */
export var MessagePriority;
(function (MessagePriority) {
    // High-priority controller commands that must be handled before all other commands.
    // We use this priority to decide which messages go onto the immediate queue.
    MessagePriority[MessagePriority["ControllerImmediate"] = 0] = "ControllerImmediate";
    // Controller commands finish quickly and should be preferred over node queries
    MessagePriority[MessagePriority["Controller"] = 1] = "Controller";
    // Some node commands like nonces, responses to Supervision and Transport Service
    // need to be handled before all node commands.
    // We use this priority to decide which messages go onto the immediate queue.
    MessagePriority[MessagePriority["Immediate"] = 2] = "Immediate";
    // To avoid S2 collisions, some commands that normally have Immediate priority
    // have to go onto the normal queue, but still before all other messages
    MessagePriority[MessagePriority["ImmediateLow"] = 3] = "ImmediateLow";
    // Pings (NoOP) are used for device probing at startup and for network diagnostics
    MessagePriority[MessagePriority["Ping"] = 4] = "Ping";
    // Whenever sleeping devices wake up, their queued messages must be handled quickly
    // because they want to go to sleep soon. So prioritize them over non-sleeping devices
    MessagePriority[MessagePriority["WakeUp"] = 5] = "WakeUp";
    // Normal operation and node data exchange
    MessagePriority[MessagePriority["Normal"] = 6] = "Normal";
    // Node querying is expensive and happens whenever a new node is discovered.
    // In order to keep the system responsive, give them a lower priority
    MessagePriority[MessagePriority["NodeQuery"] = 7] = "NodeQuery";
    // Some devices need their state to be polled at regular intervals. Only do that when
    // nothing else needs to be done
    MessagePriority[MessagePriority["Poll"] = 8] = "Poll";
})(MessagePriority || (MessagePriority = {}));
export function isMessagePriority(val) {
    return typeof val === "number" && val in MessagePriority;
}
//# sourceMappingURL=MessagePriority.js.map