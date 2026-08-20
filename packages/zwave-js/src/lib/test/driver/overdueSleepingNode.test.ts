import { NodeStatus } from "@zwave-js/core";
import path from "node:path";
import { integrationTest } from "../integrationTestSuite.js";

// The cache fixture reproduces a real device: a Zooz ZSE44 with the default 12 h wake up
// interval whose last contact was 2025-05-15, restored from a previous session.

integrationTest(
	"a sleeping node that stopped reporting in is overdue after being restored from cache",
	{
		provisioningDirectory: path.join(
			__dirname,
			"fixtures/overdueSleepingNode",
		),

		testBody: async (t, driver, node2, mockController, mockNode) => {
			t.expect(node2.status).toBe(NodeStatus.Asleep);
			t.expect(node2.isOverdue).toBe(true);

			const recovered = new Promise<void>((resolve) => {
				node2.once("no longer overdue", () => resolve());
			});

			// Hearing from the node again must clear it
			node2.lastSeen = new Date();
			await recovered;

			t.expect(node2.isOverdue).toBe(false);
		},
	},
);
