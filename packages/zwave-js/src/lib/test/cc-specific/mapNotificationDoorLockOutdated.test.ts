import { DoorLockMode } from "@zwave-js/cc";
import {
	DoorLockCCOperationReport,
	DoorLockCCValues,
} from "@zwave-js/cc/DoorLockCC";
import { NotificationCCReport } from "@zwave-js/cc/NotificationCC";
import { createMockZWaveRequestFrame } from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import path from "node:path";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"A repeated (un)lock notification must not override a newer Door Lock CC report",
	{
		// debug: true,
		provisioningDirectory: path.join(
			__dirname,
			"fixtures/notificationAndDoorLockCC",
		),

		testBody: async (t, driver, node, mockController, mockNode) => {
			const valueId = DoorLockCCValues.currentMode.id;

			const unlockNotification = () =>
				new NotificationCCReport({
					nodeId: mockController.ownNodeId,
					notificationType: 0x06, // Access Control
					notificationEvent: 0x06, // Keypad Unlock Operation
				});

			// The door is unlocked, and the lock reports it
			await mockNode.sendToController(
				createMockZWaveRequestFrame(unlockNotification(), {
					ackRequested: false,
				}),
			);
			await wait(100);
			t.expect(node.getValue(valueId)).toBe(DoorLockMode.Unsecured);

			// It is locked again, which the lock reports through Door Lock CC
			const operationReport = new DoorLockCCOperationReport({
				nodeId: mockController.ownNodeId,
				currentMode: DoorLockMode.Secured,
				outsideHandlesCanOpenDoor: [false, false, false, false],
				insideHandlesCanOpenDoor: [false, false, false, false],
				doorStatus: "open",
				boltStatus: "locked",
				latchStatus: "open",
			});
			await mockNode.sendToController(
				createMockZWaveRequestFrame(operationReport, {
					ackRequested: false,
				}),
			);
			await wait(100);
			t.expect(node.getValue(valueId)).toBe(DoorLockMode.Secured);

			// Some locks repeat their notifications several seconds later. The repeated
			// notification refers to an operation that has already been superseded, so
			// applying it would leave the lock in the wrong state.
			await mockNode.sendToController(
				createMockZWaveRequestFrame(unlockNotification(), {
					ackRequested: false,
				}),
			);
			await wait(100);
			t.expect(node.getValue(valueId)).toBe(DoorLockMode.Secured);
		},
	},
);
