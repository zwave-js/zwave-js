import type { Duration } from "@zwave-js/core";

export function areDurationsEqual(
	first: Duration | undefined,
	second: Duration | undefined,
): boolean {
	return first?.value === second?.value && first?.unit === second?.unit;
}
