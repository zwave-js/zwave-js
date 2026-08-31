import {
	MessagePriority,
	type TXReport,
	type TransactionProgress,
	type TransactionProgressListener,
	TransactionState,
	type ZWaveError,
	highResTimestamp,
	isZWaveError,
} from "@zwave-js/core";
import type { Message } from "@zwave-js/serial";
import { getErrorMessage, noop } from "@zwave-js/shared";
import {
	type Comparable,
	type CompareResult,
	compareNumberOrString,
} from "alcalzone-shared/comparable";
import type { DeferredPromise } from "alcalzone-shared/deferred-promise";
import { NodeStatus } from "../node/_Types.js";
import type { Driver } from "./Driver.js";

export interface MessageGenerator {
	parent: Transaction;
	/** Start a new copy of this message generator */
	start: () => AsyncGenerator<Message, void, Message>;
	/** Resets this message generator so it can be started anew */
	reset: () => void;
	/** A reference to the currently running message generator if it was already started */
	self?: ReturnType<MessageGenerator["start"]>;
	/** A reference to the last generated message, or undefined if the generator wasn't started or has finished */
	current?: Message;
}

export interface TransactionOptions {
	/** The "primary" message this transaction contains, e.g. the un-encapsulated version of a SendData request */
	message: Message;
	/**
	 * The actual messages that will be sent when handling this transaction,
	 * defined as a message generator to dynamically create the messages.
	 */
	parts: MessageGenerator;
	/** The priority of this transaction */
	priority: MessagePriority;
	/**
	 * Ensures this command is transmitted: it will not share another command's
	 * physical transmission and a newer command cannot supersede it.
	 */
	preventDeduplication?: boolean;
	/** Reports the physical outcome exactly once, even when no callers remain attached */
	onSettled?: (result: TransactionResult) => void;
}

/**
 * A caller waiting for the result of a transaction: the promise to settle,
 * plus optional callbacks for progress updates and TX reports. Multiple
 * callers can wait for the same transaction when commands are coalesced.
 */
interface TransactionCaller {
	promise: DeferredPromise<Message | void>;
	listener?: TransactionProgressListener;
	onTXReport?: (report: TXReport) => void;
	/** The lifecycle this caller is currently attached to */
	lifecycle: TransactionLifecycle;
}

/** The physical outcome of a transaction */
export type TransactionResult =
	| { status: "fulfilled"; value: Message | void }
	| { status: "rejected"; reason: unknown };

/**
 * Tracks the state of one physical transmission and distributes progress
 * updates, TX reports and the final result to all attached callers.
 * Requeued clones of a transaction share its lifecycle. When commands are
 * coalesced, callers move between lifecycles.
 */
class TransactionLifecycle {
	public constructor(onSettled?: (result: TransactionResult) => void) {
		this.onSettled = onSettled;
	}

	private readonly onSettled?: (result: TransactionResult) => void;
	private readonly callers = new Set<TransactionCaller>();
	private settled: TransactionResult | undefined;
	private progress: TransactionProgress | undefined;

	/**
	 * Adds a caller. It immediately receives the current progress and, if the
	 * transaction is already settled, the result.
	 */
	public attach(caller: TransactionCaller): void {
		if (this.progress) {
			caller.listener?.({ ...this.progress });
		}
		this.callers.add(caller);
		this.replaySettlement(caller);
	}

	/**
	 * Rejects the given caller's promise and stops its progress updates.
	 * Returns `true` when this removed the last attached caller.
	 */
	public detach(caller: TransactionCaller, error: ZWaveError): boolean {
		if (this.settled || !this.callers.delete(caller)) return false;
		caller.listener?.({
			state: TransactionState.Failed,
			reason: error.message,
		});
		caller.promise.reject(error);
		return this.callers.size === 0;
	}

	/** Whether any callers are waiting for the result */
	public get hasCallers(): boolean {
		return this.callers.size > 0;
	}

