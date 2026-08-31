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
import { noop } from "@zwave-js/shared";
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
	/** Will be resolved/rejected by the Send Thread Machine when the entire transaction is handled */
	promise: DeferredPromise<Message | void>;
	/** Prevents this transaction from sharing another physical transmission. */
	preventDeduplication?: boolean;
	/** @internal */
	attachmentState?: TransactionAttachmentState;
}

interface TransactionAttachment {
	promise: DeferredPromise<Message | void>;
	listener?: TransactionProgressListener;
	onTXReport?: (report: TXReport) => void;
	state: TransactionAttachmentState;
}

type TransactionResult =
	| { status: "fulfilled"; value: Message | void }
	| { status: "rejected"; reason: unknown };

class TransactionAttachmentState {
	public constructor(physicalPromise: DeferredPromise<Message | void>) {
		void physicalPromise.then(
			(value) => this.settle({ status: "fulfilled", value }),
			(reason) => this.settle({ status: "rejected", reason }),
		);
	}

	public readonly attachments = new Set<TransactionAttachment>();
	public settled: TransactionResult | undefined;
	public progress: TransactionProgress | undefined;

	private settle(result: TransactionResult): void {
		if (this.settled) return;
		this.settled = result;
		for (const attachment of this.attachments) {
			if (result.status === "rejected") {
				attachment.promise.reject(result.reason);
			} else {
				attachment.promise.resolve(result.value);
			}
		}
	}
}

export interface TransactionAttachmentHandle {
	detach(error: ZWaveError): void;
	readonly hasAttachments: boolean;
	isAttachedTo(transaction: Transaction): boolean;
}

/**
 * Transactions are used to track and correlate messages with their responses.
 */
export class Transaction implements Comparable<Transaction> {
	public constructor(
		public readonly driver: Driver,
		private readonly options: TransactionOptions,
	) {
		// Give the message generator a reference to this transaction
		options.parts.parent = this;

		// Initialize class fields
		this.promise = options.promise;
		this.message = options.message;
		this.priority = options.priority;
		this.parts = options.parts;
		this.preventDeduplication = options.preventDeduplication ?? false;
		this.attachmentState = options.attachmentState
			?? new TransactionAttachmentState(options.promise);

		// We need create the stack on a temporary object or the Error
		// class will try to print the message
		const tmp = { message: "" };
		Error.captureStackTrace(tmp, Transaction);
		this._stack = (tmp as any).stack.replace(/^Error:?\s*\n/, "");
	}

	public clone(): Transaction {
		const ret = new Transaction(this.driver, {
			...this.options,
			attachmentState: this.attachmentState,
		});
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

	/** Will be resolved/rejected by the Send Thread Machine when the entire transaction is handled */
	public readonly promise: DeferredPromise<Message | void>;

	/** The "primary" message this transaction contains, e.g. the un-encapsulated version of a SendData request */
	public readonly message: Message;

	/** The message generator to create the actual messages for this transaction */
	public readonly parts: MessageGenerator;

	private readonly attachmentState: TransactionAttachmentState;

	public attach(
		promise: DeferredPromise<Message | void>,
		listener?: TransactionProgressListener,
		onTXReport?: (report: TXReport) => void,
	): TransactionAttachmentHandle {
		const attachment: TransactionAttachment = {
			promise,
			listener,
			onTXReport,
			state: this.attachmentState,
		};

		if (this.attachmentState.progress) {
			listener?.({ ...this.attachmentState.progress });
		}
		this.attachmentState.attachments.add(attachment);
		const settled = this.attachmentState.settled;
		if (settled) {
			if (settled.status === "rejected") {
				promise.reject(settled.reason);
			} else {
				promise.resolve(settled.value);
			}
		}

		return {
			detach: (error) => {
				if (
					attachment.state.settled
					|| !attachment.state.attachments.delete(attachment)
				) {
					return;
				}
				attachment.listener?.({
					state: TransactionState.Failed,
					reason: error.message,
				});
				attachment.promise.reject(error);
			},
			get hasAttachments() {
				return attachment.state.attachments.size > 0;
			},
			isAttachedTo: (transaction) =>
				attachment.state === transaction.attachmentState,
		};
	}

	public get hasAttachments(): boolean {
		return this.attachmentState.attachments.size > 0;
	}

	public get isSettled(): boolean {
		return this.attachmentState.settled != undefined;
	}

	public get hasTerminalProgress(): boolean {
		// Terminal progress must be visible before synchronous listeners run
		return (
			this.attachmentState.progress?.state === TransactionState.Completed
			|| this.attachmentState.progress?.state === TransactionState.Failed
		);
	}

	public transferAttachmentsFrom(other: Transaction): void {
		if (other.attachmentState === this.attachmentState) return;
		const sourceState = other.attachmentState;
		const targetProgress = this.attachmentState.progress;
		const replayTargetProgress = targetProgress != undefined
			&& sourceState.progress?.state !== targetProgress.state;
		for (const attachment of sourceState.attachments) {
			sourceState.attachments.delete(attachment);
			// Expiry handles must follow the caller after a protected replacement
			attachment.state = this.attachmentState;
			this.attachmentState.attachments.add(attachment);
			if (replayTargetProgress) {
				attachment.listener?.({ ...targetProgress });
			}
			const settled = this.attachmentState.settled;
			if (settled?.status === "rejected") {
				attachment.promise.reject(settled.reason);
			} else if (settled?.status === "fulfilled") {
				attachment.promise.resolve(settled.value);
			}
		}
	}

	public reportTXReport(report: TXReport): void {
		for (const attachment of this.attachmentState.attachments) {
			attachment.onTXReport?.(report);
		}
	}

	public setProgress(progress: TransactionProgress): void {
		// Ignore duplicate updates
		const previousState = this.attachmentState.progress?.state;
		if (
			previousState === progress.state
			|| previousState === TransactionState.Completed
			|| previousState === TransactionState.Failed
		) {
			return;
		}
		this.attachmentState.progress = progress;
		for (const attachment of this.attachmentState.attachments) {
			attachment.listener?.({ ...progress });
		}
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
			this.promise.reject(result);
		} else {
			this.promise.resolve(result);
		}
	}

	/** The priority of this transaction */
	public priority: MessagePriority;

	/** Prevents this transaction from sharing another physical transmission. */
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
