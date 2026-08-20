import {
	CommandClasses,
	Duration,
	SupervisionStatus,
	type SupervisionUpdateHandler,
	ValueDB,
	type ValueID,
} from "@zwave-js/core";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import {
	TransitionTracker,
	type TransitionTrackerHost,
} from "./TransitionTracker.js";

const currentValueId: ValueID = {
	commandClass: CommandClasses["Multilevel Switch"],
	endpoint: 0,
	property: "currentValue",
};
const targetValueId: ValueID = {
	commandClass: CommandClasses["Multilevel Switch"],
	endpoint: 0,
	property: "targetValue",
};
const durationValueId: ValueID = {
	commandClass: CommandClasses["Multilevel Switch"],
	endpoint: 0,
	property: "duration",
};

function setup(options: {
	seedCurrent?: number;
	seedTarget?: number;
} = {}): {
	valueDB: ValueDB;
	host: TransitionTrackerHost;
	schedulePoll: ReturnType<typeof vi.fn>;
	tracker: TransitionTracker;
	updates: ReturnType<typeof vi.fn>;
} {
	const valueDB = new ValueDB(2, new Map() as any, new Map() as any);
	if (options.seedCurrent != undefined) {
		valueDB.setValue(currentValueId, options.seedCurrent, {
			noEvent: true,
		});
	}
	if (options.seedTarget != undefined) {
		valueDB.setValue(targetValueId, options.seedTarget, { noEvent: true });
	}

	const schedulePoll = vi.fn(() => true);
	const host: TransitionTrackerHost = { valueDB, schedulePoll };
	const tracker = new TransitionTracker(host, {
		currentValueId,
		targetValueId,
		durationValueId,
	});
	const updates = vi.fn();
	tracker.on("transition update", updates);

	return { valueDB, host, schedulePoll, tracker, updates };
}

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

test("seeds from cached values without inferring movement from a stale target", () => {
	const { tracker } = setup({ seedCurrent: 40, seedTarget: 99 });

	expect(tracker.state).toMatchObject({
		movement: "idle",
		currentLevel: 40,
		targetLevel: undefined,
		source: "initial",
	});
});

test("coalesces value events from one report into a single atomic update", async () => {
	const { valueDB, tracker, updates } = setup();

	// One report persists all three values in the same tick
	valueDB.setValue(currentValueId, 10);
	valueDB.setValue(targetValueId, 99);
	valueDB.setValue(durationValueId, new Duration(5, "seconds"));
	await Promise.resolve();

	expect(updates).toHaveBeenCalledTimes(1);
	expect(tracker.state).toMatchObject({
		movement: "increasing",
		currentLevel: 10,
		targetLevel: 99,
	});
});

test("driver-sourced value updates are treated as commanded transitions", async () => {
	const { valueDB, tracker } = setup({ seedCurrent: 10, seedTarget: 10 });

	valueDB.setValue(targetValueId, 80, { source: "driver" });
	await Promise.resolve();

	expect(tracker.state).toMatchObject({
		movement: "increasing",
		currentLevel: 10,
		targetLevel: 80,
		source: "command",
	});
});

test("trackCommand feeds supervision progress and mirrors optimistic updates", async () => {
	const { valueDB, tracker, updates } = setup({ seedCurrent: 0 });

	let onUpdate: SupervisionUpdateHandler;
	const result = await tracker.trackCommand(
		{ type: "set", targetLevel: 99 },
		(handler) => {
			onUpdate = handler;
			return Promise.resolve({
				status: SupervisionStatus.Working,
				remainingDuration: new Duration(10, "seconds"),
			});
		},
	);
	expect(result).toMatchObject({ status: SupervisionStatus.Working });
	expect(tracker.state).toMatchObject({
		movement: "increasing",
		targetLevel: 99,
	});
	// The commanded target is mirrored into the value DB
	expect(valueDB.getValue(targetValueId)).toBe(99);

	onUpdate!({ status: SupervisionStatus.Success });
	expect(tracker.state).toMatchObject({
		movement: "idle",
		currentLevel: 99,
	});
	expect(valueDB.getValue(currentValueId)).toBe(99);

	// Start and end of the transition are exactly two updates
	expect(updates).toHaveBeenCalledTimes(2);
});

test("a session update before the command promise settles starts the transition", async () => {
	const { tracker } = setup({ seedCurrent: 0 });

	let resolveSend: (result: undefined) => void;
	const promise = tracker.trackCommand(
		{ type: "set", targetLevel: 99 },
		(handler) => {
			handler({
				status: SupervisionStatus.Working,
				remainingDuration: new Duration(10, "seconds"),
			});
			return new Promise((resolve) => {
				resolveSend = resolve;
			});
		},
	);
	expect(tracker.state).toMatchObject({
		movement: "increasing",
		targetLevel: 99,
	});

	resolveSend!(undefined);
	await promise;
	// The late promise result must not restart the transition
	expect(tracker.state.movement).toBe("increasing");
});

test("a failed send restores the previous state", async () => {
	const { tracker, updates } = setup({ seedCurrent: 0 });

	await expect(
		tracker.trackCommand(
			{ type: "set", targetLevel: 99 },
			() => Promise.reject(new Error("no connection")),
		),
	).rejects.toThrow();

	expect(tracker.state.movement).toBe("idle");
	expect(updates).not.toHaveBeenCalled();
});

test("verifies via poll after the quiet period and degrades when unanswered", async () => {
	const { schedulePoll, tracker } = setup({ seedCurrent: 0 });

	await tracker.trackCommand(
		{ type: "set", targetLevel: 99 },
		() => Promise.resolve(undefined),
	);
	expect(tracker.state.movement).toBe("increasing");

	// No verification happens while the quiet period is still running
	await vi.advanceTimersByTimeAsync(4000);
	expect(schedulePoll).not.toHaveBeenCalled();

	// Quiet period elapses without any reports
	await vi.advanceTimersByTimeAsync(1000);
	expect(schedulePoll).toHaveBeenCalledWith(
		expect.objectContaining({ property: "currentValue" }),
		{ timeoutMs: 0 },
	);

	// Both verification attempts time out
	await vi.advanceTimersByTimeAsync(10_000);
	expect(schedulePoll).toHaveBeenCalledTimes(2);
	await vi.advanceTimersByTimeAsync(10_000);

	expect(tracker.state).toMatchObject({
		movement: "idle",
		currentLevel: undefined,
		source: "timeout",
	});
});

test("an incoming report answers the verification", async () => {
	const { valueDB, tracker } = setup({ seedCurrent: 99 });

	await tracker.trackCommand(
		{ type: "startLevelChange", direction: "up" },
		() => Promise.resolve(undefined),
	);
	await vi.advanceTimersByTimeAsync(5000);

	valueDB.setValue(currentValueId, 99);
	await Promise.resolve();

	expect(tracker.state).toMatchObject({
		movement: "idle",
		currentLevel: 99,
	});
});

test("destroy stops timers and unsubscribes from the value DB", async () => {
	const { valueDB, tracker, updates } = setup({ seedCurrent: 0 });

	await tracker.trackCommand(
		{ type: "set", targetLevel: 99 },
		() => Promise.resolve(undefined),
	);
	updates.mockClear();
	tracker.destroy();

	valueDB.setValue(currentValueId, 50);
	await vi.advanceTimersByTimeAsync(120_000);

	expect(updates).not.toHaveBeenCalled();
	expect(tracker.state.movement).toBe("increasing");
});
