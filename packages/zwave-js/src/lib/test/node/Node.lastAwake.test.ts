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

function createNode(driver: Driver, canSleep: boolean): ZWaveNode {
	// Not node 1, which is the controller and can never sleep
	const node = new ZWaveNode(2, driver);
	node["isListening"] = !canSleep;
	node["isFrequentListening"] = false;
	return node;
}

const longAgo = new Date(2020, 0, 1);

test("Marking a sleeping node as awake remembers when it was observed", ({ context, expect }) => {
	const node = createNode(context.driver, true);
	node.markAsAwake();
	expect(node.lastAwake).toBeInstanceOf(Date);
	node.destroy();
});

test("Nodes that are always listening do not track when they were awake", ({ context, expect }) => {
	const node = createNode(context.driver, false);
	node.markAsAwake();
	expect(node.lastAwake).toBeUndefined();
	node.destroy();
});

test("Marking an already awake node as awake updates when it was observed", ({ context, expect }) => {
	const node = createNode(context.driver, true);
	node.markAsAwake();
	node["lastAwake"] = longAgo;

	// The node is already considered awake, so this does not change its status
	node.markAsAwake();
	expect(node.lastAwake.getTime()).toBeGreaterThan(longAgo.getTime());
	node.destroy();
});

test("Restoring the awake status does not count as an observation", ({ context, expect }) => {
	const node = createNode(context.driver, true);
	node["lastAwake"] = longAgo;

	node.restoreAwakeStatus();
	expect(node.lastAwake).toStrictEqual(longAgo);
	node.destroy();
});
