import { BasicCCGet, BasicCCReport } from "@zwave-js/cc";
import { MessagePriority } from "@zwave-js/core";
import { type MockNodeBehavior } from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import path from "node:path";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"A Basic CC Set (normal priority) is followed by a Basic CC Get (poll priority): the Get is delayed by pollTime",
	{
		// debug: true,

		provisioningDirectory: path.join(__dirname, "fixtures/basicCC"),

		additionalDriverOptions: {
			timeouts: {
				// Use 1 second poll time so tests complete quickly
				pollTime: 1000,
			},
		},

		async customSetup(_driver, _mockController, mockNode) {
			const respondToBasicCCGet: MockNodeBehavior = {
				async handleCC(controller, _self, receivedCC) {
					if (receivedCC instanceof BasicCCGet) {
						const cc = new BasicCCReport({
							nodeId: controller.ownNodeId,
							currentValue: 50,
						});
						return { action: "sendCC", cc };
					}
				},
			};
			mockNode.defineBehavior(respondToBasicCCGet);
		},

		testBody: async (t, _driver, node, _mockController, _mockNode) => {
			const basic = node.commandClasses.Basic;
			const basicPoll = node.commandClasses.Basic.withOptions({
				priority: MessagePriority.Poll,
			});

			// Start both without awaiting — Set has higher priority and runs first
			const setPromise = basic.set(0xff);
			const getPromise = basicPoll.get();

			await setPromise;
			const setDone = Date.now();

			// Get should be delayed by pollTime after the Set completes
			await getPromise;
			t.expect(Date.now() - setDone).toBeGreaterThanOrEqual(900);
		},
	},
);

integrationTest(
	"Three consecutive Basic CC Gets with poll priority are each separated by pollTime",
	{
		// debug: true,

		provisioningDirectory: path.join(__dirname, "fixtures/basicCC"),

		additionalDriverOptions: {
			timeouts: {
				// Use 1 second poll time so tests complete quickly
				pollTime: 1000,
			},
		},

		async customSetup(_driver, _mockController, mockNode) {
			const respondToBasicCCGet: MockNodeBehavior = {
				async handleCC(controller, _self, receivedCC) {
					if (receivedCC instanceof BasicCCGet) {
						const cc = new BasicCCReport({
							nodeId: controller.ownNodeId,
							currentValue: 50,
						});
						return { action: "sendCC", cc };
					}
				},
			};
			mockNode.defineBehavior(respondToBasicCCGet);
		},

		testBody: async (t, _driver, node, _mockController, _mockNode) => {
			const basicPoll = node.commandClasses.Basic.withOptions({
				priority: MessagePriority.Poll,
			});

			// Queue all three without awaiting
			const get1 = basicPoll.get();
			const get2 = basicPoll.get();
			const get3 = basicPoll.get();

			await get1;
			const after1 = Date.now();
			await get2;
			const after2 = Date.now();
			await get3;
			const after3 = Date.now();

			// Each subsequent poll must wait at least pollTime after the previous one
			t.expect(after2 - after1).toBeGreaterThanOrEqual(900);
			t.expect(after3 - after2).toBeGreaterThanOrEqual(900);
		},
	},
);

integrationTest(
	"A Basic CC Get (poll priority) queued between two Basic CC Sets (normal priority) is executed last, after waiting pollTime",
	{
		// debug: true,

		provisioningDirectory: path.join(__dirname, "fixtures/basicCC"),

		additionalDriverOptions: {
			timeouts: {
				// Use 1 second poll time so tests complete quickly
				pollTime: 1000,
			},
		},

		async customSetup(_driver, _mockController, mockNode) {
			const respondToBasicCCGet: MockNodeBehavior = {
				async handleCC(controller, _self, receivedCC) {
					if (receivedCC instanceof BasicCCGet) {
						const cc = new BasicCCReport({
							nodeId: controller.ownNodeId,
							currentValue: 50,
						});
						return { action: "sendCC", cc };
					}
				},
			};
			mockNode.defineBehavior(respondToBasicCCGet);
		},

		testBody: async (t, _driver, node, _mockController, _mockNode) => {
			const basic = node.commandClasses.Basic;
			const basicPoll = node.commandClasses.Basic.withOptions({
				priority: MessagePriority.Poll,
			});

			// Enqueue: Set1 (normal), Get (poll), Set2 (normal)
			// Expected order: Set1, Set2, Get — Sets have higher priority
			const set1 = basic.set(0xff);
			const getPromise = basicPoll.get();
			const set2 = basic.set(0x00);

			// Both Sets complete quickly before the poll Get
			await set1;
			await set2;
			const setsComplete = Date.now();

			// Get must wait pollTime after the last Set
			await getPromise;
			t.expect(Date.now() - setsComplete).toBeGreaterThanOrEqual(900);
		},
	},
);

