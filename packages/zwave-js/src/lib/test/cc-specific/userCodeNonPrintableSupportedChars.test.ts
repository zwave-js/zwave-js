import {
	UserCodeCCAdminCodeSet,
	UserCodeCCExtendedUserCodeSet,
	UserCodeCCValues,
} from "@zwave-js/cc";
import { KeypadMode, UserIDStatus } from "@zwave-js/cc/safe";
import { CommandClasses } from "@zwave-js/core";
import { MockZWaveFrameType, ccCaps } from "@zwave-js/testing";

import { integrationTest } from "../integrationTestSuite.js";

// The supported keys bitmask 0xFF 0x03 marks the bytes 0x00 to 0x09 instead of the ASCII digits
const nonPrintableDigits = String.fromCharCode(
	...Array.from({ length: 10 }, (_, i) => i),
);

const userCodeCaps = ccCaps({
	ccId: CommandClasses["User Code"],
	version: 2,
	numUsers: 10,
	supportsAdminCode: true,
	supportedASCIIChars: nonPrintableDigits,
	supportedUserIDStatuses: [
		UserIDStatus.Available,
		UserIDStatus.Enabled,
		UserIDStatus.Disabled,
	],
	supportedKeypadModes: [
		KeypadMode.Normal,
		KeypadMode.Vacation,
		KeypadMode.Privacy,
	],
});

integrationTest(
	"User codes can be set when the node reports only non-printable supported characters",
	{
		// debug: true,

		nodeCapabilities: {
			commandClasses: [CommandClasses.Version, userCodeCaps],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			await node.commandClasses["User Code"].set(
				1,
				UserIDStatus.Enabled,
				"1234",
			);

			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof UserCodeCCExtendedUserCodeSet
					&& frame.payload.userCodes[0]?.userCode === "1234",
				{
					errorMessage:
						"Node should have received an Extended User Code Set with the code 1234",
				},
			);

			t.expect(
				node.getValue(UserCodeCCValues.supportedASCIIChars.id),
			).toBe("0123456789");
		},
	},
);

integrationTest(
	"The admin code can be set when the node reports only non-printable supported characters",
	{
		// debug: true,

		nodeCapabilities: {
			commandClasses: [CommandClasses.Version, userCodeCaps],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			await node.commandClasses["User Code"].setAdminCode("5678");

			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof UserCodeCCAdminCodeSet
					&& frame.payload.adminCode === "5678",
				{
					errorMessage:
						"Node should have received an Admin Code Set with the code 5678",
				},
			);
		},
	},
);
