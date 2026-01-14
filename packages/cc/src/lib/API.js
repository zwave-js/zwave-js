import { CommandClasses, NODE_ID_BROADCAST, NODE_ID_BROADCAST_LR, NOT_KNOWN, ZWaveError, ZWaveErrorCodes, getCCName, stripUndefined, } from "@zwave-js/core";
import { getEnumMemberName, getErrorMessage, num2hex, } from "@zwave-js/shared";
import { isArray } from "alcalzone-shared/typeguards";
import { getAPI, getCCValues, getCommandClass, getImplementedVersion, } from "./CommandClassDecorators.js";
/** Used to identify the method on the CC API class that handles setting values on nodes directly */
export const SET_VALUE = Symbol.for("CCAPI_SET_VALUE");
export const SET_VALUE_HOOKS = Symbol.for("CCAPI_SET_VALUE_HOOKS");
/** Used to identify the method on the CC API class that handles polling values from nodes */
export const POLL_VALUE = Symbol.for("CCAPI_POLL_VALUE");
// Since the setValue API is called from a point with very generic parameters,
// we must do narrowing inside the API calls. These three methods are for convenience
export function throwUnsupportedProperty(cc, property) {
    throw new ZWaveError(`${CommandClasses[cc]}: "${property}" is not a supported property`, ZWaveErrorCodes.Argument_Invalid);
}
export function throwUnsupportedPropertyKey(cc, property, propertyKey) {
    throw new ZWaveError(`${CommandClasses[cc]}: "${propertyKey}" is not a supported property key for property "${property}"`, ZWaveErrorCodes.Argument_Invalid);
}
export function throwMissingPropertyKey(cc, property) {
    throw new ZWaveError(`${CommandClasses[cc]}: property "${property}" requires a property key, but none was given`, ZWaveErrorCodes.Argument_Invalid);
}
export function throwWrongValueType(cc, property, expectedType, receivedType) {
    throw new ZWaveError(`${CommandClasses[cc]}: "${property}" must be of type "${expectedType}", received "${receivedType}"`, ZWaveErrorCodes.Argument_Invalid);
}
/**
 * The base class for all CC APIs exposed via `Node.commandClasses.<CCName>`
 * @publicAPI
 */
