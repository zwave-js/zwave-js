import { PhysicalCCAPI } from "../lib/API.js";
import { CommandClass } from "../lib/CommandClass.js";
export declare class NoOperationCCAPI extends PhysicalCCAPI {
    send(): Promise<void>;
}
export declare class NoOperationCC extends CommandClass {
    ccCommand: undefined;
}
//# sourceMappingURL=NoOperationCC.d.ts.map