import { NoOperationCC } from "@zwave-js/cc";
import {
	ControllerStatus,
	MessagePriority,
	NodeStatus,
	TransmitStatus,
	ZWaveErrorCodes,
	ZWaveError,
	assertZWaveError,
	getZWaveChipType,
	highResTimestamp,
} from "@zwave-js/core";
import { FunctionType } from "@zwave-js/serial";
import {
	GetControllerVersionRequest,
	SendDataAbort,
	SendDataRequest,
	SendDataRequestTransmitReport,
	SendDataResponse,
	SoftResetRequest,
} from "@zwave-js/serial/serialapi";
import {
	type MockControllerBehavior,
	type MockControllerCapabilities,
	getDefaultMockControllerCapabilities,
	getDefaultSupportedFunctionTypes,
} from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import sinon from "sinon";
import { vi } from "vitest";

import {
	MockControllerCommunicationState,
	MockControllerStateKeys,
} from "../../controller/MockControllerState.js";
import { integrationTest } from "../integrationTestSuite.js";
import { integrationTest as integrationTestMulti } from "../integrationTestSuiteMulti.js";

let shouldFail = false;

const controllerCapabilitiesNoBridge: MockControllerCapabilities = {
	// No support for Bridge API:
	...getDefaultMockControllerCapabilities(),
	supportedFunctionTypes: getDefaultSupportedFunctionTypes().filter(
		(ft) =>
			ft !== FunctionType.SendDataBridge
			&& ft !== FunctionType.SendDataMulticastBridge,
	),
};

integrationTest.sequential(
	"update the controller status and wait if TX status is Fail",
	{
		// debug: true,
		// provisioningDirectory: path.join(
		// 	__dirname,
		// 	"__fixtures/supervision_binary_switch",
		// ),

		controllerCapabilities: controllerCapabilitiesNoBridge,

		additionalDriverOptions: {
			testingHooks: {
				skipNodeInterview: true,
			},
		},

		customSetup: async (driver, controller, mockNode) => {
			// Return a TX status of Fail when desired
			const handleSendData: MockControllerBehavior = {
				async onHostMessage(controller, msg) {
					if (msg instanceof SendDataRequest) {
						if (!shouldFail) {
							// Defer to the default behavior
							return false;
						}

						// Check if this command is legal right now
						const state = controller.state.get(
							MockControllerStateKeys.CommunicationState,
						) as MockControllerCommunicationState | undefined;
						if (
							state != undefined
							&& state !== MockControllerCommunicationState.Idle
						) {
							throw new Error(
								"Received SendDataRequest while not idle",
							);
						}

						// Put the controller into sending state
						controller.state.set(
							MockControllerStateKeys.CommunicationState,
							MockControllerCommunicationState.Sending,
						);

						// Notify the host that the message was sent
						const res = new SendDataResponse({
							wasSent: true,
						});
						await controller.sendMessageToHost(res);

						await wait(100);

						controller.state.set(
							MockControllerStateKeys.CommunicationState,
							MockControllerCommunicationState.Idle,
						);

						const cb = new SendDataRequestTransmitReport({
							callbackId: msg.callbackId!,
							transmitStatus: TransmitStatus.Fail,
							txReport: {
								txTicks: 0,
								routeSpeed: 0 as any,
								routingAttempts: 0,
								ackRSSI: 0,
							},
						});
						await controller.sendMessageToHost(cb);

						return true;
					} else if (msg instanceof SendDataAbort) {
						// Put the controller into idle state
						controller.state.set(
							MockControllerStateKeys.CommunicationState,
							MockControllerCommunicationState.Idle,
						);
					}
				},
			};
			controller.defineBehavior(handleSendData);
		},
		testBody: async (t, driver, node, mockController, mockNode) => {
			node.markAsAlive();

			const statusChanges: ControllerStatus[] = [];
			driver.controller.on("status changed", (status) => {
				statusChanges.push(status);
			});

			const nodeDead = sinon.spy();
			node.on("dead", nodeDead);

			shouldFail = true;
			const promise = node.ping();
			await wait(500);

			// The controller should now be jammed, but the node's status must not change
			t.expect(driver.controller.status).toBe(ControllerStatus.Jammed);
			t.expect(node.status).toBe(NodeStatus.Alive);

			setTimeout(() => {
				shouldFail = false;
			}, 2000);

			await promise;

			t.expect(driver.controller.status).toBe(ControllerStatus.Ready);
			t.expect(node.status).toBe(NodeStatus.Alive);

			sinon.assert.notCalled(nodeDead);
			t.expect(statusChanges).toStrictEqual([
				ControllerStatus.Jammed,
				ControllerStatus.Ready,
			]);
		},
	},
);

