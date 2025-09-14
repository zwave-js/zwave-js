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
				beforeStartup(mockPort, serial) {
					const controller = new MockController({
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

test("ensure cached skipInterview value", ({ context, expect }) => {
	const { driver } = context;

	const oldNode = new ZWaveNode(2, driver);
	expect(oldNode.skipInterview).toBe(false);
	oldNode.skipInterview = true;
	expect(oldNode.skipInterview).toBe(true);

	const newNode = new ZWaveNode(2, driver);
	expect(newNode.skipInterview).toBe(true);
});

// TODO: Make the node fail S2 and then check if skipInterview is true and also ensure that "interview completed" is NOT emitted
