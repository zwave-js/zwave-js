import {
	ApplicationStatus,
	ApplicationStatusCCBusy,
	HailCC,
	MultilevelSwitchCCGet,
	MultilevelSwitchCCReport,
	MultilevelSwitchCCValues,
} from "@zwave-js/cc";
import { CommandClasses } from "@zwave-js/core";
import { ApplicationUpdateRequestNodeInfoReceived } from "@zwave-js/serial/serialapi";
import {
	type MockNodeBehavior,
	createMockZWaveRequestFrame,
} from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";

import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"A Get answered with Application Busy (Try again later) is sent again after the wait time",
	{
		// debug: true,

		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				CommandClasses["Multilevel Switch"],
				CommandClasses["Application Status"],
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Mimic a device that rejects the first Get as busy, then sends a Hail once it is ready
			let numGets = 0;
			const busyOnFirstGet: MockNodeBehavior = {
				handleCC(controller, self, receivedCC) {
					if (!(receivedCC instanceof MultilevelSwitchCCGet)) return;
					numGets++;
					if (numGets === 1) {
						setTimeout(() => {
							void self.sendToController(
								createMockZWaveRequestFrame(
									new HailCC({
										nodeId: controller.ownNodeId,
									}),
									{ ackRequested: false },
								),
							);
						}, 900);
						const cc = new ApplicationStatusCCBusy({
							nodeId: controller.ownNodeId,
							status: ApplicationStatus.TryAgainLater,
						});
						return { action: "sendCC", cc };
					}
					const cc = new MultilevelSwitchCCReport({
						nodeId: controller.ownNodeId,
						targetValue: 42,
						currentValue: 42,
					});
					return { action: "sendCC", cc };
				},
			};
			mockNode.defineBehavior(busyOnFirstGet);

			// Send a command to the host informing it that something happened
			const nif = new ApplicationUpdateRequestNodeInfoReceived({
				nodeInformation: {
					nodeId: node.id,
					basicDeviceClass: mockNode.capabilities.basicDeviceClass,
					genericDeviceClass:
						mockNode.capabilities.genericDeviceClass,
					specificDeviceClass:
						mockNode.capabilities.specificDeviceClass,
					supportedCCs: [...mockNode.implementedCCs.keys()],
				},
			});
			await mockController.sendMessageToHost(nif);

			await wait(2500);

			// Check that the node retried the Get command after being busy
			t.expect(numGets).toBe(2);
			t.expect(
				node.getValue(MultilevelSwitchCCValues.currentValue.id),
			).toBe(42);
		},
	},
);

integrationTest(
	"A Get answered with Application Busy (Try again in wait time) resolves with the report of the next attempt",
	{
		// debug: true,

		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				CommandClasses["Multilevel Switch"],
				CommandClasses["Application Status"],
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			let numGets = 0;
			const busyOnFirstGet: MockNodeBehavior = {
				handleCC(controller, self, receivedCC) {
					if (!(receivedCC instanceof MultilevelSwitchCCGet)) return;
					numGets++;
					if (numGets === 1) {
						const cc = new ApplicationStatusCCBusy({
							nodeId: controller.ownNodeId,
							status: ApplicationStatus.TryAgainInWaitTimeSeconds,
							waitTime: 1,
						});
						return { action: "sendCC", cc };
					} else {
						const cc = new MultilevelSwitchCCReport({
							nodeId: controller.ownNodeId,
							targetValue: 42,
							currentValue: 42,
						});
						return { action: "sendCC", cc };
					}
				},
			};
			mockNode.defineBehavior(busyOnFirstGet);

			const start = Date.now();
			const report = await driver.sendCommand(
				new MultilevelSwitchCCGet({ nodeId: node.id }),
			);
			t.expect(report).toBeInstanceOf(MultilevelSwitchCCReport);
			t.expect(numGets).toBe(2);
			t.expect(Date.now() - start).toBeGreaterThanOrEqual(1000);
		},
	},
);

integrationTest(
	"A Get that is always answered with Application Busy is sent at most as often as configured",
	{
		// debug: true,

		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				CommandClasses["Multilevel Switch"],
				CommandClasses["Application Status"],
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			let numGets = 0;
			const alwaysBusy: MockNodeBehavior = {
				handleCC(controller, self, receivedCC) {
					if (!(receivedCC instanceof MultilevelSwitchCCGet)) return;
					numGets++;
					const cc = new ApplicationStatusCCBusy({
						nodeId: controller.ownNodeId,
						status: ApplicationStatus.TryAgainInWaitTimeSeconds,
						waitTime: 1,
					});
					return { action: "sendCC", cc };
				},
			};
			mockNode.defineBehavior(alwaysBusy);

			// sendCommand returns nothing when the node does not respond
			const report = await driver.sendCommand(
				new MultilevelSwitchCCGet({ nodeId: node.id }),
			);
			t.expect(report).toBeUndefined();
			t.expect(numGets).toBe(driver.options.attempts.sendData);
		},
	},
);
