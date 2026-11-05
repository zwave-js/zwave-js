import { CommandClass, FirmwareUpdateMetaDataCCReport } from "@zwave-js/cc";
import { CommandClasses } from "@zwave-js/core";
import { test } from "vitest";

const firmwareData = Uint8Array.from([0x01, 0x02, 0x03, 0x04, 0x05]);

for (const version of [1, 2]) {
	test(`the Report command (v${version}) should survive a round trip`, async (t) => {
		const report = new FirmwareUpdateMetaDataCCReport({
			nodeId: 2,
			reportNumber: 0x1234,
			isLast: true,
			firmwareData,
		});
		const serialized = await report.serialize({
			getSupportedCCVersion: (cc: CommandClasses) =>
				cc === CommandClasses["Firmware Update Meta Data"]
					? version
					: 0,
		} as any);

		const parsed = (await CommandClass.parse(serialized, {
			sourceNodeId: 1,
		} as any)) as FirmwareUpdateMetaDataCCReport;
		t.expect(parsed.constructor).toBe(FirmwareUpdateMetaDataCCReport);
		t.expect(parsed.reportNumber).toBe(0x1234);
		t.expect(parsed.isLast).toBe(true);
		t.expect(Uint8Array.from(parsed.firmwareData)).toStrictEqual(
			firmwareData,
		);
	});
}
