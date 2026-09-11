import { CommandClasses, ZWaveErrorCodes } from "@zwave-js/core";
import { Bytes } from "@zwave-js/shared";
import { expect, test, vi } from "vitest";

import { CCRaw } from "../lib/CommandClass.js";
import { LanguageCommand } from "../lib/_Types.js";
import type { CCEncodingContext, CCParsingContext } from "../lib/traits.js";

import { LanguageCCReport, LanguageCCSet } from "./LanguageCC.js";

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

test.each([undefined, "US"])(
	"Language codecs preserve country %s",
	async (country) => {
		const payload = Bytes.from("eng" + (country ?? ""), "ascii");
		const set = LanguageCCSet.from(
			new CCRaw(CommandClasses.Language, LanguageCommand.Set, payload),
			ctx,
		);
		expect(set).toMatchObject({ language: "eng", country });
		const report = new LanguageCCReport({
			nodeId: 2,
			language: "eng",
			country,
		});
		expect(await report.serialize(ctx)).toEqual(
			Bytes.concat([
				[CommandClasses.Language, LanguageCommand.Report],
				payload,
			]),
		);
	},
);

test.each(["", "en", "ENG", "engus"])(
	"Language Set rejects invalid code %s",
	(payload) => {
		expect(() =>
			LanguageCCSet.from(
				new CCRaw(
					CommandClasses.Language,
					LanguageCommand.Set,
					Bytes.from(payload, "ascii"),
				),
				ctx,
			),
		).toThrow(
			expect.objectContaining({
				code: ZWaveErrorCodes.PacketFormat_InvalidPayload,
			}),
		);
	},
);
