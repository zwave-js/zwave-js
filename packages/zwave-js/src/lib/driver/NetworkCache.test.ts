import { InterviewStage, NodeType } from "@zwave-js/core";
import { test } from "vitest";
import {
	deserializeNetworkCacheValue,
	serializeNetworkCacheValue,
} from "./NetworkCache.js";

test("deserializeNetworkCacheValue() accepts zero-valued enum members", (t) => {
	// InterviewStage.None and NodeType.Controller are both 0
	t.expect(deserializeNetworkCacheValue("node.1.interviewStage", "None"))
		.toBe(InterviewStage.None);
	t.expect(deserializeNetworkCacheValue("node.1.nodeType", "Controller"))
		.toBe(NodeType.Controller);
});

test("deserializeNetworkCacheValue() still rejects unknown enum members", (t) => {
	t.expect(() =>
		deserializeNetworkCacheValue("node.1.interviewStage", "Nonsense")
	).toThrow();
	t.expect(() => deserializeNetworkCacheValue("node.1.nodeType", "Nonsense"))
		.toThrow();
});

test("Date properties survive a serialization round-trip", (t) => {
	const date = new Date(2026, 0, 1, 12, 34, 56);
	for (const key of ["node.1.lastSeen", "node.1.lastAwake"]) {
		const serialized = serializeNetworkCacheValue(key, date);
		t.expect(serialized).toBe(date.getTime());
		t.expect(deserializeNetworkCacheValue(key, serialized))
			.toStrictEqual(date);
	}
});
