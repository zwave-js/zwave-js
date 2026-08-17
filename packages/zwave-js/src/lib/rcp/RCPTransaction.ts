import { ZWaveError, ZWaveErrorCodes } from "@zwave-js/core";
import type { RCPMessage } from "@zwave-js/serial";
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
export class RCPTransaction {
	public constructor(options: RCPTransactionOptions) {
		this.promise = options.promise;
		this.message = options.message;

		// We need create the stack on a temporary object or the Error
		// class will try to print the message
		const tmp = { message: "" };
		Error.captureStackTrace(tmp, RCPTransaction);
		this._stack = (tmp as any).stack.replace(/^Error:?\s*\n/, "");
	}

	/** Will be resolved/rejected by the Send Thread Machine when the entire transaction is handled */
	public readonly promise: DeferredPromise<RCPMessage | void>;

	/** The "primary" message this transaction contains */
	public readonly message: RCPMessage;

	/** The stack trace where the transaction was created */
	private _stack: string;
	public get stack(): string {
		return this._stack;
	}

	/**
	 * Is called when the queue discards this transaction before it ran. Only
	 * destroying the host does that, and `Driver_Destroyed` keeps the caller
	 * out of `isTransmissionError`, which would have it retry against a dead
	 * host.
	 */
	public [Symbol.dispose](): void {
		this.promise.reject(
			new ZWaveError(
				"The RCP host was destroyed",
				ZWaveErrorCodes.Driver_Destroyed,
				undefined,
				this._stack,
			),
		);
	}
}
