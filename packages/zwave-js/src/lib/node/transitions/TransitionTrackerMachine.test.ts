import { Duration, SupervisionStatus } from "@zwave-js/core";
import { expect, test } from "vitest";
import {
	type TransitionMachineConfig,
	type TransitionMachineInput,
	TransitionTrackerMachine,
} from "./TransitionTrackerMachine.js";

function setup(
	config: Partial<TransitionMachineConfig> = {},
	currentLevel?: number,
): TransitionTrackerMachine {
	return new TransitionTrackerMachine(config, { currentLevel });
}

const set = (
	targetLevel: number,
	duration?: Duration,
): TransitionMachineInput => ({
	type: "commandIssued",
	command: { type: "set", targetLevel, duration },
});

const startLevelChange = (
	direction: "up" | "down",
	duration?: Duration,
): TransitionMachineInput => ({
	type: "commandIssued",
	command: { type: "startLevelChange", direction, duration },
});

const stop: TransitionMachineInput = {
	type: "commandIssued",
	command: { type: "stop" },
};

const result = (
	status?: SupervisionStatus,
	remainingDuration?: Duration,
): TransitionMachineInput => ({
	type: "commandResult",
	result: status == undefined
		? undefined
		: { status, remainingDuration } as any,
});

test("supervised set: Working -> Success completes at the target", () => {
	const machine = setup({}, 0);

	machine.handleInput(set(99), 1000);
	const started = machine.handleInput(
		result(SupervisionStatus.Working, new Duration(10, "seconds")),
		1000,
	);

	expect(machine.state).toMatchObject({
		movement: "increasing",
		currentLevel: 0,
		targetLevel: 99,
	});
	// Slack for a 10 s transition is max(1 s, 10%) = 1 s
	expect(started.timers.deadline).toBe(1000 + 11_000);
	expect(started.timers.quiet).toBeUndefined();
	expect(started.effects).toContainEqual({
		type: "setValueOptimistic",
		which: "target",
		level: 99,
	});

	const finished = machine.handleInput({
		type: "supervisionUpdate",
		status: SupervisionStatus.Success,
	}, 6000);

	expect(machine.state).toMatchObject({
		movement: "idle",
		currentLevel: 99,
		targetLevel: undefined,
	});
	expect(finished.timers).toEqual({});
	expect(finished.effects).toContainEqual({
		type: "setValueOptimistic",
		which: "current",
		level: 99,
	});
});

test("supervised set: Working updates refresh the deadline", () => {
	const machine = setup({}, 0);

	machine.handleInput(set(99), 0);
	machine.handleInput(
		result(SupervisionStatus.Working, new Duration(10, "seconds")),
		0,
	);
	const updated = machine.handleInput({
		type: "supervisionUpdate",
		status: SupervisionStatus.Working,
		remainingDuration: new Duration(8, "seconds"),
	}, 3000);

	expect(updated.timers.deadline).toBe(3000 + 9000);
	expect(machine.state.estimatedDuration).toMatchObject({
		value: 8,
		unit: "seconds",
	});
});

test("supervised set: session failure triggers verification", () => {
	const machine = setup({}, 0);

	machine.handleInput(set(99), 0);
	machine.handleInput(
		result(SupervisionStatus.Working, new Duration(10, "seconds")),
		0,
	);
	const interrupted = machine.handleInput({
		type: "supervisionUpdate",
		status: SupervisionStatus.Fail,
	}, 4000);

	expect(interrupted.effects).toContainEqual({ type: "requestVerification" });
	expect(interrupted.timers.verification).toBe(4000 + 10_000);

	// The verification report settles the state at the actual position
	machine.handleInput({ type: "report", currentLevel: 42 }, 4500);
	expect(machine.state).toMatchObject({
		movement: "idle",
		currentLevel: 42,
	});
});

test("supervised set: immediate Success is an instant transition", () => {
	const machine = setup({}, 0);

	machine.handleInput(set(50), 0);
	const finished = machine.handleInput(result(SupervisionStatus.Success), 0);

	expect(machine.state).toMatchObject({
		movement: "idle",
		currentLevel: 50,
	});
	expect(finished.effects).toContainEqual({
		type: "setValueOptimistic",
		which: "current",
		level: 50,
	});
});

test("supervision update while the command promise is pending starts the transition", () => {
	const machine = setup({}, 0);

	machine.handleInput(set(99), 0);
	machine.handleInput({
		type: "supervisionUpdate",
		status: SupervisionStatus.Working,
		remainingDuration: new Duration(5, "seconds"),
	}, 0);

	expect(machine.state).toMatchObject({
		movement: "increasing",
		targetLevel: 99,
	});
});

