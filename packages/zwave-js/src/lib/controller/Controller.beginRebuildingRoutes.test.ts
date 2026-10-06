import { MockController } from "@zwave-js/testing";
import { waitFor } from "@zwave-js/waddle";
import { createDeferredPromise } from "alcalzone-shared/deferred-promise";
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

function queueRebuildWithNodeTask(driver: Driver) {
	const nodeTaskStarted = createDeferredPromise<void>();
	const nodeTaskGate = createDeferredPromise<void>();

	const rebuildTask = driver.scheduler.queueTask({
		priority: TaskPriority.Lower,
		tag: { id: "rebuild-routes" },
		task: async function* () {
			return yield* waitFor({
				priority: TaskPriority.Lower,
				tag: { id: "rebuild-node-routes", nodeId: 2 },
				task: async function* () {
					nodeTaskStarted.resolve();
					yield* waitFor(nodeTaskGate);
					return true;
				},
			});
		},
	});

	return {
		rebuildTask,
		nodeTaskStarted,
		releaseNodeTask: () => nodeTaskGate.resolve(),
	};
}

test("should not start a rebuild while the running rebuild waits for a single node", async ({
	context,
	expect,
}) => {
	const { driver } = context;
	const { rebuildTask, nodeTaskStarted, releaseNodeTask } =
		queueRebuildWithNodeTask(driver);
	await nodeTaskStarted;

	expect(driver.controller.beginRebuildingRoutes()).toBe(false);

	releaseNodeTask();
	await rebuildTask;
});

test("should not start a rebuild when a single node's rebuild has just finished", async ({
	context,
	expect,
}) => {
	const { driver } = context;
	const { rebuildTask, nodeTaskStarted, releaseNodeTask } =
		queueRebuildWithNodeTask(driver);
	await nodeTaskStarted;

	// Callers of rebuildNodeRoutes() join the running node task and get its promise
	const nodeTask = driver.scheduler.findTask(
		(t) => t.tag?.id === "rebuild-node-routes",
	)!;
	const startedAfterNodeTask = nodeTask.then(() =>
		driver.controller.beginRebuildingRoutes(),
	);

	releaseNodeTask();
	expect(await startedAfterNodeTask).toBe(false);
	await rebuildTask;
});
