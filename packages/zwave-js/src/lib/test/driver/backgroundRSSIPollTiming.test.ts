import { BatteryCCGet, BatteryCCValues } from "@zwave-js/cc";
import { CommandClasses } from "@zwave-js/core";
import { FunctionType } from "@zwave-js/serial";
import {
	GetBackgroundRSSIRequest,
	GetBackgroundRSSIResponse,
} from "@zwave-js/serial/serialapi";
import {
	type MockControllerBehavior,
	MockZWaveFrameType,
	getDefaultMockControllerCapabilities,
	getDefaultSupportedFunctionTypes,
} from "@zwave-js/testing";
import { vi } from "vitest";
import { integrationTest } from "../integrationTestSuite.js";

// Regression test for https://github.com/zwave-js/zwave-js/issues/9182
// The driver polls the background RSSI every 30 seconds while the send queue is idle.
// That query never reaches the mesh, so it must not count as mesh activity for the
// poll spacing. Otherwise a poll whose required spacing exceeds 30 seconds is deferred
// forever and its refresh task never settles.

const respondToGetBackgroundRSSI: MockControllerBehavior = {
	async onHostMessage(controller, msg) {
		if (msg instanceof GetBackgroundRSSIRequest) {
			await controller.sendMessageToHost(
				new GetBackgroundRSSIResponse({
					rssiChannel0: -90,
					rssiChannel1: -90,
				}),
			);
			return true;
		}
	},
};

integrationTest(
	"the background RSSI poll does not delay auto-refresh polls",
	{
		// debug: true,

		controllerCapabilities: {
			...getDefaultMockControllerCapabilities(),
			supportedFunctionTypes: [
				...getDefaultSupportedFunctionTypes(),
				FunctionType.GetBackgroundRSSI,
			],
		},

		nodeCapabilities: {
			isListening: true,
			isFrequentListening: false,
			commandClasses: [
				CommandClasses.Version,
				CommandClasses["Manufacturer Specific"],
				CommandClasses.Battery,
			],
		},

		additionalDriverOptions: {
			// The mock fails a no-ACK attempt within a second, so the failed poll
			// below adds 3 seconds of command time. The required spacing must end
			// up above the 30 second RSSI cadence, while the first poll must still
			// fit between two RSSI polls, so pollTime has to be between 27 and 30 s.
			timeouts: { pollTime: 28500 },
		},

		customSetup: async (_driver, mockController) => {
			mockController.defineBehavior(respondToGetBackgroundRSSI);
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			vi.useFakeTimers();
			try {
				// Battery was queried during the interview. Make it stale so the
				// auto-refresh will query it again.
				node.valueDB.removeValue(BatteryCCValues.level.endpoint(0));

				// The first poll fails because the node does not ack. This inflates
				// the recorded poll command time.
				mockNode.autoAckControllerFrames = false;
				const firstRefresh = node.autoRefreshValues();
				// The poll is sent about 33.5 s in: pollTime after the interview, plus
				// 5 s because the first RSSI poll resets the wait. It fails 3 s later.
				// Advance past that, otherwise awaiting the refresh hangs.
				await vi.advanceTimersByTimeAsync(40000);
				await firstRefresh;

				// Bring the node back to life
				mockNode.autoAckControllerFrames = true;
				const ping = node.ping();
				await vi.advanceTimersByTimeAsync(1000);
				await ping;
				mockNode.clearReceivedControllerFrames();

				// The battery is still stale. Its poll now needs more silence than
				// the RSSI poll interval.
				void node.autoRefreshValues();
				for (let i = 0; i < 12; i++) {
					await vi.advanceTimersByTimeAsync(10000);
				}

				mockController.assertReceivedHostMessage(
					(msg) => msg instanceof GetBackgroundRSSIRequest,
					{ errorMessage: "the background RSSI was never polled" },
				);
				mockNode.assertReceivedControllerFrame(
					(frame) =>
						frame.type === MockZWaveFrameType.Request
						&& frame.payload instanceof BatteryCCGet,
					{
						errorMessage:
							"the battery poll was starved by the background RSSI polls",
					},
				);
			} finally {
				vi.useRealTimers();
			}
		},
	},
);
