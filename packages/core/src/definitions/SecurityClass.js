export var SecurityClass;
(function (SecurityClass) {
    /**
     * Used internally during inclusion of a node. Don't use this!
     */
    SecurityClass[SecurityClass["Temporary"] = -2] = "Temporary";
    /**
     * `None` is used to indicate that a node is included without security.
     * It is not meant as input to methods that accept a security class.
     */
    SecurityClass[SecurityClass["None"] = -1] = "None";
    SecurityClass[SecurityClass["S2_Unauthenticated"] = 0] = "S2_Unauthenticated";
    SecurityClass[SecurityClass["S2_Authenticated"] = 1] = "S2_Authenticated";
    SecurityClass[SecurityClass["S2_AccessControl"] = 2] = "S2_AccessControl";
    SecurityClass[SecurityClass["S0_Legacy"] = 7] = "S0_Legacy";
})(SecurityClass || (SecurityClass = {}));
/** Tests if the given security class is S2 */
export function securityClassIsS2(secClass) {
    return (secClass != undefined
        && secClass >= SecurityClass.S2_Unauthenticated
        && secClass <= SecurityClass.S2_AccessControl);
}
/** Tests if the given security class is valid for use with Z-Wave LR */
export function securityClassIsLongRange(secClass) {
    return (secClass === SecurityClass.S2_AccessControl
        || secClass === SecurityClass.S2_Authenticated);
}
/** An array of security classes, ordered from high (index 0) to low (index > 0) */
export const securityClassOrder = [
    SecurityClass.S2_AccessControl,
    SecurityClass.S2_Authenticated,
    SecurityClass.S2_Unauthenticated,
    SecurityClass.S0_Legacy,
];
export function getHighestSecurityClass(securityClasses) {
    for (const cls of securityClassOrder) {
        if (securityClasses.includes(cls))
            return cls;
    }
    return SecurityClass.None;
}
//# sourceMappingURL=SecurityClass.js.map