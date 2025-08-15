import { isArray } from "alcalzone-shared/typeguards";
import { CommandClass } from "./CommandClass.js";
/**
 * Tests if a given CC statically implements the EncapsulatingCommandClassStatic interface
 * @param cc The command class instance to test
 */
export function isEncapsulatingCommandClass(cc) {
    // To satisfy the criterion, cc must be a CommandClass
    if (!(cc instanceof CommandClass))
        return false;
    // The encapsulated property must be a CommandClass
    if (!(cc.encapsulated instanceof CommandClass)) {
        return false;
    }
    // Walk up the static side of the prototype chain to see if it has the required methods
    let proto = Object.getPrototypeOf(cc.constructor);
    while (proto) {
        if (typeof proto.encapsulate === "function") {
            return true;
        }
        proto = Object.getPrototypeOf(proto);
    }
    return false;
}
export function getInnermostCommandClass(cc) {
    if (isEncapsulatingCommandClass(cc)) {
        return getInnermostCommandClass(cc.encapsulated);
    }
    else {
        return cc;
    }
}
/**
 * Tests if a given CC statically implements the EncapsulatingCommandClassStatic interface
 * @param cc The command class instance to test
 */
export function isMultiEncapsulatingCommandClass(cc) {
    // To satisfy the criterion, cc must be a CommandClass
    if (!(cc instanceof CommandClass))
        return false;
    // The encapsulated property must  array of CCs
    if (!(isArray(cc.encapsulated)
        && cc.encapsulated.every((item) => item instanceof CommandClass))) {
        return false;
    }
    // Walk up the static side of the prototype chain to see if it has the required methods
    let proto = Object.getPrototypeOf(cc.constructor);
    while (proto) {
        if (typeof proto.encapsulate === "function") {
            return true;
        }
        proto = Object.getPrototypeOf(proto);
    }
    return false;
}
//# sourceMappingURL=EncapsulatingCommandClass.js.map