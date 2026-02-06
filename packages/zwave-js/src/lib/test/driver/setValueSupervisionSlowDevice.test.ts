import {
	SupervisionCCGet,
	SupervisionCCReport,
	WindowCoveringCCGet,
	WindowCoveringCCReport,
	WindowCoveringCCSet,
	WindowCoveringCCValues,
	WindowCoveringParameter,
} from "@zwave-js/cc";
import {
	BasicDeviceClass,
	CommandClasses,
	Duration,
	SupervisionStatus,
} from "@zwave-js/core";
import {
	type MockNodeBehavior,
	ccCaps,
	createMockZWaveRequestFrame,
} from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"setValue: slow device without Supervision CC and without final state report",
	{
		// debug: true,

		additionalDriverOptions: {
			timeouts: {
				refreshValue: 1200,
			},
		},

		nodeCapabilities: {
			basicDeviceClass: BasicDeviceClass["End Node"],
			genericDeviceClass: 0x09, // Window Covering
			specificDeviceClass: 0x01, // Simple Window Covering Control
			commandClasses: [
				// No Supervision CC
				ccCaps({
					ccId: CommandClasses["Window Covering"],
					isSupported: true,
					supportedParameters: [
						WindowCoveringParameter["Outbound Left"],
					],
				}),
			],
		},

		customSetup: async (driver, controller, mockNode) => {
			// Track the current value
			let currentValue = 0;

			// Handle Window Covering Set commands
			const respondToWindowCoveringSet: MockNodeBehavior = {
				handleCC(controller, self, receivedCC) {
					if (receivedCC instanceof WindowCoveringCCSet) {
						// Update the internal state
						if (receivedCC.targetValues.length > 0) {
							currentValue = receivedCC.targetValues[0].value;
						}
						return { action: "ok" };
					}
				},
			};
			mockNode.defineBehavior(respondToWindowCoveringSet);

			// Report Window Covering status
			const respondToWindowCoveringGet: MockNodeBehavior = {
				handleCC(controller, self, receivedCC) {
					if (receivedCC instanceof WindowCoveringCCGet) {
						const cc = new WindowCoveringCCReport({
							nodeId: controller.ownNodeId,
							parameter: receivedCC.parameter,
							currentValue,
							targetValue: currentValue,
							duration: Duration.unknown(),
						});
						return { action: "sendCC", cc };
					}
				},
			};
			mockNode.defineBehavior(respondToWindowCoveringGet);
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Set initial value to 0
			node.valueDB.setValue(
				WindowCoveringCCValues.currentValue(
					WindowCoveringParameter["Outbound Left"],
				).id,
				0,
			);

			// Wait for the currentValue to be updated
			const valuePromise = new Promise<number>((resolve) => {
				node.on("value updated", (node, args) => {
					if (
						args.commandClass === CommandClasses["Window Covering"]
						&& args.propertyName === "currentValue"
					) {
						resolve(args.newValue as number);
					}
				});
			});

			// Set target value to 50 (not supervised since no Supervision CC)
			await node.setValue(
				WindowCoveringCCValues.targetValue(
					WindowCoveringParameter["Outbound Left"],
				).id,
				50,
			);

			// Wait for the value to be updated (this will likely timeout)
			const newValue = await Promise.race([
				valuePromise,
				wait(5000).then(() => "timeout"),
			]);
			t.expect(newValue).toBe(50);
		},
	},
);

