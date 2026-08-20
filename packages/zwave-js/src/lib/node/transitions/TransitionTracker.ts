import type { SchedulePollOptions } from "@zwave-js/cc";
import {
	Duration,
	type SupervisionResult,
	type SupervisionUpdateHandler,
	type ValueDB,
	type ValueID,
	type ValueUpdatedArgs,
	normalizeValueID,
} from "@zwave-js/core";
import { type Timer, TypedEventTarget, setTimer } from "@zwave-js/shared";
import {
	type TransitionCommand,
	type TransitionMachineInput,
	type TransitionMachineTimers,
	type TransitionState,
	TransitionTrackerMachine,
	defaultTransitionMachineConfig,
} from "./TransitionTrackerMachine.js";

export type {
	TransitionCommand,
	TransitionMovement,
	TransitionState,
	TransitionStateSource,
} from "./TransitionTrackerMachine.js";

/** The subset of node functionality the tracker depends on */
export interface TransitionTrackerHost {
	readonly valueDB: ValueDB;
	schedulePoll(valueId: ValueID, options?: SchedulePollOptions): boolean;
}

export interface TransitionTrackerEventCallbacks {
	"transition update": (
		state: Readonly<TransitionState>,
		previous: Readonly<TransitionState>,
	) => void;
}

export interface TransitionTrackerOptions {
	/** Where the current level is stored, if the dimension has a readable level at all */
	currentValueId?: ValueID;
	targetValueId?: ValueID;
	durationValueId?: ValueID;
	/** The lowest level of the tracked dimension. Default: 0 */
	minLevel?: number;
	/** The highest level of the tracked dimension. Default: 99 */
	maxLevel?: number;
	/** Assumed full transition time when no duration is known. Default: 60 seconds */
	defaultTransitionDuration?: Duration;
	/** Quiet time without progress updates before an unsupervised transition is verified. Default: 5 seconds */
	idleDetectionTimeoutMs?: number;
	/** Hard cap after which any transition is verified. Default: 5 minutes */
	maxTransitionDurationMs?: number;
	/** Whether to mirror commanded transitions into the value DB as optimistic updates. Default: `true` */
	synthesizeValueUpdates?: boolean;
	/**
	 * How to verify the current level when the tracker has lost track of a
	 * transition. Defaults to polling `currentValueId`. Pass `null` for
	 * dimensions that cannot be queried at all.
	 */
	verify?: (() => Promise<void>) | null;
}

function isMaybeLevel(value: unknown): value is number | null {
	return value === null || typeof value === "number";
}

function statesEqual(a: TransitionState, b: TransitionState): boolean {
	return a.movement === b.movement
		&& a.currentLevel === b.currentLevel
		&& a.targetLevel === b.targetLevel
		&& a.estimatedDuration?.unit === b.estimatedDuration?.unit
		&& a.estimatedDuration?.value === b.estimatedDuration?.value;
}

/**
 * Tracks transitions of a single level dimension (cover position, tilt,
 * dimmer brightness, ...) by combining commands issued through zwave-js,
 * supervision session updates, and incoming reports into one consolidated,
 * consistent state with atomic change events.
 */
