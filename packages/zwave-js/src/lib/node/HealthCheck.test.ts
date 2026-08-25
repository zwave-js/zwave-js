import { test } from "vitest";
import { formatLifelineHealthCheckRound } from "./HealthCheck.js";

test("formatLifelineHealthCheckRound reports SNR margin in dB", ({ expect }) => {
	const result = formatLifelineHealthCheckRound(1, 1, {
		failedPingsNode: 0,
		latency: 10,
		rating: 10,
		snrMargin: 17,
	});

	expect(result).toContain("SNR margin:                      17 dB");
	expect(result).not.toContain("dBm");
});
