var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
import { CommandClasses, MessagePriority, SecurityClass, ValueMetadata, ZWaveError, ZWaveErrorCodes, ZWaveLibraryTypes, enumValuesToMetadataStates, getCCName, securityClassIsS2, securityClassOrder, validatePayload, } from "@zwave-js/core";
import { Bytes, getEnumMemberName, num2hex, pick } from "@zwave-js/shared";
import { validateArgs } from "@zwave-js/transformers";
import { CCAPI, PhysicalCCAPI } from "../lib/API.js";
import { CommandClass, } from "../lib/CommandClass.js";
import { API, CCCommand, ccValueProperty, ccValues, commandClass, expectedCCResponse, getImplementedVersion, implementedVersion, } from "../lib/CommandClassDecorators.js";
import { V } from "../lib/Values.js";
import { VersionCommand } from "../lib/_Types.js";
export const VersionCCValues = V.defineCCValues(CommandClasses.Version, {
    ...V.staticProperty("firmwareVersions", {
        ...ValueMetadata.ReadOnly,
        type: "string[]",
        label: "Z-Wave chip firmware versions",
    }, { supportsEndpoints: false }),
    ...V.staticProperty("libraryType", {
        ...ValueMetadata.ReadOnlyNumber,
        label: "Library type",
        states: enumValuesToMetadataStates(ZWaveLibraryTypes),
    }, { supportsEndpoints: false }),
    ...V.staticProperty("protocolVersion", {
        ...ValueMetadata.ReadOnlyString,
        label: "Z-Wave protocol version",
    }, { supportsEndpoints: false }),
    ...V.staticProperty("hardwareVersion", {
        ...ValueMetadata.ReadOnlyNumber,
        label: "Z-Wave chip hardware version",
    }, {
        minVersion: 2,
        supportsEndpoints: false,
    }),
    ...V.staticProperty("supportsZWaveSoftwareGet", undefined, {
        minVersion: 3,
        internal: true,
    }),
    ...V.staticProperty("sdkVersion", {
        ...ValueMetadata.ReadOnlyString,
        label: "SDK version",
    }, {
        minVersion: 3,
        supportsEndpoints: false,
    }),
    ...V.staticProperty("applicationFrameworkAPIVersion", {
        ...ValueMetadata.ReadOnlyString,
        label: "Z-Wave application framework API version",
    }, {
        minVersion: 3,
        supportsEndpoints: false,
    }),
    ...V.staticProperty("applicationFrameworkBuildNumber", {
        ...ValueMetadata.ReadOnlyString,
        label: "Z-Wave application framework API build number",
    }, {
        minVersion: 3,
        supportsEndpoints: false,
    }),
    ...V.staticPropertyWithName("serialAPIVersion", "hostInterfaceVersion", {
        ...ValueMetadata.ReadOnlyString,
        label: "Serial API version",
    }, {
        minVersion: 3,
        supportsEndpoints: false,
    }),
    ...V.staticPropertyWithName("serialAPIBuildNumber", "hostInterfaceBuildNumber", {
        ...ValueMetadata.ReadOnlyString,
        label: "Serial API build number",
    }, {
        minVersion: 3,
        supportsEndpoints: false,
    }),
    ...V.staticProperty("zWaveProtocolVersion", {
        ...ValueMetadata.ReadOnlyString,
        label: "Z-Wave protocol version",
    }, {
        minVersion: 3,
        supportsEndpoints: false,
    }),
    ...V.staticProperty("zWaveProtocolBuildNumber", {
        ...ValueMetadata.ReadOnlyString,
        label: "Z-Wave protocol build number",
    }, {
        minVersion: 3,
        supportsEndpoints: false,
    }),
    ...V.staticProperty("applicationVersion", {
        ...ValueMetadata.ReadOnlyString,
        label: "Application version",
    }, {
        minVersion: 3,
        supportsEndpoints: false,
    }),
    ...V.staticProperty("applicationBuildNumber", {
        ...ValueMetadata.ReadOnlyString,
        label: "Application build number",
    }, {
        minVersion: 3,
        supportsEndpoints: false,
    }),
});
function parseVersion(buffer) {
    if (buffer[0] === 0 && buffer[1] === 0 && buffer[2] === 0)
        return "unused";
    return `${buffer[0]}.${buffer[1]}.${buffer[2]}`;
}
// @noSetValueAPI This CC is read-only
let VersionCCAPI = (() => {
    let _classDecorators = [API(CommandClasses.Version)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = PhysicalCCAPI;
    let _instanceExtraInitializers = [];
    let _sendReport_decorators;
    let _getCCVersion_decorators;
    let _reportCCVersion_decorators;
    var VersionCCAPI = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _sendReport_decorators = [validateArgs()];
            _getCCVersion_decorators = [validateArgs()];
            _reportCCVersion_decorators = [validateArgs()];
            __esDecorate(this, null, _sendReport_decorators, { kind: "method", name: "sendReport", static: false, private: false, access: { has: obj => "sendReport" in obj, get: obj => obj.sendReport }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _getCCVersion_decorators, { kind: "method", name: "getCCVersion", static: false, private: false, access: { has: obj => "getCCVersion" in obj, get: obj => obj.getCCVersion }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(this, null, _reportCCVersion_decorators, { kind: "method", name: "reportCCVersion", static: false, private: false, access: { has: obj => "reportCCVersion" in obj, get: obj => obj.reportCCVersion }, metadata: _metadata }, null, _instanceExtraInitializers);
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            VersionCCAPI = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        supportsCommand(cmd) {
            switch (cmd) {
                case VersionCommand.Get:
                case VersionCommand.Report:
                case VersionCommand.CommandClassGet:
                case VersionCommand.CommandClassReport:
                    return true; // This is mandatory
                case VersionCommand.CapabilitiesGet:
                case VersionCommand.CapabilitiesReport:
                case VersionCommand.ZWaveSoftwareReport:
                    return this.version >= 3;
                case VersionCommand.ZWaveSoftwareGet: {
                    return this.getValueDB().getValue(VersionCCValues.supportsZWaveSoftwareGet.endpoint(this.endpoint.index));
                }
            }
            return super.supportsCommand(cmd);
        }
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        async get() {
            this.assertSupportsCommand(VersionCommand, VersionCommand.Get);
            const cc = new VersionCCGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, [
                    "libraryType",
                    "protocolVersion",
                    "firmwareVersions",
                    "hardwareVersion",
                ]);
            }
        }
        async sendReport(options) {
            this.assertSupportsCommand(VersionCommand, VersionCommand.Report);
            const cc = new VersionCCReport({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                ...options,
            });
            await this.host.sendCommand(cc, this.commandOptions);
        }
        async getCCVersion(requestedCC) {
            this.assertSupportsCommand(VersionCommand, VersionCommand.CommandClassGet);
            const cc = new VersionCCCommandClassGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                requestedCC,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            return response?.ccVersion;
        }
        async reportCCVersion(requestedCC, version) {
            this.assertSupportsCommand(VersionCommand, VersionCommand.CommandClassReport);
            let ccVersion;
            switch (requestedCC) {
                case CommandClasses["Z-Wave Protocol"]:
                case CommandClasses["Z-Wave Long Range"]:
                    // These two are only for internal use
                    ccVersion = 0;
                    break;
                case CommandClasses.Hail:
                case CommandClasses["Manufacturer Proprietary"]:
                    // These CCs are obsolete, we cannot enter them in the certification portal
                    // but not doing so fails a certification test. Just respond that they
                    // are not supported or controlled
                    ccVersion = 0;
                    break;
                default:
                    ccVersion = version ?? getImplementedVersion(requestedCC);
                    break;
            }
            const cc = new VersionCCCommandClassReport({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                requestedCC,
                ccVersion,
            });
            await this.host.sendCommand(cc, this.commandOptions);
        }
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        async getCapabilities() {
            this.assertSupportsCommand(VersionCommand, VersionCommand.CapabilitiesGet);
            const cc = new VersionCCCapabilitiesGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, ["supportsZWaveSoftwareGet"]);
            }
        }
        async reportCapabilities() {
            this.assertSupportsCommand(VersionCommand, VersionCommand.CapabilitiesReport);
            const cc = new VersionCCCapabilitiesReport({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
                // At this time, we do not support responding to Z-Wave Software Get
                supportsZWaveSoftwareGet: false,
            });
            await this.host.sendCommand(cc, this.commandOptions);
        }
        // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
        async getZWaveSoftware() {
            this.assertSupportsCommand(VersionCommand, VersionCommand.ZWaveSoftwareGet);
            const cc = new VersionCCZWaveSoftwareGet({
                nodeId: this.endpoint.nodeId,
                endpointIndex: this.endpoint.index,
            });
            const response = await this.host.sendCommand(cc, this.commandOptions);
            if (response) {
                return pick(response, [
                    "sdkVersion",
                    "applicationFrameworkAPIVersion",
                    "applicationFrameworkBuildNumber",
                    "hostInterfaceVersion",
                    "hostInterfaceBuildNumber",
                    "zWaveProtocolVersion",
                    "zWaveProtocolBuildNumber",
                    "applicationVersion",
                    "applicationBuildNumber",
                ]);
            }
        }
        constructor() {
            super(...arguments);
            __runInitializers(this, _instanceExtraInitializers);
        }
    };
    return VersionCCAPI = _classThis;
})();
export { VersionCCAPI };
let VersionCC = (() => {
    let _classDecorators = [commandClass(CommandClasses.Version), implementedVersion(3), ccValues(VersionCCValues)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = CommandClass;
    var VersionCC = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            VersionCC = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        determineRequiredCCInterviews() {
            // VersionCC must be the 2nd CC after ManufacturerSpecificCC
            return [CommandClasses["Manufacturer Specific"]];
        }
        async interview(ctx) {
            const node = this.getNode(ctx);
            // SDS13782: In a Multi Channel device, the Version Command Class MUST be supported by the Root Device, while
            // the Version Command Class SHOULD NOT be supported by individual End Points.
            //
            // There may be cases where a given Command Class is not implemented by the Root Device of a Multi
            // Channel device. However, the Root Device MUST respond to Version requests for any Command Class
            // implemented by the Multi Channel device; also in cases where the actual Command Class is only
            // provided by an End Point.
            const endpoint = this.getEndpoint(ctx);
            // Use the CC API of the root device for all queries
            const api = CCAPI.create(CommandClasses.Version, ctx, node).withOptions({
                priority: MessagePriority.NodeQuery,
            });
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: `Interviewing ${this.ccName}...`,
                direction: "none",
            });
            const queryCCVersion = async (cc) => {
                // Only query CCs we support. Theoretically we could skip queries where we support only V1,
                // but there are Z-Wave certification tests that require us to query all CCs
                const maxImplemented = getImplementedVersion(cc);
                if (maxImplemented === 0) {
                    ctx.logNode(node.id, `  skipping query for ${CommandClasses[cc]} (${num2hex(cc)}) because max implemented version is ${maxImplemented}`);
                    return;
                }
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: `  querying the CC version for ${getCCName(cc)}...`,
                    direction: "outbound",
                });
                // query the CC version
                const supportedVersion = await api.getCCVersion(cc);
                if (supportedVersion != undefined) {
                    // Remember which CC version this endpoint supports
                    let logMessage;
                    if (supportedVersion > 0) {
                        // Basic CC has special rules for when it is considered supported
                        // Therefore we mark all other CCs as supported, but not Basic CC,
                        // for which support is determined later.
                        if (cc === CommandClasses.Basic) {
                            endpoint.addCC(cc, { version: supportedVersion });
                        }
                        else {
                            endpoint.addCC(cc, {
                                isSupported: true,
                                version: supportedVersion,
                            });
                        }
                        logMessage = `  supports CC ${CommandClasses[cc]} (${num2hex(cc)}) in version ${supportedVersion}`;
                    }
                    else {
                        // We were lied to - the NIF said this CC is supported, now the node claims it isn't
                        // Make sure this is not a critical CC, which must be supported though
                        if (cc === CommandClasses.Version
                            || cc === CommandClasses["Manufacturer Specific"]) {
                            logMessage = `  claims NOT to support CC ${CommandClasses[cc]} (${num2hex(cc)}), but it must. Assuming the ${this.endpointIndex === 0 ? "node" : "endpoint"} supports version 1...`;
                            endpoint.addCC(cc, { version: 1 });
                        }
                        else if ((cc === CommandClasses.Security
                            && node.hasSecurityClass(SecurityClass.S0_Legacy))
                            || (cc === CommandClasses["Security 2"]
                                && securityClassOrder.some((sc) => securityClassIsS2(sc)
                                    && node.hasSecurityClass(sc)))) {
                            logMessage = `  claims NOT to support CC ${CommandClasses[cc]} (${num2hex(cc)}), but it is known to support it. Assuming the ${this.endpointIndex === 0 ? "node" : "endpoint"} supports version 1...`;
                            endpoint.addCC(cc, { version: 1 });
                        }
                        else {
                            logMessage = `  does NOT support CC ${CommandClasses[cc]} (${num2hex(cc)})`;
                            endpoint.removeCC(cc);
                        }
                    }
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message: logMessage,
                    });
                }
                else {
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message: `CC version query for ${getCCName(cc)} timed out - assuming the ${this.endpointIndex === 0 ? "node" : "endpoint"} supports version 1...`,
                        level: "warn",
                    });
                    endpoint.addCC(cc, { version: 1 });
                }
            };
            // Version information should not change (except for firmware updates)
            // And it is only relevant on the root endpoint (the node)
            if (this.endpointIndex === 0) {
                // Step 1: Query Version CC version
                await queryCCVersion(CommandClasses.Version);
                // Step 2: Query node versions
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: "querying node versions...",
                    direction: "outbound",
                });
                const versionGetResponse = await api.get();
                if (versionGetResponse) {
                    let logMessage = `received response for node versions:
  library type:      ${ZWaveLibraryTypes[versionGetResponse.libraryType]} (${num2hex(versionGetResponse.libraryType)})
  protocol version:  ${versionGetResponse.protocolVersion}
  firmware versions: ${versionGetResponse.firmwareVersions.join(", ")}`;
                    if (versionGetResponse.hardwareVersion != undefined) {
                        logMessage +=
                            `\n  hardware version:  ${versionGetResponse.hardwareVersion}`;
                    }
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message: logMessage,
                        direction: "inbound",
                    });
                }
            }
            // Step 3: Query all other CC versions
            ctx.logNode(node.id, {
                endpoint: this.endpointIndex,
                message: "querying CC versions...",
                direction: "outbound",
            });
            // Basic CC is not included in the NIF, so it won't be returned by endpoint.getCCs() at this point
            {
                const cc = CommandClasses.Basic;
                // Skip the query of endpoint CCs that are also supported by the root device
                if (this.endpointIndex === 0 || node.getCCVersion(cc) === 0) {
                    await queryCCVersion(cc);
                }
            }
            for (const [cc] of endpoint.getCCs()) {
                // We already queried the Version CC version at the start of this interview
                if (cc === CommandClasses.Version)
                    continue;
                // And we queried Basic CC just before this
                if (cc === CommandClasses.Basic)
                    continue;
                // Skip the query of endpoint CCs that are also supported by the root device
                if (this.endpointIndex > 0 && node.getCCVersion(cc) > 0)
                    continue;
                await queryCCVersion(cc);
            }
            // Step 4: Query VersionCC capabilities (root device only)
            if (this.endpointIndex === 0 && api.version >= 3) {
                // Step 4a: Support for SoftwareGet
                ctx.logNode(node.id, {
                    endpoint: this.endpointIndex,
                    message: "querying if Z-Wave Software Get is supported...",
                    direction: "outbound",
                });
                const capsResponse = await api.getCapabilities();
                if (capsResponse) {
                    const { supportsZWaveSoftwareGet } = capsResponse;
                    ctx.logNode(node.id, {
                        endpoint: this.endpointIndex,
                        message: `Z-Wave Software Get is${supportsZWaveSoftwareGet ? "" : " not"} supported`,
                        direction: "inbound",
                    });
                    if (supportsZWaveSoftwareGet) {
                        // Step 4b: Query Z-Wave Software versions
                        ctx.logNode(node.id, {
                            endpoint: this.endpointIndex,
                            message: "querying Z-Wave software versions...",
                            direction: "outbound",
                        });
                        await api.getZWaveSoftware();
                        ctx.logNode(node.id, {
                            endpoint: this.endpointIndex,
                            message: "received Z-Wave software versions",
                            direction: "inbound",
                        });
                    }
                }
            }
            // Remember that the interview is complete
            this.setInterviewComplete(ctx, true);
        }
    };
    return VersionCC = _classThis;
})();
export { VersionCC };
let VersionCCReport = (() => {
    let _classDecorators = [CCCommand(VersionCommand.Report), ccValueProperty("libraryType", VersionCCValues.libraryType), ccValueProperty("protocolVersion", VersionCCValues.protocolVersion), ccValueProperty("firmwareVersions", VersionCCValues.firmwareVersions), ccValueProperty("hardwareVersion", VersionCCValues.hardwareVersion)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VersionCC;
    var VersionCCReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            VersionCCReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            if (!/^\d+\.\d+(\.\d+)?$/.test(options.protocolVersion)) {
                throw new ZWaveError(`protocolVersion must be a string in the format "major.minor" or "major.minor.patch", received "${options.protocolVersion}"`, ZWaveErrorCodes.Argument_Invalid);
            }
            else if (!options.firmwareVersions.every((fw) => /^\d+\.\d+(\.\d+)?$/.test(fw))) {
                throw new ZWaveError(`firmwareVersions must be an array of strings in the format "major.minor" or "major.minor.patch", received "${JSON.stringify(options.firmwareVersions)}"`, ZWaveErrorCodes.Argument_Invalid);
            }
            this.libraryType = options.libraryType;
            this.protocolVersion = options.protocolVersion;
            this.firmwareVersions = options.firmwareVersions;
            this.hardwareVersion = options.hardwareVersion;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 5);
            const libraryType = raw.payload[0];
            const protocolVersion = `${raw.payload[1]}.${raw.payload[2]}`;
            const firmwareVersions = [`${raw.payload[3]}.${raw.payload[4]}`];
            let hardwareVersion;
            if (raw.payload.length >= 7) {
                // V2+
                hardwareVersion = raw.payload[5];
                const additionalFirmwares = raw.payload[6];
                validatePayload(raw.payload.length >= 7 + 2 * additionalFirmwares);
                for (let i = 0; i < additionalFirmwares; i++) {
                    firmwareVersions.push(`${raw.payload[7 + 2 * i]}.${raw.payload[7 + 2 * i + 1]}`);
                }
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                libraryType,
                protocolVersion,
                firmwareVersions,
                hardwareVersion,
            });
        }
        libraryType;
        protocolVersion;
        firmwareVersions;
        hardwareVersion;
        serialize(ctx) {
            this.payload = Bytes.from([
                this.libraryType,
                ...this.protocolVersion
                    .split(".")
                    .map((n) => parseInt(n))
                    .slice(0, 2),
                ...this.firmwareVersions[0]
                    .split(".")
                    .map((n) => parseInt(n))
                    .slice(0, 2),
                this.hardwareVersion ?? 0x00,
                this.firmwareVersions.length - 1,
            ]);
            if (this.firmwareVersions.length > 1) {
                const firmwaresBuffer = new Bytes((this.firmwareVersions.length - 1) * 2);
                for (let i = 1; i < this.firmwareVersions.length; i++) {
                    const [major, minor] = this.firmwareVersions[i]
                        .split(".")
                        .map((n) => parseInt(n));
                    firmwaresBuffer[2 * (i - 1)] = major;
                    firmwaresBuffer[2 * (i - 1) + 1] = minor;
                }
                this.payload = Bytes.concat([this.payload, firmwaresBuffer]);
            }
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            const message = {
                "library type": getEnumMemberName(ZWaveLibraryTypes, this.libraryType),
                "protocol version": this.protocolVersion,
                "firmware versions": this.firmwareVersions.join(", "),
            };
            if (this.hardwareVersion != undefined) {
                message["hardware version"] = this.hardwareVersion;
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return VersionCCReport = _classThis;
})();
export { VersionCCReport };
let VersionCCGet = (() => {
    let _classDecorators = [CCCommand(VersionCommand.Get), expectedCCResponse(VersionCCReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VersionCC;
    var VersionCCGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            VersionCCGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return VersionCCGet = _classThis;
})();
export { VersionCCGet };
let VersionCCCommandClassReport = (() => {
    let _classDecorators = [CCCommand(VersionCommand.CommandClassReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VersionCC;
    var VersionCCCommandClassReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            VersionCCCommandClassReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.requestedCC = options.requestedCC;
            this.ccVersion = options.ccVersion;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 2);
            const requestedCC = raw.payload[0];
            const ccVersion = raw.payload[1];
            return new this({
                nodeId: ctx.sourceNodeId,
                requestedCC,
                ccVersion,
            });
        }
        ccVersion;
        requestedCC;
        serialize(ctx) {
            this.payload = Bytes.from([this.requestedCC, this.ccVersion]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    CC: getCCName(this.requestedCC),
                    version: this.ccVersion,
                },
            };
        }
    };
    return VersionCCCommandClassReport = _classThis;
})();
export { VersionCCCommandClassReport };
function testResponseForVersionCommandClassGet(sent, received) {
    // We expect a Version CommandClass Report that matches the requested CC
    return sent.requestedCC === received.requestedCC;
}
let VersionCCCommandClassGet = (() => {
    let _classDecorators = [CCCommand(VersionCommand.CommandClassGet), expectedCCResponse(VersionCCCommandClassReport, testResponseForVersionCommandClassGet)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VersionCC;
    var VersionCCCommandClassGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            VersionCCCommandClassGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.requestedCC = options.requestedCC;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const requestedCC = raw.payload[0];
            return new this({
                nodeId: ctx.sourceNodeId,
                requestedCC,
            });
        }
        requestedCC;
        serialize(ctx) {
            this.payload = Bytes.from([this.requestedCC]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: { CC: getCCName(this.requestedCC) },
            };
        }
    };
    return VersionCCCommandClassGet = _classThis;
})();
export { VersionCCCommandClassGet };
let VersionCCCapabilitiesReport = (() => {
    let _classDecorators = [CCCommand(VersionCommand.CapabilitiesReport), ccValueProperty("supportsZWaveSoftwareGet", VersionCCValues.supportsZWaveSoftwareGet)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VersionCC;
    var VersionCCCapabilitiesReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            VersionCCCapabilitiesReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            this.supportsZWaveSoftwareGet = options.supportsZWaveSoftwareGet;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 1);
            const capabilities = raw.payload[0];
            const supportsZWaveSoftwareGet = !!(capabilities & 0b100);
            return new this({
                nodeId: ctx.sourceNodeId,
                supportsZWaveSoftwareGet,
            });
        }
        supportsZWaveSoftwareGet;
        serialize(ctx) {
            this.payload = Bytes.from([
                (this.supportsZWaveSoftwareGet ? 0b100 : 0) | 0b11,
            ]);
            return super.serialize(ctx);
        }
        toLogEntry(ctx) {
            return {
                ...super.toLogEntry(ctx),
                message: {
                    "supports Z-Wave Software Get command": this.supportsZWaveSoftwareGet,
                },
            };
        }
    };
    return VersionCCCapabilitiesReport = _classThis;
})();
export { VersionCCCapabilitiesReport };
let VersionCCCapabilitiesGet = (() => {
    let _classDecorators = [CCCommand(VersionCommand.CapabilitiesGet), expectedCCResponse(VersionCCCapabilitiesReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VersionCC;
    var VersionCCCapabilitiesGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            VersionCCCapabilitiesGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return VersionCCCapabilitiesGet = _classThis;
})();
export { VersionCCCapabilitiesGet };
let VersionCCZWaveSoftwareReport = (() => {
    let _classDecorators = [CCCommand(VersionCommand.ZWaveSoftwareReport), ccValueProperty("sdkVersion", VersionCCValues.sdkVersion), ccValueProperty("applicationFrameworkAPIVersion", VersionCCValues.applicationFrameworkAPIVersion), ccValueProperty("applicationFrameworkBuildNumber", VersionCCValues.applicationFrameworkBuildNumber), ccValueProperty("hostInterfaceVersion", VersionCCValues.serialAPIVersion), ccValueProperty("hostInterfaceBuildNumber", VersionCCValues.serialAPIBuildNumber), ccValueProperty("zWaveProtocolVersion", VersionCCValues.zWaveProtocolVersion), ccValueProperty("zWaveProtocolBuildNumber", VersionCCValues.zWaveProtocolBuildNumber), ccValueProperty("applicationVersion", VersionCCValues.applicationVersion), ccValueProperty("applicationBuildNumber", VersionCCValues.applicationBuildNumber)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VersionCC;
    var VersionCCZWaveSoftwareReport = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            VersionCCZWaveSoftwareReport = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        constructor(options) {
            super(options);
            // TODO: Check implementation:
            this.sdkVersion = options.sdkVersion;
            this.applicationFrameworkAPIVersion =
                options.applicationFrameworkAPIVersion;
            this.applicationFrameworkBuildNumber =
                options.applicationFrameworkBuildNumber;
            this.hostInterfaceVersion = options.hostInterfaceVersion;
            this.hostInterfaceBuildNumber = options.hostInterfaceBuildNumber;
            this.zWaveProtocolVersion = options.zWaveProtocolVersion;
            this.zWaveProtocolBuildNumber = options.zWaveProtocolBuildNumber;
            this.applicationVersion = options.applicationVersion;
            this.applicationBuildNumber = options.applicationBuildNumber;
        }
        static from(raw, ctx) {
            validatePayload(raw.payload.length >= 23);
            const sdkVersion = parseVersion(raw.payload);
            const applicationFrameworkAPIVersion = parseVersion(raw.payload.subarray(3));
            let applicationFrameworkBuildNumber;
            if (applicationFrameworkAPIVersion !== "unused") {
                applicationFrameworkBuildNumber = raw.payload.readUInt16BE(6);
            }
            else {
                applicationFrameworkBuildNumber = 0;
            }
            const hostInterfaceVersion = parseVersion(raw.payload.subarray(8));
            let hostInterfaceBuildNumber;
            if (hostInterfaceVersion !== "unused") {
                hostInterfaceBuildNumber = raw.payload.readUInt16BE(11);
            }
            else {
                hostInterfaceBuildNumber = 0;
            }
            const zWaveProtocolVersion = parseVersion(raw.payload.subarray(13));
            let zWaveProtocolBuildNumber;
            if (zWaveProtocolVersion !== "unused") {
                zWaveProtocolBuildNumber = raw.payload.readUInt16BE(16);
            }
            else {
                zWaveProtocolBuildNumber = 0;
            }
            const applicationVersion = parseVersion(raw.payload.subarray(18));
            let applicationBuildNumber;
            if (applicationVersion !== "unused") {
                applicationBuildNumber = raw.payload.readUInt16BE(21);
            }
            else {
                applicationBuildNumber = 0;
            }
            return new this({
                nodeId: ctx.sourceNodeId,
                sdkVersion,
                applicationFrameworkAPIVersion,
                applicationFrameworkBuildNumber,
                hostInterfaceVersion,
                hostInterfaceBuildNumber,
                zWaveProtocolVersion,
                zWaveProtocolBuildNumber,
                applicationVersion,
                applicationBuildNumber,
            });
        }
        sdkVersion;
        applicationFrameworkAPIVersion;
        applicationFrameworkBuildNumber;
        hostInterfaceVersion;
        hostInterfaceBuildNumber;
        zWaveProtocolVersion;
        zWaveProtocolBuildNumber;
        applicationVersion;
        applicationBuildNumber;
        toLogEntry(ctx) {
            const message = {
                "SDK version": this.sdkVersion,
            };
            message["appl. framework API version"] =
                this.applicationFrameworkAPIVersion;
            if (this.applicationFrameworkAPIVersion !== "unused") {
                message["appl. framework build number"] =
                    this.applicationFrameworkBuildNumber;
            }
            message["host interface version"] = this.hostInterfaceVersion;
            if (this.hostInterfaceVersion !== "unused") {
                message["host interface  build number"] =
                    this.hostInterfaceBuildNumber;
            }
            message["Z-Wave protocol version"] = this.zWaveProtocolVersion;
            if (this.zWaveProtocolVersion !== "unused") {
                message["Z-Wave protocol build number"] =
                    this.zWaveProtocolBuildNumber;
            }
            message["application version"] = this.applicationVersion;
            if (this.applicationVersion !== "unused") {
                message["application build number"] = this.applicationBuildNumber;
            }
            return {
                ...super.toLogEntry(ctx),
                message,
            };
        }
    };
    return VersionCCZWaveSoftwareReport = _classThis;
})();
export { VersionCCZWaveSoftwareReport };
let VersionCCZWaveSoftwareGet = (() => {
    let _classDecorators = [CCCommand(VersionCommand.ZWaveSoftwareGet), expectedCCResponse(VersionCCZWaveSoftwareReport)];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    let _classSuper = VersionCC;
    var VersionCCZWaveSoftwareGet = class extends _classSuper {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            VersionCCZWaveSoftwareGet = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return VersionCCZWaveSoftwareGet = _classThis;
})();
export { VersionCCZWaveSoftwareGet };
//# sourceMappingURL=VersionCC.js.map