integrationTest(
	"setValue: slow device without Supervision CC but with final state report",
	{
		// debug: true,

		additionalDriverOptions: {
			timeouts: {
				refreshValue: 1200,
			},
		},

		nodeCapabilities: {
			basicDeviceClass: BasicDeviceClass["End Node"],
			genericDeviceClass: 0x09, // Window Covering
			specificDeviceClass: 0x01, // Simple Window Covering Control
			commandClasses: [
				// No Supervision CC
				ccCaps({
					ccId: CommandClasses["Window Covering"],
					isSupported: true,
					supportedParameters: [
						WindowCoveringParameter["Outbound Left"],
					],
				}),
			],
		},

		customSetup: async (driver, controller, mockNode) => {
			// Track the current value
			let currentValue = 0;

			// Handle Window Covering Set commands
			const respondToWindowCoveringSet: MockNodeBehavior = {
				async handleCC(controller, self, receivedCC) {
					if (receivedCC instanceof WindowCoveringCCSet) {
						// Update the internal state
						if (receivedCC.targetValues.length > 0) {
							currentValue = receivedCC.targetValues[0].value;
						}

						// Send a Window Covering Report after a short delay
						await wait(500);

						const report = new WindowCoveringCCReport({
							nodeId: controller.ownNodeId,
							parameter: WindowCoveringParameter["Outbound Left"],
							currentValue,
							targetValue: currentValue,
							duration: Duration.unknown(),
						});
						return { action: "sendCC", cc: report };
					}
				},
			};
			mockNode.defineBehavior(respondToWindowCoveringSet);

			// Report Window Covering status
			const respondToWindowCoveringGet: MockNodeBehavior = {
				handleCC(controller, self, receivedCC) {
					if (receivedCC instanceof WindowCoveringCCGet) {
						const cc = new WindowCoveringCCReport({
							nodeId: controller.ownNodeId,
							parameter: receivedCC.parameter,
							currentValue,
							targetValue: currentValue,
							duration: Duration.unknown(),
						});
						return { action: "sendCC", cc };
					}
				},
			};
			mockNode.defineBehavior(respondToWindowCoveringGet);
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Set initial value to 0
			node.valueDB.setValue(
				WindowCoveringCCValues.currentValue(
					WindowCoveringParameter["Outbound Left"],
				).id,
				0,
			);

			// Wait for the currentValue to be updated
			const valuePromise = new Promise<number>((resolve) => {
				node.on("value updated", (node, args) => {
					if (
						args.commandClass === CommandClasses["Window Covering"]
						&& args.propertyName === "currentValue"
					) {
						resolve(args.newValue as number);
					}
				});
			});

			// Set target value to 50 (not supervised since no Supervision CC)
			await node.setValue(
				WindowCoveringCCValues.targetValue(
					WindowCoveringParameter["Outbound Left"],
				).id,
				50,
			);

			// Wait for the value to be updated
			const newValue = await Promise.race([
				valuePromise,
				wait(5000).then(() => "timeout"),
			]);
			t.expect(newValue).toBe(50);
		},
	},
);

integrationTest(
	"setValue: slow device with Supervision CC success but without final state report",
	{
		// debug: true,

		additionalDriverOptions: {
			timeouts: {
				refreshValue: 1200,
			},
		},

		nodeCapabilities: {
			basicDeviceClass: BasicDeviceClass["End Node"],
			genericDeviceClass: 0x09, // Window Covering
			specificDeviceClass: 0x01, // Simple Window Covering Control
			commandClasses: [
				CommandClasses.Supervision,
				ccCaps({
					ccId: CommandClasses["Window Covering"],
					isSupported: true,
					supportedParameters: [
						WindowCoveringParameter["Outbound Left"],
					],
				}),
			],
		},

		customSetup: async (driver, controller, mockNode) => {
			// Track the current value
			let currentValue = 0;

			// Respond to Supervision Get with immediate success
			const respondToSupervisionGet: MockNodeBehavior = {
				handleCC(controller, self, receivedCC) {
					if (
						receivedCC instanceof SupervisionCCGet
						&& receivedCC.encapsulated
							instanceof WindowCoveringCCSet
					) {
						// Update the internal state
						if (receivedCC.encapsulated.targetValues.length > 0) {
							currentValue =
								receivedCC.encapsulated.targetValues[0].value;
						}

						const cc = new SupervisionCCReport({
							nodeId: controller.ownNodeId,
							sessionId: receivedCC.sessionId,
							moreUpdatesFollow: false,
							status: SupervisionStatus.Success,
						});
						return { action: "sendCC", cc };
					}
				},
			};
			mockNode.defineBehavior(respondToSupervisionGet);

			// Report Window Covering status
			const respondToWindowCoveringGet: MockNodeBehavior = {
				handleCC(controller, self, receivedCC) {
					if (receivedCC instanceof WindowCoveringCCGet) {
						const cc = new WindowCoveringCCReport({
							nodeId: controller.ownNodeId,
							parameter: receivedCC.parameter,
							currentValue,
							targetValue: currentValue,
							duration: Duration.unknown(),
						});
						return { action: "sendCC", cc };
					}
				},
			};
			mockNode.defineBehavior(respondToWindowCoveringGet);
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Set initial value to 0
			node.valueDB.setValue(
				WindowCoveringCCValues.currentValue(
					WindowCoveringParameter["Outbound Left"],
				).id,
				0,
			);

			// Wait for the currentValue to be updated
			const valuePromise = new Promise<number>((resolve) => {
				node.on("value updated", (node, args) => {
					if (
						args.commandClass === CommandClasses["Window Covering"]
						&& args.propertyName === "currentValue"
					) {
						resolve(args.newValue as number);
					}
				});
			});

			// Set target value to 50 (supervised)
			await node.setValue(
				WindowCoveringCCValues.targetValue(
					WindowCoveringParameter["Outbound Left"],
				).id,
				50,
			);

			// Wait for the value to be updated
			const newValue = await Promise.race([
				valuePromise,
				wait(5000).then(() => "timeout"),
			]);
			t.expect(newValue).toBe(50);
		},
	},
);

