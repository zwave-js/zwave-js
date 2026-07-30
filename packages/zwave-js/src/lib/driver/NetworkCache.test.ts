import { InterviewStage, NodeType } from "@zwave-js/core";
import { test } from "vitest";
import { deserializeNetworkCacheValue } from "./NetworkCache.js";

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