integrationTest.sequential(
	"When sending fails continuously, soft-reset to recover",
	{
		// debug: true,
		// provisioningDirectory: path.join(
		// 	__dirname,
		// 	"__fixtures/supervision_binary_switch",
		// ),

		controllerCapabilities: controllerCapabilitiesNoBridge,

		additionalDriverOptions: {
			testingHooks: {
				skipNodeInterview: true,
			},
		},

		customSetup: async (driver, controller, mockNode) => {
			// Return a TX status of Fail when desired
			const handleSendData: MockControllerBehavior = {
				async onHostMessage(controller, msg) {
					// Soft reset should restore normal operation
					if (msg instanceof SoftResetRequest) {
						shouldFail = false;

						// Call the original handler
						return false;
					} else if (msg instanceof SendDataRequest) {
						if (!shouldFail) {
							// Defer to the default behavior
							return false;
						}

						// Check if this command is legal right now
						const state = controller.state.get(
							MockControllerStateKeys.CommunicationState,
						) as MockControllerCommunicationState | undefined;
						if (
							state != undefined
							&& state !== MockControllerCommunicationState.Idle
						) {
							throw new Error(
								"Received SendDataRequest while not idle",
							);
						}

						// Put the controller into sending state
						controller.state.set(
							MockControllerStateKeys.CommunicationState,
							MockControllerCommunicationState.Sending,
						);

						// Notify the host that the message was sent
						const res = new SendDataResponse({
							wasSent: true,
						});
						await controller.sendMessageToHost(res);

						await wait(100);

						controller.state.set(
							MockControllerStateKeys.CommunicationState,
							MockControllerCommunicationState.Idle,
						);

						const cb = new SendDataRequestTransmitReport({
							callbackId: msg.callbackId!,
							transmitStatus: TransmitStatus.Fail,
							txReport: {
								txTicks: 0,
								routeSpeed: 0 as any,
								routingAttempts: 0,
								ackRSSI: 0,
							},
						});
						await controller.sendMessageToHost(cb);

						return true;
					} else if (msg instanceof SendDataAbort) {
						// Put the controller into idle state
						controller.state.set(
							MockControllerStateKeys.CommunicationState,
							MockControllerCommunicationState.Idle,
						);
					}
				},
			};
			controller.defineBehavior(handleSendData);
		},
		testBody: async (t, driver, node, mockController, mockNode) => {
			node.markAsAlive();

			const statusChanges: ControllerStatus[] = [];
			driver.controller.on("status changed", (status) => {
				statusChanges.push(status);
			});

			const nodeDead = sinon.spy();
			node.on("dead", nodeDead);

			shouldFail = true;
			const promise = node.ping();
			await wait(500);

			// The controller should now be jammed, but the node's status must not change
			t.expect(driver.controller.status).toBe(ControllerStatus.Jammed);
			t.expect(node.status).toBe(NodeStatus.Alive);

			// After soft-resetting (done automatically), the controller should be sending normally again
			await promise;
			// And the controller should have been soft-reset
			mockController.assertReceivedHostMessage(
				(msg) => msg.functionType === FunctionType.SoftReset,
			);

			t.expect(driver.controller.status).toBe(ControllerStatus.Ready);
			t.expect(node.status).toBe(NodeStatus.Alive);

			sinon.assert.notCalled(nodeDead);
			t.expect(statusChanges).toStrictEqual([
				ControllerStatus.Jammed,
				ControllerStatus.Ready,
			]);
		},
	},
);

integrationTestMulti(
	"Prevent an infinite loop when the controller is unable to transmit a command to a specific node",
	{
		// debug: true,
		// provisioningDirectory: path.join(
		// 	__dirname,
		// 	"__fixtures/supervision_binary_switch",
		// ),

		additionalDriverOptions: {
			testingHooks: {
				skipNodeInterview: true,
			},
		},

		controllerCapabilities: {
			...controllerCapabilitiesNoBridge,
			// 500 series controller, where the soft-reset workaround does not make sense
			libraryVersion: "Z-Wave 6.84",
			zwaveChipType: getZWaveChipType(0x05, 0x00),
		},

		nodeCapabilities: [
			{
				id: 2,
				capabilities: {
					isListening: true,
				},
			},
			{
				id: 3,
				capabilities: {
					isListening: true,
				},
			},
		],

		customSetup: async (driver, controller, mockNodes) => {
			// Return a TX status of Fail when desired
			const handleSendData: MockControllerBehavior = {
				async onHostMessage(controller, msg) {
					if (msg instanceof SendDataRequest) {
						// Commands to node 3 work normally
						if (msg.getNodeId() === 3) {
							// Defer to the default behavior
							return false;
						}

						// Check if this command is legal right now
						const state = controller.state.get(
							MockControllerStateKeys.CommunicationState,
						) as MockControllerCommunicationState | undefined;
						if (
							state != undefined
							&& state !== MockControllerCommunicationState.Idle
						) {
							throw new Error(
								"Received SendDataRequest while not idle",
							);
						}

						// Put the controller into sending state
						controller.state.set(
							MockControllerStateKeys.CommunicationState,
							MockControllerCommunicationState.Sending,
						);

						// Notify the host that the message was sent
						const res = new SendDataResponse({
							wasSent: true,
						});
						await controller.sendMessageToHost(res);

						await wait(100);

						controller.state.set(
							MockControllerStateKeys.CommunicationState,
							MockControllerCommunicationState.Idle,
						);

						const cb = new SendDataRequestTransmitReport({
							callbackId: msg.callbackId!,
							transmitStatus: TransmitStatus.Fail,
							txReport: {
								txTicks: 0,
								routeSpeed: 0 as any,
								routingAttempts: 0,
								ackRSSI: 0,
							},
						});
						await controller.sendMessageToHost(cb);

						return true;
					} else if (msg instanceof SendDataAbort) {
						// Put the controller into idle state
						controller.state.set(
							MockControllerStateKeys.CommunicationState,
							MockControllerCommunicationState.Idle,
						);
					}
				},
			};
			controller.defineBehavior(handleSendData);
		},
		testBody: async (t, driver, nodes, mockController, mockNodes) => {
			const [node2, node3] = nodes;
			node2.markAsAlive();
			node3.markAsAlive();

			driver.options.timeouts.retryJammed = 100;

			// Commands to node 2 will fail forever
			await assertZWaveError(
				t.expect,
				() => node2.commandClasses.Basic.set(99),
				{
					errorCode: ZWaveErrorCodes.Controller_MessageDropped,
				},
			);

			// But commands to node 3 should still continue afterwards
			t.expect(await node3.ping()).toBe(true);
		},
	},
);

