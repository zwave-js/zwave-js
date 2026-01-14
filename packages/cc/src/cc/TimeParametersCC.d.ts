import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { CommandClasses, type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type SupervisionResult, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { CCAPI, POLL_VALUE, type PollValueImplementation, SET_VALUE, type SetValueImplementation } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext, type PersistValuesContext } from "../lib/CommandClass.js";
import { TimeParametersCommand } from "../lib/_Types.js";
export declare const TimeParametersCCValues: Readonly<{
    dateAndTime: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Time Parameters"];
            readonly property: "dateAndTime";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Time Parameters"];
            readonly endpoint: number;
            readonly property: "dateAndTime";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Date and Time";
            readonly type: "any";
            readonly readable: true;
            readonly writeable: true;
        };
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
export declare class TimeParametersCCAPI extends CCAPI {
    supportsCommand(cmd: TimeParametersCommand): MaybeNotKnown<boolean>;
    protected get [SET_VALUE](): SetValueImplementation;
    protected get [POLL_VALUE](): PollValueImplementation;
    get(): Promise<MaybeNotKnown<Date>>;
    set(dateAndTime: Date): Promise<SupervisionResult | undefined>;
}
export declare class TimeParametersCC extends CommandClass {
    ccCommand: TimeParametersCommand;
    interview(ctx: InterviewContext): Promise<void>;
}
export interface TimeParametersCCReportOptions {
    dateAndTime: Date;
}
export declare class TimeParametersCCReport extends TimeParametersCC {
    constructor(options: WithAddress<TimeParametersCCReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): TimeParametersCCReport;
    persistValues(ctx: PersistValuesContext): boolean;
    dateAndTime: Date;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class TimeParametersCCGet extends TimeParametersCC {
}
export interface TimeParametersCCSetOptions {
    dateAndTime: Date;
    useLocalTime?: boolean;
}
export declare class TimeParametersCCSet extends TimeParametersCC {
    constructor(options: WithAddress<TimeParametersCCSetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): TimeParametersCCSet;
    persistValues(ctx: PersistValuesContext): boolean;
    dateAndTime: Date;
    private useLocalTime?;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
//# sourceMappingURL=TimeParametersCC.d.ts.map