	/** Whether the physical outcome is already known */
	public get isSettled(): boolean {
		return this.settled != undefined;
	}

	/**
	 * Reports the physical outcome. The first call wins, emits the terminal
	 * progress update and settles all attached callers.
	 */
	public settle(result: TransactionResult): void {
		if (this.settled) return;
		this.settled = result;
		if (result.status === "fulfilled") {
			this.setProgress({ state: TransactionState.Completed });
		} else {
			this.setProgress({
				state: TransactionState.Failed,
				reason: getErrorMessage(result.reason),
			});
		}
		this.onSettled?.(result);
		for (const caller of this.callers) {
			this.replaySettlement(caller);
		}
		this.callers.clear();
	}

	/**
	 * Moves all callers waiting for another lifecycle over to this one,
	 * e.g. when a newer command replaces or joins an older one.
	 */
	public adoptCallersFrom(source: TransactionLifecycle): void {
		if (source === this) return;
		const targetProgress = this.progress;
		const replayTargetProgress = targetProgress != undefined
			&& source.progress?.state !== targetProgress.state;
		for (const caller of source.callers) {
			source.callers.delete(caller);
			// The caller's attachment handle finds the lifecycle through this
			// field. It must point here so detaching affects the right transaction.
			caller.lifecycle = this;
			this.callers.add(caller);
			if (replayTargetProgress) {
				caller.listener?.({ ...targetProgress });
			}
			this.replaySettlement(caller);
		}
	}

	/** Forwards a TX report to all attached callers */
	public reportTXReport(report: TXReport): void {
		for (const caller of this.callers) {
			caller.onTXReport?.(report);
		}
	}

	/**
	 * Notifies all attached callers of a progress update.
	 * Duplicate updates and updates after Completed/Failed are ignored.
	 */
	public setProgress(progress: TransactionProgress): void {
		const previousState = this.progress?.state;
		if (
			previousState === progress.state
			|| previousState === TransactionState.Completed
			|| previousState === TransactionState.Failed
		) {
			return;
		}
		this.progress = progress;
		for (const caller of this.callers) {
			caller.listener?.({ ...progress });
		}
	}

	/** Passes an already-known result on to a single caller */
	private replaySettlement(caller: TransactionCaller): void {
		if (this.settled?.status === "rejected") {
			caller.promise.reject(this.settled.reason);
		} else if (this.settled?.status === "fulfilled") {
			// Coalesced callers all resolve with the same Message instance
			caller.promise.resolve(this.settled.value);
		}
	}
}

/** Lets a single caller manage its attachment to a transaction */
export interface TransactionAttachmentHandle {
	/**
	 * Rejects this caller's promise and stops its progress updates.
	 * Returns `true` when no other callers are waiting for the transmission.
	 */
	detach(error: ZWaveError): boolean;
	/**
	 * Whether this caller gets its result from the given transaction.
	 * Also works after detaching, so the caller can find and cancel
	 * a transmission nobody waits for anymore.
	 */
	sharesLifecycleWith(transaction: Transaction): boolean;
}

/**
 * Transactions are used to track and correlate messages with their responses.
 */
export class Transaction implements Comparable<Transaction> {
	public constructor(
		public readonly driver: Driver,
		private readonly options: TransactionOptions,
		lifecycle?: TransactionLifecycle,
	) {
		// Give the message generator a reference to this transaction
		options.parts.parent = this;

		// Initialize class fields
		this.message = options.message;
		this.priority = options.priority;
		this.parts = options.parts;
		this.preventDeduplication = options.preventDeduplication ?? false;
		this.lifecycle = lifecycle
			?? new TransactionLifecycle(options.onSettled);

		// We need create the stack on a temporary object or the Error
		// class will try to print the message
		const tmp = { message: "" };
		Error.captureStackTrace(tmp, Transaction);
		this._stack = (tmp as any).stack.replace(/^Error:?\s*\n/, "");
	}

