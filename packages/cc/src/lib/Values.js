import { evalOrStatic, } from "@zwave-js/shared";
import { CCValues } from "../cc/_CCValues.generated.js";
function defineCCValues(commandClass, _) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore I know what I'm doing!
    return CCValues[commandClass];
}
export const defaultCCValueOptions = {
    internal: false,
    minVersion: 1,
    secret: false,
    stateful: true,
    supportsEndpoints: true,
    autoCreate: true,
};
// Namespace for utilities to define CC values
export const V = {
    /** Returns a CC value definition that is named like the value `property` */
    staticProperty(property, meta, options) {
        return {
            [property]: {
                property,
                meta,
                options,
            },
        };
    },
    /** Returns a CC value definition with the given name and `property` */
    staticPropertyWithName(name, property, meta, options) {
        return {
            [name]: {
                property,
                meta,
                options,
            },
        };
    },
    /** Returns a CC value definition with the given name, `property` and `propertyKey` */
    staticPropertyAndKeyWithName(name, property, propertyKey, meta, options) {
        return {
            [name]: {
                property,
                propertyKey,
                meta,
                options,
            },
        };
    },
    /** Returns a CC value definition with the given name and a dynamic `property` */
    dynamicPropertyWithName(name, property, is, meta, options) {
        return {
            [name]: Object.assign((...args) => ({
                property: evalOrStatic(property, ...args),
                meta: evalOrStatic(meta, ...args),
            }), { is, options }),
        };
    },
    /** Returns a CC value definition with the given name and a dynamic `property` */
    dynamicPropertyAndKeyWithName(name, property, propertyKey, is, meta, options) {
        return {
            [name]: Object.assign((...args) => {
                return {
                    property: evalOrStatic(property, ...args),
                    propertyKey: evalOrStatic(propertyKey, ...args),
                    meta: evalOrStatic(meta, ...args),
                };
            }, { is, options }),
        };
    },
    defineCCValues,
};
//# sourceMappingURL=Values.js.map