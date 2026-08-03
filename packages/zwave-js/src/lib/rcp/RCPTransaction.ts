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

export interface RCPTransactionOptions {
	/** The "primary" message this transaction contains, e.g. the un-encapsulated version of a SendData request */
	message: RCPMessage;
	/** Will be resolved/rejected by the Send Thread Machine when the entire transaction is handled */
	promise: DeferredPromise<RCPMessage | void>;
}

/**
 * Transactions are used to track and correlate messages with their responses.
 */
export class RCPTransaction implements Comparable<RCPTransaction> {
	public constructor(
		private readonly options: RCPTransactionOptions,
	) {
		this.promise = options.promise;
		this.message = options.message;

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
				"creationTimestamp",
			] as const
		) {
			(ret as any)[prop] = this[prop];
		}

		return ret;
	}

	/** Will be resolved/rejected by the Send Thread Machine when the entire transaction is handled */
	public readonly promise: DeferredPromise<RCPMessage | void>;

	/** The "primary" message this transaction contains */
	public readonly message: RCPMessage;

	/**
	 * Forcefully aborts the message generator by throwing the given result.
	 * Errors will be treated as a rejection of the transaction, everything else as success
	 */
	public abort(result: RCPMessage | ZWaveError | undefined): void {
		if (isZWaveError(result)) {
			this.promise.reject(result);
		} else {
			this.promise.resolve(result);
		}
	}

	/** The timestamp at which the transaction was created */
	public creationTimestamp: number = highResTimestamp();

	/** The stack trace where the transaction was created */
	private _stack: string;
	public get stack(): string {
		return this._stack;
	}

	/** Compares two transactions in order to plan their transmission sequence */
	public compareTo(other: RCPTransaction): CompareResult {
		// Sort by the creation timestamp
		return compareNumberOrString(
			other.creationTimestamp,
			this.creationTimestamp,
		);
	}
}