let softResetsWithoutEffect = 0;
// Number of SendData requests the controller cannot queue after the next soft reset
let queueFullAfterSoftReset = 0;
let queueFullResponses = 0;

// Fails every SendData with txTicks = 0 while shouldFail is set. A soft reset clears the jam.
const jamUntilSoftReset: MockControllerBehavior = {
	async onHostMessage(controller, msg) {
		if (msg instanceof SoftResetRequest) {
			if (softResetsWithoutEffect > 0) {
				softResetsWithoutEffect--;
			} else {
				shouldFail = false;
			}
			queueFullResponses = queueFullAfterSoftReset;
			queueFullAfterSoftReset = 0;
			return false;
		} else if (msg instanceof SendDataRequest) {
			if (queueFullResponses > 0) {
				queueFullResponses--;
				await controller.sendMessageToHost(
					new SendDataResponse({ wasSent: false }),
				);
				return true;
			}
			if (!shouldFail) return false;

			controller.state.set(
				MockControllerStateKeys.CommunicationState,
				MockControllerCommunicationState.Sending,
			);
			await controller.sendMessageToHost(
				new SendDataResponse({ wasSent: true }),
			);
			await wait(100);
			controller.state.set(
				MockControllerStateKeys.CommunicationState,
				MockControllerCommunicationState.Idle,
			);
			await controller.sendMessageToHost(
				new SendDataRequestTransmitReport({
					callbackId: msg.callbackId!,
					transmitStatus: TransmitStatus.Fail,
					txReport: {
						txTicks: 0,
						routeSpeed: 0 as any,
						routingAttempts: 0,
						ackRSSI: 0,
					},
				}),
			);
			return true;
		} else if (msg instanceof SendDataAbort) {
			controller.state.set(
				MockControllerStateKeys.CommunicationState,
				MockControllerCommunicationState.Idle,
			);
		}
	},
};

integrationTest.sequential(
	"After recovering a jammed controller, commands on the immediate queue are sent again",
	{
		// debug: true,

		controllerCapabilities: controllerCapabilitiesNoBridge,

		additionalDriverOptions: {
			testingHooks: {
				skipNodeInterview: true,
			},
		},

		customSetup: async (driver, controller, mockNode) => {
			controller.defineBehavior(jamUntilSoftReset);
		},
		testBody: async (t, driver, node, mockController, mockNode) => {
			node.markAsAlive();

			const statusChanges: ControllerStatus[] = [];
			driver.controller.on("status changed", (status) => {
				statusChanges.push(status);
			});

			const immediatePing = () =>
				driver.sendCommand(new NoOperationCC({ nodeId: node.id }), {
					priority: MessagePriority.Immediate,
				});

			shouldFail = true;
			const promise = immediatePing();
			await wait(500);
			t.expect(driver.controller.status).toBe(ControllerStatus.Jammed);

			// No other traffic follows, so only the re-queued command can
			// clear the jammed status
			const result = await Promise.race([
				promise.then(() => "sent"),
				wait(10000).then(() => "timeout"),
			]);
			t.expect(result).toBe("sent");

			mockController.assertReceivedHostMessage(
				(msg) => msg.functionType === FunctionType.SoftReset,
			);
			t.expect(driver.controller.status).toBe(ControllerStatus.Ready);
			t.expect(statusChanges).toStrictEqual([
				ControllerStatus.Jammed,
				ControllerStatus.Ready,
			]);

			// The immediate queue keeps working
			await immediatePing();
		},
	},
);

