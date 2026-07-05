import {
	BasicWindowCoveringCCStartLevelChange,
	BasicWindowCoveringCCStopLevelChange,
} from "@zwave-js/cc/BasicWindowCoveringCC";
import { CommandClasses } from "@zwave-js/core";
import { MockZWaveFrameType, ccCaps } from "@zwave-js/testing";
import { CoverAspect } from "../../../Node.js";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest("Basic Window Covering: movement-only control", {
	nodeCapabilities: {
		// Simple Window Covering Control
		genericDeviceClass: 0x09,
		specificDeviceClass: 0x01,
		commandClasses: [
			CommandClasses.Version,
			ccCaps({
				ccId: CommandClasses["Basic Window Covering"],
				version: 1,
			}),
		],
	},

	testBody: async (t, driver, node, mockController, mockNode) => {
		const covers = node.covers;
		t.expect(covers).toBeDefined();

		const caps = covers!.getCapabilitiesCached();
		t.expect(caps.primaryAspect).toBe(CoverAspect.Primary);
		t.expect(caps.aspects[0]).toMatchObject({
			aspect: CoverAspect.Primary,
			type: "position",
			supportsGoToValue: false,
			reportsValue: false,
			reportsTarget: false,
			supportsStartStop: true,
			supportsDuration: false,
		});

		mockNode.clearReceivedControllerFrames();

		await covers!.open();
		mockNode.assertReceivedControllerFrame(
			(frame) =>
				frame.type === MockZWaveFrameType.Request
				&& frame.payload
					instanceof BasicWindowCoveringCCStartLevelChange
				&& frame.payload.direction === "up",
			{
				errorMessage:
					"Expected a Basic Window Covering StartLevelChange up",
			},
		);

		await covers!.stop();
		mockNode.assertReceivedControllerFrame(
			(frame) =>
				frame.type === MockZWaveFrameType.Request
				&& frame.payload
					instanceof BasicWindowCoveringCCStopLevelChange,
			{
				errorMessage:
					"Expected a Basic Window Covering StopLevelChange",
			},
		);

		await t.expect(covers!.setPosition(50)).rejects.toThrow(
			"cannot be moved",
		);

		// Without any feedback, the position remains unknown, but movement
		// state is still tracked
		const state = covers!.getStateCached()!;
		t.expect(state.currentValue).toBeUndefined();
	},
});
