import { ZWaveError, ZWaveErrorCodes } from "@zwave-js/core";
import { GetControllerVersionRequest } from "@zwave-js/serial/serialapi";
import type { BytesView } from "@zwave-js/shared";
import { MockController } from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import { test } from "vitest";
import { createDefaultMockControllerBehaviors } from "../../../Testing.js";
import type { Driver } from "../../driver/Driver.js";
import { createAndStartTestingDriver } from "../../driver/DriverMock.js";

async function createDriverWithoutHostACKs(): Promise<Driver> {
	let mockController!: MockController;
	const { driver } = await createAndStartTestingDriver({
		loadConfiguration: false,
		skipNodeInterview: true,
		async beforeStartup(mockPort, serial) {
			mockController = await MockController.create({
				mockPort,
				serial,
			});
			mockController.defineBehavior(
				...createDefaultMockControllerBehaviors(),
			);
		},
	});

	// Keep the controller from ACKing, so the next command gets stuck
	mockController.autoAckHostMessages = false;
	return driver;
}

test.sequential(
	"destroying the driver while a Serial API command waits for its ACK aborts the command",
	async (t) => {
		const driver = await createDriverWithoutHostACKs();

		const command = driver.sendMessage(new GetControllerVersionRequest(), {
			supportCheck: false,
		}).then(() => undefined, (e) => e as Error);
		await wait(50);

		await driver.destroy();

		// The ACK timeout is 1600 ms by default, so a command that is not
		// aborted would still be waiting here
		const outcome = await Promise.race([
			command,
			wait(500).then(() => "still pending" as const),
		]);

		t.expect(outcome).toBeInstanceOf(ZWaveError);
		t.expect((outcome as ZWaveError).code).toBe(
			ZWaveErrorCodes.Driver_Destroyed,
		);
	},
);

test.sequential(
	"destroying the driver while a Serial API command is being written does not cause an unhandled rejection",
	async (t) => {
		const driver = await createDriverWithoutHostACKs();

		// Stretch the sending state, which does not race the abort promise
		const writeSerial = driver["writeSerial"].bind(driver);
		driver["writeSerial"] = async (data: BytesView) => {
			await wait(100);
			return writeSerial(data);
		};

		const unhandled: unknown[] = [];
		const onUnhandledRejection = (e: unknown) => {
			unhandled.push(e);
		};
		process.on("unhandledRejection", onUnhandledRejection);

		try {
			void driver.sendMessage(new GetControllerVersionRequest(), {
				supportCheck: false,
			}).catch(() => {});
			await wait(50);

			t.expect(driver["abortSerialAPICommand"]).toBeDefined();
			await driver.destroy();

			// Give Node a chance to report a rejection without a handler
			await wait(100);

			t.expect(unhandled).toStrictEqual([]);
		} finally {
			process.off("unhandledRejection", onUnhandledRejection);
		}
	},
);
