import type { Message } from "@zwave-js/serial";
import {
	type DeferredPromise,
	createDeferredPromise,
} from "alcalzone-shared/deferred-promise";

/** Sends a message to the controller during exclusive access, bypassing the transaction queues */
export type SendExclusive = (msg: Message) => Promise<Message | undefined>;

export interface ControllerGateLease {
	/** Aborted when the gate is sealed while this lease is active */
	readonly signal: AbortSignal;
	/** Passes the gate to the next waiting operation or opens it. Calling it more than once has no effect. */
	release(): void;
}

/**
 * Grants exclusive access to the controller to one operation at a time.
 * While the gate is closed, only the commands of that operation are sent to the controller.
 *
 * A released gate passes directly to the next waiting operation and only opens when nobody waits.
 * Each controller instance has its own gate. Sealing it aborts the current lease,
 * rejects everyone waiting and keeps the gate closed for good.
 */
export class ControllerGate {
	private current:
		| (ControllerGateLease & { abort(e: Error): void })
		| undefined;
	private waiters: DeferredPromise<ControllerGateLease>[] = [];
	private sealedReason: Error | undefined;
	private openWaiters: DeferredPromise<void>[] = [];
	private sealedSignal = createDeferredPromise<never>();

	public constructor() {
		this.sealedSignal.catch(() => {});
	}

	/** Rejects with the reason when the gate is sealed */
	public whenSealed(): Promise<never> {
		return this.sealedSignal;
	}
	private _closedPeriods = 0;

	/** How often the gate was closed. A handoff to the next operation does not start a new period. */
	public get closedPeriods(): number {
		return this._closedPeriods;
	}

	/** Resolves when the gate is open. Rejects when the gate is sealed. */
	public whenOpen(): Promise<void> {
		if (this.sealedReason) return Promise.reject(this.sealedReason);
		if (!this.current) return Promise.resolve();
		const waiter = createDeferredPromise<void>();
		this.openWaiters.push(waiter);
		return waiter;
	}

	public get isClosed(): boolean {
		return !!this.current || !!this.sealedReason;
	}

	/**
	 * Waits until the gate is free, then closes it.
	 * Rejects if the gate is sealed before that.
	 */
	public close(): Promise<ControllerGateLease> {
		if (this.sealedReason) return Promise.reject(this.sealedReason);
		if (!this.current) {
			this._closedPeriods++;
			return Promise.resolve(this.grant());
		}

		const lease = createDeferredPromise<ControllerGateLease>();
		this.waiters.push(lease);
		return lease;
	}

	/**
	 * Creates the lease for the next operation and makes it the current one.
	 * Releasing the lease passes the gate to the next waiting operation, or opens it when nobody waits.
	 */
	private grant(): ControllerGateLease {
		const abortController = new AbortController();
		const lease = {
			signal: abortController.signal,
			release: () => {
				if (this.current !== lease) return;
				const next = this.waiters.shift();
				if (next) {
					next.resolve(this.grant());
				} else {
					this.current = undefined;
					const waiters = this.openWaiters;
					this.openWaiters = [];
					for (const waiter of waiters) waiter.resolve();
				}
			},
			abort: (e: Error) => abortController.abort(e),
		};
		this.current = lease;
		return lease;
	}

	/** Aborts the current lease, rejects everyone waiting and keeps the gate closed */
	public seal(reason: Error): void {
		if (this.sealedReason) return;
		this.sealedReason = reason;
		this.current?.abort(reason);
		this.current = undefined;
		const waiters = this.waiters;
		this.waiters = [];
		for (const lease of waiters) lease.reject(reason);
		const openWaiters = this.openWaiters;
		this.openWaiters = [];
		for (const waiter of openWaiters) waiter.reject(reason);
		this.sealedSignal.reject(reason);
	}
}
