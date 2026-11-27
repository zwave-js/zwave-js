import crypto from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { NodeIDType } from "@zwave-js/core";
import { FunctionType, type Message, MessageHeaders } from "@zwave-js/serial";
import {
	SendDataBridgeRequest,
	SendDataRequest,
	SerialAPISetupCommand,
	SerialAPISetup_SetNodeIDTypeRequest,
	SerialAPISetup_SetNodeIDTypeResponse,
	SerialAPIStartedRequest,
	SerialAPIWakeUpReason,
	SoftResetRequest,
} from "@zwave-js/serial/serialapi";
import {
	type MockControllerBehavior,
	type MockControllerCapabilities,
	getDefaultSupportedFunctionTypes,
} from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import { test } from "vitest";

import { determineNIF } from "../../controller/NodeInformationFrame.js";
import { integrationTest } from "../integrationTestSuite.js";
import { prepareDriver, prepareMocks } from "../integrationTestSuiteShared.js";

// A controller below SDK 7.21 that can switch the node ID type
const controllerCapabilities: Partial<MockControllerCapabilities> = {
	libraryVersion: "Z-Wave 7.19.3",
	supportedFunctionTypes: [
		...getDefaultSupportedFunctionTypes(),
		FunctionType.SerialAPISetup,
	],
	supportedSerialAPISetupCommands: [SerialAPISetupCommand.SetNodeIDType],
};

integrationTest.sequential(
	"When the node ID type cannot be confirmed after a soft reset, the driver sends no node traffic and fails",
	{
		// debug: true,

		controllerCapabilities,

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Start with 16-bit node IDs
			t.expect(driver.controller.nodeIdType).toBe(NodeIDType.Long);
			// Circumvent the options validation so the test doesn't take forever
			driver.options.timeouts.response = 200;

			// Let the controller ignore SetNodeIDType after the reset
			const ignoreSetNodeIDType: MockControllerBehavior = {
				onHostMessage(controller, msg) {
					return msg instanceof SerialAPISetup_SetNodeIDTypeRequest;
				},
			};
			mockController.defineBehavior(ignoreSetNodeIDType);
			// Watch for the driver to fail
			const failed = new Promise<Error>((resolve) =>
				driver.once("error", resolve),
			);
			// Soft-reset and queue a ping
			mockController.clearReceivedHostMessages();

			const resetPromise = driver.softReset();
			void node.ping().catch(() => {});
			// The reset fails and the driver destroys itself
			await t.expect(resetPromise).rejects.toThrow();
			await failed;

			// No SendData may follow the reset
			const messages = mockController.receivedHostMessages;
			const resetIndex = messages.findIndex(
				(msg) => msg instanceof SoftResetRequest,
			);
			t.expect(
				messages
					.slice(resetIndex + 1)
					.some(
						(msg) =>
							msg instanceof SendDataRequest
							|| msg instanceof SendDataBridgeRequest,
					),
			).toBe(false);
		},
	},
);

integrationTest.sequential(
	"The driver stops all other commands before it acknowledges an unexpected Serial API restart",
	{
		// debug: true,

		controllerCapabilities,

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Record whether the gate is closed when the driver acknowledges the restart notification
			const gateClosedOnACK: boolean[] = [];
			let restartSent = false;
			const writeHeader = driver["writeHeader"].bind(driver);
			driver["writeHeader"] = (header: MessageHeaders) => {
				if (restartSent && header === MessageHeaders.ACK) {
					gateClosedOnACK.push(driver["controllerGate"].isClosed);
					restartSent = false;
				}
				return writeHeader(header);
			};

			// Simulate a restart of a controller that falls back to 8-bit node IDs
			mockController.encodingContext.nodeIdType = NodeIDType.Short;
			mockController.parsingContext.nodeIdType = NodeIDType.Short;
			restartSent = true;
			await mockController.sendMessageToHost(
				new SerialAPIStartedRequest({
					wakeUpReason: SerialAPIWakeUpReason.WatchdogReset,
					watchdogEnabled: false,
					isListening: true,
					...determineNIF(),
					supportsLongRange: false,
				}),
			);

			// The gate must already be closed at the ACK, and commands work afterwards
			t.expect(gateClosedOnACK).toStrictEqual([true]);
			t.expect(await node.ping()).toBe(true);
		},
	},
);