let swallowSoftReset = false;

integrationTest.sequential(
	"softResetAndRestart re-interviews the controller when it does not send SerialAPIStarted",
	{
		// debug: true,

		additionalDriverOptions: {
			timeouts: {
				serialAPIStarted: 1000,
			},
		},

		customSetup: async (driver, controller, mockNode) => {
			const noSerialAPIStarted: MockControllerBehavior = {
				onHostMessage(controller, msg) {
					if (swallowSoftReset && msg instanceof SoftResetRequest) {
						swallowSoftReset = false;
						return true;
					}
				},
			};
			controller.defineBehavior(noSerialAPIStarted);
		},
		testBody: async (t, driver, node, mockController, mockNode) => {
			swallowSoftReset = true;
			mockController.clearReceivedHostMessages();

			const driverReady = new Promise<void>((resolve) => {
				driver.once("driver ready", () => resolve());
			});
			await driver.softResetAndRestart();

			const result = await Promise.race([
				driverReady.then(() => "ready"),
				wait(20000).then(() => "timeout"),
			]);
			t.expect(result).toBe("ready");

			// The driver had to poll the controller to detect that it restarted
			mockController.assertReceivedHostMessage(
				(msg) => msg instanceof GetControllerVersionRequest,
			);
		},
	},
);

// A controller without the Bridge API that stays jammed until a soft reset
const jamTestOptions = {
	controllerCapabilities: controllerCapabilitiesNoBridge,
	additionalDriverOptions: {
		testingHooks: {
			skipNodeInterview: true,
		},
	},
	customSetup: async (driver: any, controller: any) => {
		controller.defineBehavior(jamUntilSoftReset);
	},
};

// Fakes only the monotonic clock, so the test can jump over the waiting time between jam recoveries
function useFakeClock(): void {
	vi.useFakeTimers({ toFake: ["hrtime"], shouldAdvanceTime: true });
}

/** Returns the monotonic time in milliseconds */
function now(): number {
	return highResTimestamp() / 1e6;
}

/** Moves the fake monotonic clock forward to the given time in milliseconds */
function jumpTo(time: number): void {
	vi.advanceTimersByTime(Math.max(0, time - now()));
}

// Counts the soft resets the controller received
function countSoftResets(mockController: {
	receivedHostMessages: readonly { functionType: FunctionType }[];
}): number {
	return mockController.receivedHostMessages.filter(
		(msg) => msg.functionType === FunctionType.SoftReset,
	).length;
}

integrationTest.sequential(
	"After jam recoveries that did not help, the driver waits 15 s, 30 s, then 1 min before it recovers again",
	{
		// debug: true,
		...jamTestOptions,

		testBody: async (t, driver, node, mockController, mockNode) => {
			node.markAsAlive();
			// Circumvent the options validation, so the jam attempts are quick
			driver.options.timeouts.retryJammed = 100;
			useFakeClock();
			try {
				// Let the controller stay jammed through 5 soft resets
				softResetsWithoutEffect = 5;
				shouldFail = true;
				// The first recovery does not help, so the driver gives up and returns to Ready
				t.expect(await node.ping()).toBe(false);
				t.expect(countSoftResets(mockController)).toBe(1);
				t.expect(driver.controller.status).toBe(ControllerStatus.Ready);

				// Check each waiting time from the moment the last recovery failed
				let failedAt = now();
				let resets = 1;
				for (const backoff of [15_000, 30_000, 60_000, 60_000]) {
					// Within the waiting time, a jam fails without a reset
					jumpTo(failedAt + backoff - 2000);
					t.expect(await node.ping()).toBe(false);
					t.expect(countSoftResets(mockController)).toBe(resets);

					// After it, the next jam is recovered, which does not help either
					jumpTo(failedAt + backoff + 1000);
					t.expect(await node.ping()).toBe(false);
					t.expect(countSoftResets(mockController)).toBe(++resets);
					failedAt = now();
				}
			} finally {
				shouldFail = false;
				vi.useRealTimers();
			}
		},
	},
);

integrationTest.sequential(
	"A command that is still retrying a jam when a recovery fails does not start a second soft reset",
	{
		// debug: true,
		...jamTestOptions,

		testBody: async (t, driver, node, mockController, mockNode) => {
			node.markAsAlive();

			// The soft reset outlasts the delay between jam attempts.
			// So the immediate command's last attempt waits for the reset and is sent before the retry.
			const slowSoftReset: MockControllerBehavior = {
				async onHostMessage(controller, msg) {
					if (msg instanceof SoftResetRequest) await wait(1500);
					return false;
				},
			};
			mockController.defineBehavior(slowSoftReset);

			// Let one soft reset not help
			softResetsWithoutEffect = 1;
			shouldFail = true;
			// The normal command runs out of jam attempts first and starts the recovery
			const normal = node.ping();
			// Send an immediate command while the normal one is still between its jam attempts
			await wait(500);
			const immediate = driver.sendCommand(
				new NoOperationCC({ nodeId: node.id }),
				{ priority: MessagePriority.Immediate },
			);
			// The immediate command fails before the assertion runs
			immediate.catch(() => {});

			// Both commands fail, after only one soft reset
			t.expect(await normal).toBe(false);
			await t.expect(immediate).rejects.toMatchObject({
				code: ZWaveErrorCodes.Controller_MessageDropped,
			});
			t.expect(countSoftResets(mockController)).toBe(1);
		},
	},
);