	/** Creates a copy of this transaction that shares its lifecycle, e.g. for requeuing */
	public clone(): Transaction {
		const ret = new Transaction(this.driver, this.options, this.lifecycle);
		for (
			const prop of [
				"_stack",
				"creationTimestamp",
				"changeNodeStatusOnTimeout",
				"pauseSendThread",
				"priority",
				"tag",
				"requestWakeUpOnDemand",
				"requestStatusUpdates",
			] as const
		) {
			(ret as any)[prop] = this[prop];
		}

		return ret;
	}

	/** The "primary" message this transaction contains, e.g. the un-encapsulated version of a SendData request */
	public readonly message: Message;

	/** The message generator to create the actual messages for this transaction */
	public readonly parts: MessageGenerator;

	private readonly lifecycle: TransactionLifecycle;

	/**
	 * Adds a caller that waits for this transaction's result.
	 * @param promise Settled with the result of the transaction
	 * @param listener Called with each progress update
	 * @param onTXReport Called when a TX report for the transmission is received
	 */
	public attach(
		promise: DeferredPromise<Message | void>,
		listener?: TransactionProgressListener,
		onTXReport?: (report: TXReport) => void,
	): TransactionAttachmentHandle {
		const caller: TransactionCaller = {
			promise,
			listener,
			onTXReport,
			lifecycle: this.lifecycle,
		};
		this.lifecycle.attach(caller);

		return {
			detach: (error) => caller.lifecycle.detach(caller, error),
			sharesLifecycleWith: (transaction) =>
				caller.lifecycle === transaction.lifecycle,
		};
	}

	/** Whether any callers are waiting for this transaction's result */
	public get hasAttachments(): boolean {
		return this.lifecycle.hasCallers;
	}

	/** Whether the physical outcome of this transaction is already known */
	public get isSettled(): boolean {
		return this.lifecycle.isSettled;
	}

	/** @internal Reports the successful physical outcome, settling all attached callers */
	public settleFulfilled(value: Message | void): void {
		this.lifecycle.settle({ status: "fulfilled", value });
	}

	/** @internal Reports the failed physical outcome, settling all attached callers */
	public settleRejected(reason: unknown): void {
		this.lifecycle.settle({ status: "rejected", reason });
	}

	/** Moves all callers waiting for the given transaction over to this one */
	public adoptCallersFrom(other: Transaction): void {
		this.lifecycle.adoptCallersFrom(other.lifecycle);
	}

	/** Forwards a TX report to all attached callers */
	public reportTXReport(report: TXReport): void {
		this.lifecycle.reportTXReport(report);
	}

	/** Notifies all attached callers of a progress update */
	public setProgress(progress: TransactionProgress): void {
		this.lifecycle.setProgress(progress);
	}

	/**
	 * Returns the current message of this transaction. This is either the currently active partial message
	 * or the primary message if the generator hasn't been started yet.
	 */
	public getCurrentMessage(): Message | undefined {
		return this.parts.current ?? this.message;
	}

	/**
	 * Starts the transaction's message generator if it hasn't been started yet.
	 * Returns `true` when the generator was started, `false` if it was already started before.
	 */
	public start(): boolean {
		if (!this.parts.self) {
			this.parts.start();
			return true;
		}
		return false;
	}

	/**
	 * Resets this transaction's message generator
	 */
	public reset(): void {
		this.parts.reset();
	}

	public async generateNextMessage(
		prevResult: Message | undefined,
	): Promise<Message | undefined> {
		if (!this.parts.self) return;
		// Get the next message from the generator
		const { done, value } = await this.parts.self.next(prevResult!);
		if (!done) return value;
	}

	/**
	 * Forcefully aborts the message generator by throwing the given result.
	 * Errors will be treated as a rejection of the transaction, everything else as success
	 */
	public abort(result: Message | ZWaveError | undefined): void {
		if (this.parts.self) {
			this.parts.self.throw(result).catch(noop);
		} else if (isZWaveError(result)) {
			this.settleRejected(result);
		} else {
			this.settleFulfilled(result);
		}
	}

