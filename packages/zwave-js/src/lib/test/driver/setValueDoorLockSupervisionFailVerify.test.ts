import {
	DoorLockCCOperationGet,
	DoorLockCCOperationReport,
	DoorLockCCOperationSet,
	DoorLockMode,
	SupervisionCCGet,
	SupervisionCCReport,
} from "@zwave-js/cc";
import { DoorLockCCValues } from "@zwave-js/cc/DoorLockCC";
import { CommandClasses, Duration, SupervisionStatus } from "@zwave-js/core";
import {
	type MockNodeBehavior,
	MockZWaveFrameType,
	createMockZWaveRequestFrame,
} from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"Door Lock setValue: targetMode optimistic, verify on final supervision Fail",
	{
		// debug: true,

		nodeCapabilities: {
			commandClasses: [
				{
					ccId: CommandClasses["Door Lock"],
					isSupported: true,
					version: 4,
				},
				CommandClasses.Supervision,
				CommandClasses.Version,
			],
		},

		customSetup: async (_driver, _controller, mockNode) => {
			// Generic handler for Door Lock Gets
			const respondToDoorLockGets: MockNodeBehavior = {
				handleCC(controller, _self, receivedCC) {
					if (receivedCC instanceof DoorLockCCOperationGet) {
						const cc = new DoorLockCCOperationReport({
							nodeId: controller.ownNodeId,
							currentMode: DoorLockMode.Unsecured,
							targetMode: DoorLockMode.Unsecured,
							duration: new Duration(0, "seconds"),
							outsideHandlesCanOpenDoor: [
								true,
								true,
								true,
								true,
							],
							insideHandlesCanOpenDoor: [
								true,
								true,
								true,
								true,
							],
						});
						return { action: "sendCC", cc };
					}
				},
			};

			// When receiving any supervised command, fail after a delay
			const respondToSupervisionGet: MockNodeBehavior = {
				async handleCC(controller, self, receivedCC) {
					if (
						receivedCC instanceof DoorLockCCOperationSet
						&& receivedCC.encapsulatingCC
							instanceof SupervisionCCGet
					) {
						const sessionId = receivedCC.encapsulatingCC.sessionId;
						const cc = new SupervisionCCReport({
							nodeId: controller.ownNodeId,
							sessionId,
							moreUpdatesFollow: true,
							status: SupervisionStatus.Working,
							duration: new Duration(2, "seconds"),
						});

						setTimeout(async () => {
							const delayedCC = new SupervisionCCReport({
								nodeId: controller.ownNodeId,
								sessionId,
								moreUpdatesFollow: false,
								status: SupervisionStatus.Fail,
							});
							await self.sendToController(
								createMockZWaveRequestFrame(delayedCC, {
									ackRequested: false,
								}),
							);
						}, 500);

						return { action: "sendCC", cc };
					}
				},
			};

			mockNode.defineBehavior(
				respondToDoorLockGets,
				respondToSupervisionGet,
			);
		},

		testBody: async (t, _driver, node, _mockController, mockNode) => {
			const targetModeValueId = DoorLockCCValues.targetMode.id;
			const currentModeValueId = DoorLockCCValues.currentMode.id;
			const initialCurrentMode = node.getValue(currentModeValueId);

			t.expect(initialCurrentMode === DoorLockMode.Unsecured).toBe(true);

			// Set targetMode to Secured
			await node.setValue(
				targetModeValueId,
				DoorLockMode.Secured,
			);

			// After the Working report and setValue completion, targetMode updates optimistically
			t.expect(node.getValue(targetModeValueId)).toBe(
				DoorLockMode.Secured,
			);

			// Current mode should not update yet
			t.expect(node.getValue(currentModeValueId)).toBe(
				initialCurrentMode,
			);

			// Wait for Supervision Fail to trigger verification GET
			await wait(1000);

			// After the GET completes, current mode should be reported as Unsecured (from OperationReport)
			t.expect(node.getValue(currentModeValueId)).toBe(
				DoorLockMode.Unsecured,
			);

			// Assert that the GET was actually sent
			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof DoorLockCCOperationGet,
				{
					errorMessage:
						"Node should have received a DoorLockCCOperationGet after final supervision Fail",
				},
			);
		},
	},
);
