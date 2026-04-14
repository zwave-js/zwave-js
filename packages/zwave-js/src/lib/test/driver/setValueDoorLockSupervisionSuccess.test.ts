import {
	DoorLockCCOperationGet,
	DoorLockCCOperationSet,
	DoorLockMode,
	SupervisionCCGet,
} from "@zwave-js/cc";
import { DoorLockCCValues } from "@zwave-js/cc/DoorLockCC";
import { CommandClasses } from "@zwave-js/core";
import { MockZWaveFrameType } from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"Door Lock setValue: immediate supervised Success updates currentMode without verification",
	{
		// debug: true,

		nodeCapabilities: {
			commandClasses: [
				{
					ccId: CommandClasses["Door Lock"],
					isSupported: true,
					version: 4,
					travelTime: 0,
				},
				CommandClasses.Supervision,
				CommandClasses.Version,
			],
		},

		testBody: async (t, _driver, node, _mockController, mockNode) => {
			const targetModeValueId = DoorLockCCValues.targetMode.id;
			const currentModeValueId = DoorLockCCValues.currentMode.id;

			await node.setValue(targetModeValueId, DoorLockMode.Secured);
			await wait(500);

			t.expect(node.getValue(targetModeValueId)).toBe(
				DoorLockMode.Secured,
			);
			t.expect(node.getValue(currentModeValueId)).toBe(
				DoorLockMode.Secured,
			);

			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof SupervisionCCGet
					&& frame.payload.encapsulated
						instanceof DoorLockCCOperationSet,
				{
					errorMessage:
						"Node should have received a supervised DoorLockCCOperationSet",
				},
			);
			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof DoorLockCCOperationGet,
				{
					noMatch: true,
					errorMessage:
						"Node should NOT have received a DoorLockCCOperationGet",
				},
			);
		},
	},
);

integrationTest(
	"Door Lock setValue: delayed supervised Success updates currentMode without verification",
	{
		// debug: true,

		nodeCapabilities: {
			commandClasses: [
				{
					ccId: CommandClasses["Door Lock"],
					isSupported: true,
					version: 4,
					travelTime: 500,
				},
				CommandClasses.Supervision,
				CommandClasses.Version,
			],
		},

		testBody: async (t, _driver, node, _mockController, mockNode) => {
			const targetModeValueId = DoorLockCCValues.targetMode.id;
			const currentModeValueId = DoorLockCCValues.currentMode.id;
			const initialCurrentMode = node.getValue(currentModeValueId);

			await node.setValue(targetModeValueId, DoorLockMode.Secured);

			t.expect(node.getValue(targetModeValueId)).toBe(
				DoorLockMode.Secured,
			);
			t.expect(node.getValue(currentModeValueId)).toBe(
				initialCurrentMode,
			);

			await wait(750);

			t.expect(node.getValue(currentModeValueId)).toBe(
				DoorLockMode.Secured,
			);

			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof DoorLockCCOperationGet,
				{
					noMatch: true,
					errorMessage:
						"Node should NOT have received a DoorLockCCOperationGet",
				},
			);
		},
	},
);
