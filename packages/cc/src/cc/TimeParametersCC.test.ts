import { CommandClasses } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { expect, test, vi } from "vitest";

import { CCRaw } from "../lib/CommandClass.js";
import { TimeParametersCommand } from "../lib/_Types.js";
import type { CCEncodingContext, CCParsingContext } from "../lib/traits.js";

import { TimeParametersCCReport } from "./TimeParametersCC.js";

const ctx: CCEncodingContext & CCParsingContext = {
	ownNodeId: 1,
	homeId: 1,
	sourceNodeId: 2,
	frameType: "singlecast",
	securityManager: undefined,
	securityManager2: undefined,
	securityManagerLR: undefined,
	getDeviceConfig: () => undefined,
	getSupportedCCVersion: () => 1,
	getHighestSecurityClass: () => undefined,
	hasSecurityClass: () => false,
	setSecurityClass: vi.fn(),
};

test("Time Parameters Report serializes UTC date fields by default", async () => {
	const dateAndTime = new Date("2026-09-11T13:28:29.000Z");
	const cc = new TimeParametersCCReport({ nodeId: 2, dateAndTime });
	const serialized = await cc.serialize(ctx);
	expect(serialized).toEqual(
		Bytes.from([
			CommandClasses["Time Parameters"],
			TimeParametersCommand.Report,
			0x07,
			0xea,
			9,
			11,
			13,
			28,
			29,
		]),
	);
	expect(
		TimeParametersCCReport.from(CCRaw.parse(serialized), ctx).dateAndTime,
	).toEqual(dateAndTime);
});

test("Time Parameters Report can serialize local date fields", async () => {
	const cc = new TimeParametersCCReport({
		nodeId: 2,
		dateAndTime: new Date(2026, 8, 11, 13, 28, 29),
		useLocalTime: true,
	});
	expect(await cc.serialize(ctx)).toEqual(
		Bytes.from([
			CommandClasses["Time Parameters"],
			TimeParametersCommand.Report,
			0x07,
			0xea,
			9,
			11,
			13,
			28,
			29,
		]),
	);
});
