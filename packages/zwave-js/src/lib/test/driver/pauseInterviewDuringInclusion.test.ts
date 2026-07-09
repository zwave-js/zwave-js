import { VersionCCCommandClassGet } from "@zwave-js/cc";
import { CommandClasses, InterviewStage } from "@zwave-js/core";
import { type MockNodeBehavior, MockZWaveFrameType } from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import { InclusionStrategy } from "../../controller/Inclusion.js";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"an ongoing interview is paused while an inclusion is active",
	{
		// debug: true,

		nodeCapabilities: {
			isListening: true,
			isFrequentListening: false,
			commandClasses: [
				CommandClasses.Version,
				CommandClasses["Binary Switch"],
				CommandClasses.Basic,
			],
		},

		customSetup: async (driver, mockController, mockNode) => {
			// Delay responses so the interview spans the inclusion window
			const delayResponses: MockNodeBehavior = {
				async handleCC(controller, self, receivedCC) {
					await wait(30);
					// Fall through to the default handlers
					return undefined;
				},
			};
			mockNode.defineBehavior(delayResponses);
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			t.expect(node.interviewStage).toBe(InterviewStage.Complete);

			// Detect when the node is in the middle of the Version CC interview,
			// which queries the version of each supported CC one by one. Starting
			// the inclusion here means the in-flight interview step still has
			// multiple commands left to send.
			const midVersionInterview = new Promise<void>((resolve) => {
				const detect: MockNodeBehavior = {
					handleCC(controller, self, receivedCC) {
						if (receivedCC instanceof VersionCCCommandClassGet) {
							resolve();
						}
						// Fall through to the default handlers
						return undefined;
					},
				};
				mockNode.defineBehavior(detect);
			});

			// Re-interview the node and wait until it is busy with the CC interview
			void node.refreshInfo();
			await midVersionInterview;

			// Include another node while the interview is running.
			// The assertion runs synchronously in the event handler: "node added" is
			// emitted in the same tick that ends the inclusion, before the send
			// queue can release any held interview frames.
			const nodeAdded = new Promise<void>((resolve, reject) => {
				driver.controller.once("node added", () => {
					try {
						mockNode.assertReceivedControllerFrame(
							(frame) =>
								frame.type === MockZWaveFrameType.Request,
							{
								noMatch: true,
								errorMessage:
									"The node should not have received any frames while the inclusion was active",
							},
						);
						resolve();
					} catch (e) {
						reject(e as Error);
					}
				});
			});

			mockController.nodePendingInclusion = {
				id: 3,
				capabilities: {
					commandClasses: [
						CommandClasses.Version,
					],
				},
			};
			await driver.controller.beginInclusion({
				strategy: InclusionStrategy.Insecure,
			});

			// The interview must still be running, otherwise this tests nothing
			t.expect(node.interviewStage).not.toBe(InterviewStage.Complete);

			// From this point on, no interview traffic may reach the node.
			// A command that was already in flight has completed, because the
			// inclusion request above went through the same serialized queue.
			mockNode.clearReceivedControllerFrames();

			await nodeAdded;

			// Afterwards, the interview resumes and completes
			if (node.interviewStage !== InterviewStage.Complete) {
				await new Promise<void>((resolve) => {
					node.once("interview completed", () => resolve());
				});
			}
			t.expect(node.interviewStage).toBe(InterviewStage.Complete);
		},
	},
);
