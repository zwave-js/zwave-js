/**
 * The state a transaction is in.
 */
export var TransactionState;
(function (TransactionState) {
    /** The transaction is currently queued */
    TransactionState[TransactionState["Queued"] = 0] = "Queued";
    /** The transaction is currently being handled */
    TransactionState[TransactionState["Active"] = 1] = "Active";
    /** The transaction was completed */
    TransactionState[TransactionState["Completed"] = 2] = "Completed";
    /** The transaction failed */
    TransactionState[TransactionState["Failed"] = 3] = "Failed";
})(TransactionState || (TransactionState = {}));
//# sourceMappingURL=Transactions.js.map