import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { CommandClasses, type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { CCAPI, POLL_VALUE, type PollValueImplementation } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext, type PersistValuesContext, type RefreshValuesContext } from "../lib/CommandClass.js";
import { EnergyProductionCommand, EnergyProductionParameter, type EnergyProductionScale } from "../lib/_Types.js";
export declare const EnergyProductionCCValues: Readonly<{
    value: ((parameter: EnergyProductionParameter) => {
        id: {
            readonly commandClass: (typeof CommandClasses)["Energy Production"];
            readonly property: "value";
            readonly propertyKey: EnergyProductionParameter;
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Energy Production"];
            readonly endpoint: number;
            readonly property: "value";
            readonly propertyKey: EnergyProductionParameter;
        };
        readonly meta: {
            readonly label: string;
            readonly writeable: false;
            readonly type: "number";
            readonly readable: true;
        };
    }) & {
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        options: {
            readonly internal: false;
            readonly minVersion: 1;
            readonly secret: false;
            readonly stateful: true;
            readonly supportsEndpoints: true;
            readonly autoCreate: true;
        };
    };
}>;
export declare class EnergyProductionCCAPI extends CCAPI {
    supportsCommand(cmd: EnergyProductionCommand): MaybeNotKnown<boolean>;
    protected get [POLL_VALUE](): PollValueImplementation;
    get(parameter: EnergyProductionParameter): Promise<MaybeNotKnown<{
        value: number;
        scale: EnergyProductionScale;
    }>>;
}
export declare class EnergyProductionCC extends CommandClass {
    ccCommand: EnergyProductionCommand;
    interview(ctx: InterviewContext): Promise<void>;
    refreshValues(ctx: RefreshValuesContext): Promise<void>;
}
export interface EnergyProductionCCReportOptions {
    parameter: EnergyProductionParameter;
    scale: EnergyProductionScale;
    value: number;
}
export declare class EnergyProductionCCReport extends EnergyProductionCC {
    constructor(options: WithAddress<EnergyProductionCCReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): EnergyProductionCCReport;
    readonly parameter: EnergyProductionParameter;
    readonly scale: EnergyProductionScale;
    readonly value: number;
    persistValues(ctx: PersistValuesContext): boolean;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface EnergyProductionCCGetOptions {
    parameter: EnergyProductionParameter;
}
export declare class EnergyProductionCCGet extends EnergyProductionCC {
    constructor(options: WithAddress<EnergyProductionCCGetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): EnergyProductionCCGet;
    parameter: EnergyProductionParameter;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
//# sourceMappingURL=EnergyProductionCC.d.ts.map