integrationTest.sequential(
	"A successful transmission resets the waiting time after failed jam recoveries to 15 s",
	{
		// debug: true,
		...jamTestOptions,

		testBody: async (t, driver, node, mockController, mockNode) => {
			node.markAsAlive();
			// Circumvent the options validation, so the jam attempts are quick
			driver.options.timeouts.retryJammed = 100;
			useFakeClock();
			try {
				// Let the controller stay jammed through 3 soft resets
				softResetsWithoutEffect = 3;
				shouldFail = true;
				// Fail two recoveries, so the next waiting time would be 1 min
				t.expect(await node.ping()).toBe(false);
				jumpTo(now() + 16_000);
				t.expect(await node.ping()).toBe(false);
				t.expect(countSoftResets(mockController)).toBe(2);

				// The jam clears on its own, and a transmission succeeds
				shouldFail = false;
				t.expect(await node.ping()).toBe(true);

				// The next jam is recovered right away
				shouldFail = true;
				t.expect(await node.ping()).toBe(false);
				t.expect(countSoftResets(mockController)).toBe(3);
				const failedAt = now();

				// The waiting time starts at 15 s again
				jumpTo(failedAt + 13_000);
				t.expect(await node.ping()).toBe(false);
				t.expect(countSoftResets(mockController)).toBe(3);
				jumpTo(failedAt + 16_000);
				t.expect(await node.ping()).toBe(true);
				t.expect(countSoftResets(mockController)).toBe(4);
			} finally {
				shouldFail = false;
				vi.useRealTimers();
			}
		},
	},
);

integrationTest.sequential(
	"The controller stays jammed after the soft reset until a transmission succeeds",
	{
		// debug: true,
		...jamTestOptions,

		testBody: async (t, driver, node, mockController, mockNode) => {
			node.markAsAlive();

			// Record the controller status when the first command after the soft reset is sent
			const statusAtRetry: ControllerStatus[] = [];
			let afterReset = false;
			const recordStatus: MockControllerBehavior = {
				onHostMessage(controller, msg) {
					if (msg instanceof SoftResetRequest) {
						afterReset = true;
					} else if (afterReset && msg instanceof SendDataRequest) {
						afterReset = false;
						statusAtRetry.push(driver.controller.status);
					}
					return false;
				},
			};
			mockController.defineBehavior(recordStatus);

			// Jam the controller until the soft reset
			shouldFail = true;
			t.expect(await node.ping()).toBe(true);

			// The status is still Jammed at the retry and Ready after it succeeded
			t.expect(statusAtRetry).toStrictEqual([ControllerStatus.Jammed]);
			t.expect(driver.controller.status).toBe(ControllerStatus.Ready);
		},
	},
);

integrationTest.sequential("Two jammed commands cause one soft reset", {
	// debug: true,
	...jamTestOptions,

	testBody: async (t, driver, node, mockController, mockNode) => {
		node.markAsAlive();

		// Jam the controller until the soft reset, and send a normal and an immediate command
		shouldFail = true;
		const normal = node.ping();
		const immediate = driver.sendCommand(
			new NoOperationCC({ nodeId: node.id }),
			{ priority: MessagePriority.Immediate },
		);

		// Both commands succeed after one soft reset
		t.expect(await normal).toBe(true);
		await t.expect(immediate).resolves.toBeUndefined();
		t.expect(countSoftResets(mockController)).toBe(1);
	},
});

integrationTest.sequential(
	"Destroying the driver while it recovers a jammed controller ends the recovery",
	{
		// debug: true,
		...jamTestOptions,

		testBody: async (t, driver, node, mockController, mockNode) => {
			node.markAsAlive();
			// The recovery then waits for the Serial API to start
			mockController.capabilities.sendsSerialAPIStartedAfterSoftReset = false;

			// Jam the controller and wait until the recovery sends the soft reset
			shouldFail = true;
			const ping = node.ping();
			await mockController.expectHostMessage(
				(msg) => msg instanceof SoftResetRequest,
				{ timeout: 10000 },
			);

			// Destroy the driver while the recovery waits for the restart
			const start = Date.now();
			await driver.destroy();
			t.expect(Date.now() - start).toBeLessThan(1000);
			// The ping reports the failure instead of hanging
			t.expect(await ping).toBe(false);
		},
	},
);

