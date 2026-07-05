import { WindowCoveringParameter } from "@zwave-js/cc";
import {
	WindowCoveringCCReport,
	WindowCoveringCCSet,
	WindowCoveringCCStartLevelChange,
	WindowCoveringCCStopLevelChange,
} from "@zwave-js/cc/WindowCoveringCC";
import { CommandClasses, Duration } from "@zwave-js/core";
import {
	MockZWaveFrameType,
	ccCaps,
	createMockZWaveRequestFrame,
} from "@zwave-js/testing";
import type { CoverAspectState } from "../../../Node.js";
import { CoverAspect } from "../../../Node.js";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest("Window Covering: positioned parameters", {
	nodeCapabilities: {
		// Motor Control Class C
		genericDeviceClass: 0x11,
		specificDeviceClass: 0x07,
		commandClasses: [
			CommandClasses.Version,
			// Every Window Covering device must also support the Multilevel
			// Switch CC, which the covers API must never control
			ccCaps({
				ccId: CommandClasses["Multilevel Switch"],
				version: 4,
				defaultValue: 0,
			}),
			ccCaps({
				ccId: CommandClasses["Window Covering"],
				version: 1,
				supportedParameters: [
					WindowCoveringParameter["Outbound Left"],
				],
			}),
		],
	},

	testBody: async (t, driver, node, mockController, mockNode) => {
		const covers = node.covers;
		t.expect(covers).toBeDefined();

		const caps = covers!.getCapabilitiesCached();
		t.expect(caps.primaryAspect).toBe(CoverAspect.OutboundLeft);
		t.expect(caps.primaryTiltAspect).toBeUndefined();
		t.expect(caps.aspects).toHaveLength(1);
		t.expect(caps.aspects[0]).toMatchObject({
			aspect: CoverAspect.OutboundLeft,
			type: "position",
			supportsGoToValue: true,
			reportsValue: true,
			reportsTarget: true,
			supportsStartStop: true,
			supportsDuration: true,
		});

		mockNode.clearReceivedControllerFrames();

		// open() moves the positioned parameter to 99
		await covers!.open();
		mockNode.assertReceivedControllerFrame(
			(frame) =>
				frame.type === MockZWaveFrameType.Request
				&& frame.payload instanceof WindowCoveringCCSet
				&& frame.payload.targetValues.length === 1
				&& frame.payload.targetValues[0].parameter
					=== WindowCoveringParameter["Outbound Left"]
				&& frame.payload.targetValues[0].value === 99,
			{ errorMessage: "Expected a Window Covering CC Set to 99" },
		);

		await covers!.setPosition(37, { duration: "10s" });
		mockNode.assertReceivedControllerFrame(
			(frame) =>
				frame.type === MockZWaveFrameType.Request
				&& frame.payload instanceof WindowCoveringCCSet
				&& frame.payload.targetValues[0].value === 37
				&& frame.payload.duration?.toMilliseconds() === 10_000,
			{ errorMessage: "Expected a Window Covering CC Set to 37" },
		);

		await covers!.stop();
		mockNode.assertReceivedControllerFrame(
			(frame) =>
				frame.type === MockZWaveFrameType.Request
				&& frame.payload instanceof WindowCoveringCCStopLevelChange
				&& frame.payload.parameter
					=== WindowCoveringParameter["Outbound Left"],
			{
				errorMessage: "Expected a Window Covering CC StopLevelChange",
			},
		);

		// CL:006A.01.51.01.2: "A controlling node MUST NOT interview and
		// provide controlling functionalities for the Multilevel Switch
		// Command Class for a node (or endpoint) supporting this Command
		// Class, as it is a fully redundant and less precise application
		// functionality."
		mockNode.assertReceivedControllerFrame(
			(frame) =>
				frame.type === MockZWaveFrameType.Request
				&& frame.payload.ccId
					=== CommandClasses["Multilevel Switch"],
			{
				noMatch: true,
				errorMessage:
					"The covers API must never control the Multilevel Switch CC when Window Covering is supported",
			},
		);
	},
});

integrationTest("Window Covering: no-position parameters", {
	nodeCapabilities: {
		genericDeviceClass: 0x11,
		// Motor Control Class A
		specificDeviceClass: 0x05,
		commandClasses: [
			CommandClasses.Version,
			ccCaps({
				ccId: CommandClasses["Window Covering"],
				version: 1,
				supportedParameters: [
					WindowCoveringParameter["Outbound Left (no position)"],
				],
			}),
		],
	},

	testBody: async (t, driver, node, mockController, mockNode) => {
		const covers = node.covers!;
		const caps = covers.getCapabilitiesCached();
		t.expect(caps.aspects[0]).toMatchObject({
			aspect: CoverAspect.OutboundLeft,
			supportsGoToValue: false,
			reportsValue: false,
			reportsTarget: false,
			supportsStartStop: true,
		});

		mockNode.clearReceivedControllerFrames();

		// Without position support, open() falls back to a level change
		await covers.open();
		mockNode.assertReceivedControllerFrame(
			(frame) =>
				frame.type === MockZWaveFrameType.Request
				&& frame.payload
					instanceof WindowCoveringCCStartLevelChange
				&& frame.payload.direction === "up",
			{
				errorMessage:
					"Expected a Window Covering CC StartLevelChange up",
			},
		);

		await t.expect(covers.setPosition(50)).rejects.toThrow(
			"cannot be moved",
		);
	},
});

