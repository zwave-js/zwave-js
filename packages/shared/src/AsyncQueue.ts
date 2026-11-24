import {
	type DeferredPromise,
	createDeferredPromise,
} from "alcalzone-shared/deferred-promise";

export interface AsyncQueueOptions<T> {
	/** Whether an item may be returned from the queue or not. */
	mayTake?: (item: T) => boolean;
}

export class AsyncQueue<T> implements AsyncIterable<T> {
	public constructor(options?: AsyncQueueOptions<T>) {
		this.mayTake = options?.mayTake ?? (() => true);
	}

	private mayTake: (item: T) => boolean;

	/** Adds one or more items onto the queue */
	public add(...items: T[]): void {
		if (items.length === 0 || this.ended) return;

		this.backlog.push(...items);
		this.trigger();
	}

	/** Hands the items that may be taken now to the pending consumers. Items that may not be taken stay in the queue until this is called again. */
	public trigger(): void {
		while (this.listeners.length > 0) {
			const index = this.backlog.findIndex(this.mayTake);
			if (index === -1) return;
			const [item] = this.backlog.splice(index, 1);
			this.listeners.shift()!.resolve(item);
		}
	}

	/**
	 * Removes an item from the queue if it was not processed yet.
	 * The return value indicates whether the item was removed.
	 */
	public remove(item: T): boolean {
		if (this.ended) return false;

		// Remove the item from the backlog
		const index = this.backlog.indexOf(item);
		if (index !== -1) {
			this.backlog.splice(index, 1);
			return true;
		}

		return false;
	}

	public get length(): number {
		return this.backlog.length;
	}

	// A list of items that have been pushed but not pulled
	private backlog: T[] = [];
	// A list of Promises that are waiting to be resolved
	private listeners: DeferredPromise<T | undefined>[] = [];

	// Whether the queue was ended
	private ended = false;

	/** Whether the queue was ended. Items added afterwards are dropped. */
	public get isEnded(): boolean {
		return this.ended;
	}

	/** Ends the queue after it has been drained */
	public end(): void {
		this.ended = true;
	}

	/** Ends the queue and discards all pending items */
	public abort(): void {
		this.ended = true;

		while (this.backlog.length > 0) {
			const removed = this.backlog.pop();
			if (
				typeof removed === "object"
				&& removed !== null
				&& Symbol.dispose in removed
				&& typeof removed[Symbol.dispose] === "function"
			) {
				(removed as any)[Symbol.dispose]();
			}
		}

		for (const p of this.listeners) {
			p.resolve(undefined);
		}
	}

	public [Symbol.asyncIterator](): AsyncIterator<T> {
		return {
			next: async (): Promise<IteratorResult<T>> => {
				let value: T | undefined;

				const index = this.backlog.findIndex(this.mayTake);
				if (index !== -1) {
					// Return the first item that may be taken
					[value] = this.backlog.splice(index, 1);
				} else if (!this.ended) {
					// Otherwise create a new promise and add it to the pending list
					const promise = createDeferredPromise<T | undefined>();
					this.listeners.push(promise);
					value = await promise;
				}

				if (value) {
					// We have a value, return it
					return { value, done: false };
				} else {
					// No value means the queue was ended
					return { value: undefined, done: true };
				}
			},
		};
	}
}
