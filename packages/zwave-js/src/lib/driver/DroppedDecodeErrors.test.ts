import { ZWaveErrorCodes } from "@zwave-js/core";
import { EXPECTED_ERROR_CODES } from "@zwave-js/eslint-plugin/src/rules/no-unexpected-parse-errors.js";
import { expect, test } from "vitest";

import { droppedDecodeErrors } from "./DroppedDecodeErrors.js";

test("The no-unexpected-parse-errors lint rule expects the error codes dropped by the receive path", () => {
	const dropped = [...droppedDecodeErrors.keys()].map(
		(code) => ZWaveErrorCodes[code],
	);
	expect([...EXPECTED_ERROR_CODES].toSorted()).toStrictEqual(
		dropped.toSorted(),
	);
});
