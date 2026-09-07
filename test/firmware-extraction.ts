import fs from "node:fs/promises";

import { extractFirmware, guessFirmwareFileFormat } from "@zwave-js/core";

void (async () => {
	const filename = process.argv[2];
	const data = await fs.readFile(filename);
	const format = guessFirmwareFileFormat(filename, data);
	await extractFirmware(data, format);
})();
