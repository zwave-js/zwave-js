import { type CommandClasses } from "@zwave-js/core";
import type { TypedClassDecorator } from "@zwave-js/shared";
import type { APIConstructor, CCAPI } from "./API.js";
import type { CCConstructor, CCResponsePredicate, CommandClass, DynamicCCResponse } from "./CommandClass.js";
import type { DynamicCCValue, StaticCCValue, StaticCCValueFactory } from "./Values.js";
/**
 * @publicAPI
 * Defines the CC ID associated with a Z-Wave Command Class
 */
export declare const commandClass: <TTarget extends typeof CommandClass>(ccId: CommandClasses) => TypedClassDecorator<TTarget>;
/**
 * @publicAPI
 * Looks up the command class constructor for a given CC ID
 */
export declare const getCCConstructor: (ccId: CommandClasses) => CCConstructor<CommandClass> | undefined;
/**
 * @publicAPI
 * Defines the CC command a subclass of a CC implements
 */
export declare const CCCommand: <TTarget extends typeof CommandClass>(ccCommand: number) => TypedClassDecorator<TTarget>;
/**
 * @publicAPI
 * Retrieves the CC command a subclass of a CC implements
 */
export declare const getCCCommand: (target: CommandClass) => number | undefined;
/**
 * @publicAPI
 * Looks up the command class constructor for a given CC ID and command
 */
export declare const getCCCommandConstructor: (ccId: CommandClasses, ccCommand: number) => CCConstructor<CommandClass> | undefined;
/**
 * @publicAPI
 * Retrieves the CC ID defined for a Z-Wave Command Class
 */
export declare function getCommandClassStatic<T extends CCConstructor<CommandClass>>(classConstructor: T): CommandClasses;
/**
 * @publicAPI
 * Defines the CC ID a CC API implementation belongs to
 */
export declare const API: <TTarget extends typeof CCAPI>(cc: CommandClasses) => TypedClassDecorator<TTarget>;
/**
 * @publicAPI
 * Retrieves the CC API constructor that is defined for a Z-Wave CC ID
 */
export declare function getAPI(cc: CommandClasses): APIConstructor | undefined;
/**
 * @publicAPI
 * Retrieves the CC ID associated with a Z-Wave Command Class or CC API
 */
export declare function getCommandClass(cc: CommandClass | CCAPI): CommandClasses;
/**
 * @publicAPI
 * Defines the implemented version of a Z-Wave command class
 */
export declare const implementedVersion: <TTarget extends typeof CommandClass>(version: number) => TypedClassDecorator<TTarget>;
/**
 * @publicAPI
 * Retrieves the implemented version defined for a Z-Wave command class
 */
export declare function getImplementedVersion<T extends CommandClass>(cc: T | CommandClasses): number;
/**
 * @publicAPI
 * Retrieves the implemented version defined for a Z-Wave command class
 */
export declare function getImplementedVersionStatic<T extends CCConstructor<CommandClass>>(classConstructor: T): number;
/**
 * @publicAPI
 * Defines the expected response associated with a Z-Wave message
 */
export declare function expectedCCResponse<TTarget extends typeof CommandClass, TSent extends CommandClass, TReceived extends CommandClass>(cc: CCConstructor<TReceived> | DynamicCCResponse<TSent, TReceived>, predicate?: CCResponsePredicate<TSent, TReceived>): TypedClassDecorator<TTarget>;
/**
 * @publicAPI
 * Retrieves the expected response (static or dynamic) defined for a Z-Wave message class
 */
export declare function getExpectedCCResponse<T extends CommandClass>(ccClass: T): typeof CommandClass | DynamicCCResponse<T> | undefined;
/**
 * @publicAPI
 * Retrieves the CC response predicate defined for a Z-Wave message class
 */
export declare function getCCResponsePredicate<T extends CommandClass>(ccClass: T): CCResponsePredicate<T> | undefined;
/**
 * @publicAPI
 * Defines which CC value definitions belong to a Z-Wave command class
 */
export declare const ccValues: <TTarget extends typeof CommandClass>(valueDefinition: Record<string, StaticCCValue | DynamicCCValue>) => TypedClassDecorator<TTarget>;
/**
 * @publicAPI
 * Retrieves the CC value definitions which belong to a Z-Wave command class
 */
export declare function getCCValues<T extends CommandClass>(cc: T | CommandClasses): Record<string, StaticCCValue | DynamicCCValue | undefined> | undefined;
export declare function ccValueProperty<Class extends abstract new (...args: any) => any>(property: keyof InstanceType<Class>, value: StaticCCValue): TypedClassDecorator<Class>;
export declare function ccValueProperty<Class extends abstract new (...args: any) => any, const TArgs extends any[]>(property: keyof InstanceType<Class>, value: DynamicCCValue<TArgs>, getArgs: (self: InstanceType<Class>) => TArgs): TypedClassDecorator<Class>;
/**
 * @publicAPI
 * Retrieves the defined mapping between properties and CC values of a Z-Wave command class instance
 */
export declare function getCCValueProperties<TTarget extends CommandClass>(target: TTarget): ReadonlyMap<string | number, StaticCCValue | StaticCCValueFactory<TTarget>>;
/**
 * @publicAPI
 * Defines that this CC may be sent supervised
 */
export declare const useSupervision: <TTarget extends typeof CommandClass>() => TypedClassDecorator<TTarget>;
/**
 * @publicAPI
 * Checks if the given CC may be sent supervised
 */
export declare const shouldUseSupervision: (target: CommandClass) => boolean;
//# sourceMappingURL=CommandClassDecorators.d.ts.map