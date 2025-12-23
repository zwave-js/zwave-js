import { ZWaveDataRate } from "./Protocol.js";
export var RouteKind;
(function (RouteKind) {
    RouteKind[RouteKind["None"] = 0] = "None";
    /** Last Working Route */
    RouteKind[RouteKind["LWR"] = 1] = "LWR";
    /** Next to Last Working Route */
    RouteKind[RouteKind["NLWR"] = 2] = "NLWR";
    /** Application-defined priority route */
    RouteKind[RouteKind["Application"] = 16] = "Application";
})(RouteKind || (RouteKind = {}));
export const EMPTY_ROUTE = {
    repeaters: [],
    routeSpeed: ZWaveDataRate["9k6"],
};
export function isEmptyRoute(route) {
    return (route.repeaters.length === 0
        && route.routeSpeed === ZWaveDataRate["9k6"]);
}
/** How many repeaters can appear in a route */
export const MAX_REPEATERS = 4;
//# sourceMappingURL=Route.js.map