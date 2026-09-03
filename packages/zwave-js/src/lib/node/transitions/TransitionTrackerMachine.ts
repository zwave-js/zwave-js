import {
	Duration,
	type SupervisionResult,
	SupervisionStatus,
} from "@zwave-js/core";

/** The direction a tracked level is currently moving in. "unknown" means an ongoing transition with underivable direction */
export type TransitionMovement =
	| "idle"
	| "increasing"
	| "decreasing"
	| "unknown";

/** What caused the most recent transition state change */
export type TransitionStateSource =
	| "initial"
	| "command"
	| "report"
	| "supervision"
	| "timeout";

/** Consolidated, consistent view of a tracked level dimension */
export interface TransitionState {
	movement: TransitionMovement;
	/** Last known level. `undefined` while the level is unknown, e.g. mid-travel on devices without position feedback */
	currentLevel?: number;
	/** The level being moved towards, if known */
	targetLevel?: number;
	/** Estimated duration of the ongoing transition, if known */
	estimatedDuration?: Duration;
	source: TransitionStateSource;
}

/** A level-affecting command issued through the tracker */
export type TransitionCommand =
	| {
		type: "set";
		targetLevel: number;
		duration?: Duration;
	}
	| {
		type: "startLevelChange";
		direction: "up" | "down";
		duration?: Duration;
	}
	| { type: "stop" };

export type TransitionMachineInput =
	| { type: "commandIssued"; command: TransitionCommand }
	| { type: "commandResult"; result: SupervisionResult | undefined }
	| { type: "commandFailed" }
	| {
		type: "supervisionUpdate";
		status: SupervisionStatus;
		remainingDuration?: Duration;
	}
	// For level fields, `null` means the device reported the level as unknown,
	// `undefined` means the field was not part of the update
	| {
		type: "report";
		currentLevel?: number | null;
		targetLevel?: number | null;
		duration?: Duration;
	}
	| {
		type: "syntheticUpdate";
		currentLevel?: number | null;
		targetLevel?: number | null;
	}
	| { type: "unsolicitedLevelChange"; direction: "up" | "down" | "stop" }
	| { type: "deadlineElapsed" }
	| { type: "quietPeriodElapsed" }
	| { type: "verificationTimedOut" };

export type TransitionMachineEffect =
	| { type: "requestVerification" }
	| {
		type: "setValueOptimistic";
		which: "current" | "target";
		level: number;
	};

/** Desired active timers as absolute timestamps. The host reconciles these with its running timers */
export interface TransitionMachineTimers {
	deadline?: number;
	quiet?: number;
	verification?: number;
}

export interface TransitionMachineResult {
	timers: TransitionMachineTimers;
	effects: TransitionMachineEffect[];
}

export interface TransitionMachineConfig {
	minLevel: number;
	maxLevel: number;
	/** Assumed full transition time when no duration is known */
	defaultTransitionDurationMs: number;
	/** Quiet time without progress updates before an unsupervised transition is verified */
	idleDetectionTimeoutMs: number;
	/** Hard cap after which any transition is verified */
	maxTransitionDurationMs: number;
	/** Lower bound for the slack added to expected transition durations */
	minSlackMs: number;
	/** Whether the level can be verified by querying the device */
	canVerify: boolean;
	verificationTimeoutMs: number;
	maxVerificationAttempts: number;
	/** Whether to emit optimistic value update effects for commanded transitions */
	synthesizeValueUpdates: boolean;
}

export const defaultTransitionMachineConfig = {
	minLevel: 0,
	maxLevel: 99,
	defaultTransitionDurationMs: 60_000,
	idleDetectionTimeoutMs: 5_000,
	maxTransitionDurationMs: 300_000,
	minSlackMs: 1_000,
	canVerify: true,
	verificationTimeoutMs: 10_000,
	maxVerificationAttempts: 2,
	synthesizeValueUpdates: true,
} as const satisfies TransitionMachineConfig;

type Direction = "up" | "down";

type MachineState =
	| { type: "idle" }
	| {
		type: "commandPending";
		command: TransitionCommand;
		// Restored when sending the command fails
		previous: MachineState;
	}
	| {
		type: "movingSupervised";
		direction?: Direction;
		target?: number;
		deadlineAt: number;
	}
	| {
		type: "movingUnsupervised";
		direction?: Direction;
		target?: number;
		deadlineAt: number;
		quietAt?: number;
	}
	| {
		type: "movingByDevice";
		direction?: Direction;
		target?: number;
		deadlineAt: number;
		quietAt?: number;
	}
	| { type: "stopPending"; deadlineAt: number }
	| { type: "verifying"; attempt: number; verificationAt: number };

