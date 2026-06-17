import { AssociationCCGet, AssociationCCReport } from "@zwave-js/cc";
import { afterEach, test, vi } from "vitest";

afterEach(() => {
	vi.useRealTimers();
});
import {
	PartialCCSessionManager,
	type PartialCCSessionManagerHost,
} from "./PartialCCSessionManager.js";

function report(reportsToFollow: number, nodeIds: number[]) {
	return new AssociationCCReport({
		nodeId: 2,
		groupId: 1,
		maxNodes: 10,
		nodeIds,
		reportsToFollow,
	});
}

function setup() {
	const calls = { rerequested: 0, lost: 0 };
	const requestCC = new AssociationCCGet({ nodeId: 2, groupId: 1 });
	const host: PartialCCSessionManagerHost = {
		getSegmentTimeout: () => 60000,
		getMaxReRequestAttempts: () => 2,
		findRequestCC: () => requestCC,
		rerequestSession: () => void calls.rerequested++,
		onSessionLost: () => void calls.lost++,
	};
	const manager = new PartialCCSessionManager(host);
	return { manager, calls };
}

const dummyMsg = () => ({}) as any;

test("a complete series is merged in transmission order, despite duplicates", (t) => {
	const { manager } = setup();

	t.expect(manager.handleCommand(report(2, [1]), dummyMsg())?.type).toBe(
		"segment",
	);
	// Re-transmission of the same segment
	const dup = manager.handleCommand(report(2, [1]), dummyMsg());
	t.expect(dup).toMatchObject({ type: "segment", duplicate: true });

	t.expect(manager.handleCommand(report(1, [2]), dummyMsg())?.type).toBe(
		"segment",
	);

	const finalMsg = dummyMsg();
	const update = manager.handleCommand(report(0, [3]), finalMsg);
	t.expect(update?.type).toBe("complete");
	if (update?.type === "complete") {
		t.expect(
			update.partials.map((cc) =>
				(cc as AssociationCCReport).reportsToFollow
			),
		).toStrictEqual([2, 1]);
		t.expect(update.finalMsg).toBe(finalMsg);
	}

	manager.clear();
});

test("a missing segment triggers a re-request after the segment timeout", (t) => {
	vi.useFakeTimers();
	const { manager, calls } = setup();

	manager.handleCommand(report(2, [1]), dummyMsg());
	// Segment 1 went missing
	const update = manager.handleCommand(report(0, [3]), dummyMsg());
	t.expect(update?.type).toBe("segment");

	// The missing segment is only considered lost when it
	// does not arrive within the segment timeout
	t.expect(calls.rerequested).toBe(0);
	vi.advanceTimersByTime(60000);
	t.expect(calls.rerequested).toBe(1);

	// The re-requested series patches the hole...
	manager.handleCommand(report(2, [1]), dummyMsg());
	const complete = manager.handleCommand(report(1, [2]), dummyMsg());
	t.expect(complete?.type).toBe("complete");

	// ...and the surplus tail is swallowed
	const surplus = manager.handleCommand(report(0, [3]), dummyMsg());
	t.expect(surplus).toMatchObject({ type: "segment", duplicate: true });

	// Afterwards, a new single-segment response is handled normally again
	const fresh = manager.handleCommand(report(0, [9]), dummyMsg());
	t.expect(fresh?.type).toBe("complete");

	manager.clear();
});

test("segments missing from the surplus tail do not start a new session", (t) => {
	vi.useFakeTimers();
	const { manager, calls } = setup();

	// Segment 2 went missing
	manager.handleCommand(report(3, [1]), dummyMsg());
	manager.handleCommand(report(1, [3]), dummyMsg());
	manager.handleCommand(report(0, [4]), dummyMsg());
	vi.advanceTimersByTime(60000);
	t.expect(calls.rerequested).toBe(1);

	// The re-requested series fills the hole early
	manager.handleCommand(report(3, [1]), dummyMsg());
	const complete = manager.handleCommand(report(2, [2]), dummyMsg());
	t.expect(complete?.type).toBe("complete");

	// Segment 1 of the surplus tail goes missing as well. The remaining
	// segment was already merged and must not look like a new response.
	const surplus = manager.handleCommand(report(0, [4]), dummyMsg());
	t.expect(surplus).toMatchObject({ type: "segment", duplicate: true });

	manager.clear();
});

test("a segment with a higher count than the completed series ends the drain", (t) => {
	const { manager } = setup();

	// Complete a series by filling a hole, which arms the drain
	manager.handleCommand(report(2, [1]), dummyMsg());
	manager.handleCommand(report(0, [3]), dummyMsg());
	manager.handleCommand(report(2, [1]), dummyMsg());
	const complete = manager.handleCommand(report(1, [2]), dummyMsg());
	t.expect(complete?.type).toBe("complete");

	// A new, longer series starts before the surplus tail arrived
	const fresh = manager.handleCommand(report(3, [5]), dummyMsg());
	t.expect(fresh).toMatchObject({ type: "segment", duplicate: false });

	manager.clear();
});
