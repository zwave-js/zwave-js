import { WakeUpCCValues } from "@zwave-js/cc";
import { CommandClasses, type MaybeNotKnown } from "@zwave-js/core";
import { type Timer, setTimer } from "@zwave-js/shared";
import { NodeCapabilityValuesMixin } from "./41_CapabilityValues.js";

/**
 * How many times its wake up interval a sleeping node may stay silent before it is
 * considered overdue.
 *
 * Silicon Labs' gateway documentation ("Detection of Sleeping Device Failure",
 * https://docs.silabs.com/z-wave/1.0.1/z-wave-training-docs/gateway-session4-sleeping-nodes)
 * specifies `2 * Wake Up Interval + 10%` for Reporting Sleeping Slaves. Their worked
 * example resolves the ambiguity in that wording: a 20 s interval is given as 44 s, so
 * the 10% applies to the doubled interval rather than the original.
 *
 * Doubling tolerates a single missed notification; the additional 10% absorbs clock
 * drift in the node's sleep timer.
 */
export const OVERDUE_WAKE_UP_INTERVAL_FACTOR = 2.2;

/** `setTimeout` silently fires immediately for delays beyond this, so they are re-armed in chunks. */
export const TIMEOUT_MAX = 2 ** 31 - 1;

/**
 * Computes how long a sleeping node may stay silent before it is considered overdue,
 * in milliseconds. Returns `undefined` when no prediction is possible.
 *
 * @param wakeUpInterval The node's wake up interval in seconds
 */
export function getOverdueThreshold(
	wakeUpInterval: MaybeNotKnown<number>,
): number | undefined {
	// A Wake Up Interval of 0 means the node only wakes on local events, so there is no
	// predictable pattern of Wake Up Notifications and a failure cannot be detected.
	// The comparison also rejects NaN, which would otherwise survive as a NaN threshold.
	if (
		wakeUpInterval == undefined
		|| !(wakeUpInterval > 0)
		|| !Number.isFinite(wakeUpInterval)
	) {
		return undefined;
	}

	return Math.round(
		wakeUpInterval * OVERDUE_WAKE_UP_INTERVAL_FACTOR * 1000,
	);
}

export interface NodeLiveness {
	/**
	 * Whether a sleeping node has failed to report in for significantly longer than its
	 * wake up interval, suggesting it is no longer functioning - typically a dead battery
	 * or a node that is out of range.
	 *
	 * This is always `false` for nodes whose liveness cannot be predicted this way, namely
	 * always listening nodes, FLiRS nodes, and nodes with a wake up interval of 0.
	 */
	readonly isOverdue: boolean;
}

/**
 * Defines functionality to detect sleeping nodes that have stopped waking up.
 *
 * The detection is purely passive - it only observes when expected Wake Up Notifications
 * fail to arrive, and never transmits. This keeps it free of the cost and risk of polling
 * nodes that may be unreachable.
 */
export abstract class NodeLivenessMixin extends NodeCapabilityValuesMixin
	implements NodeLiveness
{
	private overdueTimer: Timer | undefined;
	private _isOverdue: boolean = false;

	public get isOverdue(): boolean {
		return this._isOverdue;
	}

	/** The last time a message was received from this node */
	public abstract get lastSeen(): MaybeNotKnown<Date>;

	private setOverdue(overdue: boolean): void {
		if (overdue === this._isOverdue) return;
		this._isOverdue = overdue;
		this._emit(overdue ? "overdue" : "no longer overdue", this);
	}

	/**
	 * @internal
	 * Re-evaluates whether this node is overdue and schedules the next check.
	 * Called whenever the node is seen and when a sleeping node is restored from cache.
	 */
	public scheduleOverdueCheck(): void {
		this.cancelOverdueCheck();

		// This runs for every received command, so bail out before looking up any values
		// for the nodes that can never be overdue. canSleep is false for always listening
		// and FLiRS nodes; FLiRS failure is detected through failed beaming instead, since
		// those nodes can be reached on demand.
		if (!this.canSleep || !this.supportsCC(CommandClasses["Wake Up"])) {
			this.setOverdue(false);
			return;
		}

		const threshold = getOverdueThreshold(
			this.getValue<number>(WakeUpCCValues.wakeUpInterval.id),
		);
		const lastSeen = this.lastSeen;
		if (threshold == undefined || !lastSeen) {
			this.setOverdue(false);
			return;
		}

		const remaining = threshold - (Date.now() - lastSeen.getTime());
		if (remaining <= 0) {
			// Nodes restored from cache can already be overdue by months, so this must be
			// evaluated immediately instead of waiting for a timer to elapse.
			this.setOverdue(true);
			return;
		}

		this.setOverdue(false);
		// A Wake Up Interval is a 3 byte seconds field, so the delay can exceed what
		// setTimeout accepts, where it would silently fire immediately. Re-arming in
		// chunks and re-evaluating also keeps the result correct if the wall clock and
		// the timer diverge, e.g. after the host suspends.
		this.overdueTimer = setTimer(
			() => this.scheduleOverdueCheck(),
			Math.min(remaining, TIMEOUT_MAX),
		).unref();
	}

	/** @internal */
	public cancelOverdueCheck(): void {
		this.overdueTimer?.clear();
		this.overdueTimer = undefined;
	}

	public override markAsAsleep(): void {
		super.markAsAsleep();
		// Sleeping nodes are marked asleep when restored from cache, which is the only
		// opportunity to notice a node that has not been heard from since a previous session.
		this.scheduleOverdueCheck();
	}
}