export class TransitionTracker
	extends TypedEventTarget<TransitionTrackerEventCallbacks>
{
	public constructor(
		host: TransitionTrackerHost,
		options: TransitionTrackerOptions,
	) {
		super();
		this.host = host;
		this.currentValueId = options.currentValueId
			&& normalizeValueID(options.currentValueId);
		this.targetValueId = options.targetValueId
			&& normalizeValueID(options.targetValueId);
		this.durationValueId = options.durationValueId
			&& normalizeValueID(options.durationValueId);
		this.synthesizeValueUpdates = options.synthesizeValueUpdates ?? true;
		const currentValueId = this.currentValueId;
		this.verify = options.verify === undefined
			? (currentValueId
				? () => {
					this.host.schedulePoll(currentValueId, { timeoutMs: 0 });
					return Promise.resolve();
				}
				: null)
			: options.verify;

		// Seed the level from cached values, but never infer an ongoing
		// transition from stale cached state
		const cachedLevel = currentValueId
			&& this.host.valueDB.getValue(currentValueId);
		this.machine = new TransitionTrackerMachine({
			minLevel: options.minLevel,
			maxLevel: options.maxLevel,
			defaultTransitionDurationMs:
				options.defaultTransitionDuration?.toMilliseconds()
					?? defaultTransitionMachineConfig
						.defaultTransitionDurationMs,
			idleDetectionTimeoutMs: options.idleDetectionTimeoutMs,
			maxTransitionDurationMs: options.maxTransitionDurationMs,
			canVerify: this.verify != null,
			synthesizeValueUpdates: this.synthesizeValueUpdates,
		}, {
			currentLevel: typeof cachedLevel === "number"
				? cachedLevel
				: undefined,
		});
		this.lastState = this.machine.state;

		this.host.valueDB
			.on("value added", this.onValueEvent)
			.on("value updated", this.onValueEvent);
	}

	private readonly host: TransitionTrackerHost;
	private readonly machine: TransitionTrackerMachine;
	private readonly currentValueId: ValueID | undefined;
	private readonly targetValueId: ValueID | undefined;
	private readonly durationValueId: ValueID | undefined;
	private readonly synthesizeValueUpdates: boolean;
	private readonly verify: (() => Promise<void>) | null;

	private lastState: TransitionState;
	private commandGeneration = 0;
	private destroyed = false;

	private timers: {
		deadline?: { at: number; timer: Timer };
		quiet?: { at: number; timer: Timer };
		verification?: { at: number; timer: Timer };
	} = {};

	// Value events for one report are emitted in the same tick; collect them and
	// dispatch a single consolidated input per microtask
	private pendingUpdate:
		| {
			currentLevel?: number | null;
			targetLevel?: number | null;
			duration?: Duration;
			fromDriver: boolean;
		}
		| undefined;

	/** Returns the consolidated state of the tracked dimension */
	public get state(): Readonly<TransitionState> {
		return this.machine.state;
	}

	private matchValueId(
		args: ValueID,
	): "current" | "target" | "duration" | undefined {
		const matches = (other: ValueID | undefined) =>
			other != undefined
			&& args.commandClass === other.commandClass
			&& (args.endpoint ?? 0) === (other.endpoint ?? 0)
			&& args.property === other.property
			&& args.propertyKey === other.propertyKey;
		if (matches(this.currentValueId)) return "current";
		if (matches(this.targetValueId)) return "target";
		if (matches(this.durationValueId)) return "duration";
	}

	private readonly onValueEvent = (
		args: ValueUpdatedArgs | (ValueID & { newValue: unknown }),
	): void => {
		const which = this.matchValueId(args);
		if (!which) return;

		const fromDriver = "source" in args && args.source === "driver";
		if (!this.pendingUpdate) {
			this.pendingUpdate = { fromDriver };
			queueMicrotask(() => this.flushPendingUpdate());
		}
		// A single node-sourced write makes the whole burst count as a report
		this.pendingUpdate.fromDriver &&= fromDriver;

		const value = args.newValue;
		switch (which) {
			case "current":
				if (isMaybeLevel(value)) {
					this.pendingUpdate.currentLevel = value;
				}
				break;
			case "target":
				if (isMaybeLevel(value)) {
					this.pendingUpdate.targetLevel = value;
				}
				break;
			case "duration": {
				const duration = Duration.from(value as any);
				if (duration) this.pendingUpdate.duration = duration;
				break;
			}
		}
	};

	private flushPendingUpdate(): void {
		if (this.destroyed || !this.pendingUpdate) return;
		const update = this.pendingUpdate;
		this.pendingUpdate = undefined;

		if (update.fromDriver) {
			this.dispatch({
				type: "syntheticUpdate",
				currentLevel: update.currentLevel,
				targetLevel: update.targetLevel,
			});
		} else {
			this.dispatch({
				type: "report",
				currentLevel: update.currentLevel,
				targetLevel: update.targetLevel,
				duration: update.duration,
			});
		}
	}

	private dispatch(input: TransitionMachineInput): void {
		if (this.destroyed) return;
		const now = Date.now();
		const { timers, effects } = this.machine.handleInput(input, now);
		this.reconcileTimers(timers, now);

		for (const effect of effects) {
			switch (effect.type) {
				case "requestVerification":
					void this.verify?.().catch(() => {
						// A failed verification attempt is settled by the verification timeout
					});
					break;
				case "setValueOptimistic": {
					const valueId = effect.which === "current"
						? this.currentValueId
						: this.targetValueId;
					if (valueId) {
						this.host.valueDB.setValue(valueId, effect.level, {
							source: "driver",
						});
					}
					break;
				}
			}
		}

		const state = this.machine.state;
		if (!statesEqual(state, this.lastState)) {
			const previous = this.lastState;
			this.lastState = state;
			this.emit("transition update", state, previous);
		} else {
			this.lastState = state;
		}
	}

	private reconcileTimers(
		desired: TransitionMachineTimers,
		now: number,
	): void {
		const reconcile = (
			key: "deadline" | "quiet" | "verification",
			at: number | undefined,
			input: TransitionMachineInput,
		) => {
			const existing = this.timers[key];
			if (existing?.at === at) return;
			existing?.timer.clear();
			this.timers[key] = at == undefined
				? undefined
				: {
					at,
					timer: setTimer(
						() => this.dispatch(input),
						Math.max(0, at - now),
					).unref(),
				};
		};
		reconcile("deadline", desired.deadline, { type: "deadlineElapsed" });
		reconcile("quiet", desired.quiet, { type: "quietPeriodElapsed" });
		reconcile("verification", desired.verification, {
			type: "verificationTimedOut",
		});
	}

	/**
	 * Executes a level-affecting command while keeping the tracker informed
	 * about its progress, including supervision status updates.
	 *
	 * The `send` callback performs the actual communication and receives a
	 * handler that must be passed to the CC API via
	 * `withOptions({ requestStatusUpdates: true, onUpdate })`.
	 */
	public async trackCommand(
		command: TransitionCommand,
		send: (
			onSupervisionUpdate: SupervisionUpdateHandler,
		) => Promise<SupervisionResult | undefined>,
	): Promise<SupervisionResult | undefined> {
		const generation = ++this.commandGeneration;
		let settled = false;

		this.dispatch({ type: "commandIssued", command });

		const onUpdate: SupervisionUpdateHandler = (update) => {
			// Ignore updates from sessions that were superseded by a newer command
			if (generation !== this.commandGeneration) return;
			// The initial result is dispatched from the command promise
			if (!settled) return;
			this.dispatch({
				type: "supervisionUpdate",
				status: update.status,
				remainingDuration: update.remainingDuration,
			});
		};

		try {
			const result = await send((update) => {
				if (generation !== this.commandGeneration) return;
				if (!settled) {
					// A session update before the promise settles means the
					// transition has started
					settled = true;
					this.dispatch({ type: "commandResult", result: update });
				} else {
					onUpdate(update);
				}
			});
			if (!settled && generation === this.commandGeneration) {
				settled = true;
				this.dispatch({ type: "commandResult", result });
			}
			return result;
		} catch (e) {
			if (!settled && generation === this.commandGeneration) {
				settled = true;
				this.dispatch({ type: "commandFailed" });
			}
			throw e;
		}
	}

	/**
	 * Informs the tracker about a command that was sent outside of
	 * {@link trackCommand}, e.g. as part of a combined command affecting
	 * multiple dimensions at once.
	 */
	public notifyCommand(
		command: TransitionCommand,
		result: SupervisionResult | undefined,
	): void {
		this.commandGeneration++;
		this.dispatch({ type: "commandIssued", command });
		this.dispatch({ type: "commandResult", result });
	}

	/** Feeds a device-initiated level change, e.g. from an unsolicited Multilevel Switch Start/Stop Level Change */
	public handleUnsolicitedLevelChange(
		direction: "up" | "down" | "stop",
	): void {
		this.dispatch({ type: "unsolicitedLevelChange", direction });
	}

	/** Removes all listeners and stops all timers */
	public destroy(): void {
		this.destroyed = true;
		this.host.valueDB
			.off("value added", this.onValueEvent)
			.off("value updated", this.onValueEvent);
		for (const key of ["deadline", "quiet", "verification"] as const) {
			this.timers[key]?.timer.clear();
			this.timers[key] = undefined;
		}
		this.removeAllListeners();
	}
}
