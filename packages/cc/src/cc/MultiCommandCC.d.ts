import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { CCAPI } from "../lib/API.js";
import { type CCRaw, CommandClass } from "../lib/CommandClass.js";
import { MultiCommandCommand } from "../lib/_Types.js";
export declare class MultiCommandCCAPI extends CCAPI {
    supportsCommand(_cmd: MultiCommandCommand): MaybeNotKnown<boolean>;
    send(commands: CommandClass[]): Promise<void>;
}
export declare class MultiCommandCC extends CommandClass {
    ccCommand: MultiCommandCommand;
    /** Tests if a command targets a specific endpoint and thus requires encapsulation */
    static requiresEncapsulation(cc: CommandClass): boolean;
    static encapsulate(CCs: CommandClass[]): MultiCommandCCCommandEncapsulation;
}
export interface MultiCommandCCCommandEncapsulationOptions {
    encapsulated: CommandClass[];
}
export declare class MultiCommandCCCommandEncapsulation extends MultiCommandCC {
    constructor(options: WithAddress<MultiCommandCCCommandEncapsulationOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): Promise<MultiCommandCCCommandEncapsulation>;
    encapsulated: CommandClass[];
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
//# sourceMappingURL=MultiCommandCC.d.ts.map