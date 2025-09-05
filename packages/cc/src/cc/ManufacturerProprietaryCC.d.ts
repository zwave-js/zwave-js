import type { CCEncodingContext, CCParsingContext } from "@zwave-js/cc";
import { type WithAddress } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { CCAPI, type CCAPIEndpoint, type CCAPIHost } from "../lib/API.js";
import { type CCRaw, CommandClass, type InterviewContext, type RefreshValuesContext } from "../lib/CommandClass.js";
export type ManufacturerProprietaryCCConstructor<T extends typeof ManufacturerProprietaryCC = typeof ManufacturerProprietaryCC> = T & {
    new (options: any): InstanceType<T>;
};
export declare class ManufacturerProprietaryCCAPI extends CCAPI {
    constructor(host: CCAPIHost, endpoint: CCAPIEndpoint);
    sendData(manufacturerId: number, data?: Uint8Array): Promise<void>;
    sendAndReceiveData(manufacturerId: number, data?: Uint8Array): Promise<{
        manufacturerId: number | undefined;
        data: Bytes;
    } | undefined>;
}
export interface ManufacturerProprietaryCCOptions {
    manufacturerId?: number;
    unspecifiedExpectsResponse?: boolean;
    payload?: Uint8Array;
}
export declare class ManufacturerProprietaryCC extends CommandClass {
    ccCommand: undefined;
    constructor(options: WithAddress<ManufacturerProprietaryCCOptions>);
    static from(raw: CCRaw, ctx: CCParsingContext): ManufacturerProprietaryCC;
    manufacturerId?: number;
    private getManufacturerIdOrThrow;
    serialize(ctx: CCEncodingContext): Promise<Bytes>;
    createSpecificInstance(): ManufacturerProprietaryCC | undefined;
    interview(ctx: InterviewContext): Promise<void>;
    refreshValues(ctx: RefreshValuesContext): Promise<void>;
}
//# sourceMappingURL=ManufacturerProprietaryCC.d.ts.map