import { ZWaveError, ZWaveErrorCodes } from "@zwave-js/core";
import { FunctionType } from "@zwave-js/serial";
import { GetControllerVersionRequest } from "@zwave-js/serial/serialapi";
import type { BytesView } from "@zwave-js/shared";
import { MockController } from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import { createDeferredPromise } from "alcalzone-shared/deferred-promise";
import { test } from "vitest";
import { createDefaultMockControllerBehaviors } from "../../../Testing.js";
import type { Driver } from "../../driver/Driver.js";
import { createAndStartTestingDriver } from "../../driver/DriverMock.js";

async function createDriverWithoutHostACKs(): Promise<{
	driver: Driver;
	mockController: MockController;
}> {
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
	return { driver, mockController };
}

test.sequential(
	"destroying the driver while a Serial API command waits for its ACK aborts the command",
	async (t) => {
		const { driver, mockController } = await createDriverWithoutHostACKs();

		const command = driver.sendMessage(new GetControllerVersionRequest(), {
			supportCheck: false,
		}).then(() => undefined, (e) => e as Error);

		// Once the controller has received the command, the driver is waiting for the ACK
		await mockController.expectHostMessage(
			(msg) => msg.functionType === FunctionType.GetControllerVersion,
			{ preventDefault: true },
		);

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
		const { driver } = await createDriverWithoutHostACKs();

		// Hold the command in the sending state, which does not race the abort promise
		const sending = createDeferredPromise<void>();
		const release = createDeferredPromise<void>();
		const writeSerial = driver["writeSerial"].bind(driver);
		let holding = false;
		driver["writeSerial"] = async (data: BytesView) => {
			// Only the command itself must be held, or destroying would deadlock
			if (!holding) {
				holding = true;
				sending.resolve();
				await release;
			}
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
			await sending;

			t.expect(driver["abortSerialAPICommand"]).toBeDefined();
			await driver.destroy();
			release.resolve();

			// Give Node a chance to report a rejection without a handler
			await wait(100);

			t.expect(unhandled).toStrictEqual([]);
		} finally {
			process.off("unhandledRejection", onUnhandledRejection);
		}
	},
);
