import type net from "node:net";

import {
	ControllerStatus,
	NodeIDType,
	ZWaveErrorCodes,
	assertZWaveError,
} from "@zwave-js/core";
import { FunctionType, type Message } from "@zwave-js/serial";
import {
	SendDataBridgeRequest,
	SendDataRequest,
	SerialAPISetupCommand,
	SerialAPISetup_SetNodeIDTypeRequest,
	SoftResetRequest,
} from "@zwave-js/serial/serialapi";
import {
	type MockController,
	type MockControllerBehavior,
	type MockControllerCapabilities,
	getDefaultSupportedFunctionTypes,
} from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";

import { integrationTest } from "../integrationTestSuite.js";

// A controller with the given SDK version that can switch the node ID type
function controllerCapabilities(
	libraryVersion: string,
): Partial<MockControllerCapabilities> {
	return {
		libraryVersion,
		supportedFunctionTypes: [
			...getDefaultSupportedFunctionTypes(),
			FunctionType.SerialAPISetup,
		],
		supportedSerialAPISetupCommands: [SerialAPISetupCommand.SetNodeIDType],
	};
}

function isSendData(msg: Message): boolean {
	return (
		msg instanceof SendDataRequest || msg instanceof SendDataBridgeRequest
	);
}

/** Returns the messages the mock controller received after the soft reset */
function messagesAfterReset(mockController: MockController): Message[] {
	const messages = mockController.receivedHostMessages;
	const resetIndex = messages.findLastIndex(
		(msg) => msg instanceof SoftResetRequest,
	);
	return messages.slice(resetIndex + 1) as Message[];
}

/**
 * Makes the mock controller ignore all commands. It still performs a soft reset, but neither acknowledges it
 * nor reports the restart. When `respondAfterReconnect` is set, it responds again once the driver reconnects.
 */
function goSilent(
	mockController: MockController,
	tcpServer: net.Server,
	respondAfterReconnect: boolean,
): void {
	let silent = true;
	mockController.autoAckHostMessages = false;
	mockController.capabilities.sendsSerialAPIStartedAfterSoftReset = false;
	const ignoreCommands: MockControllerBehavior = {
		onHostMessage(controller, msg) {
			if (!silent) return false;
			// The default behavior performs the reset
			if (msg instanceof SoftResetRequest) return false;
			return true;
		},
	};
	mockController.defineBehavior(ignoreCommands);
	if (respondAfterReconnect) {
		tcpServer.once("connection", () => {
			silent = false;
			mockController.autoAckHostMessages = true;
			mockController.capabilities.sendsSerialAPIStartedAfterSoftReset = true;
		});
	}
}

// The mock is connected via TCP, so reopening the serial port reconnects to it
const testOptions = {
	connectViaTCP: true,
	additionalDriverOptions: {
		testingHooks: {
			skipNodeInterview: true,
		},
		timeouts: {
			// Shorten the timeouts to speed up the test
			ack: 400,
		},
	},
};

integrationTest.sequential(
	"Below SDK 7.21, when an unresponsive controller reset without acknowledging it, the driver restores 16-bit node IDs after reopening the serial port",
	{
		// debug: true,
		...testOptions,
		controllerCapabilities: controllerCapabilities("Z-Wave 7.19.3"),

		async testBody(t, driver, node, mockController, mockNode, context) {
			node.markAsAlive();
			// Start with 16-bit node IDs
			t.expect(driver.controller.nodeIdType).toBe(NodeIDType.Long);

			// Let the controller reset silently, and answer again once the driver reconnects
			goSilent(mockController, context.tcpServer!, true);
			// Ping the node until it fails, and wait for the soft reset of the recovery
			const failing = node.ping();
			await mockController.expectHostMessage(
				(msg) => msg instanceof SoftResetRequest,
				{ timeout: 5000 },
			);
			// Queued during the recovery
			const queued = node.ping();

			// The first ping fails, and the queued one succeeds with 16-bit node IDs
			t.expect(await failing).toBe(false);
			t.expect(await queued).toBe(true);
			t.expect(mockController.parsingContext.nodeIdType).toBe(
				NodeIDType.Long,
			);
			t.expect(driver.controller.nodeIdType).toBe(NodeIDType.Long);
			t.expect(driver.controller.status).toBe(ControllerStatus.Ready);

			// The node ID type was confirmed before the queued command was sent
			const afterReset = messagesAfterReset(mockController);
			const confirmIndex = afterReset.findIndex(
				(msg) => msg instanceof SerialAPISetup_SetNodeIDTypeRequest,
			);
			t.expect(confirmIndex).toBeGreaterThanOrEqual(0);
			t.expect(afterReset.findIndex(isSendData)).toBeGreaterThan(
				confirmIndex,
			);
			// Commands keep working
			t.expect(await node.ping()).toBe(true);
		},
	},
);

