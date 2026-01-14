import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { type GetValueDB, type MaybeNotKnown, type MessageOrCCLogEntry, type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { CCAPI } from "../lib/API.js";
import { type CCRaw, CommandClass } from "../lib/CommandClass.js";
import { InclusionControllerCommand, InclusionControllerStatus, InclusionControllerStep } from "../lib/_Types.js";
export declare class InclusionControllerCC extends CommandClass {
    ccCommand: InclusionControllerCommand;
}
export declare class InclusionControllerCCAPI extends CCAPI {
    supportsCommand(cmd: InclusionControllerCommand): MaybeNotKnown<boolean>;
    /** Instruct the target to initiate the given inclusion step for the given node */
    initiateStep(nodeId: number, step: InclusionControllerStep): Promise<void>;
    /** Indicate to the other node that the given inclusion step has been completed */
    completeStep(step: InclusionControllerStep, status: InclusionControllerStatus): Promise<void>;
}
export interface InclusionControllerCCCompleteOptions {
    step: InclusionControllerStep;
    status: InclusionControllerStatus;
}
export declare class InclusionControllerCCComplete extends InclusionControllerCC {
    constructor(options: WithAddress<InclusionControllerCCCompleteOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): InclusionControllerCCComplete;
    step: InclusionControllerStep;
    status: InclusionControllerStatus;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
export interface InclusionControllerCCInitiateOptions {
    includedNodeId: number;
    step: InclusionControllerStep;
}
export declare class InclusionControllerCCInitiate extends InclusionControllerCC {
    constructor(options: WithAddress<InclusionControllerCCInitiateOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): InclusionControllerCCInitiate;
    includedNodeId: number;
    step: InclusionControllerStep;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    toLogEntry(ctx?: GetValueDB): MessageOrCCLogEntry;
}
//# sourceMappingURL=InclusionControllerCC.d.ts.map