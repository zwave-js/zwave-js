import {
	MultilevelSwitchCCReport,
	MultilevelSwitchCommand,
	MultilevelSwitchCCValues,
	WindowCoveringCCValues,
} from "@zwave-js/cc";
import { CommandClasses } from "@zwave-js/core";
import { test } from "vitest";

test("MultilevelSwitchCCReport should deserialize correctly", async (t) => {
	// This test verifies the current behavior before implementing the fix
	const cc = MultilevelSwitchCCReport.from(
		{
			ccId: CommandClasses["Multilevel Switch"],
			ccCommand: MultilevelSwitchCommand.Report,
			payload: Uint8Array.from([50]), // 50% value
		},
		{
			sourceNodeId: 2,
			frameType: "singlecast",
		} as any
	);
	
	t.expect(cc.currentValue).toBe(50);
	t.expect(cc.targetValue).toBeUndefined();
	t.expect(cc.duration).toBeUndefined();
});

test("MultilevelSwitchCCReport should deserialize correctly with target and duration", async (t) => {
	const cc = MultilevelSwitchCCReport.from(
		{
			ccId: CommandClasses["Multilevel Switch"],
			ccCommand: MultilevelSwitchCommand.Report,
			payload: Uint8Array.from([50, 75, 0x21]), // current=50%, target=75%, duration
		},
		{
			sourceNodeId: 2,
			frameType: "singlecast",
		} as any
	);
	
	t.expect(cc.currentValue).toBe(50);
	t.expect(cc.targetValue).toBe(75);
	t.expect(cc.duration).toBeDefined();
});

test("MultilevelSwitchCCReport should have persistMultilevelSwitchValues method", async (t) => {
	const cc = new MultilevelSwitchCCReport({
		nodeId: 2,
		currentValue: 50,
		targetValue: 75,
	});
	
	t.expect(typeof cc.persistMultilevelSwitchValues).toBe("function");
});