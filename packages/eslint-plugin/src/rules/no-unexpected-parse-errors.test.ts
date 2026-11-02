import { ZWaveErrorCodes } from "@zwave-js/core";
import { droppedDecodeErrors } from "@zwave-js/serial/safe";
import { expect, test } from "vitest";

import { EXPECTED_ERROR_CODES } from "./no-unexpected-parse-errors.js";

test("EXPECTED_ERROR_CODES matches the error codes dropped by the receive path", () => {
	const dropped = [...droppedDecodeErrors.keys()].map(
		(code) => ZWaveErrorCodes[code],
	);
	expect([...EXPECTED_ERROR_CODES].toSorted()).toStrictEqual(
		dropped.toSorted(),
	);
});
