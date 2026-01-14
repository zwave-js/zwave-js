export declare enum NodeIDType {
    Short = 1,
    Long = 2
}
/** The broadcast target node id */
export declare const NODE_ID_BROADCAST = 255;
/** The broadcast target node id for Z-Wave LR */
export declare const NODE_ID_BROADCAST_LR = 4095;
/** The highest allowed node id */
export declare const NODE_ID_MAX = 232;
export type MulticastDestination = [number, number, ...number[]];
//# sourceMappingURL=NodeID.d.ts.map