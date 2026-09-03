import { WakeUpCCWakeUpNotification } from "@zwave-js/cc";
import { MockController } from "@zwave-js/testing";
import { test as baseTest } from "vitest";
import { createDefaultMockControllerBehaviors } from "../../../Testing.js";
import type { Driver } from "../../driver/Driver.js";
import { createAndStartTestingDriver } from "../../driver/DriverMock.js";
import { ZWaveNode } from "../../node/Node.js";

interface LocalTestContext {
	context: {
		driver: Driver;
		controller: MockController;
	};
}

const test = baseTest.extend<LocalTestContext>({
	context: [
		async ({}, use) => {
			// Setup
			const context = {} as LocalTestContext["context"];

			const { driver } = await createAndStartTestingDriver({
				skipNodeInterview: true,
				loadConfiguration: false,
				async beforeStartup(mockPort, serial) {
					const controller = await MockController.create({
						mockPort,
						serial,
					});
					controller.defineBehavior(
						...createDefaultMockControllerBehaviors(),
					);
					context.controller = controller;
				},
			});
			context.driver = driver;

			// Run tests
			await use(context);

			// Teardown
			driver.removeAllListeners();
			await driver.destroy();
		},
		{ auto: true },
	],
});

function createNode(driver: Driver): ZWaveNode {
	// Not node 1, which is the controller and can never sleep
	const node = new ZWaveNode(2, driver);
	node["isListening"] = false;
	node["isFrequentListening"] = false;
	return node;
}

function wakeUpNotification(node: ZWaveNode): WakeUpCCWakeUpNotification {
	return new WakeUpCCWakeUpNotification({ nodeId: node.id });
}

const longAgo = new Date(1970, 0, 1);

test("A Wake Up notification records when the node was awake", async ({ context, expect }) => {
	const node = createNode(context.driver);
	expect(node.lastAwake).toBeUndefined();

	await node.handleCommand(wakeUpNotification(node));
	expect(node.lastAwake).toBeInstanceOf(Date);
	node.destroy();
});

test("Repeated Wake Up notifications update when the node was last awake", async ({ context, expect }) => {
	const node = createNode(context.driver);
	await node.handleCommand(wakeUpNotification(node));
	node.lastAwake = longAgo;

	// The node is already considered awake, so this does not change its status
	await node.handleCommand(wakeUpNotification(node));
	expect(node.lastAwake.getTime()).toBeGreaterThan(longAgo.getTime());
	node.destroy();
});

test("Marking a node as awake does not count as an observation", ({ context, expect }) => {
	const node = createNode(context.driver);
	node.lastAwake = longAgo;

	node.markAsAwake();
	expect(node.lastAwake).toStrictEqual(longAgo);
	node.destroy();
});