test("unsupervised set with duration relies on the deadline only", () => {
	const machine = setup({}, 99);

	machine.handleInput(set(0, new Duration(20, "seconds")), 0);
	const started = machine.handleInput(result(), 0);

	expect(machine.state).toMatchObject({
		movement: "decreasing",
		targetLevel: 0,
	});
	// Slack for a 20 s transition is 10% = 2 s
	expect(started.timers.deadline).toBe(22_000);
	expect(started.timers.quiet).toBeUndefined();
	expect(started.effects).toContainEqual({
		type: "setValueOptimistic",
		which: "target",
		level: 0,
	});

	// The end report settles the transition
	machine.handleInput(
		{ type: "report", currentLevel: 0, targetLevel: 0 },
		18_000,
	);
	expect(machine.state).toMatchObject({
		movement: "idle",
		currentLevel: 0,
	});
});

test("unsupervised set without duration uses a rolling quiet period", () => {
	const machine = setup({}, 0);

	machine.handleInput(set(99), 0);
	const started = machine.handleInput(result(), 0);
	expect(started.timers.quiet).toBe(5000);
	// The default transition duration of 60 s gets 10% slack
	expect(started.timers.deadline).toBe(66_000);

	// Intermediate reports restart the quiet period
	const progress = machine.handleInput(
		{ type: "report", currentLevel: 30 },
		4000,
	);
	expect(progress.timers.quiet).toBe(9000);
	expect(machine.state).toMatchObject({
		movement: "increasing",
		currentLevel: 30,
		targetLevel: 99,
	});

	// Silence triggers verification, the response ends the transition
	const quiet = machine.handleInput({ type: "quietPeriodElapsed" }, 9000);
	expect(quiet.effects).toContainEqual({ type: "requestVerification" });
	machine.handleInput({ type: "report", currentLevel: 99 }, 9500);
	expect(machine.state).toMatchObject({
		movement: "idle",
		currentLevel: 99,
	});
});

test("start level change at the travel limit never stays moving", () => {
	const machine = setup({}, 99);

	machine.handleInput(startLevelChange("up"), 0);
	machine.handleInput(result(), 0);
	expect(machine.state).toMatchObject({
		movement: "increasing",
		targetLevel: 99,
	});

	// The device is already at the limit and never reports anything
	const quiet = machine.handleInput({ type: "quietPeriodElapsed" }, 5000);
	expect(quiet.effects).toContainEqual({ type: "requestVerification" });
	machine.handleInput({ type: "report", currentLevel: 99 }, 5500);
	expect(machine.state).toMatchObject({
		movement: "idle",
		currentLevel: 99,
	});
});

test("supervised start level change with immediate Success remains an open-ended transition", () => {
	const machine = setup({}, 50);

	machine.handleInput(startLevelChange("down"), 0);
	const started = machine.handleInput(result(SupervisionStatus.Success), 0);

	expect(machine.state).toMatchObject({
		movement: "decreasing",
		targetLevel: 0,
	});
	expect(started.timers.quiet).toBe(5000);
});

test("stop: an unsupervised stop waits briefly for a resting position report", () => {
	const machine = setup({}, 0);

	machine.handleInput(set(99), 0);
	machine.handleInput(result(), 0);

	machine.handleInput(stop, 3000);
	const stopped = machine.handleInput(result(), 3000);
	expect(stopped.timers.deadline).toBe(5000);

	machine.handleInput({ type: "report", currentLevel: 40 }, 4000);
	expect(machine.state).toMatchObject({
		movement: "idle",
		currentLevel: 40,
		targetLevel: undefined,
	});
});

test("stop: supervised Success verifies the resting position", () => {
	const machine = setup({}, 0);

	machine.handleInput(set(99), 0);
	machine.handleInput(
		result(SupervisionStatus.Working, new Duration(10, "seconds")),
		0,
	);

	machine.handleInput(stop, 3000);
	const stopped = machine.handleInput(
		result(SupervisionStatus.Success),
		3000,
	);
	expect(stopped.effects).toContainEqual({ type: "requestVerification" });
});

test("device-initiated transition with full reporting (Window Covering)", () => {
	const machine = setup({}, 10);

	const started = machine.handleInput({
		type: "report",
		currentLevel: 10,
		targetLevel: 99,
		duration: new Duration(15, "seconds"),
	}, 0);

	expect(machine.state).toMatchObject({
		movement: "increasing",
		currentLevel: 10,
		targetLevel: 99,
	});
	expect(started.timers.deadline).toBe(16_500);

	machine.handleInput({
		type: "report",
		currentLevel: 99,
		targetLevel: 99,
		duration: new Duration(0, "seconds"),
	}, 15_000);
	expect(machine.state).toMatchObject({
		movement: "idle",
		currentLevel: 99,
	});
});

test("device-initiated transition with current-only reports (MLS v1-3)", () => {
	const machine = setup({}, 0);

	// A changed current level without target information indicates movement
	machine.handleInput({ type: "report", currentLevel: 20 }, 0);
	expect(machine.state).toMatchObject({
		movement: "increasing",
		currentLevel: 20,
		targetLevel: undefined,
	});

	machine.handleInput({ type: "report", currentLevel: 40 }, 2000);
	expect(machine.state.movement).toBe("increasing");

	// After the reports stop, verification settles the state
	const quiet = machine.handleInput({ type: "quietPeriodElapsed" }, 7000);
	expect(quiet.effects).toContainEqual({ type: "requestVerification" });
	machine.handleInput({ type: "report", currentLevel: 55 }, 7500);
	expect(machine.state).toMatchObject({
		movement: "idle",
		currentLevel: 55,
	});
});

