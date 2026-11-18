import {
	KeypadMode,
	UserCodeCCExtendedUserCodeSet,
	UserCodeCCValues,
} from "@zwave-js/cc";
import { UserIDStatus } from "@zwave-js/cc/safe";
import { CommandClasses } from "@zwave-js/core";
import { MockZWaveFrameType, ccCaps } from "@zwave-js/testing";

import { integrationTest } from "../integrationTestSuite.js";

for (const productId of [0x00c7, 0x00c8]) {
	integrationTest(
		`Kaadas lock 0x021d:0x0103:0x${productId
			.toString(16)
			.padStart(4, "0")} accepts numeric user codes`,
		{
			// debug: true,

			nodeCapabilities: {
				manufacturerId: 0x021d,
				productType: 0x0103,
				productId,
				commandClasses: [
					CommandClasses["Manufacturer Specific"],
					CommandClasses.Version,
					ccCaps({
						ccId: CommandClasses["User Code"],
						version: 2,
						numUsers: 10,
						supportsAdminCode: true,
						supportsAdminCodeDeactivation: false,
						supportsUserCodeChecksum: false,
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
						// The locks report the key values 0 to 9 as the bitmask 0xFF 0x03
						supportedASCIIChars: Array.from(
							{ length: 10 },
							(_, i) => String.fromCharCode(i),
						).join(""),
					}),
				],
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
						&& frame.payload
							instanceof UserCodeCCExtendedUserCodeSet
						&& frame.payload.userCodes.length === 1
						&& frame.payload.userCodes[0].userId === 1
						&& frame.payload.userCodes[0].userCode === "1234",
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
}
