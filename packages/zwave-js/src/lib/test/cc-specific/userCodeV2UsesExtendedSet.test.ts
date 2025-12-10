import {
	UserCodeCCExtendedUserCodeSet,
	UserCodeCCSet,
	UserCodeCCValues,
} from "@zwave-js/cc";
import { UserIDStatus } from "@zwave-js/cc/safe";
import { CommandClasses } from "@zwave-js/core";
import { MockZWaveFrameType, ccCaps } from "@zwave-js/testing";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"UserCodeCCAPI.set uses Extended User Code Set on V2 nodes",
	{
		// debug: true,

		nodeCapabilities: {
			commandClasses: [
				ccCaps({
					ccId: CommandClasses["User Code"],
					version: 2,
					numUsers: 10,
					supportsMultipleUserCodeSet: true,
					supportedASCIIChars: "0123456789",
					supportedUserIDStatuses: [
						UserIDStatus.Available,
						UserIDStatus.Enabled,
						UserIDStatus.Disabled,
					],
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			const api = node.commandClasses["User Code"];

			// Set a user code on a V2 node
			await api.set(1, UserIDStatus.Enabled, "1234");

			// The node should have received an Extended User Code Set command, not the legacy Set command
			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof UserCodeCCExtendedUserCodeSet,
				{
					errorMessage:
						"Node should have received UserCodeCCExtendedUserCodeSet",
				},
			);

			// Verify that the old Set command was NOT used
			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof UserCodeCCSet,
				{
					errorMessage: "Node should NOT have received UserCodeCCSet",
					noMatch: true,
				},
			);
		},
	},
);

integrationTest(
	"UserCodeCCAPI.clear uses Extended User Code Set on V2 nodes",
	{
		// debug: true,

		nodeCapabilities: {
			commandClasses: [
				ccCaps({
					ccId: CommandClasses["User Code"],
					version: 2,
					numUsers: 10,
					supportsMultipleUserCodeSet: true,
					supportedASCIIChars: "0123456789",
					supportedUserIDStatuses: [
						UserIDStatus.Available,
						UserIDStatus.Enabled,
						UserIDStatus.Disabled,
					],
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			const api = node.commandClasses["User Code"];

			// Clear a user code on a V2 node
			await api.clear(1);

			// The node should have received an Extended User Code Set command
			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof UserCodeCCExtendedUserCodeSet,
				{
					errorMessage:
						"Node should have received UserCodeCCExtendedUserCodeSet",
				},
			);

			// Verify that the old Set command was NOT used
			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof UserCodeCCSet,
				{
					errorMessage: "Node should NOT have received UserCodeCCSet",
					noMatch: true,
				},
			);
		},
	},
);

// Note: Testing V1 behavior is challenging because the UserCodeCC class has @implementedVersion(2)
// which affects how the test framework sets up the mock node. The important behavior is that
// V2 nodes use Extended User Code Set, which is tested above. V1 nodes in the field will
// simply not support the Extended commands and will fall back to the legacy Set command
// through the assertSupportsCommand check in the API.