integrationTest.sequential(
	"Below SDK 7.21, when an unresponsive controller stays silent after reopening the serial port, the driver destroys itself without sending node commands",
	{
		// debug: true,
		...testOptions,
		controllerCapabilities: controllerCapabilities("Z-Wave 7.19.3"),

		async testBody(t, driver, node, mockController, mockNode, context) {
			node.markAsAlive();
			// Watch for the driver to fail
			const errorPromise = new Promise<Error>((resolve) => {
				driver.on("error", resolve);
			});

			// Let the controller reset silently and stay silent after the reconnect
			goSilent(mockController, context.tcpServer!, false);
			// Ping the node until it fails, and wait for the soft reset of the recovery
			const failing = node.ping();
			await mockController.expectHostMessage(
				(msg) => msg instanceof SoftResetRequest,
				{ timeout: 5000 },
			);
			// Queued during the recovery, so it would be sent once the gate opens
			void node.ping();

			// The driver fails because it cannot confirm the node ID type
			const error = await Promise.race([
				errorPromise,
				wait(20000).then(() => {
					throw new Error("The driver did not emit an error event");
				}),
			]);
			assertZWaveError(t.expect, error, {
				errorCode: ZWaveErrorCodes.Driver_Failed,
			});
			t.expect(await failing).toBe(false);
			t.expect(driver["wasDestroyed"]).toBe(true);

			// The driver tried SetNodeIDType, but sent no SendData after the reset
			const afterReset = messagesAfterReset(mockController);
			t.expect(
				afterReset.some(
					(msg) => msg instanceof SerialAPISetup_SetNodeIDTypeRequest,
				),
			).toBe(true);
			t.expect(afterReset.some(isSendData)).toBe(false);
		},
	},
);

integrationTest.sequential(
	"From SDK 7.21 on, an unresponsive controller that reset without acknowledging it is used again after reopening the serial port",
	{
		// debug: true,
		...testOptions,
		controllerCapabilities: controllerCapabilities("Z-Wave 7.21.0"),

		async testBody(t, driver, node, mockController, mockNode, context) {
			node.markAsAlive();
			t.expect(driver.controller.nodeIdType).toBe(NodeIDType.Long);

			goSilent(mockController, context.tcpServer!, true);
			t.expect(await node.ping()).toBe(false);
			// The recovery ends after the command failed
			await wait(2000);
			t.expect(driver.controller.status).toBe(ControllerStatus.Ready);

			t.expect(await node.ping()).toBe(true);
			// The controller kept the node ID type, so the driver did not need to confirm it
			t.expect(
				messagesAfterReset(mockController).some(
					(msg) => msg instanceof SerialAPISetup_SetNodeIDTypeRequest,
				),
			).toBe(false);
		},
	},
);

integrationTest.sequential(
	"A soft reset requested while the unresponsive controller recovery reopens the serial port waits until the recovery is done",
	{
		// debug: true,
		...testOptions,
		controllerCapabilities: controllerCapabilities("Z-Wave 7.19.3"),

		async testBody(t, driver, node, mockController, mockNode, context) {
			node.markAsAlive();
			// Let the controller reset silently, and answer again once the driver reconnects
			goSilent(mockController, context.tcpServer!, true);

			// Request a soft reset as soon as the recovery closes the serial port
			let softReset: Promise<void> | undefined;
			const serial = driver["serial"]!;
			const close = serial.close.bind(serial);
			serial.close = () => {
				softReset = driver.softReset();
				return close();
			};

			// The ping fails and starts the recovery, and the requested reset runs
			t.expect(await node.ping()).toBe(false);
			t.expect(softReset).toBeDefined();
			await softReset;

			// The requested soft reset follows the confirmation of the node ID type
			const messages = mockController.receivedHostMessages;
			const confirmIndex = messages.findIndex(
				(msg) => msg instanceof SerialAPISetup_SetNodeIDTypeRequest,
			);
			const lastReset = messages.findLastIndex(
				(msg) => msg instanceof SoftResetRequest,
			);
			t.expect(
				messages.findIndex((msg) => msg instanceof SoftResetRequest),
			).toBeLessThan(confirmIndex);
			t.expect(lastReset).toBeGreaterThan(confirmIndex);
			// Commands work afterwards
			t.expect(await node.ping()).toBe(true);
		},
	},
);