integrationTest.sequential(
	"When the retry after recovering a jammed controller cannot be queued, the next jam is recovered after the waiting time",
	{
		// debug: true,

		controllerCapabilities: controllerCapabilitiesNoBridge,

		additionalDriverOptions: {
			testingHooks: {
				skipNodeInterview: true,
			},
		},

		customSetup: async (driver, controller, mockNode) => {
			controller.defineBehavior(jamUntilSoftReset);
		},
		testBody: async (t, driver, node, mockController, mockNode) => {
			node.markAsAlive();

			// Count the soft resets the controller received
			const countSoftResets = () =>
				mockController.receivedHostMessages.filter(
					(msg) => msg.functionType === FunctionType.SoftReset,
				).length;

			// The waiting time must be set with the fake clock
			useFakeClock();
			try {
				// After the soft reset, the controller rejects all attempts of the retry
				queueFullAfterSoftReset = 3;
				shouldFail = true;
				t.expect(await node.ping()).toBe(false);
				t.expect(countSoftResets()).toBe(1);

				// No transmission succeeded after the recovery. So the next jam fails without a reset.
				shouldFail = true;
				t.expect(await node.ping()).toBe(false);
				t.expect(countSoftResets()).toBe(1);

				// After the waiting time, the next jam starts a new recovery
				jumpTo(now() + 16_000);
				t.expect(await node.ping()).toBe(true);
			} finally {
				vi.useRealTimers();
			}
			t.expect(countSoftResets()).toBe(2);
			t.expect(driver.controller.status).toBe(ControllerStatus.Ready);
		},
	},
);

integrationTest.sequential(
	"A jam is recovered even when another transmission set the status to Ready in the meantime",
	{
		// debug: true,
		...jamTestOptions,

		testBody: async (t, driver, node, mockController, mockNode) => {
			node.markAsAlive();

			// Like a successful transmission of another command right before the last jammed attempt
			let jammedSendData = 0;
			const readyBeforeLastAttempt: MockControllerBehavior = {
				onHostMessage(controller, msg) {
					if (shouldFail && msg instanceof SendDataRequest) {
						jammedSendData++;
						if (
							jammedSendData
							=== driver.options.attempts.sendDataJammed
						) {
							driver.controller.setStatus(ControllerStatus.Ready);
						}
					}
					return false;
				},
			};
			mockController.defineBehavior(readyBeforeLastAttempt);

			// Jam the controller until the soft reset
			shouldFail = true;
			// The ping succeeds after one soft reset
			t.expect(await node.ping()).toBe(true);
			t.expect(countSoftResets(mockController)).toBe(1);
		},
	},
);

type Mode = "normal" | "noCallback" | "jam";
let mode: Mode = "normal";
// The modes after the next soft resets. Without them, a missing callback is followed by a jam, and a jam by normal operation.
let modesAfterSoftReset: Mode[] | undefined;
// Leaves the callback out or jams, depending on the mode. Each soft reset moves on to the next mode.
const callbackThenJam: MockControllerBehavior = {
	async onHostMessage(controller, msg) {
		if (msg instanceof SoftResetRequest) {
			if (modesAfterSoftReset) {
				mode = modesAfterSoftReset.shift() ?? "normal";
			} else {
				mode = mode === "noCallback" ? "jam" : "normal";
			}
			return false;
		}
		if (!(msg instanceof SendDataRequest) || mode === "normal") return;

		await controller.sendMessageToHost(
			new SendDataResponse({ wasSent: true }),
		);
		if (mode === "noCallback") return true;

		await wait(100);
		await controller.sendMessageToHost(
			new SendDataRequestTransmitReport({
				callbackId: msg.callbackId!,
				transmitStatus: TransmitStatus.Fail,
				txReport: {
					txTicks: 0,
					routeSpeed: 0 as any,
					routingAttempts: 0,
					ackRSSI: 0,
				},
			}),
		);
		return true;
	},
};

integrationTest.sequential(
	"A missing callback after a jam recovery that followed a callback recovery is recovered again",
	{
		// debug: true,
		...jamTestOptions,

		customSetup: async (driver, controller) => {
			controller.defineBehavior(callbackThenJam);
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Circumvent the options validation so the test doesn't take forever
			driver.options.timeouts.sendDataAbort = 1000;
			driver.options.timeouts.sendDataCallback = 1500;
			node.markAsAlive();
			// Watch whether a node is marked as dead
			const nodeDead = sinon.spy();
			node.on("dead", nodeDead);

			// The callback goes missing, the retry after that recovery jams, and the next retry works
			mode = "noCallback";
			t.expect(await node.ping()).toBe(true);
			t.expect(countSoftResets(mockController)).toBe(2);

			// A later missing callback is a new problem, so the driver recovers again
			mode = "noCallback";
			t.expect(await node.ping()).toBe(true);
			t.expect(countSoftResets(mockController)).toBe(4);
			// No node may be blamed for the missing callbacks
			sinon.assert.notCalled(nodeDead);
		},
	},
);

