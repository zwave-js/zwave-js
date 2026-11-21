import {
	BasicWindowCoveringCCStartLevelChange,
	BasicWindowCoveringCCStopLevelChange,
	BasicWindowCoveringCommand,
} from "@zwave-js/cc";
import { CommandClasses } from "@zwave-js/core";
import { ccCaps, createMockZWaveRequestFrame } from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";

import { integrationTest } from "../integrationTestSuite.js";

integrationTest(
	"Basic Window Covering level changes from a remote are emitted as notifications",
	{
		nodeCapabilities: {
			commandClasses: [
				ccCaps({
					ccId: CommandClasses["Basic Window Covering"],
					isSupported: false,
					isControlled: true,
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			const notifications: unknown[] = [];
			node.on("notification", (_endpoint, ccId, args) => {
				notifications.push({ ccId, args });
			});

			// Payloads 0x00 and 0x40, like the Merten 506219 sends them
			for (const cc of [
				new BasicWindowCoveringCCStartLevelChange({
					nodeId: mockController.ownNodeId,
					direction: "up",
				}),
				new BasicWindowCoveringCCStartLevelChange({
					nodeId: mockController.ownNodeId,
					direction: "down",
				}),
				new BasicWindowCoveringCCStopLevelChange({
					nodeId: mockController.ownNodeId,
				}),
			]) {
				await mockNode.sendToController(
					createMockZWaveRequestFrame(cc, { ackRequested: false }),
				);
				await wait(100);
			}

			t.expect(notifications).toStrictEqual([
				{
					ccId: CommandClasses["Basic Window Covering"],
					args: {
						eventType: BasicWindowCoveringCommand.StartLevelChange,
						eventTypeLabel: "Start level change",
						direction: "up",
					},
				},
				{
					ccId: CommandClasses["Basic Window Covering"],
					args: {
						eventType: BasicWindowCoveringCommand.StartLevelChange,
						eventTypeLabel: "Start level change",
						direction: "down",
					},
				},
				{
					ccId: CommandClasses["Basic Window Covering"],
					args: {
						eventType: BasicWindowCoveringCommand.StopLevelChange,
						eventTypeLabel: "Stop level change",
					},
				},
			]);
		},
	},
);