integrationTest("Window Covering: multiple aspects incl. slats", {
	nodeCapabilities: {
		genericDeviceClass: 0x11,
		specificDeviceClass: 0x07,
		commandClasses: [
			CommandClasses.Version,
			ccCaps({
				ccId: CommandClasses["Window Covering"],
				version: 1,
				supportedParameters: [
					WindowCoveringParameter["Outbound Bottom"],
					WindowCoveringParameter["Horizontal Slats Angle"],
				],
			}),
		],
	},

	testBody: async (t, driver, node, mockController, mockNode) => {
		const covers = node.covers!;
		const caps = covers.getCapabilitiesCached();
		t.expect(caps.aspects).toHaveLength(2);
		t.expect(caps.primaryAspect).toBe(CoverAspect.OutboundBottom);
		t.expect(caps.primaryTiltAspect).toBe(CoverAspect.HorizontalSlats);
		const tiltCaps = caps.aspects.find((a) => a.type === "tilt")!;
		t.expect(tiltCaps.aspect).toBe(CoverAspect.HorizontalSlats);

		mockNode.clearReceivedControllerFrames();

		// Opening the tilt aspect moves the slats to the midpoint
		await covers.open({ aspect: CoverAspect.Tilt });
		mockNode.assertReceivedControllerFrame(
			(frame) =>
				frame.type === MockZWaveFrameType.Request
				&& frame.payload instanceof WindowCoveringCCSet
				&& frame.payload.targetValues[0].parameter
					=== WindowCoveringParameter["Horizontal Slats Angle"]
				&& frame.payload.targetValues[0].value === 50,
			{ errorMessage: "Expected the slats to be moved to 50" },
		);

		// Both aspects are combined into a single Set command
		mockNode.clearReceivedControllerFrames();
		await covers.setValues([
			{ aspect: CoverAspect.Primary, value: 25 },
			{ aspect: CoverAspect.Tilt, value: 75 },
		]);
		mockNode.assertReceivedControllerFrame(
			(frame) =>
				frame.type === MockZWaveFrameType.Request
				&& frame.payload instanceof WindowCoveringCCSet
				&& frame.payload.targetValues.length === 2,
			{
				errorMessage:
					"Expected one Set command containing both parameters",
			},
		);
	},
});

integrationTest("Window Covering: reports emit atomic cover state events", {
	nodeCapabilities: {
		genericDeviceClass: 0x11,
		specificDeviceClass: 0x07,
		commandClasses: [
			CommandClasses.Version,
			ccCaps({
				ccId: CommandClasses["Window Covering"],
				version: 1,
				supportedParameters: [
					WindowCoveringParameter["Outbound Bottom"],
				],
			}),
		],
	},

	testBody: async (t, driver, node, mockController, mockNode) => {
		const states: CoverAspectState[] = [];
		node.on("cover state changed", (_endpoint, state) => {
			states.push(state);
		});

		// The device starts moving on its own and reports it
		const cc = new WindowCoveringCCReport({
			nodeId: mockController.ownNodeId,
			parameter: WindowCoveringParameter["Outbound Bottom"],
			currentValue: 10,
			targetValue: 99,
			duration: new Duration(10, "seconds"),
		});
		await mockNode.sendToController(
			createMockZWaveRequestFrame(cc, { ackRequested: false }),
		);
		await new Promise((resolve) => setTimeout(resolve, 100));

		// One report with three values produces exactly one event
		t.expect(states).toHaveLength(1);
		t.expect(states[0]).toMatchObject({
			aspect: CoverAspect.OutboundBottom,
			type: "position",
			currentValue: 10,
			targetValue: 99,
			movement: "opening",
			currentValueReliability: "reported",
		});

		// The final report ends the transition
		const endCC = new WindowCoveringCCReport({
			nodeId: mockController.ownNodeId,
			parameter: WindowCoveringParameter["Outbound Bottom"],
			currentValue: 99,
			targetValue: 99,
			duration: new Duration(0, "seconds"),
		});
		await mockNode.sendToController(
			createMockZWaveRequestFrame(endCC, { ackRequested: false }),
		);
		await new Promise((resolve) => setTimeout(resolve, 100));

		t.expect(states).toHaveLength(2);
		t.expect(states[1]).toMatchObject({
			currentValue: 99,
			movement: "idle",
		});

		const cached = node.covers!.getStateCached();
		t.expect(cached).toMatchObject({
			currentValue: 99,
			movement: "idle",
		});
	},
});