integrationTest.sequential(
	"A missing callback while the controller counts as jammed is handled as a missing callback",
	{
		// debug: true,
		...jamTestOptions,

		customSetup: async (driver, controller) => {
			controller.defineBehavior(callbackThenJam);
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Circumvent the options validation so the test doesn't take forever
			driver.options.timeouts.sendDataAbort = 1000;
			driver.options.timeouts.sendDataCallback = 1500;
			node.markAsAlive();

			// Mark the controller as jammed and let the next callback go missing
			driver.controller.setStatus(ControllerStatus.Jammed);
			mode = "noCallback";
			// Ping the node and wait until the recovery soft-resets the controller
			const ping = node.ping();
			await mockController.expectHostMessage(
				(msg) => msg instanceof SoftResetRequest,
				{ timeout: 5000 },
			);
			// The recovery of a missing callback marks the controller as unresponsive
			t.expect(driver.controller.status).toBe(
				ControllerStatus.Unresponsive,
			);
			// The ping succeeds after the recovery
			t.expect(await ping).toBe(true);
		},
	},
);

integrationTest.sequential(
	"A missing callback after a jam the driver gave up on is recovered again",
	{
		// debug: true,
		...jamTestOptions,

		customSetup: async (driver, controller) => {
			controller.defineBehavior(callbackThenJam);
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Circumvent the options validation so the test doesn't take forever
			driver.options.timeouts.sendDataAbort = 1000;
			driver.options.timeouts.sendDataCallback = 1500;
			driver.options.timeouts.retryJammed = 100;
			node.markAsAlive();
			// Watch whether a node is marked as dead
			const nodeDead = sinon.spy();
			node.on("dead", nodeDead);

			try {
				// The retry after the jam recovery loses its callback.
				// The retry after that recovery jams, and the driver gives up.
				mode = "jam";
				modesAfterSoftReset = ["noCallback", "jam"];
				t.expect(await node.ping()).toBe(false);
				t.expect(countSoftResets(mockController)).toBe(2);

				// A transmission succeeds
				mode = "normal";
				t.expect(await node.ping()).toBe(true);

				// A later missing callback is a new problem, so the driver recovers again
				mode = "noCallback";
				t.expect(await node.ping()).toBe(true);
				t.expect(countSoftResets(mockController)).toBe(3);
				// No node may be blamed for the missing callback
				sinon.assert.notCalled(nodeDead);
			} finally {
				mode = "normal";
				modesAfterSoftReset = undefined;
			}
		},
	},
);

integrationTest.sequential(
	"A NotIdle transmit report does not end the waiting time after a failed jam recovery",
	{
		// debug: true,
		...jamTestOptions,

		testBody: async (t, driver, node, mockController, mockNode) => {
			node.markAsAlive();
			// Circumvent the options validation, so the jam attempts are quick
			driver.options.timeouts.retryJammed = 100;

			// Let the controller answer with NotIdle while the flag is set
			let notIdle = false;
			const reportNotIdle: MockControllerBehavior = {
				async onHostMessage(controller, msg) {
					if (!notIdle || !(msg instanceof SendDataRequest)) return;
					await controller.sendMessageToHost(
						new SendDataResponse({ wasSent: true }),
					);
					await controller.sendMessageToHost(
						new SendDataRequestTransmitReport({
							callbackId: msg.callbackId!,
							transmitStatus: TransmitStatus.NotIdle,
						}),
					);
					return true;
				},
			};
			mockController.defineBehavior(reportNotIdle);

			try {
				// Let one recovery not help, so the waiting time starts
				softResetsWithoutEffect = 1;
				shouldFail = true;
				t.expect(await node.ping()).toBe(false);
				t.expect(countSoftResets(mockController)).toBe(1);

				// The controller is busy and does not transmit
				notIdle = true;
				t.expect(await node.ping()).toBe(false);
				notIdle = false;

				// The waiting time still runs, so the next jam fails without a reset
				t.expect(await node.ping()).toBe(false);
				t.expect(countSoftResets(mockController)).toBe(1);
			} finally {
				shouldFail = false;
			}
		},
	},
);

