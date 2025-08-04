/**
 * The state a transaction is in.
 */
export declare enum TransactionState {
    /** The transaction is currently queued */
    Queued = 0,
    /** The transaction is currently being handled */
    Active = 1,
    /** The transaction was completed */
    Completed = 2,
    /** The transaction failed */
    Failed = 3
}
export type TransactionProgress = {
    state: TransactionState.Queued | TransactionState.Active | TransactionState.Completed;
} | {
    state: TransactionState.Failed;
    /** Why the transaction failed */
    reason?: string;
};
export type TransactionProgressListener = (progress: TransactionProgress) => void;
//# sourceMappingURL=Transactions.d.ts.map