import type { MaybeNotKnown } from "../values/Primitive.js";
export interface UnknownZWaveChipType {
    type: number;
    version: number;
}
export declare function getZWaveChipType(type: number, version: number): string | UnknownZWaveChipType;
export declare function getChipTypeAndVersion(zWaveChipType: string): MaybeNotKnown<{
    type: number;
    version: number;
}>;
//# sourceMappingURL=ZWaveChipTypes.d.ts.map