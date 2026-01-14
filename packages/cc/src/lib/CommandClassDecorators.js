import { ZWaveError, ZWaveErrorCodes, } from "@zwave-js/core";
import { createReflectionDecorator, createReflectionDecoratorPair, createValuelessReflectionDecorator, } from "@zwave-js/core/reflection";
const CCAndCommandDecorator = createReflectionDecoratorPair({ superName: "ccId", subName: "ccCommand" });
/**
 * @publicAPI
 * Defines the CC ID associated with a Z-Wave Command Class
 */
export const commandClass = CCAndCommandDecorator.superDecorator;
/**
 * @publicAPI
 * Looks up the command class constructor for a given CC ID
 */
export const getCCConstructor = CCAndCommandDecorator.lookupSuperConstructor;
/**
 * @publicAPI
 * Defines the CC command a subclass of a CC implements
 */
export const CCCommand = CCAndCommandDecorator.subDecorator;
/**
 * @publicAPI
 * Retrieves the CC command a subclass of a CC implements
 */
export const getCCCommand = CCAndCommandDecorator.lookupSubValue;
/**
 * @publicAPI
 * Looks up the command class constructor for a given CC ID and command
 */
export const getCCCommandConstructor = CCAndCommandDecorator.lookupSubConstructor;
/**
 * @publicAPI
 * Retrieves the CC ID defined for a Z-Wave Command Class
 */
export function getCommandClassStatic(classConstructor) {
    // retrieve the current metadata
    const ret = CCAndCommandDecorator.lookupSuperValueStatic(classConstructor);
    if (ret == undefined) {
        throw new ZWaveError(`No command class defined for ${classConstructor.name}!`, ZWaveErrorCodes.CC_Invalid);
    }
    return ret;
}
const apiDecorator = createReflectionDecorator({
    name: "API",
    valueFromArgs: (cc) => cc,
});
/**
 * @publicAPI
 * Defines the CC ID a CC API implementation belongs to
 */
export const API = apiDecorator.decorator;
/**
 * @publicAPI
 * Retrieves the CC API constructor that is defined for a Z-Wave CC ID
 */
export function getAPI(cc) {
    return apiDecorator.lookupConstructorByValue(cc);
}
/**
 * @publicAPI
 * Retrieves the CC ID associated with a Z-Wave Command Class or CC API
 */
export function getCommandClass(cc) {
    // get the class constructor
    const constr = cc.constructor;
    // retrieve the current metadata
    const ret = CCAndCommandDecorator.lookupSuperValueStatic(constr)
        ?? apiDecorator.lookupValueStatic(constr);
    if (ret == undefined) {
        throw new ZWaveError(`No command class defined for ${constr.name}!`, ZWaveErrorCodes.CC_Invalid);
    }
    return ret;
}
const implementedVersionDecorator = createReflectionDecorator({
    name: "implementedVersion",
    valueFromArgs: (version) => version,
    constructorLookupKey: false,
});
/**
 * @publicAPI
 * Defines the implemented version of a Z-Wave command class
 */
export const implementedVersion = implementedVersionDecorator.decorator;
/**
 * @publicAPI
 * Retrieves the implemented version defined for a Z-Wave command class
 */
export function getImplementedVersion(cc) {
    // get the class constructor
    let constr;
    if (typeof cc === "number") {
        constr = getCCConstructor(cc);
    }
    else {
        constr = cc.constructor;
    }
    if (!constr)
        return 0;
    return implementedVersionDecorator.lookupValueStatic(constr) ?? 0;
}
/**
 * @publicAPI
 * Retrieves the implemented version defined for a Z-Wave command class
 */
export function getImplementedVersionStatic(classConstructor) {
    return implementedVersionDecorator.lookupValueStatic(classConstructor) ?? 0;
}
const expectedCCResponseDecorator = createReflectionDecorator({
    name: "expectedCCResponse",
    valueFromArgs: (cc, predicate) => ({ cc, predicate }),
    // We don't need reverse lookup
    constructorLookupKey: false,
});
/**
 * @publicAPI
 * Defines the expected response associated with a Z-Wave message
 */
