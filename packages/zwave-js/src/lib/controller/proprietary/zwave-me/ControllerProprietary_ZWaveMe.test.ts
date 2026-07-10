import { RFRegion } from "@zwave-js/core";
import { test } from "vitest";
import {
	ZWaveMeRegion,
	rfRegionToZWaveMeRegion,
	zwaveMeRegionToRFRegion,
} from "./ControllerProprietary_ZWaveMe.js";

test("region mapping round-trips for all mappable regions", (t) => {
	const mappable = [
		ZWaveMeRegion.EU,
		ZWaveMeRegion.RU,
		ZWaveMeRegion.IN,
		ZWaveMeRegion.US,
		ZWaveMeRegion.ANZ,
		ZWaveMeRegion.HK,
		ZWaveMeRegion.CN,
		ZWaveMeRegion.JP,
		ZWaveMeRegion.KR,
		ZWaveMeRegion.IL,
		ZWaveMeRegion.US_LR,
		ZWaveMeRegion.EU_LR,
	];
	for (const region of mappable) {
		const rf = zwaveMeRegionToRFRegion(region);
		t.expect(rf).not.toBeUndefined();
		t.expect(rfRegionToZWaveMeRegion(rf!)).toBe(region);
	}
});

test("specific region mappings", (t) => {
	t.expect(zwaveMeRegionToRFRegion(ZWaveMeRegion.US)).toBe(RFRegion.USA);
	t.expect(zwaveMeRegionToRFRegion(ZWaveMeRegion.US_LR)).toBe(
		RFRegion["USA (Long Range)"],
	);
	t.expect(rfRegionToZWaveMeRegion(RFRegion.Europe)).toBe(ZWaveMeRegion.EU);
});

test("Malaysia has no standard RF region equivalent", (t) => {
	t.expect(zwaveMeRegionToRFRegion(ZWaveMeRegion.MY)).toBeUndefined();
});
