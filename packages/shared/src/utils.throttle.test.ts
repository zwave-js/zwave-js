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
	
	// Let the trailing call fire
	vi.advanceTimersByTime(50); // Total: 100ms from start, trailing call should fire
	sinon.assert.calledTwice(spy);
	sinon.assert.calledWith(spy, 1.25);
	
	// Now make another call - this should be throttled for 100ms from when the trailing call fired
	throttled(1.11);
	sinon.assert.calledTwice(spy); // Should not execute immediately
	
	// Advance time but not enough for throttle to pass
	vi.advanceTimersByTime(50);
	throttled(1.30);
	sinon.assert.calledTwice(spy); // Still should not execute
	
	// Advance full throttle period from when trailing call fired
	vi.advanceTimersByTime(50); // Total: 200ms from start, 100ms from trailing call
	sinon.assert.calledThrice(spy);
	sinon.assert.calledWith(spy, 1.30); // Should be the trailing call with last value
});

test("reproduces firmware update progress jumping issue", (t) => {
	const results: number[] = [];
	const throttled = throttle((value: number) => {
		results.push(value);
	}, 250, true);
	
	// Simulate the problematic sequence described in the issue
	throttled(1.15); // Should execute immediately
	vi.advanceTimersByTime(100);
	throttled(1.25); // Should be delayed (trailing)
	vi.advanceTimersByTime(200); // Trailing call fires with 1.25
	throttled(1.11); // This should NOT execute immediately - should be throttled
	vi.advanceTimersByTime(50);
	throttled(1.30); // Should update trailing call
	vi.advanceTimersByTime(200); // Trailing call fires with 1.30
	throttled(1.28); // Should be throttled again
	vi.advanceTimersByTime(250); // Final trailing call fires with 1.28
	
	// The key is that 1.11 should NOT appear because it should be suppressed by 1.30
	// This prevents the "jumping back and forth" behavior described in the issue
	t.expect(results).toEqual([1.15, 1.25, 1.30, 1.28]);
});
