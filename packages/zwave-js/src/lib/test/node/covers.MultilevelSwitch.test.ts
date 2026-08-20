import { SwitchType } from "@zwave-js/cc";
import {
	MultilevelSwitchCCReport,
	MultilevelSwitchCCSet,
	MultilevelSwitchCCStartLevelChange,
	MultilevelSwitchCCStopLevelChange,
} from "@zwave-js/cc/MultilevelSwitchCC";
import { CommandClasses, Duration } from "@zwave-js/core";
import {
	MockZWaveFrameType,
	ccCaps,
	createMockZWaveRequestFrame,
} from "@zwave-js/testing";
import type { CoverAspectState } from "../../../Node.js";
import { CoverAspect } from "../../../Node.js";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest("Multilevel Switch: covers API is gated by device class", {
	nodeCapabilities: {
		// Multilevel Power Switch, i.e. a dimmer
		genericDeviceClass: 0x11,
		specificDeviceClass: 0x01,
		commandClasses: [
			CommandClasses.Version,
			ccCaps({
				ccId: CommandClasses["Multilevel Switch"],
				version: 4,
				defaultValue: 0,
			}),
		],
	},

	testBody: async (t, driver, node, mockController, mockNode) => {
		t.expect(node.covers).toBeUndefined();
	},
});

integrationTest("Multilevel Switch: V4 capabilities and control", {
	nodeCapabilities: {
		// Motor Control Class C
		genericDeviceClass: 0x11,
		specificDeviceClass: 0x07,
		commandClasses: [
			CommandClasses.Version,
			ccCaps({
				ccId: CommandClasses["Multilevel Switch"],
				version: 4,
				defaultValue: 0,
				primarySwitchType: SwitchType["Close/Open"],
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
			supportsGoToValue: true,
			reportsValue: true,
			reportsTarget: true,
			supportsStartStop: true,
			supportsDuration: true,
		});

		mockNode.clearReceivedControllerFrames();

		await covers!.open();
		mockNode.assertReceivedControllerFrame(
			(frame) =>
				frame.type === MockZWaveFrameType.Request
				&& frame.payload instanceof MultilevelSwitchCCSet
				&& frame.payload.targetValue === 99,
			{ errorMessage: "Expected a Multilevel Switch CC Set to 99" },
		);

		await covers!.startTransition("close");
		mockNode.assertReceivedControllerFrame(
			(frame) =>
				frame.type === MockZWaveFrameType.Request
				&& frame.payload
					instanceof MultilevelSwitchCCStartLevelChange
				&& frame.payload.direction === "down",
			{
				errorMessage:
					"Expected a Multilevel Switch CC StartLevelChange down",
			},
		);

		await covers!.stop();
		mockNode.assertReceivedControllerFrame(
			(frame) =>
				frame.type === MockZWaveFrameType.Request
				&& frame.payload
					instanceof MultilevelSwitchCCStopLevelChange,
			{
				errorMessage: "Expected a Multilevel Switch CC StopLevelChange",
			},
		);
	},
});

integrationTest("Multilevel Switch: V3 does not report the target value", {
	nodeCapabilities: {
		genericDeviceClass: 0x11,
		specificDeviceClass: 0x07,
		commandClasses: [
			CommandClasses.Version,
			ccCaps({
				ccId: CommandClasses["Multilevel Switch"],
				version: 3,
				defaultValue: 0,
			}),
		],
	},

	testBody: async (t, driver, node, mockController, mockNode) => {
		const caps = node.covers!.getCapabilitiesCached();
		t.expect(caps.aspects[0]).toMatchObject({
			reportsTarget: false,
			supportsDuration: true,
		});
	},
});

integrationTest("Multilevel Switch: reports emit cover state events", {
	nodeCapabilities: {
		genericDeviceClass: 0x11,
		specificDeviceClass: 0x07,
		commandClasses: [
			CommandClasses.Version,
			ccCaps({
				ccId: CommandClasses["Multilevel Switch"],
				version: 4,
				defaultValue: 0,
			}),
		],
	},

	testBody: async (t, driver, node, mockController, mockNode) => {
		const states: CoverAspectState[] = [];
		node.on("cover state changed", (_endpoint, state) => {
			states.push(state);
		});
		mockNode.clearReceivedControllerFrames();

		// The device starts moving on its own and reports it
		const cc = new MultilevelSwitchCCReport({
			nodeId: mockController.ownNodeId,
			currentValue: 20,
			targetValue: 0,
			duration: new Duration(5, "seconds"),
		});
		await mockNode.sendToController(
			createMockZWaveRequestFrame(cc, { ackRequested: false }),
		);
		await new Promise((resolve) => setTimeout(resolve, 100));

		t.expect(states).toHaveLength(1);
		t.expect(states[0]).toMatchObject({
			aspect: CoverAspect.Primary,
			currentValue: 20,
			targetValue: 0,
			movement: "closing",
		});
	},
});
