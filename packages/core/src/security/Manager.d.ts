/** Management class and utils for Security S0 */
export declare function generateAuthKey(networkKey: Uint8Array): Promise<Uint8Array>;
export declare function generateEncryptionKey(networkKey: Uint8Array): Promise<Uint8Array>;
interface NonceKey {
    /** The node that has created this nonce */
    issuer: number;
    nonceId: number;
}
interface NonceEntry {
    nonce: Uint8Array;
    /** The node this nonce was created for */
    receiver: number;
}
export interface SecurityManagerOptions {
    networkKey: Uint8Array;
    ownNodeId: number;
    nonceTimeout: number;
}
export interface SetNonceOptions {
    free?: boolean;
}
export declare class SecurityManager {
    constructor(options: SecurityManagerOptions);
    private ownNodeId;
    private nonceTimeout;
    private _networkKey;
    get networkKey(): Uint8Array;
    set networkKey(v: Uint8Array);
    private _authKey;
    getAuthKey(): Promise<Uint8Array>;
    private _encryptionKey;
    getEncryptionKey(): Promise<Uint8Array>;
    private _nonceStore;
    private _freeNonceIDs;
    private _nonceTimers;
    private normalizeId;
    /** Generates a nonce for the current node */
    generateNonce(receiver: number, length: number): Uint8Array;
    getNonceId(nonce: Uint8Array): number;
    setNonce(id: number | NonceKey, entry: NonceEntry, { free }?: SetNonceOptions): void;
    /** Deletes ALL nonces that were issued for a given node */
    deleteAllNoncesForReceiver(receiver: number): void;
    deleteNonce(id: number | NonceKey): void;
    private deleteNonceInternal;
    private expireNonce;
    getNonce(id: number | NonceKey): Uint8Array | undefined;
    hasNonce(id: number | NonceKey): boolean;
    getFreeNonce(nodeId: number): Uint8Array | undefined;
}
export {};
//# sourceMappingURL=Manager.d.ts.map