function movementFromDirection(
	direction: Direction | undefined,
): TransitionMovement {
	if (direction === "up") return "increasing";
	if (direction === "down") return "decreasing";
	return "unknown";
}

/**
 * Pure state machine for tracking level transitions of a single dimension
 * (cover position, tilt, dimmer brightness, ...). All time-dependent behavior
 * is expressed through the injected `nowMs` and the returned desired timers,
 * so the machine itself is fully deterministic and unit-testable.
 */
export class TransitionTrackerMachine {
	public constructor(
		config: Partial<TransitionMachineConfig> = {},
		seed: { currentLevel?: number } = {},
	) {
		// Options that are present but undefined must not override the defaults
		const merged = { ...defaultTransitionMachineConfig };
		for (const [key, value] of Object.entries(config)) {
			if (value !== undefined) (merged as any)[key] = value;
		}
		this.config = merged;
		this.currentLevel = seed.currentLevel;
	}

	private readonly config: TransitionMachineConfig;
	private machineState: MachineState = { type: "idle" };

	// Best known level information, shared across states
	private currentLevel: number | undefined;
	private targetLevel: number | undefined;
	private estimatedDuration: Duration | undefined;
	private source: TransitionStateSource = "initial";

	/** Returns the consolidated public view of the tracked dimension */
	public get state(): TransitionState {
		const moving = this.isMoving();
		return {
			movement: moving
				? movementFromDirection(this.movingDirection())
				: "idle",
			currentLevel: this.currentLevel,
			targetLevel: moving ? this.targetLevel : undefined,
			estimatedDuration: moving ? this.estimatedDuration : undefined,
			source: this.source,
		};
	}

	private isMoving(): boolean {
		switch (this.machineState.type) {
			case "movingSupervised":
			case "movingUnsupervised":
			case "movingByDevice":
				return true;
			default:
				return false;
		}
	}

	private movingDirection(): Direction | undefined {
		switch (this.machineState.type) {
			case "movingSupervised":
			case "movingUnsupervised":
			case "movingByDevice":
				return this.machineState.direction;
			default:
				return undefined;
		}
	}

	/** Computes the deadline for an expected transition duration, bounded by the hard cap */
	private deadlineFor(nowMs: number, durationMs: number | undefined): number {
		const expected = durationMs ?? this.config.defaultTransitionDurationMs;
		const slack = Math.max(this.config.minSlackMs, expected / 10);
		return nowMs
			+ Math.min(expected + slack, this.config.maxTransitionDurationMs);
	}

	private inferDirection(
		explicit: Direction | undefined,
		target: number | undefined,
		previousLevel: number | undefined,
	): Direction | undefined {
		if (explicit) return explicit;
		if (target != undefined && this.currentLevel != undefined) {
			if (target > this.currentLevel) return "up";
			if (target < this.currentLevel) return "down";
			return undefined;
		}
		if (this.currentLevel != undefined && previousLevel != undefined) {
			if (this.currentLevel > previousLevel) return "up";
			if (this.currentLevel < previousLevel) return "down";
		}
		return undefined;
	}

	private extremeFor(direction: Direction): number {
		return direction === "up" ? this.config.maxLevel : this.config.minLevel;
	}

	/** Applies an input and returns the desired timers and side effects */
	public handleInput(
		input: TransitionMachineInput,
		nowMs: number,
	): TransitionMachineResult {
		const effects: TransitionMachineEffect[] = [];

		switch (input.type) {
			case "commandIssued":
				this.machineState = {
					type: "commandPending",
					command: input.command,
					previous: this.machineState,
				};
				break;

			case "commandFailed":
				if (this.machineState.type === "commandPending") {
					this.machineState = this.machineState.previous;
				}
				break;

			case "commandResult":
				this.onCommandResult(input.result, nowMs, effects);
				break;

			case "supervisionUpdate":
				this.onSupervisionUpdate(
					input.status,
					input.remainingDuration,
					nowMs,
					effects,
				);
				break;

			case "report":
				this.onReport(input, nowMs, effects, "report");
				break;

			case "syntheticUpdate":
				// Optimistic writes caused by raw setValue calls indicate a
				// commanded transition the tracker did not initiate itself
				this.onSyntheticUpdate(input, nowMs);
				break;

			case "unsolicitedLevelChange":
				this.onUnsolicitedLevelChange(input.direction, nowMs);
				break;

			case "deadlineElapsed":
			case "quietPeriodElapsed":
				if (
					this.isMoving() || this.machineState.type === "stopPending"
				) {
					this.enterVerifying(nowMs, effects);
				}
				break;

			case "verificationTimedOut":
				this.onVerificationTimedOut(nowMs, effects);
				break;
		}

		return { timers: this.desiredTimers(), effects };
	}