function isSendData(msg: unknown): boolean {
	return (
		msg instanceof SendDataRequest || msg instanceof SendDataBridgeRequest
	);
}

// Whether a SendData followed the soft reset
function sentNodeTrafficAfterReset(
	messages: readonly Readonly<Message>[],
): boolean {
	const resetIndex = messages.findIndex(
		(msg) => msg instanceof SoftResetRequest,
	);
	return messages.slice(resetIndex + 1).some(isSendData);
}

integrationTest.sequential(
	"When SetNodeIDType gets no response and later attempts are rejected, the driver fails without sending node commands",
	{
		// debug: true,

		controllerCapabilities,

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Circumvent the options validation so the test doesn't take forever
			driver.options.timeouts.response = 200;

			// The first attempt switches, but its response is lost. Later attempts are rejected.
			let attempts = 0;
			const loseThenReject: MockControllerBehavior = {
				async onHostMessage(controller, msg) {
					if (!(msg instanceof SerialAPISetup_SetNodeIDTypeRequest))
						return;
					attempts++;
					if (attempts === 1) {
						controller.encodingContext.nodeIdType = msg.nodeIdType;
						controller.parsingContext.nodeIdType = msg.nodeIdType;
						return true;
					}
					await controller.sendMessageToHost(
						new SerialAPISetup_SetNodeIDTypeResponse({
							success: false,
						}),
					);
					return true;
				},
			};
			mockController.defineBehavior(loseThenReject);
			// Watch for the driver to fail
			const failed = new Promise<Error>((resolve) =>
				driver.once("error", resolve),
			);
			// Soft-reset and queue a ping
			mockController.clearReceivedHostMessages();

			const resetPromise = driver.softReset();
			resetPromise.catch(() => {});
			void node.ping().catch(() => {});
			// The reset fails after 3 attempts, and no SendData follows the reset
			await t.expect(resetPromise).rejects.toThrow();
			await failed;

			t.expect(attempts).toBe(3);
			t.expect(
				sentNodeTrafficAfterReset(mockController.receivedHostMessages),
			).toBe(false);
		},
	},
);

integrationTest.sequential(
	"When every SetNodeIDType is answered with a CAN, the driver keeps working with the node ID type of the reset controller",
	{
		// debug: true,

		controllerCapabilities,

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Answer every SetNodeIDType with a CAN
			mockController.autoAckHostMessages = false;
			const canSetNodeIDType: MockControllerBehavior = {
				onHostMessage(controller, msg) {
					if (msg instanceof SerialAPISetup_SetNodeIDTypeRequest) {
						controller.mockPort.emitData(
							Uint8Array.from([MessageHeaders.CAN]),
						);
						return true;
					}
					controller.ackHostMessage();
					return false;
				},
			};
			mockController.defineBehavior(canSetNodeIDType);
			// Watch for the driver to fail
			let failed = false;
			driver.once("error", () => {
				failed = true;
			});

			// Below SDK 7.21, the reset switches the controller to 8-bit node IDs
			await driver.softReset();

			// The driver keeps working with the 8-bit node IDs of the reset controller
			t.expect(failed).toBe(false);
			t.expect(driver.controller.nodeIdType).toBe(NodeIDType.Short);
			t.expect(await node.ping()).toBe(true);
		},
	},
);

