import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { CommandClasses, type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type SupervisionResult, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { CCAPI } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext, type RefreshValuesContext } from "../lib/CommandClass.js";
import { LanguageCommand } from "../lib/_Types.js";
export declare const LanguageCCValues: Readonly<{
    language: {
        id: {
            readonly commandClass: CommandClasses.Language;
            readonly property: "language";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Language;
            readonly endpoint: number;
            readonly property: "language";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Language code";
            readonly writeable: false;
            readonly type: "string";
            readonly readable: true;
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
    country: {
        id: {
            readonly commandClass: CommandClasses.Language;
            readonly property: "country";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: CommandClasses.Language;
            readonly endpoint: number;
            readonly property: "country";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Country code";
            readonly writeable: false;
            readonly type: "string";
            readonly readable: true;
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
export declare class LanguageCCAPI extends CCAPI {
    supportsCommand(cmd: LanguageCommand): MaybeNotKnown<boolean>;
    get(): Promise<Pick<LanguageCCReport, "language" | "country"> | undefined>;
    set(language: string, country?: string): Promise<SupervisionResult | undefined>;
}
export declare class LanguageCC extends CommandClass {
    ccCommand: LanguageCommand;
    interview(ctx: InterviewContext): Promise<void>;
    refreshValues(ctx: RefreshValuesContext): Promise<void>;
}
export interface LanguageCCSetOptions {
    language: string;
    country?: string;
}
export declare class LanguageCCSet extends LanguageCC {
    constructor(options: WithAddress<LanguageCCSetOptions>);
    static from(_raw: CCRaw, _ctx: CCParsingContext): LanguageCCSet;
    private _language;
    get language(): string;
    set language(value: string);
    private _country;
    get country(): MaybeNotKnown<string>;
    set country(value: MaybeNotKnown<string>);
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface LanguageCCReportOptions {
    language: string;
    country: MaybeNotKnown<string>;
}
export declare class LanguageCCReport extends LanguageCC {
    constructor(options: WithAddress<LanguageCCReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): LanguageCCReport;
    readonly language: string;
    readonly country: MaybeNotKnown<string>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class LanguageCCGet extends LanguageCC {
}
//# sourceMappingURL=LanguageCC.d.ts.map