	private desiredTimers(): TransitionMachineTimers {
		switch (this.machineState.type) {
			case "movingSupervised":
				return { deadline: this.machineState.deadlineAt };
			case "movingUnsupervised":
			case "movingByDevice":
				return {
					deadline: this.machineState.deadlineAt,
					quiet: this.machineState.quietAt,
				};
			case "stopPending":
				return { deadline: this.machineState.deadlineAt };
			case "verifying":
				return { verification: this.machineState.verificationAt };
			default:
				return {};
		}
	}

	private onCommandResult(
		result: SupervisionResult | undefined,
		nowMs: number,
		effects: TransitionMachineEffect[],
	): void {
		if (this.machineState.type !== "commandPending") return;
		const { command } = this.machineState;

		// Resolve the commanded target and direction
		let target: number | undefined;
		let direction: Direction | undefined;
		let commandDuration: Duration | undefined;
		if (command.type === "set") {
			target = command.targetLevel;
			direction = this.inferDirection(undefined, target, undefined);
			commandDuration = command.duration;
		} else if (command.type === "startLevelChange") {
			direction = command.direction;
			target = this.extremeFor(direction);
			commandDuration = command.duration;
		}

		if (command.type === "stop") {
			if (result?.status === SupervisionStatus.Success) {
				// The device stopped somewhere along the way; find out where
				this.source = "supervision";
				this.enterVerifying(nowMs, effects);
			} else if (result?.status === SupervisionStatus.Fail) {
				this.enterVerifying(nowMs, effects);
			} else {
				this.machineState = {
					type: "stopPending",
					// Give the device a moment to report its resting position on its own
					deadlineAt: nowMs + 2000,
				};
				this.source = "command";
			}
			return;
		}

		switch (result?.status) {
			case SupervisionStatus.Working: {
				this.estimatedDuration = result.remainingDuration;
				this.targetLevel = target;
				this.machineState = {
					type: "movingSupervised",
					direction,
					target,
					deadlineAt: this.deadlineFor(
						nowMs,
						result.remainingDuration.toMilliseconds(),
					),
				};
				this.source = "command";
				if (
					this.config.synthesizeValueUpdates
					&& command.type === "set"
					&& target != undefined
				) {
					effects.push({
						type: "setValueOptimistic",
						which: "target",
						level: target,
					});
				}
				break;
			}

			case SupervisionStatus.Success: {
				if (command.type === "set") {
					// The transition completed instantly
					this.currentLevel = target;
					this.targetLevel = undefined;
					this.machineState = { type: "idle" };
					this.source = "supervision";
					if (
						this.config.synthesizeValueUpdates
						&& target != undefined
					) {
						effects.push({
							type: "setValueOptimistic",
							which: "current",
							level: target,
						});
					}
				} else {
					// Supervised Start Level Change commands are typically confirmed
					// with Success while the movement is still ongoing, so treat this
					// like an unsupervised open-ended transition
					this.startUnsupervisedMoving(
						direction,
						target,
						commandDuration,
						nowMs,
						effects,
						command.type,
					);
				}
				break;
			}

			case SupervisionStatus.Fail: {
				this.enterVerifying(nowMs, effects);
				break;
			}

			// NoSupport and unsupervised sends both mean the command was accepted
			// without any completion feedback
			case SupervisionStatus.NoSupport:
			default: {
				this.startUnsupervisedMoving(
					direction,
					target,
					commandDuration,
					nowMs,
					effects,
					command.type,
				);
				break;
			}
		}
	}

	private startUnsupervisedMoving(
		direction: Direction | undefined,
		target: number | undefined,
		duration: Duration | undefined,
		nowMs: number,
		effects: TransitionMachineEffect[],
		commandType: "set" | "startLevelChange",
	): void {
		const durationMs = duration?.toMilliseconds();
		this.estimatedDuration = duration;
		this.targetLevel = target;
		this.machineState = {
			type: "movingUnsupervised",
			direction,
			target,
			deadlineAt: this.deadlineFor(nowMs, durationMs),
			// With a known duration the deadline is authoritative; otherwise rely
			// on a rolling quiet period to detect the end of the transition
			quietAt: durationMs == undefined
				? nowMs + this.config.idleDetectionTimeoutMs
				: undefined,
		};
		this.source = "command";
		if (
			this.config.synthesizeValueUpdates
			&& commandType === "set"
			&& target != undefined
		) {
			effects.push({
				type: "setValueOptimistic",
				which: "target",
				level: target,
			});
		}
	}

