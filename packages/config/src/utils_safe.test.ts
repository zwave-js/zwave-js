import { test } from "vitest";

import { isFirmwareVersion } from "./utils_safe.js";

test("isFirmwareVersion accepts x.y and x.y.z with components between 0 and 255", (t) => {
	for (const version of [
		"0.0",
		"1.5",
		"13.0",
		"255.255",
		"1.2.3",
		"10.0.255",
	]) {
		t.expect(isFirmwareVersion(version), version).toBe(true);
	}
});

test("isFirmwareVersion rejects leading zeros", (t) => {
	for (const version of ["1.03", "13.00", "01.0", "1.0.00", "00.0"]) {
		t.expect(isFirmwareVersion(version), version).toBe(false);
	}
});

test("isFirmwareVersion rejects malformed versions", (t) => {
	for (const version of [
		"1",
		"1.",
		"1.2.3.4",
		"256.0",
		"1.256",
		"1.a",
		"",
		1.5,
	]) {
		t.expect(isFirmwareVersion(version), String(version)).toBe(false);
	}
});
