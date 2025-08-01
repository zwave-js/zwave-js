import sinon from "sinon";
import { afterAll, beforeAll, test, vi } from "vitest";
import { throttle } from "./utils.js";

beforeAll((t) => {
	vi.useFakeTimers();
});

afterAll((t) => {
	vi.useRealTimers();
});

test("calls the function immediately when called once", (t) => {
	const spy = sinon.stub();
	const throttled = throttle(spy, 100);
	throttled();
	sinon.assert.calledOnce(spy);
});

test("passes the given parameters along", (t) => {
	const spy = sinon.stub();
	const throttled = throttle(spy, 100);
	throttled(5, 6, "7");
	sinon.assert.calledWith(spy, 5, 6, "7");
});

test("calls the function once when called twice quickly", (t) => {
	const spy = sinon.stub();
	const throttled = throttle(spy, 100);
	throttled(1);
	throttled(2);
	sinon.assert.calledOnce(spy);
	sinon.assert.calledWith(spy, 1);
});

test("only adds a delayed function call when trailing=true", (t) => {
	const spy = sinon.stub();

	// Attempt 1: trailing = false
	let throttled = throttle(spy, 100);
	throttled(1);
	throttled(2);
	sinon.assert.calledOnce(spy);
	vi.advanceTimersByTime(100);
	sinon.assert.calledOnce(spy);

	spy.resetHistory();
	// Attempt 2: trailing = true
	throttled = throttle(spy, 100, true);
	throttled(1);
	throttled(2);
	sinon.assert.calledOnce(spy);
	sinon.assert.calledWith(spy, 1);
	vi.advanceTimersByTime(100);
	sinon.assert.calledTwice(spy);
	sinon.assert.calledWith(spy, 2);
});

test("when called during the wait time for the trailing call, the most recent arguments are used", (t) => {
	const spy = sinon.stub();

	const throttled = throttle(spy, 100, true);
	throttled(1);
	throttled(2);
	sinon.assert.calledOnce(spy);
	sinon.assert.calledWith(spy, 1);
	vi.advanceTimersByTime(50);
	throttled(3);
	vi.advanceTimersByTime(25);
	throttled(4);
	vi.advanceTimersByTime(25);
	sinon.assert.calledTwice(spy);
	sinon.assert.neverCalledWith(spy, 2);
	sinon.assert.calledWith(spy, 4);
});

test("throttle with trailing = true does not generate out-of-order events", (t) => {
	const results: number[] = [];
	const throttled = throttle(
		(value: number) => {
			results.push(value);
		},
		250,
		true,
	);

	// Simulate a realistic firmware update progress sequence
	// Progress should be linear: 1.0% → 1.2% → 1.4% → 1.6% → 1.8%
	// Due to throttling, some events will be discarded, but those received should be in order

	throttled(1.0); // Should execute immediately
	vi.advanceTimersByTime(100);
	throttled(1.2); // Should be delayed (trailing)
	vi.advanceTimersByTime(100);
	throttled(1.4); // Should update the pending trailing call
	vi.advanceTimersByTime(50); // Trailing call fires with 1.4

	// After trailing call, new calls should be properly throttled
	throttled(1.6); // Should be throttled (not execute immediately due to the fix)
	throttled(1.7);
	throttled(1.75);
	vi.advanceTimersByTime(100);
	throttled(1.8); // Should update the pending trailing call
	vi.advanceTimersByTime(150); // Final trailing call fires with 1.8

	// Before the fix, the bug could cause events like [1.0, 1.6, 1.4, 1.8]
	// depending on timing
	t.expect(results).toEqual([1.0, 1.4, 1.8]);
});
