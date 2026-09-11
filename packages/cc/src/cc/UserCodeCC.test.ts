import { CommandClasses, ZWaveErrorCodes } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { expect, test, vi } from "vitest";

import { CCRaw } from "../lib/CommandClass.js";
import { UserCodeCommand, UserIDStatus } from "../lib/_Types.js";
import type { CCEncodingContext, CCParsingContext } from "../lib/traits.js";

import {
	UserCodeCCExtendedUserCodeGet,
	UserCodeCCExtendedUserCodeReport,
} from "./UserCodeCC.js";

const ctx: CCEncodingContext & CCParsingContext = {
	ownNodeId: 1,
	homeId: 1,
	sourceNodeId: 2,
	frameType: "singlecast",
	securityManager: undefined,
	securityManager2: undefined,
	securityManagerLR: undefined,
	getDeviceConfig: () => undefined,
	getSupportedCCVersion: () => 2,
	getHighestSecurityClass: () => undefined,
	hasSecurityClass: () => false,
	setSecurityClass: vi.fn(),
};
const raw = (command: UserCodeCommand, payload: number[]) =>
	new CCRaw(CommandClasses["User Code"], command, Bytes.from(payload));

test.each([0xfe, 0xff])(
	"Extended User Code Get masks flags %i",
	async (flags) => {
		const cc = UserCodeCCExtendedUserCodeGet.from(
			raw(UserCodeCommand.ExtendedUserCodeGet, [0x12, 0x34, flags]),
			ctx,
		);
		expect(cc).toMatchObject({ userId: 0x1234, reportMore: !!(flags & 1) });
		expect(await cc.serialize(ctx)).toEqual(
			Bytes.from([0x63, 0x0c, 0x12, 0x34, flags & 1]),
		);
	},
);

test("Extended User Code Report encodes records and pagination", async () => {
	const userCodes = [
		{
			userId: 0x1234,
			userIdStatus: UserIDStatus.Enabled,
			userCode: "1234",
		},
		{ userId: 0x1235, userIdStatus: UserIDStatus.Available, userCode: "" },
	];
	const cc = new UserCodeCCExtendedUserCodeReport({
		nodeId: 2,
		userCodes,
		nextUserId: 0x1236,
	});
	const payload = [
		2, 0x12, 0x34, 1, 4, 49, 50, 51, 52, 0x12, 0x35, 0, 0, 0x12, 0x36,
	];
	expect(await cc.serialize(ctx)).toEqual(
		Bytes.from([0x63, 0x0d, ...payload]),
	);
	expect(
		UserCodeCCExtendedUserCodeReport.from(
			raw(UserCodeCommand.ExtendedUserCodeReport, payload),
			ctx,
		),
	).toMatchObject({ userCodes, nextUserId: 0x1236 });
});

test("Extended User Code Report supports an empty final page", async () => {
	const cc = new UserCodeCCExtendedUserCodeReport({
		nodeId: 2,
		userCodes: [],
		nextUserId: 0,
	});
	expect(await cc.serialize(ctx)).toEqual(Bytes.from([0x63, 0x0d, 0, 0, 0]));
});

test("Extended User Code Report rejects overflowing code lengths and counts", () => {
	const code = {
		userId: 1,
		userIdStatus: UserIDStatus.Enabled,
		userCode: "1".repeat(16),
	};
	const oversizedCode = new UserCodeCCExtendedUserCodeReport({
		nodeId: 2,
		userCodes: [code],
		nextUserId: 0,
	});
	expect(() => oversizedCode.serialize(ctx)).toThrow(
		expect.objectContaining({ code: ZWaveErrorCodes.Argument_Invalid }),
	);
	const oversizedCount = new UserCodeCCExtendedUserCodeReport({
		nodeId: 2,
		userCodes: Array.from({ length: 256 }, () => ({ ...code })),
		nextUserId: 0,
	});
	expect(() => oversizedCount.serialize(ctx)).toThrow(
		expect.objectContaining({ code: ZWaveErrorCodes.Argument_Invalid }),
	);
});

test.each([[], [0], [0, 1]].map((payload) => ({ payload })))(
	"Extended User Code Get rejects truncated payload $payload",
	({ payload }) => {
		expect(() =>
			UserCodeCCExtendedUserCodeGet.from(
				raw(UserCodeCommand.ExtendedUserCodeGet, payload),
				ctx,
			),
		).toThrow(
			expect.objectContaining({
				code: ZWaveErrorCodes.PacketFormat_InvalidPayload,
			}),
		);
	},
);

test.each(
	[
		[1, 0, 1, 1, 4, 49],
		[0, 0],
	].map((payload) => ({ payload })),
)(
	"Extended User Code Report rejects truncated payload $payload",
	({ payload }) => {
		expect(() =>
			UserCodeCCExtendedUserCodeReport.from(
				raw(UserCodeCommand.ExtendedUserCodeReport, payload),
				ctx,
			),
		).toThrow(
			expect.objectContaining({
				code: ZWaveErrorCodes.PacketFormat_InvalidPayload,
			}),
		);
	},
);