export class CCAPI {
    host;
    endpoint;
    constructor(host, endpoint) {
        this.host = host;
        this.endpoint = endpoint;
        this.ccId = getCommandClass(this);
    }
    static create(ccId, host, endpoint, requireSupport) {
        const APIConstructor = getAPI(ccId);
        const ccName = CommandClasses[ccId];
        if (APIConstructor == undefined) {
            throw new ZWaveError(`Command Class ${ccName} (${num2hex(ccId)}) has no associated API!`, ZWaveErrorCodes.CC_NoAPI);
        }
        const apiInstance = new APIConstructor(host, endpoint);
        // Only require support for physical endpoints by default
        requireSupport ??= !endpoint.virtual;
        if (requireSupport) {
            // @ts-expect-error TS doesn't like assigning to conditional types
            return new Proxy(apiInstance, {
                get: (target, property) => {
                    // Forbid access to the API if it is not supported by the node
                    if (property !== "ccId"
                        && property !== "endpoint"
                        && property !== "isSupported"
                        && property !== "withOptions"
                        && property !== "commandOptions"
                        && !target.isSupported()) {
                        let messageStart;
                        if (endpoint.virtual) {
                            const hasNodeId = typeof endpoint.nodeId === "number"
                                && endpoint.nodeId !== NODE_ID_BROADCAST
                                && endpoint.nodeId !== NODE_ID_BROADCAST_LR;
                            messageStart = `${hasNodeId ? "The" : "This"} virtual node${hasNodeId ? ` ${endpoint.nodeId}` : ""}`;
                        }
                        else {
                            messageStart = `Node ${endpoint.nodeId}`;
                        }
                        throw new ZWaveError(`${messageStart}${endpoint.index === 0
                            ? ""
                            : ` (endpoint ${endpoint.index})`} does not support the Command Class ${ccName}!`, ZWaveErrorCodes.CC_NotSupported);
                    }
                    // If a device config defines overrides for an API call, return a wrapper method that applies them first before calling the actual method
                    const fallback = target[property];
                    if (typeof property === "string"
                        && !endpoint.virtual
                        && typeof fallback === "function") {
                        const overrides = host.getDeviceConfig?.(endpoint.nodeId)?.compat?.overrideQueries;
                        if (overrides?.hasOverride(ccId)) {
                            return overrideQueriesWrapper(host, endpoint, ccId, property, overrides, fallback);
                        }
                    }
                    // Else just access the property
                    return fallback;
                },
            });
        }
        else {
            // @ts-expect-error TS doesn't like assigning to conditional types
            return apiInstance;
        }
    }
    /**
     * The identifier of the Command Class this API is for
     */
    ccId;
    get [SET_VALUE]() {
        return undefined;
    }
    /**
     * Can be used on supported CC APIs to set a CC value by property name (and optionally the property key).
     * **WARNING:** This function is NOT bound to an API instance. It must be called with the correct `this` context!
     */
    get setValue() {
        return this[SET_VALUE];
    }
    [SET_VALUE_HOOKS];
    /**
     * Can be implemented by CC APIs to influence the behavior of the setValue API in regards to Supervision and verifying values.
     */
    get setValueHooks() {
        return this[SET_VALUE_HOOKS];
    }
    /** Whether a successful setValue call should imply that the value was successfully updated */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    isSetValueOptimistic(valueId) {
        return true;
    }
    get [POLL_VALUE]() {
        return undefined;
    }
    /**
     * Can be used on supported CC APIs to poll a CC value by property name (and optionally the property key)
     * **WARNING:** This function is NOT bound to an API instance. It must be called with the correct `this` context!
     */
    get pollValue() {
        return this[POLL_VALUE];
    }
    /**
     * Schedules a value to be polled after a given time. Schedules are deduplicated on a per-property basis.
     * @returns `true` if the poll was scheduled, `false` otherwise
     */
    schedulePoll({ property, propertyKey }, expectedValue, { duration, transition = "slow" } = {}) {
        // Figure out the delay. If a non-zero duration was given or this is a "fast" transition,
        // use/add the short delay. Otherwise, default to the long delay.
        const durationMs = duration?.toMilliseconds() ?? 0;
        const timeouts = this.host.getRefreshValueTimeouts();
        const additionalDelay = !!durationMs || transition === "fast"
            ? timeouts.refreshValueAfterTransition
            : timeouts.refreshValue;
        const timeoutMs = durationMs + additionalDelay;
        if (this.isSinglecast()) {
            const node = this.host.getNode(this.endpoint.nodeId);
            if (!node)
                return false;
            return this.host.schedulePoll(node.id, {
                commandClass: this.ccId,
                endpoint: this.endpoint.index,
                property,
                propertyKey,
            }, { timeoutMs, expectedValue });
        }
        else if (this.isMulticast()) {
            // Only poll supporting nodes in multicast
            const supportingNodes = this.endpoint.node.physicalNodes.filter((node) => node
                .getEndpoint(this.endpoint.index)
                ?.supportsCC(this.ccId));
            let ret = false;
            for (const node of supportingNodes) {
                ret ||= this.host.schedulePoll(node.id, {
                    commandClass: this.ccId,
                    endpoint: this.endpoint.index,
                    property,
                    propertyKey,
                }, { timeoutMs, expectedValue });
            }
            return ret;
        }
        else {
            // Don't poll the broadcast node
            return false;
        }
    }
    /**
     * Retrieves the version of the given CommandClass this endpoint implements
     */
    get version() {
        if (this.isSinglecast()) {
            return this.host.getSafeCCVersion(this.ccId, this.endpoint.nodeId, this.endpoint.index) ?? 0;
        }
        else {
            return getImplementedVersion(this.ccId);
        }
    }
    /** Determines if this simplified API instance may be used. */
    isSupported() {
        return (
        // NoOperation is always supported
        this.ccId === CommandClasses["No Operation"]
            // Basic should always be supported. Since we are trying to hide it from library consumers
            // we cannot trust supportsCC to test it
            || this.ccId === CommandClasses.Basic
            || this.endpoint.supportsCC(this.ccId));
    }
    /**
     * Determine whether the linked node supports a specific command of this command class.
     * {@link NOT_KNOWN} (`undefined`) means that the information has not been received yet
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    supportsCommand(command) {
        // This needs to be overwritten per command class. In the default implementation, we don't know anything!
        return NOT_KNOWN;
    }
    assertSupportsCommand(commandEnum, command) {
        if (this.supportsCommand(command) !== true) {
            throw new ZWaveError(`${this.isSinglecast()
                ? `Node #${this.endpoint.nodeId}`
                : "This virtual node"}${this.endpoint.index > 0
                ? ` (Endpoint ${this.endpoint.index})`
                : ""} does not support the command ${getEnumMemberName(commandEnum, command)}!`, ZWaveErrorCodes.CC_NotSupported);
        }
    }
    assertPhysicalEndpoint(endpoint) {
        if (endpoint.virtual) {
            throw new ZWaveError(`This method is not supported for virtual nodes!`, ZWaveErrorCodes.CC_NotSupported);
        }
    }
    /** Returns the command options to use for sendCommand calls */
    get commandOptions() {
        // No default options
        return {};
    }
    /** Creates an instance of this API, scoped to use the given options */
    withOptions(options) {
        const mergedOptions = {
            ...this.commandOptions,
            ...options,
        };
        return new Proxy(this, {
            get: (target, property) => {
                if (property === "commandOptions") {
                    return mergedOptions;
                }
                else {
                    return target[property];
                }
            },
        });
    }
    /** Creates an instance of this API which (if supported) will return TX reports along with the result. */
    withTXReport() {
        if (this.constructor === CCAPI) {
            throw new ZWaveError("The withTXReport method may only be called on specific CC API implementations.", ZWaveErrorCodes.Driver_NotSupported);
        }
        // Remember which properties need to be proxied
        const proxiedProps = new Set([
            // These are the CC-specific methods
            ...Object.getOwnPropertyNames(this.constructor.prototype),
            // as well as setValue and pollValue
            "setValue",
            "pollValue",
        ]);
        proxiedProps.delete("constructor");
        function wrapResult(result, txReport) {
            // Both the result and the TX report may be undefined (no response, no support)
            return stripUndefined({
                result,
                txReport,
            });
        }
        return new Proxy(this, {
            get: (target, prop) => {
                if (prop === "withTXReport")
                    return undefined;
                let original = target[prop];
                if (proxiedProps.has(prop)
                    && typeof original === "function") {
                    // This is a method that only exists in the specific implementation
                    // Wrap each call with its own API proxy, so we don't mix up TX reports
                    let txReport;
                    const api = target.withOptions({
                        onTXReport: (report) => {
                            // Remember the last status report
                            txReport = report;
                        },
                    });
                    original = api[prop].bind(api);
                    // Return a wrapper function that will add the status report after the call is complete
                    return (...args) => {
                        let result = original(...args);
                        if (result instanceof Promise) {
                            result = result.then((res) => wrapResult(res, txReport));
                        }
                        else {
                            result = wrapResult(result, txReport);
                        }
                        return result;
                    };
                }
                else {
                    return original;
                }
            },
        });
    }
    isSinglecast() {
        return (!this.endpoint.virtual
            && typeof this.endpoint.nodeId === "number"
            && this.endpoint.nodeId !== NODE_ID_BROADCAST
            && this.endpoint.nodeId !== NODE_ID_BROADCAST_LR);
    }
    isMulticast() {
        return this.endpoint.virtual && isArray(this.endpoint.nodeId);
    }
    isBroadcast() {
        return (this.endpoint.virtual
            && (this.endpoint.nodeId === NODE_ID_BROADCAST
                || this.endpoint.nodeId === NODE_ID_BROADCAST_LR));
    }
    /** Returns the value DB for this CC API's node (if it can be safely accessed) */
    tryGetValueDB() {
        if (!this.isSinglecast())
            return;
        try {
            return this.host.getValueDB(this.endpoint.nodeId);
        }
        catch {
            return;
        }
    }
    /** Returns the value DB for this CC's node (or throws if it cannot be accessed) */
    getValueDB() {
        if (this.isSinglecast()) {
            try {
                return this.host.getValueDB(this.endpoint.nodeId);
            }
            catch {
                throw new ZWaveError("The node for this CC does not exist or the driver is not ready yet", ZWaveErrorCodes.Driver_NotReady);
            }
        }
        throw new ZWaveError("Cannot retrieve the value DB for non-singlecast CCs", ZWaveErrorCodes.CC_NoNodeID);
    }
}
function overrideQueriesWrapper(ctx, endpoint, ccId, method, overrides, fallback) {
    // We must not capture the `this` context here, because the API methods are bound on use
    return function (...args) {
        const match = overrides.matchOverride(ccId, endpoint.index, method, args);
        if (!match)
            return fallback.call(this, ...args);
        ctx.logNode(endpoint.nodeId, {
            message: `API call ${method} for ${getCCName(ccId)} CC overridden by a compat flag.`,
            level: "debug",
            direction: "none",
        });
        const ccValues = getCCValues(ccId);
        if (ccValues) {
            const valueDB = ctx.getValueDB(endpoint.nodeId);
            const prop2value = (prop) => {
                // We use a simplistic parser to support dynamic value IDs:
                // If end with round brackets with something inside, they are considered dynamic
                // Otherwise static
                const argsMatch = prop.match(/^(.*)\((.*)\)$/);
                if (argsMatch) {
                    const methodName = argsMatch[1];
                    const methodArgs = JSON.parse(`[${argsMatch[2]}]`);
                    const dynValue = ccValues[methodName];
                    if (typeof dynValue === "function") {
                        return dynValue(...methodArgs);
                    }
                }
                else {
                    const staticValue = ccValues[prop];
                    if (typeof staticValue?.endpoint === "function") {
                        return staticValue;
                    }
                }
            };
            // Persist values if necessary
            if (match.persistValues) {
                for (const [prop, value] of Object.entries(match.persistValues)) {
                    try {
                        const ccValue = prop2value(prop);
                        if (ccValue) {
                            valueDB.setValue(ccValue.endpoint(endpoint.index), value);
                        }
                        else {
                            ctx.logNode(endpoint.nodeId, {
                                message: `Failed to persist value ${prop} during overridden API call: value does not exist`,
                                level: "error",
                                direction: "none",
                            });
                        }
                    }
                    catch (e) {
                        ctx.logNode(endpoint.nodeId, {
                            message: `Failed to persist value ${prop} during overridden API call: ${getErrorMessage(e)}`,
                            level: "error",
                            direction: "none",
                        });
                    }
                }
            }
            // As well as metadata
            if (match.extendMetadata) {
                for (const [prop, meta] of Object.entries(match.extendMetadata)) {
                    try {
                        const ccValue = prop2value(prop);
                        if (ccValue) {
                            valueDB.setMetadata(ccValue.endpoint(endpoint.index), {
                                ...ccValue.meta,
                                ...meta,
                            });
                        }
                        else {
                            ctx.logNode(endpoint.nodeId, {
                                message: `Failed to extend value metadata ${prop} during overridden API call: value does not exist`,
                                level: "error",
                                direction: "none",
                            });
                        }
                    }
                    catch (e) {
                        ctx.logNode(endpoint.nodeId, {
                            message: `Failed to extend value metadata ${prop} during overridden API call: ${getErrorMessage(e)}`,
                            level: "error",
                            direction: "none",
                        });
                    }
                }
            }
        }
        // API methods are always async
        return Promise.resolve(match.result);
    };
}
/** A CC API that is only available for physical endpoints */
export class PhysicalCCAPI extends CCAPI {
    constructor(host, endpoint) {
        super(host, endpoint);
        this.assertPhysicalEndpoint(endpoint);
    }
}
export function normalizeCCNameOrId(ccNameOrId) {
    if (!(ccNameOrId in CommandClasses))
        return undefined;
    let ret;
    if (typeof ccNameOrId === "string") {
        if (/^\d+$/.test(ccNameOrId)) {
            // This can happen on property access
            ret = +ccNameOrId;
        }
        else if (typeof CommandClasses[ccNameOrId] === "number") {
            ret = CommandClasses[ccNameOrId];
        }
    }
    else {
        ret = ccNameOrId;
    }
    return ret;
}
//# sourceMappingURL=API.js.map