	/** The priority of this transaction */
	public priority: MessagePriority;

	/**
	 * Ensures this command is transmitted: it will not share another command's
	 * physical transmission and a newer command cannot supersede it.
	 */
	public readonly preventDeduplication: boolean;

	/** The timestamp at which the transaction was created */
	public creationTimestamp: number = highResTimestamp();

	/** Whether the node status should be updated when this transaction times out */
	public changeNodeStatusOnTimeout: boolean = true;

	/** Whether the send thread MUST be paused after this transaction was handled */
	public pauseSendThread: boolean = false;

	/** If a Wake Up On Demand should be requested for the target node. */
	public requestWakeUpOnDemand: boolean = false;

	/** Whether follow-up Supervision status updates are requested. */
	public requestStatusUpdates: boolean = false;

	/** Internal information used to identify or mark this transaction */
	public tag?: any;

	/** The stack trace where the transaction was created */
	private _stack: string;
	public get stack(): string {
		return this._stack;
	}

	/** Compares two transactions in order to plan their transmission sequence */
	public compareTo(other: Transaction): CompareResult {
		// Sort held-back transactions last, so they do not block others
		const thisIsHeld = this.driver.mustHoldTransaction(this);
		const otherIsHeld = this.driver.mustHoldTransaction(other);
		if (thisIsHeld && !otherIsHeld) return 1;
		if (otherIsHeld && !thisIsHeld) return -1;
		const compareWakeUpPriority = (
			_this: Transaction,
			_other: Transaction,
		): CompareResult | undefined => {
			const thisNode = _this.message.tryGetNode(this.driver);
			const otherNode = _other.message.tryGetNode(this.driver);

			// We don't require existence of the node object
			// If any transaction is not for a node, it targets the controller
			// which is always awake
			const thisIsAsleep = thisNode?.status === NodeStatus.Asleep;
			const otherIsAsleep = otherNode?.status === NodeStatus.Asleep;

			// If both nodes are asleep, the conventional order applies
			// Asleep nodes always have the lowest priority
			if (thisIsAsleep && !otherIsAsleep) return 1;
			if (otherIsAsleep && !thisIsAsleep) return -1;
		};

		// delay messages for sleeping nodes
		if (this.priority === MessagePriority.WakeUp) {
			const result = compareWakeUpPriority(this, other);
			if (result != undefined) return result;
		} else if (other.priority === MessagePriority.WakeUp) {
			const result = compareWakeUpPriority(other, this);
			if (result != undefined) return -result as CompareResult;
		}

		const compareNodeQueryPriority = (
			_this: Transaction,
			_other: Transaction,
		): CompareResult | undefined => {
			const thisNode = _this.message.tryGetNode(this.driver);
			const otherNode = _other.message.tryGetNode(this.driver);
			if (thisNode && otherNode) {
				// Both nodes exist
				const thisListening = thisNode.isListening
					|| thisNode.isFrequentListening;
				const otherListening = otherNode.isListening
					|| otherNode.isFrequentListening;
				// prioritize (-1) the one node that is listening when the other is not
				if (thisListening && !otherListening) return -1;
				if (!thisListening && otherListening) return 1;
			}
		};

		// delay NodeQuery messages for non-listening nodes
		if (this.priority === MessagePriority.NodeQuery) {
			const result = compareNodeQueryPriority(this, other);
			if (result != undefined) return result;
		} else if (other.priority === MessagePriority.NodeQuery) {
			const result = compareNodeQueryPriority(other, this);
			if (result != undefined) return -result as CompareResult;
		}

		// by default, sort by priority
		if (this.priority < other.priority) return -1;
		else if (this.priority > other.priority) return 1;

		// for equal priority, sort by the timestamp
		return compareNumberOrString(
			other.creationTimestamp,
			this.creationTimestamp,
		);
	}
}
