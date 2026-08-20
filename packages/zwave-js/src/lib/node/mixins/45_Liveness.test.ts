import { CommandClasses } from "@zwave-js/core";
import { afterEach, beforeEach, test, vi } from "vitest";
import {
	NodeLivenessMixin,
	TIMEOUT_MAX,
	getOverdueThreshold,
} from "./45_Liveness.js";

test("the overdue threshold is twice the wake up interval plus 10%", (t) => {
	// 1 h -> 2.2 h
	t.expect(getOverdueThreshold(3600)).toBe(7_920_000);
});

test("the overdue threshold matches the worked example from the specification", (t) => {
	// The Z/IP Gateway sleeping node lab uses a 20 s wake up interval and expects the node
	// to be considered failed after 2 * 20 s + 10% = 44 s
	t.expect(getOverdueThreshold(20)).toBe(44_000);
});

test("a wake up interval of 0 yields no threshold", (t) => {
	// 0 means the node only wakes on local events, so there is no predictable pattern of
	// Wake Up Notifications and a failure cannot be detected
	t.expect(getOverdueThreshold(0)).toBeUndefined();
});

test("an unusable wake up interval yields no threshold", (t) => {
	t.expect(getOverdueThreshold(undefined)).toBeUndefined();
	t.expect(getOverdueThreshold(-1)).toBeUndefined();
	t.expect(getOverdueThreshold(NaN)).toBeUndefined();
	t.expect(getOverdueThreshold(Infinity)).toBeUndefined();
});

/**
 * Exercises the scheduling logic in isolation. The node constructor chain needs a driver,
 * so this builds an object on the mixin's prototype and supplies only what the method
 * touches. `canSleep` is a prototype accessor further down the chain, hence defineProperty.
 */
function makeNode(
	lastSeenAgoMs: number | undefined,
	wakeUpInterval: number | undefined,
	canSleep = true,
): any {
	const node = Object.create(NodeLivenessMixin.prototype);
	const events: string[] = [];

	Object.defineProperties(node, {
		_isOverdue: { value: false, writable: true },
		overdueTimer: { value: undefined, writable: true },
		canSleep: { value: canSleep },
		lastSeen: {
			value: lastSeenAgoMs == undefined
				? undefined
				: new Date(Date.now() - lastSeenAgoMs),
			writable: true,
		},
		events: { value: events },
		supportsCC: {
			value: (cc: CommandClasses) => cc === CommandClasses["Wake Up"],
		},
		getValue: { value: () => wakeUpInterval },
		_emit: {
			value: (event: string) => {
				events.push(event);
				return true;
			},
		},
	});

	return node;
}

beforeEach(() => {
	vi.useFakeTimers();
});

afterEach(() => {
	vi.useRealTimers();
});

test("a node silent past its threshold is immediately overdue", (t) => {
	// 12 h interval -> 26.4 h threshold
	const node = makeNode(48 * 3600 * 1000, 43200);
	node.scheduleOverdueCheck();

	t.expect(node.isOverdue).toBe(true);
	t.expect(node.events).toStrictEqual(["overdue"]);
});

test("a node within its threshold only becomes overdue once it elapses", (t) => {
	const node = makeNode(0, 43200);
	node.scheduleOverdueCheck();
	t.expect(node.isOverdue).toBe(false);

	vi.advanceTimersByTime(26 * 3600 * 1000);
	t.expect(node.isOverdue).toBe(false);

	vi.advanceTimersByTime(3600 * 1000);
	t.expect(node.isOverdue).toBe(true);
	t.expect(node.events).toStrictEqual(["overdue"]);
});

test("hearing from an overdue node clears it", (t) => {
	const node = makeNode(48 * 3600 * 1000, 43200);
	node.scheduleOverdueCheck();
	t.expect(node.isOverdue).toBe(true);

	node.lastSeen = new Date();
	node.scheduleOverdueCheck();

	t.expect(node.isOverdue).toBe(false);
	t.expect(node.events).toStrictEqual(["overdue", "no longer overdue"]);
});

test("a wake up interval can exceed what setTimeout accepts in one go", (t) => {
	// 2^24-1 s is the largest a 3 byte Wake Up Interval can express, giving a threshold of
	// ~427 days. Arming setTimeout with that directly makes it fire immediately, which
	// would report a healthy node as overdue, so the wait has to be split up.
	t.expect(getOverdueThreshold(2 ** 24 - 1)!).toBeGreaterThan(TIMEOUT_MAX);

	// Anything beyond roughly 11 days is affected
	t.expect(getOverdueThreshold(14 * 24 * 3600)!).toBeGreaterThan(TIMEOUT_MAX);
	t.expect(getOverdueThreshold(7 * 24 * 3600)!).toBeLessThan(TIMEOUT_MAX);
});

test("a long wait is re-armed instead of firing early", (t) => {
	const node = makeNode(0, 2 ** 24 - 1);
	node.scheduleOverdueCheck();

	// Several times the longest delay a single timer can express
	for (let i = 0; i < 5; i++) {
		vi.advanceTimersByTime(TIMEOUT_MAX);
		t.expect(node.isOverdue).toBe(false);
	}
});

test("an always listening node is never overdue", (t) => {
	const node = makeNode(365 * 24 * 3600 * 1000, 43200, false);
	node.scheduleOverdueCheck();

	t.expect(node.isOverdue).toBe(false);
	t.expect(node.events).toStrictEqual([]);
});

test("a node that only wakes on local events is never overdue", (t) => {
	const node = makeNode(365 * 24 * 3600 * 1000, 0);
	node.scheduleOverdueCheck();

	t.expect(node.isOverdue).toBe(false);
	t.expect(node.events).toStrictEqual([]);
});

test("a node with an unknown wake up interval is never overdue", (t) => {
	const node = makeNode(365 * 24 * 3600 * 1000, undefined);
	node.scheduleOverdueCheck();

	t.expect(node.isOverdue).toBe(false);
	t.expect(node.events).toStrictEqual([]);
});

test("a node that has never been seen is not overdue", (t) => {
	const node = makeNode(undefined, 43200);
	node.scheduleOverdueCheck();

	t.expect(node.isOverdue).toBe(false);
});
