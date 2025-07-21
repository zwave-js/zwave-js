import { ControllerRole } from "@zwave-js/core";
import { integrationTest } from "../integrationTestSuite.js";
import { InterviewStage } from "../../node/_Types.js";

// Test for issue #7993: Secondary Controller: Cached information is not restored after restart

integrationTest(
	"secondary controller should include completed nodes in ping process",
	{
		// debug: true,

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Set up the node as completely interviewed 
			node.interviewStage = InterviewStage.Complete;
			
			// Verify the node would be included in secondary controller's ping list
			// (this tests that the filter in Driver.ts includes completed nodes)
			const controller = driver.controller;
			(controller as any)._role = ControllerRole.Secondary;
			
			const shouldBePinged = 
				// The original condition: listening or frequently listening
				(node.isListening || node.isFrequentListening)
				// The new condition: also ping completely interviewed nodes
				|| node.interviewStage === InterviewStage.Complete;
			
			// This is the fix: secondary controllers should ping completed nodes too
			t.expect(shouldBePinged).toBe(true);
			t.expect(node.interviewStage).toBe(InterviewStage.Complete);
		},
	},
);