export function expectedCCResponse(cc, predicate) {
    return expectedCCResponseDecorator.decorator(cc, predicate);
}
/**
 * @publicAPI
 * Retrieves the expected response (static or dynamic) defined for a Z-Wave message class
 */
export function getExpectedCCResponse(ccClass) {
    return expectedCCResponseDecorator.lookupValue(ccClass)?.cc;
}
/**
 * @publicAPI
 * Retrieves the CC response predicate defined for a Z-Wave message class
 */
export function getCCResponsePredicate(ccClass) {
    return expectedCCResponseDecorator.lookupValue(ccClass)?.predicate;
}
const ccValuesDecorator = createReflectionDecorator({
    name: "ccValues",
    valueFromArgs: (valueDefinition) => valueDefinition,
    // We don't need reverse lookup
    constructorLookupKey: false,
});
/**
 * @publicAPI
 * Defines which CC value definitions belong to a Z-Wave command class
 */
export const ccValues = ccValuesDecorator.decorator;
/**
 * @publicAPI
 * Retrieves the CC value definitions which belong to a Z-Wave command class
 */
export function getCCValues(cc) {
    // get the class constructor
    let constr;
    if (typeof cc === "number") {
        constr = getCCConstructor(cc);
    }
    else {
        constr = cc.constructor;
    }
    if (constr)
        return ccValuesDecorator.lookupValueStatic(constr);
}
const ccValue_METADATA = Symbol.for(`METADATA_ccValue`);
/**
 * @publicAPI
 * Defines which CC values the properties of a Z-Wave Command Class correspond to
 */
export function ccValueProperty(property, ...args) {
    return function decorator_ccValueProperty(constr) {
        // retrieve the current metadata
        const metadata = Reflect.getMetadata(ccValue_METADATA, constr) ?? new Map();
        // Determine the correct metadata
        let valueOrFactory;
        if (args.length === 1) {
            valueOrFactory = args[0];
        }
        else {
            const [value, getArgs] = args;
            valueOrFactory = (self) => {
                const args = getArgs(self);
                const base = value(...args);
                return {
                    ...base,
                    is: value.is,
                    options: value.options,
                };
            };
        }
        // Add the metadata
        metadata.set(property, valueOrFactory);
        // And store it back
        Reflect.defineMetadata(ccValue_METADATA, metadata, constr);
    };
}
/**
 * @publicAPI
 * Retrieves the defined mapping between properties and CC values of a Z-Wave command class instance
 */
export function getCCValueProperties(target) {
    return (Reflect.getMetadata(ccValue_METADATA, target.constructor) ?? new Map());
}
// const ccValueDecorator = createPropertyReflectionDecorator<
// 	CommandClass,
// 	[value: StaticCCValue | StaticCCValueFactory<CommandClass>],
// 	StaticCCValue | StaticCCValueFactory<CommandClass>
// >({
// 	name: "ccValue",
// 	valueFromArgs: (valueDefinition) => valueDefinition,
// });
// /**
//  * @publicAPI
//  * Defines which CC value a Z-Wave command class property belongs to
//  */
// export const ccValue = ccValueDecorator.decorator;
// /**
//  * @publicAPI
//  * Retrieves the defined mapping between properties and CC values of a Z-Wave command class instance
//  */
// export const getCCValueDefinitions = ccValueDecorator.lookupValues;
const supervisionDecorator = createValuelessReflectionDecorator({
    name: "useSupervision",
});
/**
 * @publicAPI
 * Defines that this CC may be sent supervised
 */
export const useSupervision = supervisionDecorator.decorator;
/**
 * @publicAPI
 * Checks if the given CC may be sent supervised
 */
export const shouldUseSupervision = supervisionDecorator.isDecorated;
//# sourceMappingURL=CommandClassDecorators.js.map