import "reflect-metadata";
/** Creates a reflection decorator and corresponding methods for reverse lookup of values and constructors */
export function createReflectionDecorator({ name, valueFromArgs, 
// getConstructorLookupTarget,
constructorLookupKey, }) {
    const key = Symbol.for(`METADATA_${name}`);
    const mapKey = Symbol.for(`METADATA_MAP_${name}`);
    const lookupTarget = Object.create(null);
    const grp = {
        decorator: (...args) => {
            const value = valueFromArgs(...args);
            function body(target, _context) {
                Reflect.defineMetadata(key, value, target);
                if (constructorLookupKey === false)
                    return;
                const reverseLookupKey = constructorLookupKey?.(target, ...args)
                    ?? String(value);
                // Store the constructor on the reverse lookup target
                const map = Reflect.getMetadata(mapKey, lookupTarget) || new Map();
                map.set(reverseLookupKey, target);
                Reflect.defineMetadata(mapKey, map, lookupTarget);
            }
            // Rename the decorator body so it is easier to identify in stack traces
            Object.defineProperty(body, "name", {
                value: "decoratorBody_" + name,
            });
            return body;
        },
        lookupValue: (target) => {
            return Reflect.getMetadata(key, target.constructor);
        },
        lookupValueStatic: (constr) => {
            return Reflect.getMetadata(key, constr);
        },
        lookupConstructorByValue: (value) => {
            if (constructorLookupKey === false) {
                throw new Error("Constructor lookup is disabled for this decorator!");
            }
            else if (constructorLookupKey) {
                throw new Error("Cannot lookup constructor by value when constructorLookupKey is used");
            }
            else {
                return grp.lookupConstructorByKey(String(value));
            }
        },
        lookupConstructorByKey: (key) => {
            if (constructorLookupKey === false) {
                throw new Error("Constructor lookup is disabled for this decorator!");
            }
            const map = Reflect.getMetadata(mapKey, lookupTarget);
            return map?.get(key);
        },
    };
    // Rename the decorator functions so they are easier to identify in stack traces
    for (const property of [
        "decorator",
        "lookupValue",
        "lookupValueStatic",
        "lookupConstructorByValue",
        "lookupConstructorByKey",
    ]) {
        grp[property] = Object.defineProperty(grp[property], "name", {
            value: `${property}_${name}`,
        });
    }
    return grp;
}
/**
 * Like {@link createReflectionDecorator}, but for single-value decorators. This has the advantage that the returned functions can be reused easier with named args.
 */
export function createSimpleReflectionDecorator({ name, }) {
    const decorator = createReflectionDecorator({
        name,
        valueFromArgs: (arg) => arg,
    });
    const ret = {
        decorator: decorator.decorator,
        lookupValue: decorator.lookupValue,
        lookupValueStatic: decorator.lookupValueStatic,
        lookupConstructor: decorator.lookupConstructorByValue,
    };
    return ret;
}
/**
 * Like {@link createReflectionDecorator}, but for valueless decorators.
 */
export function createValuelessReflectionDecorator({ name, }) {
    const decorator = createReflectionDecorator({
        name,
        valueFromArgs: () => true,
    });
    const ret = {
        decorator: decorator.decorator,
        isDecorated: (target) => !!decorator.lookupValue(target),
        isDecoratedStatic: (constr) => !!decorator.lookupValueStatic(constr),
    };
    return ret;
}
/**
 * Creates a pair of reflection decorators and corresponding methods for reverse lookup of values and constructors.
 * This pair is meant to decorate a super class and several of its subclasses
 */
export function createReflectionDecoratorPair({ superName, subName, }) {
    const superDecorator = createReflectionDecorator({
        name: superName,
        valueFromArgs: (arg) => arg,
    });
    const getLookupKey = (superArg, subArg) => {
        return JSON.stringify({ [superName]: superArg, [subName]: subArg });
    };
    const subDecorator = createReflectionDecorator({
        name: subName,
        valueFromArgs: (arg) => arg,
        constructorLookupKey: (target, subArg) => {
            const superArg = superDecorator.lookupValueStatic(target);
            return getLookupKey(superArg, subArg);
        },
    });
    const ret = {
        superDecorator: superDecorator.decorator,
        subDecorator: subDecorator.decorator,
        lookupSuperValue: superDecorator.lookupValue,
        lookupSubValue: subDecorator.lookupValue,
        lookupSuperValueStatic: superDecorator.lookupValueStatic,
        lookupSubValueStatic: subDecorator.lookupValueStatic,
        lookupSuperConstructor: superDecorator.lookupConstructorByValue,
        lookupSubConstructor: (...args) => {
            return subDecorator.lookupConstructorByKey(getLookupKey(args[0], args[1]));
        },
    };
    return ret;
}
//# sourceMappingURL=decorators.js.map