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
	MockZWaveFrameType,
	ccCaps,
} from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"setValue: supervised commands should update values even for slow device classes",
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
			// Respond to Supervision Get with immediate success
			const respondToSupervisionGet: MockNodeBehavior = {
				handleCC(controller, self, receivedCC) {
					if (receivedCC instanceof SupervisionCCGet) {
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

			// Track the current value
			let currentValue = 50;

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
			// Set initial value
			node.valueDB.setValue(
				WindowCoveringCCValues.currentValue(
					WindowCoveringParameter["Outbound Left"],
				).id,
				50,
			);

			// Set target value using supervised command
			await node.setValue(
				WindowCoveringCCValues.targetValue(
					WindowCoveringParameter["Outbound Left"],
				).id,
				75,
			);

			// Verify that the command was supervised
			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof SupervisionCCGet
					&& frame.payload.encapsulated instanceof WindowCoveringCCSet,
				{
					errorMessage:
						"Node should have received a supervised WindowCoveringCCSet",
				},
			);

			// Wait a bit to ensure the value update is processed
			await wait(100);

			// Verify that the current value WAS optimistically updated for supervised command
			// even though Window Covering is a slow device class
			const currentValueAfterSet = node.getValue(
				WindowCoveringCCValues.currentValue(
					WindowCoveringParameter["Outbound Left"],
				).id,
			);
			t.expect(currentValueAfterSet).toBe(75); // Should be updated to 75 for supervised success
		},
	},
);
