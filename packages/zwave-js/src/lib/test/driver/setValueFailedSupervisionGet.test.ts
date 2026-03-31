import {
	BinarySwitchCCGet,
	BinarySwitchCCReport,
	BinarySwitchCCSet,
	BinarySwitchCCValues,
	SupervisionCCGet,
	SupervisionCCReport,
	SupervisionCommand,
} from "@zwave-js/cc";
import { CommandClasses, SupervisionStatus } from "@zwave-js/core";
import { type MockNodeBehavior, MockZWaveFrameType } from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"setValue with failed supervised command: expect validation GET",
	{
		// debug: true,
		// provisioningDirectory: path.join(
		// 	__dirname,
		// 	"__fixtures/supervision_binary_switch",
		// ),

		nodeCapabilities: {
			commandClasses: [
				CommandClasses["Binary Switch"],
				CommandClasses.Supervision,
			],
		},

		customSetup: async (driver, controller, mockNode) => {
			// Have the node respond to all Supervision Get negatively
			const respondToSupervisionGet: MockNodeBehavior = {
				handleCC(controller, self, receivedCC) {
					if (
						receivedCC.isEncapsulatedWith(
							CommandClasses.Supervision,
							SupervisionCommand.Get,
						)
					) {
						return { action: "fail" };
					}
				},
			};

			// and always report OFF
			const respondToBinarySwitchGet: MockNodeBehavior = {
				handleCC(controller, self, receivedCC) {
					if (receivedCC instanceof BinarySwitchCCGet) {
						const cc = new BinarySwitchCCReport({
							nodeId: controller.ownNodeId,
							currentValue: false,
						});
						return { action: "sendCC", cc };
					}
				},
			};
			mockNode.defineBehavior(
				respondToSupervisionGet,
				respondToBinarySwitchGet,
			);
		},
		testBody: async (t, driver, node, mockController, mockNode) => {
			await node.setValue(BinarySwitchCCValues.targetValue.id, true);

			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof SupervisionCCGet
					&& frame.payload.encapsulated instanceof BinarySwitchCCSet,
				{
					errorMessage:
						"Node should have received a supervised BinarySwitchCCSet",
				},
			);

			await wait(1500);

			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof BinarySwitchCCGet,
				{
					errorMessage:
						"Node should have received a BinarySwitchCCGet",
				},
			);

			mockNode.assertSentControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof BinarySwitchCCReport
					&& frame.payload.currentValue === false,
				{
					errorMessage:
						"Node should have sent a BinarySwitchCCReport with currentValue false",
				},
			);
		},
	},
);
