import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { CommandClasses, type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type SupervisionResult, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { CCAPI, POLL_VALUE, type PollValueImplementation, SET_VALUE, type SetValueImplementation } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext } from "../lib/CommandClass.js";
import { SoundSwitchCommand, type ToneId } from "../lib/_Types.js";
export declare const SoundSwitchCCValues: Readonly<{
    volume: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Sound Switch"];
            readonly property: "volume";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Sound Switch"];
            readonly endpoint: number;
            readonly property: "volume";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly min: 0;
            readonly max: 100;
            readonly unit: "%";
            readonly label: "Volume";
            readonly allowManualEntry: true;
            readonly states: {
                readonly 0: "default";
            };
            readonly type: "number";
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
    toneId: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Sound Switch"];
            readonly property: "toneId";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Sound Switch"];
            readonly endpoint: number;
            readonly property: "toneId";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly label: "Play Tone";
            readonly valueChangeOptions: readonly ["volume"];
            readonly min: 0;
            readonly max: 255;
            readonly type: "number";
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
    defaultVolume: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Sound Switch"];
            readonly property: "defaultVolume";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Sound Switch"];
            readonly endpoint: number;
            readonly property: "defaultVolume";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly min: 0;
            readonly max: 100;
            readonly unit: "%";
            readonly label: "Default volume";
            readonly type: "number";
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
    defaultToneId: {
        id: {
            readonly commandClass: (typeof CommandClasses)["Sound Switch"];
            readonly property: "defaultToneId";
        };
        endpoint: (endpoint?: number) => {
            readonly commandClass: (typeof CommandClasses)["Sound Switch"];
            readonly endpoint: number;
            readonly property: "defaultToneId";
        };
        is: (valueId: import("@zwave-js/core").ValueID) => boolean;
        readonly meta: {
            readonly min: 1;
            readonly max: 254;
            readonly label: "Default tone ID";
            readonly type: "number";
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
export declare class SoundSwitchCCAPI extends CCAPI {
    supportsCommand(cmd: SoundSwitchCommand): MaybeNotKnown<boolean>;
    getToneCount(): Promise<MaybeNotKnown<number>>;
    getToneInfo(toneId: number): Promise<Pick<SoundSwitchCCToneInfoReport, "name" | "duration"> | undefined>;
    setConfiguration(defaultToneId: number, defaultVolume: number): Promise<SupervisionResult | undefined>;
    getConfiguration(): Promise<Pick<SoundSwitchCCConfigurationReport, "defaultVolume" | "defaultToneId"> | undefined>;
    play(toneId: number, volume?: number): Promise<SupervisionResult | undefined>;
    stopPlaying(): Promise<SupervisionResult | undefined>;
    getPlaying(): Promise<Pick<SoundSwitchCCTonePlayReport, "volume" | "toneId"> | undefined>;
    protected get [SET_VALUE](): SetValueImplementation;
    protected get [POLL_VALUE](): PollValueImplementation;
}
export declare class SoundSwitchCC extends CommandClass {
    ccCommand: SoundSwitchCommand;
    interview(ctx: InterviewContext): Promise<void>;
}
export interface SoundSwitchCCTonesNumberReportOptions {
    toneCount: number;
}
export declare class SoundSwitchCCTonesNumberReport extends SoundSwitchCC {
    constructor(options: WithAddress<SoundSwitchCCTonesNumberReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): SoundSwitchCCTonesNumberReport;
    toneCount: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class SoundSwitchCCTonesNumberGet extends SoundSwitchCC {
}
export interface SoundSwitchCCToneInfoReportOptions {
    toneId: number;
    duration: number;
    name: string;
}
export declare class SoundSwitchCCToneInfoReport extends SoundSwitchCC {
    constructor(options: WithAddress<SoundSwitchCCToneInfoReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): SoundSwitchCCToneInfoReport;
    readonly toneId: number;
    readonly duration: number;
    readonly name: string;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface SoundSwitchCCToneInfoGetOptions {
    toneId: number;
}
export declare class SoundSwitchCCToneInfoGet extends SoundSwitchCC {
    constructor(options: WithAddress<SoundSwitchCCToneInfoGetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): SoundSwitchCCToneInfoGet;
    toneId: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface SoundSwitchCCConfigurationSetOptions {
    defaultVolume: number;
    defaultToneId: number;
}
export declare class SoundSwitchCCConfigurationSet extends SoundSwitchCC {
    constructor(options: WithAddress<SoundSwitchCCConfigurationSetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): SoundSwitchCCConfigurationSet;
    defaultVolume: number;
    defaultToneId: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface SoundSwitchCCConfigurationReportOptions {
    defaultVolume: number;
    defaultToneId: number;
}
export declare class SoundSwitchCCConfigurationReport extends SoundSwitchCC {
    constructor(options: WithAddress<SoundSwitchCCConfigurationReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): SoundSwitchCCConfigurationReport;
    defaultVolume: number;
    defaultToneId: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class SoundSwitchCCConfigurationGet extends SoundSwitchCC {
}
export interface SoundSwitchCCTonePlaySetOptions {
    toneId: ToneId | number;
    volume?: number;
}
export declare class SoundSwitchCCTonePlaySet extends SoundSwitchCC {
    constructor(options: WithAddress<SoundSwitchCCTonePlaySetOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): SoundSwitchCCTonePlaySet;
    toneId: ToneId | number;
    volume?: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface SoundSwitchCCTonePlayReportOptions {
    toneId: ToneId | number;
    volume?: number;
}
export declare class SoundSwitchCCTonePlayReport extends SoundSwitchCC {
    constructor(options: WithAddress<SoundSwitchCCTonePlayReportOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): SoundSwitchCCTonePlayReport;
    readonly toneId: ToneId | number;
    volume?: number;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export declare class SoundSwitchCCTonePlayGet extends SoundSwitchCC {
}
//# sourceMappingURL=SoundSwitchCC.d.ts.map