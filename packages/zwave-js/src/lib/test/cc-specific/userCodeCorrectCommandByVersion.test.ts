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
				CommandClasses.Version,
				ccCaps({
					ccId: CommandClasses["User Code"],
					version: 2,
					numUsers: 10,
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
				CommandClasses.Version,
				ccCaps({
					ccId: CommandClasses["User Code"],
					version: 2,
					numUsers: 10,
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

integrationTest(
	"UserCodeCCAPI.set uses legacy Set command on V1 nodes",
	{
		// debug: true,

		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				ccCaps({
					ccId: CommandClasses["User Code"],
					version: 1,
					numUsers: 10,
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

			// Set a user code on a V1 node
			await api.set(1, UserIDStatus.Enabled, "1234");

			// The node should have received a legacy Set command, not Extended User Code Set
			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof UserCodeCCSet,
				{
					errorMessage: "Node should have received UserCodeCCSet",
				},
			);

			// Verify that the Extended User Code Set command was NOT used
			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof UserCodeCCExtendedUserCodeSet,
				{
					errorMessage:
						"Node should NOT have received UserCodeCCExtendedUserCodeSet",
					noMatch: true,
				},
			);
		},
	},
);

integrationTest(
	"UserCodeCCAPI.clear uses legacy Set command on V1 nodes",
	{
		// debug: true,

		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				ccCaps({
					ccId: CommandClasses["User Code"],
					version: 1,
					numUsers: 10,
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

			// Clear a user code on a V1 node
			await api.clear(1);

			// The node should have received a legacy Set command
			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof UserCodeCCSet,
				{
					errorMessage: "Node should have received UserCodeCCSet",
				},
			);

			// Verify that the Extended User Code Set command was NOT used
			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof UserCodeCCExtendedUserCodeSet,
				{
					errorMessage:
						"Node should NOT have received UserCodeCCExtendedUserCodeSet",
					noMatch: true,
				},
			);
		},
	},
);