integrationTest.sequential(
	"When the controller restarts during SetNodeIDType and rejects later attempts, the driver fails without sending node commands",
	{
		// debug: true,

		controllerCapabilities: {
			...controllerCapabilities,
			libraryVersion: "Z-Wave 7.21.0",
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Start with 16-bit node IDs on a controller that keeps the type across resets
			t.expect(driver.controller.nodeIdType).toBe(NodeIDType.Long);

			// The controller applies the switch and restarts before it responds.
			// It keeps the node ID type and rejects every later switch.
			let attempts = 0;
			const restartDuringSwitch: MockControllerBehavior = {
				async onHostMessage(controller, msg) {
					if (!(msg instanceof SerialAPISetup_SetNodeIDTypeRequest))
						return;
					attempts++;
					if (attempts === 1) {
						controller.encodingContext.nodeIdType = msg.nodeIdType;
						controller.parsingContext.nodeIdType = msg.nodeIdType;
						await controller.sendMessageToHost(
							new SerialAPIStartedRequest({
								wakeUpReason:
									SerialAPIWakeUpReason.WatchdogReset,
								watchdogEnabled: false,
								isListening: true,
								...determineNIF(),
								supportsLongRange: false,
							}),
						);
						return true;
					}
					await controller.sendMessageToHost(
						new SerialAPISetup_SetNodeIDTypeResponse({
							success: false,
						}),
					);
					return true;
				},
			};
			mockController.defineBehavior(restartDuringSwitch);
			// Watch for the driver to fail
			const failed = new Promise<Error>((resolve) =>
				driver.once("error", resolve),
			);
			// Switch to 8-bit node IDs and queue a ping
			mockController.clearReceivedHostMessages();

			const switchPromise = driver.controller.trySetNodeIDType(
				NodeIDType.Short,
			);
			switchPromise.catch(() => {});
			void node.ping().catch(() => {});
			// The driver fails without sending the ping
			await failed;

			t.expect(mockController.receivedHostMessages.some(isSendData)).toBe(
				false,
			);
		},
	},
);

test("When the node ID type cannot be confirmed at startup, the driver reports one error", async (t) => {
	// Start a driver whose controller can switch the node ID type
	const cacheDir = path.join(
		os.tmpdir(),
		`zjs_test_cache_${crypto.randomBytes(4).toString("hex")}`,
	);
	await fs.mkdir(cacheDir, { recursive: true });
	const { driver, continueStartup, mockPort, serial } = await prepareDriver(
		cacheDir,
		false,
		{ timeouts: { response: 500 } },
	);
	const { mockController } = await prepareMocks(mockPort, serial, {
		capabilities: controllerCapabilities,
	});
	// The switch to 16-bit node IDs at startup never gets a response
	const ignoreLong: MockControllerBehavior = {
		onHostMessage(controller, msg) {
			return (
				msg instanceof SerialAPISetup_SetNodeIDTypeRequest
				&& msg.nodeIdType === NodeIDType.Long
			);
		},
	};
	mockController.defineBehavior(ignoreLong);

	// Collect the errors the driver reports during startup
	const errors: Error[] = [];
	driver.on("error", (e) => errors.push(e));
	try {
		continueStartup();
		// Exactly one error is reported
		await t.expect.poll(() => errors.length, { timeout: 10000 }).toBe(1);
		await wait(500);
		t.expect(errors).toHaveLength(1);
	} finally {
		await driver.destroy();
		mockController.destroy();
		await fs.rm(cacheDir, { recursive: true, force: true });
	}
});

integrationTest.sequential(
	"After a soft reset that the controller neither acknowledges nor reports, the driver confirms the node ID type before other commands are sent",
	{
		// debug: true,

		controllerCapabilities,

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Start with 16-bit node IDs
			t.expect(driver.controller.nodeIdType).toBe(NodeIDType.Long);
			// Circumvent the options validation so the test doesn't take forever
			driver.options.timeouts.ack = 200;
			driver.options.attempts.controller = 1;

			// The controller resets and falls back to 8-bit node IDs, but loses the ACK
			// and sends no SerialAPIStarted
			mockController.autoAckHostMessages = false;
			const silentReset: MockControllerBehavior = {
				onHostMessage(controller, msg) {
					if (msg instanceof SoftResetRequest) {
						controller.encodingContext.nodeIdType =
							NodeIDType.Short;
						controller.parsingContext.nodeIdType = NodeIDType.Short;
						return true;
					}
					controller.ackHostMessage();
					return false;
				},
			};
			mockController.defineBehavior(silentReset);

			// The reset fails, but the driver confirms the node ID type the controller uses
			await t.expect(driver.softReset()).rejects.toThrow();

			t.expect(driver.controller.nodeIdType).toBe(
				mockController.parsingContext.nodeIdType,
			);
			// Commands work again
			mockController.autoAckHostMessages = true;
			t.expect(await node.ping()).toBe(true);
		},
	},
);
