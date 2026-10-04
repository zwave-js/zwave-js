import { MockController } from "@zwave-js/testing";
import { waitFor } from "@zwave-js/waddle";
import { test as baseTest } from "vitest";

import { createDefaultMockControllerBehaviors } from "../../Testing.js";
import type { Driver } from "../driver/Driver.js";
import { createAndStartTestingDriver } from "../driver/DriverMock.js";
import { TaskPriority } from "../driver/Task.js";

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
				loadConfiguration: false,
				skipNodeInterview: true,
				async beforeStartup(mockPort, serial) {
					context.controller = await MockController.create({
						mockPort,
						serial,
					});
					context.controller.defineBehavior(
						...createDefaultMockControllerBehaviors(),
					);
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

test("should not start a rebuild while a single node's routes are being rebuilt", async ({
	context,
	expect,
}) => {
	const { driver } = context;

	// While the network-wide task awaits a per-node sub-task, the scheduler takes the
	// parent out of its queue, so only the sub-task is visible. Model that state
	// directly: a rebuild-node-routes task that stays in flight until we release it.
	let releaseNodeTask: () => void;
	const nodeTaskGate = new Promise<void>((resolve) => {
		releaseNodeTask = resolve;
	});

	const nodeTask = driver.scheduler.queueTask({
		priority: TaskPriority.Lower,
		tag: { id: "rebuild-node-routes", nodeId: 2 },
		task: async function* () {
			yield* waitFor(nodeTaskGate);
			return true;
		},
	});

	// Sanity check: the scheduler really is holding a route rebuild task.
	expect(driver.controller.isRebuildingRoutes).toBe(true);

	expect(driver.controller.beginRebuildingRoutes()).toBe(false);

	releaseNodeTask!();
	await nodeTask;
});
