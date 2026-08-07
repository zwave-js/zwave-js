import { type IndicatorObject } from "@zwave-js/cc";
import { IndicatorCCReport, IndicatorCCSet } from "@zwave-js/cc/IndicatorCC";
import { CommandClasses } from "@zwave-js/core";
import {
	MockZWaveFrameType,
	ccCaps,
	createMockZWaveRequestFrame,
} from "@zwave-js/testing";
import { wait } from "alcalzone-shared/async";
import { createDeferredPromise } from "alcalzone-shared/deferred-promise";
import { integrationTest } from "../integrationTestSuite.js";

function findIndicatorObject(
	values: IndicatorObject[],
	propertyId: number,
): number | boolean | undefined {
	return values.find((v) => v.propertyId === propertyId)?.value;
}

// =============================================================================
// Capabilities
// =============================================================================

integrationTest(
	"Indicator capabilities are derived from the supported properties",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				ccCaps({
					ccId: CommandClasses.Indicator,
					version: 3,
					indicators: {
						// LCD backlight: Multilevel, blinking, timeout
						[0x30]: {
							properties: [0x01, 0x03, 0x04, 0x05, 0x06, 0x07],
						},
						// Button 1 indication: Binary only
						[0x43]: { properties: [0x02] },
						// Node Identify
						[0x50]: { properties: [0x03, 0x04, 0x05] },
					},
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			const supported = node.indicators!.getSupportedCached();

			// Node Identify must not be exposed
			t.expect(supported.map((c) => c.indicatorId)).toStrictEqual([
				0x30,
				0x43,
			]);

			t.expect(supported[0]).toStrictEqual({
				indicatorId: 0x30,
				label: "LCD backlight",
				supportsOnOff: true,
				supportsLevel: true,
				supportsBlinking: true,
				supportsTimeout: true,
				supportsSoundLevel: false,
			});
			t.expect(supported[1]).toStrictEqual({
				indicatorId: 0x43,
				label: "Button 1 indication",
				supportsOnOff: true,
				supportsLevel: false,
				supportsBlinking: false,
				supportsTimeout: false,
				supportsSoundLevel: false,
			});

			t.expect(node.indicators!.getCapabilitiesCached(0x43))
				.toStrictEqual(supported[1]);
			t.expect(node.indicators!.getCapabilitiesCached(0x50))
				.toBeUndefined();
		},
	},
);

integrationTest(
	"The indicators API is not available without Indicator CC support",
	{
		nodeCapabilities: {
			commandClasses: [CommandClasses.Version],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			t.expect(node.indicators).toBeUndefined();
		},
	},
);

integrationTest(
	"Manufacturer-defined indicators use their description as the label",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				ccCaps({
					ccId: CommandClasses.Indicator,
					version: 4,
					indicators: {
						[0x80]: {
							properties: [0x02],
							manufacturerSpecificDescription: "Ring light",
						},
					},
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			const caps = node.indicators!.getCapabilitiesCached(0x80);
			t.expect(caps?.label).toBe("Ring light");
		},
	},
);

// =============================================================================
// Reading the indicator state
// =============================================================================

integrationTest(
	"get() and getCached() return the normalized indicator state",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				ccCaps({
					ccId: CommandClasses.Indicator,
					version: 3,
					indicators: {
						[0x30]: {
							properties: [0x01, 0x03, 0x04, 0x05, 0x06, 0x07],
						},
					},
					getValue: (indicatorId, propertyId) => {
						switch (propertyId) {
							case 0x01:
								return 50;
							// Blink with a 1 second period, 3 cycles
							case 0x03:
								return 10;
							case 0x04:
								return 3;
							// Turn off after 30 seconds
							case 0x07:
								return 30;
							default:
								return 0;
						}
					},
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			const expected = {
				on: true,
				level: 50,
				blink: {
					period: 1,
					cycles: 3,
				},
				timeout: {
					seconds: 30,
				},
			};

			const state = await node.indicators!.get(0x30);
			t.expect(state).toStrictEqual(expected);

			t.expect(node.indicators!.getCached(0x30)).toStrictEqual(expected);
		},
	},
);

// =============================================================================
// Changing the indicator state
// =============================================================================

integrationTest(
	"set() sends all indicator properties in a single command",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				ccCaps({
					ccId: CommandClasses.Indicator,
					version: 3,
					indicators: {
						[0x30]: {
							properties: [0x01, 0x03, 0x04, 0x05, 0x06, 0x07],
						},
					},
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			mockNode.clearReceivedControllerFrames();

			await node.indicators!.set(0x30, {
				level: 50,
				blink: { period: 1.5 },
				timeout: "30s",
			});

			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof IndicatorCCSet
					&& frame.payload.values != undefined
					&& frame.payload.values.length === 4
					&& findIndicatorObject(frame.payload.values, 0x01) === 50
					&& findIndicatorObject(frame.payload.values, 0x03) === 15
					&& findIndicatorObject(frame.payload.values, 0x04) === 0xff
					&& findIndicatorObject(frame.payload.values, 0x07) === 30,
				{
					errorMessage:
						"Should have sent a single Indicator Set with level, blink and timeout properties",
				},
			);

			// The device resets all properties that were not part of a Set
			await node.indicators!.set(0x30, { level: 20 });
			const state = await node.indicators!.get(0x30);
			t.expect(state).toStrictEqual({
				on: true,
				level: 20,
			});
		},
	},
);

