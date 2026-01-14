/**
 * How the controller transmitted a frame to a node.
 */
export declare enum RoutingScheme {
    Idle = 0,
    Direct = 1,
    Priority = 2,
    LWR = 3,
    NLWR = 4,
    Auto = 5,
    ResortDirect = 6,
    Explore = 7
}
/**
 * Converts a routing scheme value to a human readable format.
 */
export declare function routingSchemeToString(scheme: RoutingScheme): string;
//# sourceMappingURL=RoutingScheme.d.ts.map