import { num2hex } from "@zwave-js/shared";
/**
 * How the controller transmitted a frame to a node.
 */
export var RoutingScheme;
(function (RoutingScheme) {
    RoutingScheme[RoutingScheme["Idle"] = 0] = "Idle";
    RoutingScheme[RoutingScheme["Direct"] = 1] = "Direct";
    RoutingScheme[RoutingScheme["Priority"] = 2] = "Priority";
    RoutingScheme[RoutingScheme["LWR"] = 3] = "LWR";
    RoutingScheme[RoutingScheme["NLWR"] = 4] = "NLWR";
    RoutingScheme[RoutingScheme["Auto"] = 5] = "Auto";
    RoutingScheme[RoutingScheme["ResortDirect"] = 6] = "ResortDirect";
    RoutingScheme[RoutingScheme["Explore"] = 7] = "Explore";
})(RoutingScheme || (RoutingScheme = {}));
/**
 * Converts a routing scheme value to a human readable format.
 */
export function routingSchemeToString(scheme) {
    switch (scheme) {
        case RoutingScheme.Idle:
            return "Idle";
        case RoutingScheme.Direct:
            return "Direct";
        case RoutingScheme.Priority:
            return "Priority Route";
        case RoutingScheme.LWR:
            return "LWR";
        case RoutingScheme.NLWR:
            return "NLWR";
        case RoutingScheme.Auto:
            return "Auto Route";
        case RoutingScheme.ResortDirect:
            return "Resort to Direct";
        case RoutingScheme.Explore:
            return "Explorer Frame";
        default:
            return `Unknown (${num2hex(scheme)})`;
    }
}
//# sourceMappingURL=RoutingScheme.js.map