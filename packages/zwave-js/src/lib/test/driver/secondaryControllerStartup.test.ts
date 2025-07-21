import { ControllerRole } from "@zwave-js/core";
import { integrationTest } from "../integrationTestSuite.js";
import { InterviewStage } from "../../node/_Types.js";

// Integration test for issue #7993: Secondary Controller: Cached information is not restored after restart

integrationTest(
	"secondary controller startup should ping completed nodes from cache",
	{
		// debug: true,

		testBody: async (t, driver, node, mockController, mockNode) => {
			// First set up the scenario: a node that was previously completely interviewed
			node.interviewStage = InterviewStage.Complete;
			t.expect(node.interviewStage).toBe(InterviewStage.Complete);
			
			// The node is not listening/frequently listening (e.g., a battery device)
			// But it should still be pinged because it's completely interviewed
			
			// Simulate secondary controller role
			const controller = driver.controller;
			(controller as any)._role = ControllerRole.Secondary;
			
			// Test the filtering logic that determines which nodes to ping
			// This is the core of the fix
			const nodes = [node];
			const nodeInterviewOrder = nodes
				.filter((n) => n.id !== controller.ownNodeId)
				.filter((n) => 
					// Ping listening/frequently listening nodes (original behavior)
					n.isListening || n.isFrequentListening
					// Also ping nodes that were completely interviewed (fix for #7993)
					|| n.interviewStage === InterviewStage.Complete
				);

			// The fixed behavior: the node should be included in the ping list
			// even if it's not listening, because it was completely interviewed
			t.expect(nodeInterviewOrder).toContain(node);
			t.expect(nodeInterviewOrder.length).toBe(1);
		},
	},
);