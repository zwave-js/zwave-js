import {
	MultilevelSwitchCCGet,
	MultilevelSwitchCCReport,
	MultilevelSwitchCCSet,
	MultilevelSwitchCCValues,
	SupervisionCCGet,
	SupervisionCCReport,
} from "@zwave-js/cc";
import {
	CommandClasses,
	type MaybeUnknown,
	SupervisionStatus,
} from "@zwave-js/core";
import {
	type MockNodeBehavior,
	createMockZWaveRequestFrame,
} from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"successful supervised setValue(255): expect verify GET",
	{
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

			// Except the ones with a duration in the command, those need special handling
			const respondToSupervisionGetWithDuration: MockNodeBehavior = {
				handleCC(controller, self, receivedCC) {
					if (
						receivedCC instanceof SupervisionCCGet
						&& receivedCC.encapsulated
							instanceof MultilevelSwitchCCSet
						&& !!receivedCC.encapsulated.duration
							?.toMilliseconds()
					) {
						const cc1 = new SupervisionCCReport({
							nodeId: controller.ownNodeId,
							sessionId: receivedCC.sessionId,
							moreUpdatesFollow: true,
							status: SupervisionStatus.Working,
							duration: receivedCC.encapsulated.duration,
						});

						const cc2 = new SupervisionCCReport({
							nodeId: controller.ownNodeId,
							sessionId: receivedCC.sessionId,
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
							receivedCC.encapsulated.duration
								.toMilliseconds(),
						);

						return { action: "stop" };
					}
				},
			};
			mockNode.defineBehavior(respondToSupervisionGetWithDuration);

			{
				let call = 0;
				const responses: [
					target: number,
					current: MaybeUnknown<number>,
				][] = [
					// during interview
					[20, 20],
					// change with `transitionDuration`
					[50, 50],
					// change without
					[80, 80],
				];
				const respondToMultilevelSwitchGet: MockNodeBehavior = {
					handleCC(controller, self, receivedCC) {
						if (receivedCC instanceof MultilevelSwitchCCGet) {
							const [targetValue, currentValue] = responses[call];
							const cc = new MultilevelSwitchCCReport({
								nodeId: controller.ownNodeId,
								targetValue,
								currentValue,
							});

							call += 1;

							return { action: "sendCC", cc };
						}
					},
				};
				mockNode.defineBehavior(respondToMultilevelSwitchGet);
			}
		},
		testBody: async (t, driver, node, mockController, mockNode) => {
			{
				const currentValue = node.getValue(
					MultilevelSwitchCCValues.currentValue.id,
				);
				t.expect(currentValue).toBe(20);
			}

			await node.setValue(MultilevelSwitchCCValues.targetValue.id, 255, {
				transitionDuration: "1s",
			});

			await wait(1500);

			{
				const currentValue = node.getValue(
					MultilevelSwitchCCValues.currentValue.id,
				);
				t.expect(currentValue).toBe(50);
			}

			await node.setValue(MultilevelSwitchCCValues.targetValue.id, 255);

			{
				const currentValue = node.getValue(
					MultilevelSwitchCCValues.currentValue.id,
				);
				t.expect(currentValue).toBe(80);
			}
		},
	},
);
