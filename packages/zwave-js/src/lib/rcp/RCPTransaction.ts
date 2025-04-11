import {
	type ZWaveError,
	highResTimestamp,
	isZWaveError,
} from "@zwave-js/core";
import type { RCPMessage } from "@zwave-js/serial";
import {
	type Comparable,
	type CompareResult,
	compareNumberOrString,
} from "alcalzone-shared/comparable";
import type { DeferredPromise } from "alcalzone-shared/deferred-promise";

// export interface RCPMessageGenerator {
// 	parent: RCPTransaction;
// 	/** Start a new copy of this message generator */
// 	start: () => AsyncGenerator<RCPMessage, void, RCPMessage>;
// 	/** Resets this message generator so it can be started anew */
// 	reset: () => void;
// 	/** A reference to the currently running message generator if it was already started */
// 	self?: ReturnType<RCPMessageGenerator["start"]>;
// 	/** A reference to the last generated message, or undefined if the generator wasn't started or has finished */
// 	current?: RCPMessage;
// }

export interface RCPTransactionOptions {
	/** The "primary" message this transaction contains, e.g. the un-encapsulated version of a SendData request */
	message: RCPMessage;
	// /**
	//  * The actual messages that will be sent when handling this transaction,
	//  * defined as a message generator to dynamically create the messages.
	//  */
	// parts: RCPMessageGenerator;
	// /** The priority of this transaction */
	// priority: MessagePriority;
	/** Will be resolved/rejected by the Send Thread Machine when the entire transaction is handled */
	promise: DeferredPromise<RCPMessage | void>;

	// /** Gets called with progress updates for a transaction */
	// listener?: TransactionProgressListener;
}

/**
 * Transactions are used to track and correlate messages with their responses.
 */
export class RCPTransaction implements Comparable<RCPTransaction> {
	public constructor(
		private readonly options: RCPTransactionOptions,
	) {
		// // Give the message generator a reference to this transaction
		// options.parts.parent = this;

		// Initialize class fields
		this.promise = options.promise;
		this.message = options.message;
		// this.priority = options.priority;
		// this.parts = options.parts;
		// this.listener = options.listener;

		// We need create the stack on a temporary object or the Error
		// class will try to print the message
		const tmp = { message: "" };
		Error.captureStackTrace(tmp, RCPTransaction);
		this._stack = (tmp as any).stack.replace(/^Error:?\s*\n/, "");
	}

	public clone(): RCPTransaction {
		const ret = new RCPTransaction(this.options);
		for (
			const prop of [
				"_stack",
				// "_progress",
				"creationTimestamp",
			] as const
		) {
			(ret as any)[prop] = this[prop];
		}

		// // The listener callback now lives on the clone
		// this.listener = undefined;

		return ret;
	}

	/** Will be resolved/rejected by the Send Thread Machine when the entire transaction is handled */
	public readonly promise: DeferredPromise<RCPMessage | void>;

	/** The "primary" message this transaction contains */
	public readonly message: RCPMessage;

	// /** The message generator to create the actual messages for this transaction */
	// public readonly parts: RCPMessageGenerator;

	// /** A callback which gets called with state updates of this transaction */
	// private listener?: TransactionProgressListener;

	// private _progress: TransactionProgress | undefined;
	// public setProgress(progress: TransactionProgress): void {
	// 	// Ignore duplicate updates
	// 	if (this._progress?.state === progress.state) return;
	// 	this._progress = progress;
	// 	this.listener?.({ ...progress });
	// }

	// /**
	//  * Returns the current message of this transaction. This is either the currently active partial message
	//  * or the primary message if the generator hasn't been started yet.
	//  */
	// public getCurrentMessage(): RCPMessage | undefined {
	// 	return this.parts.current ?? this.message;
	// }

	// /**
	//  * Starts the transaction's message generator if it hasn't been started yet.
	//  * Returns `true` when the generator was started, `false` if it was already started before.
	//  */
	// public start(): boolean {
	// 	if (!this.parts.self) {
	// 		this.parts.start();
	// 		return true;
	// 	}
	// 	return false;
	// }

	// /**
	//  * Resets this transaction's message generator
	//  */
	// public reset(): void {
	// 	this.parts.reset();
	// }

	// public async generateNextMessage(
	// 	prevResult: RCPMessage | undefined,
	// ): Promise<RCPMessage | undefined> {
	// 	if (!this.parts.self) return;
	// 	// Get the next message from the generator
	// 	const { done, value } = await this.parts.self.next(prevResult!);
	// 	if (!done) return value;
	// }

	/**
	 * Forcefully aborts the message generator by throwing the given result.
	 * Errors will be treated as a rejection of the transaction, everything else as success
	 */
	public abort(result: RCPMessage | ZWaveError | undefined): void {
		/*if (this.parts.self) {
			this.parts.self.throw(result).catch(noop);
		} else */ if (isZWaveError(result)) {
			this.promise.reject(result);
		} else {
			this.promise.resolve(result);
		}
	}

	// /** The priority of this transaction */
	// public priority: MessagePriority;

	/** The timestamp at which the transaction was created */
	public creationTimestamp: number = highResTimestamp();

	/** The stack trace where the transaction was created */
	private _stack: string;
	public get stack(): string {
		return this._stack;
	}

	/** Compares two transactions in order to plan their transmission sequence */
	public compareTo(other: RCPTransaction): CompareResult {
		// // by default, sort by priority
		// if (this.priority < other.priority) return -1;
		// else if (this.priority > other.priority) return 1;

		// for equal priority, sort by the timestamp
		return compareNumberOrString(
			other.creationTimestamp,
			this.creationTimestamp,
		);
	}
}
