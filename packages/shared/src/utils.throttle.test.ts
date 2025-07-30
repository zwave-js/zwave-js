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

test("subsequent calls after trailing call should respect throttle interval", (t) => {
	const spy = sinon.stub();

	const throttled = throttle(spy, 100, true);
	
	// First call - should execute immediately
	throttled(1.15);
	sinon.assert.calledOnce(spy);
	sinon.assert.calledWith(spy, 1.15);
	
	// Second call during throttle period - should be delayed
	vi.advanceTimersByTime(50);
	throttled(1.25);
	sinon.assert.calledOnce(spy); // Still only one call
	
	// Third call after the initial throttle period but before trailing call fires
	vi.advanceTimersByTime(60); // Total: 110ms from start
	throttled(1.11);
	
	// This call should NOT execute immediately because the trailing call hasn't fired yet
	// and we're still within the throttle window
	sinon.assert.calledOnce(spy); // Should still be only one call
	
	// Advance to when the trailing call should fire (100ms from first call)
	vi.advanceTimersByTime(40); // Total: 150ms from start, trailing call fires
	sinon.assert.calledTwice(spy);
	
	// The next call should now wait for the full throttle interval from when the trailing call fired
	throttled(1.28);
	sinon.assert.calledTwice(spy); // Should not execute immediately
	
	vi.advanceTimersByTime(100); // Wait full throttle interval
	sinon.assert.calledThrice(spy);
	sinon.assert.calledWith(spy, 1.28);
});
