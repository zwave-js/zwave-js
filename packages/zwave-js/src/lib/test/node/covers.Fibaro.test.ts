import { MultilevelSwitchCCSet } from "@zwave-js/cc/MultilevelSwitchCC";
import { FibaroVenetianBlindCCSet } from "@zwave-js/cc/manufacturerProprietary/FibaroCC";
import { CommandClasses } from "@zwave-js/core";
import { MockZWaveFrameType, ccCaps } from "@zwave-js/testing";
import path from "node:path";
import { CoverAspect } from "../../../Node.js";
import { integrationTest } from "../integrationTestSuite.js";

integrationTest("Fibaro Venetian Blind: position via MLS, tilt via Fibaro CC", {
	nodeCapabilities: {
		manufacturerId: 0x010f,
		productType: 0xbeef,
		productId: 0xcafe,

		// Motor Control Class B
		genericDeviceClass: 0x11,
		specificDeviceClass: 0x06,
		commandClasses: [
			CommandClasses.Version,
			CommandClasses["Manufacturer Specific"],
			ccCaps({
				ccId: CommandClasses["Multilevel Switch"],
				version: 3,
				defaultValue: 0,
			}),
			CommandClasses["Manufacturer Proprietary"],
		],
	},

	additionalDriverOptions: {
		storage: {
			deviceConfigPriorityDir: path.join(
				__dirname,
				"fixtures/fibaroVenetianBlind",
			),
		},
	},

	testBody: async (t, driver, node, mockController, mockNode) => {
		const covers = node.covers;
		t.expect(covers).toBeDefined();

		const caps = covers!.getCapabilitiesCached();
		t.expect(caps.primaryAspect).toBe(CoverAspect.Primary);
		t.expect(caps.primaryTiltAspect).toBe(CoverAspect.Tilt);

		const tiltCaps = caps.aspects.find((a) => a.type === "tilt")!;
		t.expect(tiltCaps).toMatchObject({
			supportsGoToValue: true,
			reportsValue: true,
			reportsTarget: false,
			supportsStartStop: false,
		});

		mockNode.clearReceivedControllerFrames();

		// Position control uses the Multilevel Switch CC, which Fibaro maps
		// to the blind position
		await covers!.setPosition(80);
		mockNode.assertReceivedControllerFrame(
			(frame) =>
				frame.type === MockZWaveFrameType.Request
				&& frame.payload instanceof MultilevelSwitchCCSet
				&& frame.payload.targetValue === 80,
			{ errorMessage: "Expected a Multilevel Switch CC Set to 80" },
		);

		// Fully open tilt (unified 50) maps to the Fibaro scale maximum
		await covers!.setTilt(50);
		mockNode.assertReceivedControllerFrame(
			(frame) =>
				frame.type === MockZWaveFrameType.Request
				&& frame.payload instanceof FibaroVenetianBlindCCSet
				&& frame.payload.tilt === 99,
			{ errorMessage: "Expected a Fibaro Venetian Blind Set tilt 99" },
		);

		// Closed tilt maps to the Fibaro scale minimum
		await covers!.setTilt(0);
		mockNode.assertReceivedControllerFrame(
			(frame) =>
				frame.type === MockZWaveFrameType.Request
				&& frame.payload instanceof FibaroVenetianBlindCCSet
				&& frame.payload.tilt === 0,
			{ errorMessage: "Expected a Fibaro Venetian Blind Set tilt 0" },
		);
	},
});
