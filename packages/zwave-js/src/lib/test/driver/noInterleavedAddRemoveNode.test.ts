import { Protocols } from "@zwave-js/core";
import {
	AddNodeDSKToNetworkRequest,
	RemoveFailedNodeRequest,
} from "@zwave-js/serial";
import { Bytes, noop } from "@zwave-js/shared";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"AddNodeDSK and RemoveFailedNode should not be interleaved",
	{
		// Repro for #7902
		debug: true,

		customSetup: async (driver, controller, mockNode) => {
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// These two commands should not be interleaved
			const expectation = mockController.expectHostMessage(
				500,
				(msg) => msg instanceof RemoveFailedNodeRequest,
			).then(() => "FAIL").catch(() => "PASS");

			void driver.sendMessage(
				new AddNodeDSKToNetworkRequest({
					nwiHomeId: Bytes.from("deadbeef", "hex"),
					authHomeId: Bytes.from("c0ffee00", "hex"),
					protocol: Protocols.ZWave,
					highPower: true,
					networkWide: true,
				}),
				{
					supportCheck: false,
				},
			).catch(noop);

			void driver.sendMessage(
				new RemoveFailedNodeRequest({ failedNodeId: 2 }),
				{
					supportCheck: false,
				},
			).catch(noop);

			await t.expect(
				expectation,
				"RemoveFailedNodeRequest should not be interleaved",
			).resolves.toBe("PASS");
		},
	},
);
