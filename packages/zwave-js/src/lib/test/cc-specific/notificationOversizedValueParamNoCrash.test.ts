import {
	NotificationCCReport,
	NotificationCCValues,
} from "@zwave-js/cc/NotificationCC";
import { Bytes } from "@zwave-js/shared";
import { createMockZWaveRequestFrame } from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import path from "node:path";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"A Notification Report with an oversized value event parameter is discarded instead of crashing the driver",
	{
		// The node supports Notification CC; see the fixture
		provisioningDirectory: path.join(
			__dirname,
			"fixtures/notificationCC",
		),

		testBody: async (t, driver, node, mockController, mockNode) => {
			// A "value"-type event parameter is decoded via Buffer.readUIntBE,
			// which throws a RangeError for more than 6 bytes. That error used to
			// escape the message handler as an unhandled rejection and crash the
			// process, so we watch for it explicitly.
			const escaped: Error[] = [];
			const onError = (e: unknown) => {
				if (
					e instanceof RangeError
					|| (e as { code?: string })?.code === "ERR_OUT_OF_RANGE"
				) {
					escaped.push(e as Error);
				}
			};
			process.on("unhandledRejection", onError);
			process.on("uncaughtException", onError);

			try {
				// Access Control / "Lock operation with User Code" carries a
				// "value"-type parameter; 7 bytes is one more than readUIntBE allows.
				const malicious = new NotificationCCReport({
					nodeId: mockController.ownNodeId,
					notificationType: 0x06,
					notificationEvent: 0x21,
					eventParameters: Bytes.from([0, 0, 0, 0, 0, 0, 1]),
				});
				await mockNode.sendToController(
					createMockZWaveRequestFrame(malicious, {
						ackRequested: false,
					}),
				);
				await wait(100);

				// No RangeError escaped the parser
				t.expect(escaped).toStrictEqual([]);
				// The driver is still running and processing commands
				t.expect(driver.ready).toBe(true);

				// And it still processes a subsequent, valid Notification Report
				const valid = new NotificationCCReport({
					nodeId: mockController.ownNodeId,
					notificationType: 0x06,
					notificationEvent: 0xfd, // Manual Lock Operation
				});
				await mockNode.sendToController(
					createMockZWaveRequestFrame(valid, {
						ackRequested: false,
					}),
				);
				await wait(100);

				t.expect(
					node.getValueMetadata(
						NotificationCCValues.unknownNotificationVariable(
							0x06,
							"Access Control",
						).id,
					),
				).toMatchObject({
					ccSpecific: {
						notificationType: 0x06,
					},
				});
			} finally {
				process.off("unhandledRejection", onError);
				process.off("uncaughtException", onError);
			}
		},
	},
);