	private onSupervisionUpdate(
		status: SupervisionStatus,
		remainingDuration: Duration | undefined,
		nowMs: number,
		effects: TransitionMachineEffect[],
	): void {
		// A session update while the command promise is still pending means the
		// transition has started
		if (this.machineState.type === "commandPending") {
			this.onCommandResult(
				status === SupervisionStatus.Working
					? {
						status,
						remainingDuration: remainingDuration
							?? Duration.unknown(),
					}
					: { status: status as any },
				nowMs,
				effects,
			);
			return;
		}

		if (this.machineState.type !== "movingSupervised") return;

		switch (status) {
			case SupervisionStatus.Working:
				this.estimatedDuration = remainingDuration;
				this.machineState = {
					...this.machineState,
					deadlineAt: this.deadlineFor(
						nowMs,
						remainingDuration?.toMilliseconds(),
					),
				};
				this.source = "supervision";
				break;

			case SupervisionStatus.Success:
				if (this.machineState.target != undefined) {
					this.currentLevel = this.machineState.target;
					this.targetLevel = undefined;
					this.machineState = { type: "idle" };
					this.source = "supervision";
					if (this.config.synthesizeValueUpdates) {
						effects.push({
							type: "setValueOptimistic",
							which: "current",
							level: this.currentLevel,
						});
					}
				} else {
					// The transition finished, but at an unknown level
					this.enterVerifying(nowMs, effects);
				}
				break;

			case SupervisionStatus.Fail:
				// The transition was interrupted, e.g. by manual control
				this.enterVerifying(nowMs, effects);
				break;
		}
	}

	private onReport(
		report: {
			currentLevel?: number | null;
			targetLevel?: number | null;
			duration?: Duration;
		},
		nowMs: number,
		effects: TransitionMachineEffect[],
		source: TransitionStateSource,
	): void {
		const previousLevel = this.currentLevel;
		if (report.currentLevel !== undefined) {
			this.currentLevel = report.currentLevel ?? undefined;
		}
		const reportedTarget = report.targetLevel === undefined
			? undefined
			: report.targetLevel ?? undefined;
		const durationMs = report.duration?.toMilliseconds();

		switch (this.machineState.type) {
			case "idle": {
				const movementReported =
					// An explicit target differing from the current level
					(reportedTarget != undefined
						&& this.currentLevel != undefined
						&& reportedTarget !== this.currentLevel)
					// or a nonzero remaining duration
					|| (durationMs != undefined && durationMs > 0)
					// or a changed current level without any target information
					|| (reportedTarget == undefined
						&& report.currentLevel !== undefined
						&& this.currentLevel !== previousLevel);
				if (movementReported) {
					const target = reportedTarget;
					this.targetLevel = target;
					this.estimatedDuration = report.duration;
					this.machineState = {
						type: "movingByDevice",
						direction: this.inferDirection(
							undefined,
							target,
							previousLevel,
						),
						target,
						deadlineAt: this.deadlineFor(nowMs, durationMs),
						quietAt: durationMs == undefined
							? nowMs + this.config.idleDetectionTimeoutMs
							: undefined,
					};
				}
				this.source = source;
				break;
			}

			case "movingSupervised": {
				// The supervision session remains authoritative for the end of the
				// transition, but level and target updates are taken at face value
				if (reportedTarget != undefined) {
					this.targetLevel = reportedTarget;
					this.machineState = {
						...this.machineState,
						target: reportedTarget,
						direction: this.inferDirection(
							undefined,
							reportedTarget,
							previousLevel,
						) ?? this.machineState.direction,
					};
				}
				this.source = source;
				break;
			}

			case "movingUnsupervised":
			case "movingByDevice": {
				if (reportedTarget != undefined) {
					this.targetLevel = reportedTarget;
					this.machineState = {
						...this.machineState,
						target: reportedTarget,
						direction: this.inferDirection(
							undefined,
							reportedTarget,
							previousLevel,
						) ?? this.machineState.direction,
					};
				}
				const target = this.machineState.target;
				if (this.machineState.direction == undefined) {
					const inferred = this.inferDirection(
						undefined,
						target,
						previousLevel,
					);
					if (inferred) {
						this.machineState = {
							...this.machineState,
							direction: inferred,
						};
					}
				}
				const transitionEnded =
					// The current level reached the target
					(target != undefined
						&& this.currentLevel != undefined
						&& this.currentLevel === target)
					// or the device advertised the transition as finished
					|| (durationMs != undefined
						&& durationMs === 0
						&& report.duration?.unit !== "unknown");
				if (transitionEnded) {
					this.targetLevel = undefined;
					this.estimatedDuration = undefined;
					this.machineState = { type: "idle" };
				} else {
					if (report.duration != undefined) {
						this.estimatedDuration = report.duration;
					}
					// Progress information restarts the quiet period
					this.machineState = {
						...this.machineState,
						deadlineAt: durationMs != undefined
							? this.deadlineFor(nowMs, durationMs)
							: this.machineState.deadlineAt,
						quietAt: this.machineState.quietAt != undefined
							? nowMs + this.config.idleDetectionTimeoutMs
							: undefined,
					};
				}
				this.source = source;
				break;
			}

			case "stopPending": {
				// Any level report after a stop is the resting position
				this.targetLevel = undefined;
				this.estimatedDuration = undefined;
				this.machineState = { type: "idle" };
				this.source = source;
				break;
			}

			case "verifying": {
				const movementReported = (reportedTarget != undefined
					&& this.currentLevel != undefined
					&& reportedTarget !== this.currentLevel)
					|| (durationMs != undefined && durationMs > 0);
				if (movementReported) {
					this.targetLevel = reportedTarget;
					this.estimatedDuration = report.duration;
					this.machineState = {
						type: "movingByDevice",
						direction: this.inferDirection(
							undefined,
							reportedTarget,
							previousLevel,
						),
						target: reportedTarget,
						deadlineAt: this.deadlineFor(nowMs, durationMs),
						quietAt: durationMs == undefined
							? nowMs + this.config.idleDetectionTimeoutMs
							: undefined,
					};
				} else {
					this.targetLevel = undefined;
					this.estimatedDuration = undefined;
					this.machineState = { type: "idle" };
				}
				this.source = source;
				break;
			}

			case "commandPending":
				// Early echo of the previous state; level info was already absorbed
				this.source = source;
				break;
		}
	}

