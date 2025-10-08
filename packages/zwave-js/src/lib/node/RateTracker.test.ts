import { afterEach, beforeEach, describe, test, vi } from "vitest";
import { RateTracker } from "./RateTracker.js";

describe(RateTracker.name, () => {
	beforeEach(() => {
		vi.useFakeTimers();
	});
	afterEach(() => {
		vi.useRealTimers();
	});

	test("should have rate 0 initially", (t) => {
		const sut = new RateTracker(() => {});
		t.expect(sut.rate).toBe(0);
	});

	test("should update rate after recording messages", (t) => {
		const sut = new RateTracker(() => {});
		sut.recordIncomingMessage();
		t.expect(sut.rate).toBe(1 / 60);
	});

	test("should recalculate rate after multiple messages", (t) => {
		const sut = new RateTracker(() => {});
		for (let i = 0; i < 120; i++) {
			sut.recordIncomingMessage();
		}
		t.expect(sut.rate).toBe(2); // 120 messages in 60 seconds
	});

	test("calls onRateChange when rate changes", (t) => {
		const cb = vi.fn();
		const sut = new RateTracker(cb);
		sut.recordIncomingMessage();
		t.expect(cb).toHaveBeenCalledOnce();
		t.expect(cb).toHaveBeenCalledWith(1 / 60);

		// Record another message, should call again
		sut.recordIncomingMessage();
		t.expect(cb).toHaveBeenCalledTimes(2);
		t.expect(cb).toHaveBeenLastCalledWith(2 / 60);
	});

	test("should handle expired timestamps correctly", (t) => {
		const cb = vi.fn();
		const sut = new RateTracker(cb);

		sut.recordIncomingMessage();
		t.expect(sut.rate).toBe(1 / 60);

		vi.advanceTimersByTime(30_000);
		sut.recordIncomingMessage();
		t.expect(sut.rate).toBe(2 / 60);

		vi.advanceTimersByTime(30_000);

		t.expect(sut.rate).toBe(1 / 60);
	});

	test("resets rate when no messages are recorded", (t) => {
		const cb = vi.fn();
		const sut = new RateTracker(cb);

		sut.recordIncomingMessage();
		t.expect(sut.rate).toBe(1 / 60);

		vi.advanceTimersByTime(60_000);
		t.expect(sut.rate).toBe(0);
	});

	test("once per second for 5 minutes has a rate of 1", (t) => {
		const cb = vi.fn();
		const sut = new RateTracker(cb);

		for (let i = 0; i < 300; i++) {
			sut.recordIncomingMessage();
			vi.advanceTimersByTime(1000);
		}

		t.expect(sut.rate).toBe(1);
	});
});
