import { CommandClasses, ZWaveErrorCodes } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { expect, test, vi } from "vitest";

import { CCRaw } from "../lib/CommandClass.js";
import { MultiChannelCommand } from "../lib/_Types.js";
import type { CCEncodingContext, CCParsingContext } from "../lib/traits.js";

import {
	MultiChannelCCAggregatedMembersGet,
	MultiChannelCCAggregatedMembersReport,
} from "./MultiChannelCC.js";

const ctx: CCEncodingContext & CCParsingContext = {
	ownNodeId: 1,
	homeId: 1,
	sourceNodeId: 2,
	frameType: "singlecast",
	securityManager: undefined,
	securityManager2: undefined,
	securityManagerLR: undefined,
	getDeviceConfig: () => undefined,
	getSupportedCCVersion: () => 4,
	getHighestSecurityClass: () => undefined,
	hasSecurityClass: () => false,
	setSecurityClass: vi.fn(),
};
const raw = (command: MultiChannelCommand, payload: number[]) =>
	new CCRaw(CommandClasses["Multi Channel"], command, Bytes.from(payload));

test("Aggregated Members Get ignores reserved bits and roundtrips", async () => {
	const cc = MultiChannelCCAggregatedMembersGet.from(
		raw(MultiChannelCommand.AggregatedMembersGet, [0x83]),
		ctx,
	);
	expect(cc.requestedEndpoint).toBe(3);
	expect(await cc.serialize(ctx)).toEqual(Bytes.from([0x60, 0x0e, 3]));
});

test.each([
	{ members: [1, 8, 9, 127], mask: [0x81, 1, ...Array(13).fill(0), 0x40] },
	{ members: [], mask: [0] },
])("Aggregated Members Report encodes $members", async ({ members, mask }) => {
	const cc = new MultiChannelCCAggregatedMembersReport({
		nodeId: 2,
		aggregatedEndpointIndex: 3,
		members,
	});
	const payload = [3, mask.length, ...mask];
	expect(await cc.serialize(ctx)).toEqual(
		Bytes.from([0x60, 0x0f, ...payload]),
	);
	expect(
		MultiChannelCCAggregatedMembersReport.from(
			raw(MultiChannelCommand.AggregatedMembersReport, payload),
			ctx,
		),
	).toMatchObject({ aggregatedEndpointIndex: 3, members });
});

test("Aggregated Members rejects truncated payloads", () => {
	expect(() =>
		MultiChannelCCAggregatedMembersGet.from(
			raw(MultiChannelCommand.AggregatedMembersGet, []),
			ctx,
		),
	).toThrow(
		expect.objectContaining({
			code: ZWaveErrorCodes.PacketFormat_InvalidPayload,
		}),
	);
	expect(() =>
		MultiChannelCCAggregatedMembersReport.from(
			raw(MultiChannelCommand.AggregatedMembersReport, [3, 2, 1]),
			ctx,
		),
	).toThrow(
		expect.objectContaining({
			code: ZWaveErrorCodes.PacketFormat_InvalidPayload,
		}),
	);
});