integrationTest(
	"set() validates the state against the indicator capabilities",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				ccCaps({
					ccId: CommandClasses.Indicator,
					version: 3,
					indicators: {
						[0x30]: {
							properties: [0x01, 0x03, 0x04, 0x05, 0x06, 0x07],
						},
						[0x43]: { properties: [0x02] },
					},
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			// A level for a Binary-only indicator falls back to on/off
			await node.indicators!.set(0x43, { level: 50 });
			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof IndicatorCCSet
					&& frame.payload.values != undefined
					&& frame.payload.values.length === 1
					&& frame.payload.values[0].propertyId === 0x02
					&& frame.payload.values[0].value === 0xff,
				{
					errorMessage:
						"Should have fallen back to the Binary property",
				},
			);

			// Unsupported functionality is rejected
			await t.expect(
				node.indicators!.set(0x43, { blink: { period: 1 } }),
			).rejects.toThrow("does not support blinking");

			// An empty state is rejected
			await t.expect(node.indicators!.set(0x30, {})).rejects.toThrow(
				"is empty",
			);

			// Unsupported indicators are rejected
			await t.expect(
				node.indicators!.set(0x44, { on: true }),
			).rejects.toThrow("cannot be controlled");
		},
	},
);

integrationTest(
	"A successful supervised set() updates the cached state",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				CommandClasses.Supervision,
				ccCaps({
					ccId: CommandClasses.Indicator,
					version: 3,
					indicators: {
						[0x30]: {
							properties: [0x01, 0x03, 0x04, 0x05, 0x06, 0x07],
						},
					},
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			await node.indicators!.set(0x30, {
				level: 33,
				timeout: { minutes: 2 },
			});

			t.expect(node.indicators!.getCached(0x30)).toStrictEqual({
				on: true,
				level: 33,
				timeout: {
					minutes: 2,
				},
			});
		},
	},
);

// =============================================================================
// Events
// =============================================================================

integrationTest(
	"An unsolicited report emits the indicator updated event",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				ccCaps({
					ccId: CommandClasses.Indicator,
					version: 3,
					indicators: {
						[0x30]: {
							properties: [0x01, 0x03, 0x04, 0x05, 0x06, 0x07],
						},
						[0x50]: { properties: [0x03, 0x04, 0x05] },
					},
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			const updates: unknown[] = [];
			node.on("indicator updated", (_endpoint, args) => {
				updates.push(args);
			});

			// Reports for the Node Identify indicator must not emit events
			await mockNode.sendToController(
				createMockZWaveRequestFrame(
					new IndicatorCCReport({
						nodeId: mockController.ownNodeId,
						values: [
							{ indicatorId: 0x50, propertyId: 0x03, value: 8 },
							{ indicatorId: 0x50, propertyId: 0x04, value: 3 },
						],
					}),
					{ ackRequested: false },
				),
			);

			// A partial report resets the missing properties
			await mockNode.sendToController(
				createMockZWaveRequestFrame(
					new IndicatorCCReport({
						nodeId: mockController.ownNodeId,
						values: [
							{ indicatorId: 0x30, propertyId: 0x01, value: 60 },
						],
					}),
					{ ackRequested: false },
				),
			);

			await wait(100);

			t.expect(updates).toStrictEqual([{
				indicatorId: 0x30,
				on: true,
				level: 60,
			}]);

			// The event payload matches the cached state
			t.expect(node.indicators!.getCached(0x30)).toStrictEqual({
				on: true,
				level: 60,
			});
		},
	},
);

// =============================================================================
// V1 nodes
// =============================================================================

integrationTest(
	"V1 nodes expose a single default indicator",
	{
		nodeCapabilities: {
			commandClasses: [
				CommandClasses.Version,
				ccCaps({
					ccId: CommandClasses.Indicator,
					version: 1,
					indicators: {},
				}),
			],
		},

		testBody: async (t, driver, node, mockController, mockNode) => {
			t.expect(node.indicators!.getSupportedCached()).toStrictEqual([{
				indicatorId: 0,
				label: "Default",
				supportsOnOff: true,
				supportsLevel: false,
				supportsBlinking: false,
				supportsTimeout: false,
				supportsSoundLevel: false,
			}]);

			await node.indicators!.set(0, { on: true });
			mockNode.assertReceivedControllerFrame(
				(frame) =>
					frame.type === MockZWaveFrameType.Request
					&& frame.payload instanceof IndicatorCCSet
					&& frame.payload.indicator0Value === 0xff,
				{
					errorMessage: "Should have sent a V1 Indicator Set",
				},
			);

			t.expect(await node.indicators!.get(0)).toStrictEqual({
				on: true,
			});

			// Other functionality is rejected
			await t.expect(
				node.indicators!.set(0, { blink: { period: 1 } }),
			).rejects.toThrow("on or off");
			await t.expect(
				node.indicators!.set(1, { on: true }),
			).rejects.toThrow("default indicator");

			// V1 reports emit the indicator updated event
			const update = createDeferredPromise<unknown>();
			node.once("indicator updated", (_endpoint, args) => {
				update.resolve(args);
			});
			await mockNode.sendToController(
				createMockZWaveRequestFrame(
					new IndicatorCCReport({
						nodeId: mockController.ownNodeId,
						value: 0,
					}),
					{ ackRequested: false },
				),
			);
			t.expect(await update).toStrictEqual({
				indicatorId: 0,
				on: false,
			});
		},
	},
);
