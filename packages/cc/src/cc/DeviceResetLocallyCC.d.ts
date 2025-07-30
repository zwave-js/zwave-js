import type { CCParsingContext } from "@zwave-js/cc";
import { type MaybeNotKnown } from "@zwave-js/core";
import { CCAPI } from "../lib/API.js";
import { type CCRaw, CommandClass } from "../lib/CommandClass.js";
import { DeviceResetLocallyCommand } from "../lib/_Types.js";
export declare class DeviceResetLocallyCCAPI extends CCAPI {
    supportsCommand(cmd: DeviceResetLocallyCommand): MaybeNotKnown<boolean>;
    sendNotification(): Promise<void>;
}
export declare class DeviceResetLocallyCC extends CommandClass {
    ccCommand: DeviceResetLocallyCommand;
    nodeId: number;
}
export declare class DeviceResetLocallyCCNotification extends DeviceResetLocallyCC {
    static from(raw: CCRaw, ctx: CCParsingContext): DeviceResetLocallyCCNotification;
}
//# sourceMappingURL=DeviceResetLocallyCC.d.ts.map