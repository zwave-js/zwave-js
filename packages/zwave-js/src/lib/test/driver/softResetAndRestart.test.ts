import { waitFor } from "@zwave-js/waddle";
import { test, vi } from "vitest";

import { createAndStartTestingDriver } from "../../driver/DriverMock.js";
import { TaskInterruptBehavior, TaskPriority } from "../../driver/Task.js";

test.sequential("softResetAndRestart does not abort an in-flight NVM restore task", async (t) => {
	const { driver } = await createAndStartTestingDriver({
		loadConfiguration: false,
		skipControllerIdentification: true,
		skipNodeInterview: true,
	});

	const sendMessageSpy = vi
		.spyOn(driver, "sendMessage")
		.mockResolvedValue(undefined as never);
	const ensureSerialAPISpy = vi
		.spyOn(driver as any, "ensureSerialAPI")
		.mockResolvedValue(true);
	const initializeControllerAndNodesSpy = vi
		.spyOn(driver as any, "initializeControllerAndNodes")
		.mockResolvedValue(undefined);

	try {
		await t
			.expect(
				driver.scheduler.queueTask({
					priority: TaskPriority.Normal,
					tag: { id: "nvm-restore" },
					interrupt: TaskInterruptBehavior.Forbidden,
					task: async function* () {
						yield* waitFor(driver.softResetAndRestart());
					},
				}),
			)
			.resolves.toBeUndefined();

		t.expect(sendMessageSpy).toHaveBeenCalledOnce();
		t.expect(ensureSerialAPISpy).toHaveBeenCalledOnce();
		t.expect(initializeControllerAndNodesSpy).toHaveBeenCalledOnce();
	} finally {
		sendMessageSpy.mockRestore();
		ensureSerialAPISpy.mockRestore();
		initializeControllerAndNodesSpy.mockRestore();
		await driver.destroy().catch(() => undefined);
	}
});
