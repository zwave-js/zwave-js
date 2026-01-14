import { ZWaveDataRate } from "./Protocol.js";
export declare enum RouteKind {
    None = 0,
    /** Last Working Route */
    LWR = 1,
    /** Next to Last Working Route */
    NLWR = 2,
    /** Application-defined priority route */
    Application = 16
}
export interface Route {
    repeaters: number[];
    routeSpeed: ZWaveDataRate;
}
export declare const EMPTY_ROUTE: Route;
export declare function isEmptyRoute(route: Route): boolean;
/** How many repeaters can appear in a route */
export declare const MAX_REPEATERS = 4;
//# sourceMappingURL=Route.d.ts.map