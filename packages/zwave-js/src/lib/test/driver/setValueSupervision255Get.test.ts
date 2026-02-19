import {
	MultilevelSwitchCCGet,
	MultilevelSwitchCCReport,
	MultilevelSwitchCCSet,
	MultilevelSwitchCCValues,
	SupervisionCCGet,
	SupervisionCCReport,
	SupervisionCommand,
} from "@zwave-js/cc";
import { CommandClasses, SupervisionStatus } from "@zwave-js/core";
import {
	type MockNodeBehavior,
	MockZWaveFrameType,
	type MockZWaveRequestFrame,
	createMockZWaveRequestFrame,
} from "@zwave-js/testing";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"successful supervised setValue(255) with duration: expect validation GET",
	{
		debug: true,

		nodeCapabilities: {
			commandClasses: [
				CommandClasses["Multilevel Switch"],
				CommandClasses.Supervision,
			],
		},

		customSetup: async (driver, controller, mockNode) => {
			// Just have the node respond to all Supervision Get positively
			const respondToSupervisionGet: MockNodeBehavior = {
				handleCC(controller, self, receivedCC) {
					if (
						receivedCC.isEncapsulatedWith(
							CommandClasses.Supervision,
							SupervisionCommand.Get,
						)
					) {
						return { action: "ok" };
					}
				},
			};
			mockNode.defineBehavior(respondToSupervisionGet);

			// Except the ones with a duration in the command, those need special handling
			const respondToSupervisionGetWithDuration: MockNodeBehavior = {
				handleCC(controller, self, receivedCC) {
					if (
						receivedCC.encapsulatingCC instanceof SupervisionCCGet
						&& receivedCC instanceof MultilevelSwitchCCSet
						&& !!receivedCC.duration?.toMilliseconds()
					) {
						const cc1 = new SupervisionCCReport({
							nodeId: controller.ownNodeId,
							sessionId: receivedCC.encapsulatingCC.sessionId,
							moreUpdatesFollow: true,
							status: SupervisionStatus.Working,
							duration: receivedCC.duration,
						});

						const cc2 = new SupervisionCCReport({
							nodeId: controller.ownNodeId,
							sessionId: receivedCC.encapsulatingCC.sessionId,
							moreUpdatesFollow: false,
							status: SupervisionStatus.Success,
						});

						void self.sendToController(
							createMockZWaveRequestFrame(cc1, {
								ackRequested: false,
							}),
						);

						setTimeout(
							() => {
								void self.sendToController(
									createMockZWaveRequestFrame(cc2, {
										ackRequested: false,
									}),
								);
							},
							receivedCC.duration.toMilliseconds(),
						);

						return { action: "stop" };
					}
				},
			};
			mockNode.defineBehavior(respondToSupervisionGetWithDuration);

			let lastBrightness = 88;
			let currentBrightness = 0;
			const respondToMultilevelSwitchSet: MockNodeBehavior = {
				handleCC(controller, self, receivedCC) {
					if (receivedCC instanceof MultilevelSwitchCCSet) {
						const targetValue = receivedCC.targetValue;
						if (targetValue === 255) {
							currentBrightness = lastBrightness;
						} else {
							currentBrightness = targetValue;
							if (currentBrightness > 0) {
								lastBrightness = currentBrightness;
							}
						}

						return { action: "ok" };
					}
				},
			};
			mockNode.defineBehavior(respondToMultilevelSwitchSet);

			// Report Multilevel Switch status
			const respondToMultilevelSwitchGet: MockNodeBehavior = {
				handleCC(controller, self, receivedCC) {
					if (receivedCC instanceof MultilevelSwitchCCGet) {
						const cc = new MultilevelSwitchCCReport({
							nodeId: controller.ownNodeId,
							targetValue: 88,
							currentValue: 88,
						});
						return { action: "sendCC", cc };
					}
				},
			};
			mockNode.defineBehavior(respondToMultilevelSwitchGet);
		},
		testBody: async (t, driver, node, mockController, mockNode) => {
			// await node.setValue(MultilevelSwitchCCValues.targetValue.id, 55);
			// await node.setValue(MultilevelSwitchCCValues.targetValue.id, 0);

			// await wait(500);

			// mockNode.clearReceivedControllerFrames();

			const expectGet = mockNode.expectControllerFrame(
				(frame): frame is MockZWaveRequestFrame =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof MultilevelSwitchCCGet,
				{
					timeout: 1500,
					errorMessage:
						"Node should have received a MultilevelSwitchCCGet",
				},
			);

			await node.setValue(MultilevelSwitchCCValues.targetValue.id, 255, {
				transitionDuration: "1s",
			});

			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof SupervisionCCGet
					&& frame.payload.encapsulated
						instanceof MultilevelSwitchCCSet,
				{
					errorMessage:
						"Node should have received a supervised MultilevelSwitchCCSet",
				},
			);

			await expectGet;

			// The current value should NOT be updated to 255
			const currentValue = node.getValue(
				MultilevelSwitchCCValues.currentValue.id,
			);
			t.expect(currentValue).toBe(88);
		},
	},
);