	private onSyntheticUpdate(
		update: { currentLevel?: number | null; targetLevel?: number | null },
		nowMs: number,
	): void {
		// A driver-sourced optimistic target write means a command was issued
		// outside the tracker, e.g. through raw setValue
		if (this.machineState.type === "commandPending") return;
		if (this.isMoving()) return;

		const target = update.targetLevel === undefined
			? undefined
			: update.targetLevel ?? undefined;
		if (target == undefined) {
			if (update.currentLevel !== undefined) {
				this.currentLevel = update.currentLevel ?? undefined;
			}
			return;
		}
		if (this.currentLevel != undefined && target === this.currentLevel) {
			return;
		}

		this.targetLevel = target;
		this.estimatedDuration = undefined;
		this.machineState = {
			type: "movingUnsupervised",
			direction: this.inferDirection(undefined, target, undefined),
			target,
			deadlineAt: this.deadlineFor(nowMs, undefined),
			quietAt: nowMs + this.config.idleDetectionTimeoutMs,
		};
		this.source = "command";
	}

	private onUnsolicitedLevelChange(
		direction: "up" | "down" | "stop",
		nowMs: number,
	): void {
		if (direction === "stop") {
			if (this.isMoving()) {
				this.machineState = {
					type: "stopPending",
					deadlineAt: nowMs + 2000,
				};
				this.source = "report";
			}
			return;
		}

		this.targetLevel = undefined;
		this.estimatedDuration = undefined;
		this.machineState = {
			type: "movingByDevice",
			direction,
			target: undefined,
			deadlineAt: this.deadlineFor(nowMs, undefined),
			quietAt: nowMs + this.config.idleDetectionTimeoutMs,
		};
		this.source = "report";
	}

	private enterVerifying(
		nowMs: number,
		effects: TransitionMachineEffect[],
	): void {
		if (!this.config.canVerify) {
			this.degrade();
			return;
		}
		const attempt = this.machineState.type === "verifying"
			? this.machineState.attempt + 1
			: 1;
		this.machineState = {
			type: "verifying",
			attempt,
			verificationAt: nowMs + this.config.verificationTimeoutMs,
		};
		effects.push({ type: "requestVerification" });
	}

	private onVerificationTimedOut(
		nowMs: number,
		effects: TransitionMachineEffect[],
	): void {
		if (this.machineState.type !== "verifying") return;
		if (this.machineState.attempt < this.config.maxVerificationAttempts) {
			this.enterVerifying(nowMs, effects);
		} else {
			this.degrade();
		}
	}

	/** Gives up on the current transition: not moving, level unknown */
	private degrade(): void {
		this.currentLevel = undefined;
		this.targetLevel = undefined;
		this.estimatedDuration = undefined;
		this.machineState = { type: "idle" };
		this.source = "timeout";
	}
}
