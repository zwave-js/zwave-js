import { MAX_NODES } from "./consts.js";
export var NodeIDType;
(function (NodeIDType) {
    NodeIDType[NodeIDType["Short"] = 1] = "Short";
    NodeIDType[NodeIDType["Long"] = 2] = "Long";
})(NodeIDType || (NodeIDType = {}));
/** The broadcast target node id */
export const NODE_ID_BROADCAST = 0xff;
/** The broadcast target node id for Z-Wave LR */
export const NODE_ID_BROADCAST_LR = 0xfff;
/** The highest allowed node id */
// FIXME: Rename probably
export const NODE_ID_MAX = MAX_NODES;
//# sourceMappingURL=NodeID.js.map