import { NoOperationCC } from "@zwave-js/cc";
import {
	ControllerStatus,
	MessagePriority,
	NodeStatus,
	TransmitStatus,
	ZWaveErrorCodes,
	assertZWaveError,
	getZWaveChipType,
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

// Counts the soft resets the controller received
function countSoftResets(mockController: {
	receivedHostMessages: readonly { functionType: FunctionType }[];
}): number {
	return mockController.receivedHostMessages.filter(
		(msg) => msg.functionType === FunctionType.SoftReset,
	).length;
}

integrationTest.sequential(
	"When a command still fails after recovering a jammed controller, the driver gives up and does not reset again during the cooldown",
	{
		// debug: true,
		...jamTestOptions,

		testBody: async (t, driver, node, mockController, mockNode) => {
			node.markAsAlive();

			// The first soft reset does not clear the jam, so the driver gives up on the command
			softResetsWithoutEffect = 1;
			shouldFail = true;
			t.expect(await node.ping()).toBe(false);
			t.expect(countSoftResets(mockController)).toBe(1);
			t.expect(driver.controller.status).toBe(ControllerStatus.Ready);

			// The controller is still jammed. Within the cooldown, the next jam fails without a reset
			t.expect(await node.ping()).toBe(false);
			t.expect(countSoftResets(mockController)).toBe(1);

			// Once the cooldown is over, the next jam starts a new recovery
			driver["jamRecoveryBlockedUntil"] = Date.now() - 1;
			t.expect(await node.ping()).toBe(true);
			t.expect(countSoftResets(mockController)).toBe(2);
			t.expect(driver.controller.status).toBe(ControllerStatus.Ready);
		},
	},
);

integrationTest.sequential(
	"A successful transmission ends the cooldown after a failed jam recovery",
	{
		// debug: true,
		...jamTestOptions,

		testBody: async (t, driver, node, mockController, mockNode) => {
			node.markAsAlive();

			softResetsWithoutEffect = 1;
			shouldFail = true;
			t.expect(await node.ping()).toBe(false);
			t.expect(countSoftResets(mockController)).toBe(1);

			// The jam clears on its own, and a transmission succeeds
			shouldFail = false;
			t.expect(await node.ping()).toBe(true);

			// The next jam is recovered right away
			shouldFail = true;
			t.expect(await node.ping()).toBe(true);
			t.expect(countSoftResets(mockController)).toBe(2);
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
	"When the retry after recovering a jammed controller cannot be queued, the next jam is recovered again",
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

			// After the soft reset, the controller rejects all attempts of the retry
			queueFullAfterSoftReset = 3;
			shouldFail = true;
			t.expect(await node.ping()).toBe(false);
			t.expect(countSoftResets()).toBe(1);

			// The next jam must start a new recovery
			shouldFail = true;
			t.expect(await node.ping()).toBe(true);
			t.expect(countSoftResets()).toBe(2);
			t.expect(driver.controller.status).toBe(ControllerStatus.Ready);
		},
	},
);