integrationTest.sequential(
	"A missing callback after an unresponsive controller recovery that followed a callback recovery is recovered again",
	{
		// debug: true,
		...jamTestOptions,

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Circumvent the options validation so the test doesn't take forever
			driver.options.timeouts.sendDataAbort = 1000;
			driver.options.timeouts.sendDataCallback = 1500;
			driver.options.timeouts.ack = 400;
			node.markAsAlive();
			// Watch whether a node is marked as dead
			const nodeDead = sinon.spy();
			node.on("dead", nodeDead);

			// Let the controller miss one callback or one ACK, until the next soft reset
			let failure: "none" | "noCallback" | "noAck" = "none";
			const failOnce: MockControllerBehavior = {
				async onHostMessage(controller, msg) {
					if (msg instanceof SoftResetRequest) {
						if (failure === "noAck") {
							// The ACK was not sent, so we need to do it here
							controller.ackHostMessage();
							controller.autoAckHostMessages = true;
						}
						failure = "none";
						return false;
					}
					if (
						!(msg instanceof SendDataRequest)
						|| failure === "none"
					) {
						return;
					}
					if (failure === "noCallback") {
						await controller.sendMessageToHost(
							new SendDataResponse({ wasSent: true }),
						);
					}
					return true;
				},
			};
			mockController.defineBehavior(failOnce);

			// Recover from a missing callback
			failure = "noCallback";
			t.expect(await node.ping()).toBe(true);
			t.expect(countSoftResets(mockController)).toBe(1);

			// Recover from a missing ACK
			failure = "noAck";
			mockController.autoAckHostMessages = false;
			t.expect(await node.ping()).toBe(true);
			t.expect(countSoftResets(mockController)).toBe(2);

			// The unresponsive controller recovery ended the callback recovery
			failure = "noCallback";
			t.expect(await node.ping()).toBe(true);
			t.expect(countSoftResets(mockController)).toBe(3);
			// No node may be blamed for the missing callback
			sinon.assert.notCalled(nodeDead);
		},
	},
);

/** Queues a SendData that does not start, and returns it with its transaction */
function queueSendData(
	driver: Parameters<
		NonNullable<Parameters<typeof integrationTest>[1]["testBody"]>
	>[1],
	nodeId: number,
) {
	const msg = new SendDataRequest({
		command: new NoOperationCC({ nodeId }),
	});
	const promise = driver.sendMessage(msg);
	promise.catch(() => {});
	const transaction = driver["queue"].find((t) => t.message === msg)!;
	driver["queue"].remove(transaction);
	return { msg, promise, transaction };
}

// The error of a SendData whose callback went missing
const missingCallback = new ZWaveError(
	"Timeout while waiting for a callback from the controller",
	ZWaveErrorCodes.Controller_Timeout,
	"callback",
);

integrationTest.sequential(
	"A SendData that fails during a running recovery is encoded anew before it is sent again",
	{
		// debug: true,
		...jamTestOptions,

		testBody: async (t, driver, node, mockController, mockNode) => {
			node.markAsAlive();

			// Start a jam recovery
			const recovery = driver["recoverJammedController"]();
			// Like a SendData whose callback went missing while the recovery started
			driver.controller.setStatus(ControllerStatus.Unresponsive);
			const { msg, promise, transaction } = queueSendData(
				driver,
				node.id,
			);
			// Like the bytes of a command the node has already received
			msg.serializedCC = Uint8Array.from([0x00]);
			// Let a SendData whose callback went missing join the recovery
			driver["handleFailedTransaction"](transaction, missingCallback);
			// The cached frame stays until the recovery ends and is dropped then
			t.expect(msg.serializedCC).toBeDefined();

			await recovery;
			t.expect(msg.serializedCC).toBeUndefined();
			// The command is sent again and succeeds
			driver.controller.setStatus(ControllerStatus.Ready);
			await t.expect(promise).resolves.toBeDefined();
		},
	},
);

integrationTest.sequential(
	"A command that fails during the recovery of a missing callback fails too when the soft reset fails",
	{
		// debug: true,
		...jamTestOptions,

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Circumvent the options validation so the test doesn't take forever
			driver.options.timeouts.sendDataAbort = 1000;
			driver.options.timeouts.sendDataCallback = 1500;
			driver.options.timeouts.ack = 400;
			node.markAsAlive();

			// The callback goes missing, and the controller neither acknowledges the soft reset nor restarts
			mockController.capabilities.sendsSerialAPIStartedAfterSoftReset = false;
			let missCallback = true;
			const failRecovery: MockControllerBehavior = {
				async onHostMessage(controller, msg) {
					if (!missCallback || !(msg instanceof SendDataRequest)) {
						return;
					}
					missCallback = false;
					await controller.sendMessageToHost(
						new SendDataResponse({ wasSent: true }),
					);
					controller.autoAckHostMessages = false;
					return true;
				},
			};
			mockController.defineBehavior(failRecovery);

			// Ping the node and wait until the recovery sends the soft reset
			const ping = node.ping();
			await mockController.expectHostMessage(
				(msg) => msg instanceof SoftResetRequest,
				{ timeout: 5000 },
			);
			// Let another SendData join the recovery
			const { promise, transaction } = queueSendData(driver, node.id);
			driver["handleFailedTransaction"](transaction, missingCallback);

			try {
				// Both commands fail, the joined one with its own callback timeout
				t.expect(await ping).toBe(false);
				await t.expect(promise).rejects.toMatchObject({
					code: ZWaveErrorCodes.Controller_Timeout,
					context: "callback",
				});
			} finally {
				mockController.autoAckHostMessages = true;
			}
		},
	},
);
