import { ControllerStatus, MessagePriority } from "@zwave-js/core";
import {
	SerialAPIStartedRequest,
	SerialAPIWakeUpReason,
} from "@zwave-js/serial/serialapi";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { Driver } from "../../driver/Driver.js";
import { createAndStartTestingDriver } from "../../driver/DriverMock.js";

let driver: Driver;

beforeEach(async () => {
	({ driver } = await createAndStartTestingDriver({
		loadConfiguration: false,
		skipControllerIdentification: true,
		skipNodeInterview: true,
	}));
});

afterEach(async () => {
	driver.removeAllListeners();
	await driver.destroy();
});

function serialAPIStarted(isListening: boolean): SerialAPIStartedRequest {
	return new SerialAPIStartedRequest({
		wakeUpReason: SerialAPIWakeUpReason.SoftwareReset,
		watchdogEnabled: false,
		genericDeviceClass: 1,
		specificDeviceClass: 0,
		isListening,
		supportedCCs: [],
		controlledCCs: [],
		supportsLongRange: true,
	});
}

test("repairs non-listening application node information once", async () => {
	driver.controller["_sdkVersion"] = "7.0.0";
	const setControllerNIF = vi.spyOn(driver.controller, "setControllerNIF")
		.mockResolvedValue();
	const softReset = vi.spyOn(driver, "softReset").mockResolvedValue();

	driver["updateApplicationNodeInformationRepairState"](
		serialAPIStarted(false),
	);
	await expect(
		driver["repairApplicationNodeInformationAndReset"](),
	).resolves.toBe(true);

	driver["updateApplicationNodeInformationRepairState"](
		serialAPIStarted(false),
	);
	await expect(
		driver["repairApplicationNodeInformationAndReset"](),
	).resolves.toBe(false);

	expect(setControllerNIF).toHaveBeenCalledTimes(1);
	expect(setControllerNIF).toHaveBeenCalledWith(
		MessagePriority.ControllerImmediate,
	);
	expect(softReset).toHaveBeenCalledTimes(1);
});

test("does not repair listening application node information", async () => {
	driver.controller["_sdkVersion"] = "7.0.0";
	const setControllerNIF = vi.spyOn(driver.controller, "setControllerNIF")
		.mockResolvedValue();
	const softReset = vi.spyOn(driver, "softReset").mockResolvedValue();

	driver["updateApplicationNodeInformationRepairState"](
		serialAPIStarted(true),
	);
	await expect(
		driver["repairApplicationNodeInformationAndReset"](),
	).resolves.toBe(false);

	expect(setControllerNIF).not.toHaveBeenCalled();
	expect(softReset).not.toHaveBeenCalled();
});

test("does not repair 500 series application node information", async () => {
	driver.controller["_sdkVersion"] = "6.84.0";
	const setControllerNIF = vi.spyOn(driver.controller, "setControllerNIF")
		.mockResolvedValue();
	const softReset = vi.spyOn(driver, "softReset").mockResolvedValue();

	driver["updateApplicationNodeInformationRepairState"](
		serialAPIStarted(false),
	);
	await expect(
		driver["repairApplicationNodeInformationAndReset"](),
	).resolves.toBe(false);

	expect(setControllerNIF).not.toHaveBeenCalled();
	expect(softReset).not.toHaveBeenCalled();
});

test("treats SDK 7.0 as soft-reset capable", () => {
	driver.controller["_sdkVersion"] = "7.0.0";
	driver["_options"].features.softReset = false;

	expect(driver["maySoftReset"]()).toBe(true);
});

test("unblocks an unavailable controller after the repair reset", async () => {
	driver.controller["_sdkVersion"] = "7.0.0";
	driver.controller.setStatus(ControllerStatus.Unresponsive);
	vi.spyOn(driver.controller, "setControllerNIF").mockResolvedValue();
	vi.spyOn(driver, "softReset").mockResolvedValue();

	driver["updateApplicationNodeInformationRepairState"](
		serialAPIStarted(false),
	);
	await expect(
		driver["repairApplicationNodeInformationAndReset"](),
	).resolves.toBe(true);

	expect(driver.controller.status).toBe(ControllerStatus.Ready);
});

test("repairs before restarting services after an unexpected reset", async () => {
	driver.controller["_sdkVersion"] = "7.0.0";
	vi.spyOn(driver.controller, "setControllerNIF").mockResolvedValue();
	vi.spyOn(driver, "softReset").mockResolvedValue();
	const startWatchdog = vi.spyOn(driver.controller, "startWatchdog")
		.mockResolvedValue(true);

	await expect(
		driver["handleSerialAPIStartedUnexpectedly"](
			serialAPIStarted(false),
		),
	).resolves.toBe(true);

	expect(startWatchdog).not.toHaveBeenCalled();
});