test("a consistent report while idle only updates the level", () => {
	const machine = setup({}, 0);

	machine.handleInput({
		type: "report",
		currentLevel: 60,
		targetLevel: 60,
		duration: new Duration(0, "seconds"),
	}, 0);
	expect(machine.state).toMatchObject({
		movement: "idle",
		currentLevel: 60,
	});
});

test("unsolicited level change reports movement with unknown target", () => {
	const machine = setup({}, 50);

	const started = machine.handleInput({
		type: "unsolicitedLevelChange",
		direction: "down",
	}, 0);
	expect(machine.state).toMatchObject({
		movement: "decreasing",
		targetLevel: undefined,
	});
	expect(started.timers.quiet).toBe(5000);

	machine.handleInput({
		type: "unsolicitedLevelChange",
		direction: "stop",
	}, 2000);
	const afterStop = machine.handleInput({ type: "deadlineElapsed" }, 4000);
	expect(afterStop.effects).toContainEqual({ type: "requestVerification" });
});

test("degrades to unknown after exhausted verification attempts", () => {
	const machine = setup({}, 0);

	machine.handleInput(set(99), 0);
	machine.handleInput(result(), 0);
	machine.handleInput({ type: "quietPeriodElapsed" }, 5000);

	const retry = machine.handleInput({ type: "verificationTimedOut" }, 15_000);
	expect(retry.effects).toContainEqual({ type: "requestVerification" });

	machine.handleInput({ type: "verificationTimedOut" }, 25_000);
	expect(machine.state).toMatchObject({
		movement: "idle",
		currentLevel: undefined,
		targetLevel: undefined,
		source: "timeout",
	});
});

test("without verification support, timeouts degrade immediately", () => {
	const machine = setup({ canVerify: false }, undefined);

	machine.handleInput(startLevelChange("up"), 0);
	machine.handleInput(result(), 0);
	expect(machine.state).toMatchObject({
		movement: "increasing",
		currentLevel: undefined,
	});

	const elapsed = machine.handleInput({ type: "deadlineElapsed" }, 70_000);
	expect(elapsed.effects).not.toContainEqual({
		type: "requestVerification",
	});
	expect(machine.state).toMatchObject({
		movement: "idle",
		source: "timeout",
	});
});

test("a level reported as unknown clears the current level", () => {
	const machine = setup({}, 30);

	machine.handleInput(set(99), 0);
	machine.handleInput(result(), 0);
	machine.handleInput({ type: "report", currentLevel: null }, 1000);
	expect(machine.state.currentLevel).toBeUndefined();
	expect(machine.state.movement).toBe("increasing");
});

test("a new command supersedes the ongoing transition", () => {
	const machine = setup({}, 0);

	machine.handleInput(set(99), 0);
	machine.handleInput(result(), 0);
	expect(machine.state.movement).toBe("increasing");

	machine.handleInput({ type: "report", currentLevel: 50 }, 1000);
	machine.handleInput(set(0), 2000);
	machine.handleInput(
		result(SupervisionStatus.Working, new Duration(5, "seconds")),
		2000,
	);
	expect(machine.state).toMatchObject({
		movement: "decreasing",
		targetLevel: 0,
	});
});

test("a failed send restores the previous state", () => {
	const machine = setup({}, 0);

	machine.handleInput(set(99), 0);
	machine.handleInput(result(), 0);

	machine.handleInput(stop, 2000);
	machine.handleInput({ type: "commandFailed" }, 2000);
	expect(machine.state).toMatchObject({
		movement: "increasing",
		targetLevel: 99,
	});
});

test("a synthetic target update tracks raw setValue commands", () => {
	const machine = setup({}, 10);

	const started = machine.handleInput({
		type: "syntheticUpdate",
		targetLevel: 80,
	}, 0);
	expect(machine.state).toMatchObject({
		movement: "increasing",
		currentLevel: 10,
		targetLevel: 80,
		source: "command",
	});
	expect(started.timers.quiet).toBe(5000);
});

test("an unknown remaining duration falls back to the default deadline", () => {
	const machine = setup({}, 0);

	machine.handleInput(set(99), 0);
	const started = machine.handleInput(
		result(SupervisionStatus.Working, Duration.unknown()),
		0,
	);
	// Default 60 s + 10% slack
	expect(started.timers.deadline).toBe(66_000);
});

test("the deadline is bounded by the maximum transition duration", () => {
	const machine = setup({}, 0);

	machine.handleInput(set(99, new Duration(20, "minutes")), 0);
	const started = machine.handleInput(result(), 0);
	expect(started.timers.deadline).toBe(300_000);
});
