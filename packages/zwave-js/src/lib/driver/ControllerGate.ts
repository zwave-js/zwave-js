import type { Message } from "@zwave-js/serial";
import {
	type DeferredPromise,
	createDeferredPromise,
} from "alcalzone-shared/deferred-promise";

/** Sends a message to the controller during exclusive access, bypassing the transaction queues */
export type SendExclusive = (msg: Message) => Promise<Message | undefined>;

/**
 * Grants exclusive access to the controller to one operation at a time.
 * While the gate is closed, the transaction queues must not start new transactions.
 */
export interface ControllerGateLease {
	/** Opens the gate again. Calling it more than once has no effect. */
	release(): void;
	/** Rejects when the gate is sealed before it was released */
	destroyed: Promise<never>;
}

export class ControllerGate {
	private closed = false;
	private lease:
		| (ControllerGateLease & { reject(e: Error): void })
		| undefined;
	private waiters: DeferredPromise<void>[] = [];

	public get isClosed(): boolean {
		return this.closed;
	}

	/**
	 * Waits until the gate is open, then closes it.
	 * Rejects if the gate is sealed while waiting.
	 */
	public async close(): Promise<ControllerGateLease> {
		while (this.closed) {
			const waiter = createDeferredPromise<void>();
			this.waiters.push(waiter);
			await waiter;
		}
		this.closed = true;

		const destroyed = createDeferredPromise<never>();
		// Nobody might be waiting for this
		destroyed.catch(() => {});
		const lease = {
			release: () => {
				if (this.lease !== lease) return;
				this.lease = undefined;
				this.closed = false;
				this.waiters.shift()?.resolve();
			},
			destroyed,
			reject: (e: Error) => destroyed.reject(e),
		};
		this.lease = lease;
		return lease;
	}

	/** Opens the gate and rejects the current lease and all callers waiting to close it */
	public seal(reason: Error): void {
		this.lease?.reject(reason);
		this.lease = undefined;
		this.closed = false;
		const waiters = this.waiters;
		this.waiters = [];
		for (const waiter of waiters) waiter.reject(reason);
	}
}
