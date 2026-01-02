import { type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type WithAddress } from "@zwave-js/core";
import { CCAPI } from "../lib/API.js";
import { type CCRaw, CommandClass } from "../lib/CommandClass.js";
import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { Bytes } from "@zwave-js/shared";
import { CRC16Command } from "../lib/_Types.js";
export declare class CRC16CCAPI extends CCAPI {
    supportsCommand(_cmd: CRC16Command): MaybeNotKnown<boolean>;
    sendEncapsulated(encapsulatedCC: CommandClass): Promise<void>;
}
export declare class CRC16CC extends CommandClass {
    ccCommand: CRC16Command;
    /** Tests if a command should be supervised and thus requires encapsulation */
    static requiresEncapsulation(cc: CommandClass): boolean;
    /** Encapsulates a command in a CRC-16 CC */
    static encapsulate(cc: CommandClass): CRC16CCCommandEncapsulation;
}
export interface CRC16CCCommandEncapsulationOptions {
    encapsulated: CommandClass;
}
export declare class CRC16CCCommandEncapsulation extends CRC16CC {
    constructor(options: WithAddress<CRC16CCCommandEncapsulationOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): Promise<CRC16CCCommandEncapsulation>;
    encapsulated: CommandClass;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    protected computeEncapsulationOverhead(): number;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
//# sourceMappingURL=CRC16CC.d.ts.map