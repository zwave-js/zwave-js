import { Duration } from "@zwave-js/core";
import { type Timer, setTimer } from "@zwave-js/shared";

export interface MockTransition {
	startValue: number;
	targetValue: number;
	startTime: number;
	durationMs: number;
	timer: Timer;
}

/** Computes the interpolated current value from a running transition. */
export function getTransitionCurrentValue(
	transition: MockTransition,
): number {
	const elapsed = Date.now() - transition.startTime;
	const progress = Math.min(elapsed / transition.durationMs, 1);
	return Math.round(
		transition.startValue
			+ (transition.targetValue - transition.startValue) * progress,
	);
}

/** Returns the remaining duration of a running transition. */
export function getTransitionRemainingDuration(
	transition: MockTransition,
): Duration {
	const remaining = Math.max(
		0,
		transition.durationMs - (Date.now() - transition.startTime),
	);
	return new Duration(Math.ceil(remaining / 1000), "seconds");
}

/**
 * Stops a running transition and returns the interpolated value at
 * the time of stopping.
 */
export function stopTransition(transition: MockTransition): number {
	transition.timer.clear();
	return getTransitionCurrentValue(transition);
}

/**
 * Starts a value transition with proportional duration based on distance.
 * Returns the new {@link MockTransition}, or `undefined` when the
 * transition completes instantly (travelTime is 0 or current equals target).
 */
export function startTransition(options: {
	currentValue: number;
	targetValue: number;
	duration: number;
	onComplete: () => void | Promise<void>;
}): MockTransition | undefined {
	const { currentValue, targetValue, duration, onComplete } = options;

	if (currentValue === targetValue || duration === 0) {
		return undefined;
	}

	const durationMs = Math.round(
		duration * (Math.abs(targetValue - currentValue) / 99),
	);

	return {
		startValue: currentValue,
		targetValue,
		startTime: Date.now(),
		durationMs,
		timer: setTimer(onComplete, durationMs).unref(),
	};
}