integrationTest(
	"setValue: slow device with Supervision CC success and with final state report",
	{
		// debug: true,

		nodeCapabilities: {
			basicDeviceClass: BasicDeviceClass["End Node"],
			genericDeviceClass: 0x09, // Window Covering
			specificDeviceClass: 0x01, // Simple Window Covering Control
			commandClasses: [
				CommandClasses.Supervision,
				ccCaps({
					ccId: CommandClasses["Window Covering"],
					isSupported: true,
					supportedParameters: [
						WindowCoveringParameter["Outbound Left"],
					],
				}),
			],
		},

		customSetup: async (driver, controller, mockNode) => {
			// Track the current value
			let currentValue = 0;

			// Respond to Supervision Get with immediate success
			const respondToSupervisionGet: MockNodeBehavior = {
				handleCC(controller, self, receivedCC) {
					if (
						receivedCC instanceof SupervisionCCGet
						&& receivedCC.encapsulated
							instanceof WindowCoveringCCSet
					) {
						// Update the internal state
						if (receivedCC.encapsulated.targetValues.length > 0) {
							currentValue =
								receivedCC.encapsulated.targetValues[0].value;
						}

						// Send update after a short delay
						setTimeout(() => {
							const report = new WindowCoveringCCReport({
								nodeId: controller.ownNodeId,
								parameter:
									WindowCoveringParameter["Outbound Left"],
								currentValue,
								targetValue: currentValue,
								duration: Duration.unknown(),
							});

							mockNode.sendToController(
								createMockZWaveRequestFrame(report, {
									ackRequested: false,
								}),
							);
						}, 500);

						const cc = new SupervisionCCReport({
							nodeId: controller.ownNodeId,
							sessionId: receivedCC.sessionId,
							moreUpdatesFollow: false,
							status: SupervisionStatus.Success,
						});
						return { action: "sendCC", cc };
					}
				},
			};
			mockNode.defineBehavior(respondToSupervisionGet);

			// Report Window Covering status
			const respondToWindowCoveringGet: MockNodeBehavior = {
				handleCC(controller, self, receivedCC) {
					if (receivedCC instanceof WindowCoveringCCGet) {
						const cc = new WindowCoveringCCReport({
							nodeId: controller.ownNodeId,
							parameter: receivedCC.parameter,
							currentValue,
							targetValue: currentValue,
							duration: Duration.unknown(),
						});
						return { action: "sendCC", cc };
					}
				},
			};
			mockNode.defineBehavior(respondToWindowCoveringGet);
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// Set initial value to 0
			node.valueDB.setValue(
				WindowCoveringCCValues.currentValue(
					WindowCoveringParameter["Outbound Left"],
				).id,
				0,
			);

			// Wait for the currentValue to be updated
			const valuePromise = new Promise<number>((resolve) => {
				node.on("value updated", (node, args) => {
					if (
						args.commandClass === CommandClasses["Window Covering"]
						&& args.propertyName === "currentValue"
					) {
						resolve(args.newValue as number);
					}
				});
			});

			// Set target value to 50 (supervised)
			await node.setValue(
				WindowCoveringCCValues.targetValue(
					WindowCoveringParameter["Outbound Left"],
				).id,
				50,
			);

			// Wait for the value to be updated
			const newValue = await Promise.race([
				valuePromise,
				wait(5000).then(() => "timeout"),
			]);
			t.expect(newValue).toBe(50);
		},
	},
);