integrationTest(
	"A Basic CC Get (poll priority) is sent immediately when pollTime has already elapsed since the last command",
	{
		// debug: true,

		provisioningDirectory: path.join(__dirname, "fixtures/basicCC"),

		additionalDriverOptions: {
			timeouts: {
				// Use 1 second poll time so tests complete quickly
				pollTime: 1000,
			},
		},

		async customSetup(_driver, _mockController, mockNode) {
			const respondToBasicCCGet: MockNodeBehavior = {
				async handleCC(controller, _self, receivedCC) {
					if (receivedCC instanceof BasicCCGet) {
						const cc = new BasicCCReport({
							nodeId: controller.ownNodeId,
							currentValue: 50,
						});
						return { action: "sendCC", cc };
					}
				},
			};
			mockNode.defineBehavior(respondToBasicCCGet);
		},

		testBody: async (t, _driver, node, _mockController, _mockNode) => {
			const basic = node.commandClasses.Basic;
			const basicPoll = node.commandClasses.Basic.withOptions({
				priority: MessagePriority.Poll,
			});

			await basic.set(0xff);

			// Wait longer than pollTime before sending the poll
			await wait(1200);

			// The poll should be sent immediately — no additional delay needed
			const start = Date.now();
			await basicPoll.get();
			t.expect(Date.now() - start).toBeLessThan(200);
		},
	},
);

integrationTest(
	"When the ACK for a poll is delayed, the CommandTime is measured and added to the next poll delay",
	{
		// debug: true,

		provisioningDirectory: path.join(__dirname, "fixtures/basicCC"),

		additionalDriverOptions: {
			timeouts: {
				// Use 1 second poll time so tests complete quickly
				pollTime: 1000,
			},
		},

		async customSetup(_driver, _mockController, mockNode) {
			// Delay the ACK by 500ms to represent a slow radio link.
			// Only BasicCCGet frames will arrive after we disable auto-ACK in testBody,
			// so there is no risk of blocking other traffic.
			const slowAck: MockNodeBehavior = {
				async handleCC(controller, self, receivedCC) {
					if (receivedCC instanceof BasicCCGet) {
						// This delay is what the driver should measure as CommandTime
						// and add on top of pollTime before allowing the next poll.
						await wait(500);
						await self.ackControllerRequestFrame();

						await wait(100);
						const cc = new BasicCCReport({
							nodeId: controller.ownNodeId,
							currentValue: 50,
						});
						return { action: "sendCC", cc };
					}
				},
			};
			mockNode.defineBehavior(slowAck);
		},

		testBody: async (t, _driver, node, _mockController, mockNode) => {
			const basicPoll = node.commandClasses.Basic.withOptions({
				priority: MessagePriority.Poll,
			});

			// Disable auto-ACK now that the driver is fully initialized.
			// From this point on, only our BasicCCGet polls will be sent, so the
			// slowAck behavior above will handle all further frames.
			mockNode.autoAckControllerFrames = false;

			// Queue both polls without awaiting so poll 2 queues while poll 1 is executing
			const get1 = basicPoll.get();
			const get2 = basicPoll.get();

			await get1;
			const poll1End = Date.now();

			await get2;
			const poll2End = Date.now();

			// Poll 1 took ~500ms (CommandTime). The driver should wait at least
			// pollTime (1000ms) + CommandTime (500ms) = 1500ms before starting poll 2.
			// Poll 2 itself takes another ~500ms, so the gap between ends is >= 2000ms.
			t.expect(poll2End - poll1End).toBeGreaterThanOrEqual(1900);
		},
	},
);

integrationTest(
	"A normal-priority command inserted while a poll is waiting resets the poll delay",
	{
		// debug: true,

		provisioningDirectory: path.join(__dirname, "fixtures/basicCC"),

		additionalDriverOptions: {
			timeouts: {
				// Use 1 second poll time so tests complete quickly
				pollTime: 1000,
			},
		},

		async customSetup(_driver, _mockController, mockNode) {
			const respondToBasicCCGet: MockNodeBehavior = {
				async handleCC(controller, _self, receivedCC) {
					if (receivedCC instanceof BasicCCGet) {
						const cc = new BasicCCReport({
							nodeId: controller.ownNodeId,
							currentValue: 50,
						});
						return { action: "sendCC", cc };
					}
				},
			};
			mockNode.defineBehavior(respondToBasicCCGet);
		},

		testBody: async (t, _driver, node, _mockController, _mockNode) => {
			const basic = node.commandClasses.Basic;
			const basicPoll = node.commandClasses.Basic.withOptions({
				priority: MessagePriority.Poll,
			});

			// Queue a Set and a poll Get; the Set runs first and the poll starts waiting
			const setPromise = basic.set(0xff);
			const pollPromise = basicPoll.get();

			// 500ms into the poll's wait window, queue a normal-priority Set.
			// It jumps ahead of the poll and resets its idle timer
			await wait(500);
			const normalSetPromise = basic.set(0x00);

			await setPromise;
			await normalSetPromise;
			const normalSetDone = Date.now();

			// The poll must wait a full pollTime after the normal Set, not the original Set
			await pollPromise;
			t.expect(Date.now() - normalSetDone).toBeGreaterThanOrEqual(900);
		},
	},
);
