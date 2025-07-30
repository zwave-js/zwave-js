import { CommandClass } from "./CommandClass.js";
export type EncapsulatedCommandClass = CommandClass & {
    encapsulatingCC: EncapsulatingCommandClass;
};
export type EncapsulatingCommandClass = CommandClass & {
    encapsulated: EncapsulatedCommandClass;
};
/**
 * Tests if a given CC statically implements the EncapsulatingCommandClassStatic interface
 * @param cc The command class instance to test
 */
export declare function isEncapsulatingCommandClass(cc: any): cc is CommandClass & EncapsulatingCommandClass;
export declare function getInnermostCommandClass(cc: CommandClass): CommandClass;
export interface MultiEncapsulatingCommandClass {
    encapsulated: EncapsulatedCommandClass[];
}
/**
 * Tests if a given CC statically implements the EncapsulatingCommandClassStatic interface
 * @param cc The command class instance to test
 */
export declare function isMultiEncapsulatingCommandClass(cc: any): cc is CommandClass & MultiEncapsulatingCommandClass;
//# sourceMappingURL=EncapsulatingCommandClass.d.ts.map