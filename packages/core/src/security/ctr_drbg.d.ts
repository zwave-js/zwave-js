export declare class CtrDRBG {
    private key;
    private v;
    saveState(): {
        key: Uint8Array;
        v: Uint8Array;
    };
    restoreState(state: {
        key: Uint8Array;
        v: Uint8Array;
    }): void;
    init(entropy: Uint8Array, personalizationString?: Uint8Array): Promise<void>;
    update(providedData: Uint8Array | undefined): Promise<void>;
    generate(len: number): Promise<Uint8Array>;
    protected reseed(entropy: Uint8Array): Promise<void>;
}
//# sourceMappingURL=ctr_drbg.d.ts.map