import { type CommandClass, WakeUpCCWakeUpNotification } from "@zwave-js/cc";
import { CommandClasses, InterviewStage, NodeStatus } from "@zwave-js/core";
import {
	type MockNode,
	type MockNodeBehavior,
	MockZWaveFrameType,
	createMockZWaveRequestFrame,
} from "@zwave-js/testing";
import path from "node:path";
import type { ZWaveNode } from "../../node/Node.js";
import {
	type IntegrationTestOptions,
	integrationTest,
} from "../integrationTestSuiteMulti.js";

function sendWakeUpNotification(
	mockNode: MockNode,
	mockController: { ownNodeId: number },
) {
	const cc: CommandClass = new WakeUpCCWakeUpNotification({
		nodeId: mockController.ownNodeId,
	});
	void mockNode.sendToController(
		createMockZWaveRequestFrame(cc, { ackRequested: false }),
	);
}

const nodeCapabilities: IntegrationTestOptions["nodeCapabilities"] = [
	{
		id: 2,
		capabilities: {
			isListening: false,
			isFrequentListening: false,
			commandClasses: [
				CommandClasses["Wake Up"],
				CommandClasses.Version,
			],
		},
	},
	{
		id: 3,
		capabilities: {
			isListening: true,
			isFrequentListening: false,
			commandClasses: [
				CommandClasses.Version,
			],
		},
	},
];

const fixtureDir = path.join(
	__dirname,
	"fixtures/interviewTaskPriority",
);

integrationTest(
	"a sleeping node's interview is paused while asleep, and the listening node's interview proceeds",
	{
		provisioningDirectory: fixtureDir,
		nodeCapabilities,

		testBody: async (t, driver, nodes, mockController, mockNodes) => {
			const [node2, node3] = nodes;
			const [mockNode2] = mockNodes;

			t.expect(node2.interviewStage).toBe(InterviewStage.Complete);
			t.expect(node3.interviewStage).toBe(InterviewStage.Complete);

			const completionOrder: number[] = [];
			node2.on("interview completed", () => completionOrder.push(2));
			node3.on("interview completed", () => completionOrder.push(3));

			t.expect(node2.status).toBe(NodeStatus.Asleep);

			// Trigger re-interviews for both nodes. Node 2 is asleep, so
			// its refreshInfo waits for wakeup before proceeding.
			void node2.refreshInfo();
			void node3.refreshInfo();

			// Wait for node 3's interview to complete
			await new Promise<void>((resolve) => {
				node3.once("interview completed", () => resolve());
			});

			// Node 2's interview should not have started — it is still
			// waiting for wakeup inside refreshInfo
			mockNode2.assertReceivedControllerFrame(
				(frame) => frame.type === MockZWaveFrameType.Request,
				{
					noMatch: true,
					errorMessage:
						"Node 2 should not have received any frames while asleep",
				},
			);

			// Wake node 2 so its refreshInfo and interview can proceed
			sendWakeUpNotification(mockNode2, mockController);

			await new Promise<void>((resolve) => {
				node2.once("interview completed", () => resolve());
			});

			t.expect(node2.interviewStage).toBe(InterviewStage.Complete);
			t.expect(node3.interviewStage).toBe(InterviewStage.Complete);
			t.expect(completionOrder).toEqual([3, 2]);
		},
	},
);

integrationTest(
	"when a node falls asleep during the interview, the listening node's interview proceeds",
	{
		provisioningDirectory: fixtureDir,
		nodeCapabilities,

		customSetup: async (_driver, _mockController, mockNodes) => {
			const [mockNode2] = mockNodes;

			const doNotAnswerWhenAsleep: MockNodeBehavior = {
				handleCC(controller, self, receivedCC) {
					if (!mockNode2.autoAckControllerFrames) {
						return { action: "stop" };
					}
				},
			};
			mockNode2.defineBehavior(doNotAnswerWhenAsleep);
		},

		testBody: async (t, driver, nodes, mockController, mockNodes) => {
			const [node2, node3] = nodes;
			const [mockNode2, mockNode3] = mockNodes;

			t.expect(node2.interviewStage).toBe(InterviewStage.Complete);
			t.expect(node3.interviewStage).toBe(InterviewStage.Complete);

			const completionOrder: number[] = [];
			node2.on("interview completed", () => completionOrder.push(2));
			node3.on("interview completed", () => completionOrder.push(3));

			// After NodeInfo, stop ACKing so the driver detects the node as
			// unresponsive during the CC interview
			const nodeInfoDone = new Promise<void>((resolve) => {
				const handler = (_node: ZWaveNode, stageName: string) => {
					if (stageName === "NodeInfo") {
						node2.off("interview stage completed", handler);
						mockNode2.autoAckControllerFrames = false;
						resolve();
					}
				};
				node2.on("interview stage completed", handler);
			});

			// Mark node 2 as awake, then trigger re-interviews for both nodes
			node2.markAsAwake();
			void node2.refreshInfo();
			void node3.refreshInfo();

			// Wait for the NodeInfo stage, which triggers the sleep simulation
			await nodeInfoDone;

			// Wait for node 2 to be marked as asleep (after failed sends)
			if (node2.status !== NodeStatus.Asleep) {
				await new Promise<void>((resolve) => {
					node2.once("sleep", () => resolve());
				});
			}

			// The interview group should have prevented node 3's interview
			// from starting while node 2's was active
			mockNode3.assertReceivedControllerFrame(
				(frame) => frame.type === MockZWaveFrameType.Request,
				{
					noMatch: true,
					errorMessage:
						"Node 3 should not have received any frames while node 2's interview was running",
				},
			);

			// Node 2's interview task should have exited, releasing the
			// group slot so node 3's interview can proceed.
			// Wait for node 3 to complete.
			if (node3.interviewStage !== InterviewStage.Complete) {
				await new Promise<void>((resolve) => {
					node3.once("interview completed", () => resolve());
				});
			}

			// Re-enable ACKing and wake up node 2
			mockNode2.autoAckControllerFrames = true;
			sendWakeUpNotification(mockNode2, mockController);

			// Wait for node 2 to complete
			if (node2.interviewStage !== InterviewStage.Complete) {
				await new Promise<void>((resolve) => {
					node2.once("interview completed", () => resolve());
				});
			}

			t.expect(node2.interviewStage).toBe(InterviewStage.Complete);
			t.expect(node3.interviewStage).toBe(InterviewStage.Complete);
			t.expect(completionOrder).toEqual([3, 2]);
		},
	},
);
