// @ts-check

import { describe, expect, it } from "vitest";
import {
	classificationToFeedback,
	classifyLogfile,
} from "./classifyLogfile.cjs";

/** Repeats the given lines until the excerpt resembles a real logfile */
function repeatLines(lines, times = 10) {
	return Array.from({ length: times }, () => lines).flat().join("\n");
}

const ZJS_DEBUG_LINES = [
	"2025-06-13 13:20:33.397 CNTRLR   Querying configured RF region...",
	"2025-06-13 13:20:33.398 DRIVER » [REQ] [SerialAPISetup]",
	"                                  command: GetRFRegion",
	"2025-06-13 13:20:33.398 SERIAL » 0x0104000b20d0                                                       (6 bytes)",
	"2025-06-13 13:20:33.403 SERIAL « [ACK]                                                                   (0x06)",
];

const ZJS_INFO_LINES = [
	"2025-09-05 19:08:19.455 CNTRLR » [Node 017] pinging the node...",
	"2025-09-05 19:08:19.462 CNTRLR   [Node 017] The node is alive.",
	"2025-09-05 19:08:19.470 DRIVER   all queues idle",
];

const ZUI_LINES = [
	"2021-08-04 15:56:59.250 INFO MQTT: MQTT is disabled",
	"2021-08-04 15:56:59.503 INFO Z-WAVE: Connecting to /dev/ttyACM0",
	"2021-08-04 15:57:09.381 DEBUG GATEWAY: Publishing discovery",
];

const HA_LINES = [
	"2025-06-13 13:32:31.856 INFO (MainThread) [homeassistant.components.zwave_js] Zwave-js-server logging is enabled",
	"2025-06-13 13:32:35.307 DEBUG (MainThread) [zwave_js_server] Publishing message:",
	"{'command': 'driver.update_log_config'}",
];

describe("classifyLogfile", () => {
	it("detects a driver log on loglevel debug", () => {
		expect(classifyLogfile(repeatLines(ZJS_DEBUG_LINES))).toBe(
			"Z-Wave JS: correct log level",
		);
	});

	it("detects a driver log with the wrong loglevel", () => {
		expect(classifyLogfile(repeatLines(ZJS_INFO_LINES))).toBe(
			"Z-Wave JS: wrong log level",
		);
	});

	it("handles ISO timestamps with Z suffix", () => {
		const log = repeatLines([
			"2025-03-23T18:49:45.763Z SERIAL » 0x0116000400110e32                (23 bytes)",
			"2025-03-23T18:49:45.764Z SERIAL « [ACK]                                (0x06)",
			"2025-03-23T18:49:45.765Z DRIVER « [REQ] [BridgeApplicationCommand]",
		]);
		expect(classifyLogfile(log)).toBe("Z-Wave JS: correct log level");
	});

	it("handles bare-time timestamps from console exports", () => {
		const log = repeatLines([
			"14:51:36.782 SERIAL « [ACK]                                            (0x06)",
			"14:51:36.790 SERIAL » 0x0105000b40ff4e                              (7 bytes)",
			"14:51:36.795 CNTRLR   [Node 011] pinging the node...",
		]);
		expect(classifyLogfile(log)).toBe("Z-Wave JS: correct log level");
	});

	it("detects a Z-Wave JS UI log", () => {
		expect(classifyLogfile(repeatLines(ZUI_LINES))).toBe("Z-Wave JS UI");
	});

	it("detects a Z-Wave JS UI log with ANSI colors", () => {
		const colored = repeatLines(ZUI_LINES)
			.split("\n")
			.map((line) =>
				`\x1b[90m${line.slice(0, 23)}\x1b[39m${line.slice(23)}`
			)
			.join("\n");
		expect(classifyLogfile(colored)).toBe("Z-Wave JS UI");
	});

	it("classifies stray driver lines inside a Z-Wave JS UI log as Z-Wave JS UI", () => {
		const log = repeatLines([
			"2025-11-08 20:35:35.838 CNTRLR « [Node 025] Received update",
			...repeatLines(ZUI_LINES, 2).split("\n"),
		], 5);
		expect(classifyLogfile(log)).toBe("Z-Wave JS UI");
	});

	it("detects a Home Assistant log without driver logs", () => {
		expect(classifyLogfile(repeatLines(HA_LINES))).toBe(
			"Home Assistant: No Z-Wave JS",
		);
	});

	it("detects driver logs interleaved with a Home Assistant log", () => {
		const log = repeatLines([...HA_LINES, ...ZJS_DEBUG_LINES]);
		expect(classifyLogfile(log)).toBe(
			"Home Assistant: Includes Z-Wave JS",
		);
	});

	it("detects zip uploads by their magic bytes", () => {
		expect(classifyLogfile("PK\x03\x04lots of compressed data here")).toBe(
			"Binary or compressed file",
		);
	});

	it("detects gzip uploads by their magic bytes", () => {
		expect(classifyLogfile("\x1f\x8b\x08more compressed data")).toBe(
			"Binary or compressed file",
		);
	});

	it("detects binary garbage decoded with replacement characters", () => {
		const garbage = Array.from(
			{ length: 2000 },
			(_, i) => (i % 3 === 0 ? "�" : "a"),
		).join("");
		expect(classifyLogfile(garbage)).toBe("Binary or compressed file");
	});

	it("classifies JSON dumps as unrelated", () => {
		const json = repeatLines([
			"          \"propertyName\": \"Illuminance\",",
			"          \"commandClass\": 49,",
			"          \"newValue\": 1,",
		], 30);
		expect(classifyLogfile(json)).toBe("Unrelated");
	});

	it("classifies empty content as unrelated", () => {
		expect(classifyLogfile("")).toBe("Unrelated");
		expect(classifyLogfile("\n\n\n")).toBe("Unrelated");
	});

	it("returns Unknown for a few matching lines in mostly unrecognized content", () => {
		const log = [
			...ZJS_INFO_LINES,
			...Array.from({ length: 100 }, (_, i) => `random line ${i}`),
		].join("\n");
		expect(classifyLogfile(log)).toBe("Unknown");
	});
});

describe("classificationToFeedback", () => {
	it("maps every classification to a feedback code", () => {
		expect(classificationToFeedback("Z-Wave JS: correct log level")).toBe(
			"OK",
		);
		expect(
			classificationToFeedback("Home Assistant: Includes Z-Wave JS"),
		).toBe("OK");
		expect(classificationToFeedback("Z-Wave JS: wrong log level")).toBe(
			"WRONG_LOG_LEVEL",
		);
		expect(classificationToFeedback("Z-Wave JS UI")).toBe("Z_UI");
		expect(classificationToFeedback("Home Assistant: No Z-Wave JS")).toBe(
			"HA_ONLY",
		);
		expect(classificationToFeedback("Binary or compressed file")).toBe(
			"BINARY",
		);
		expect(classificationToFeedback("Unrelated")).toBe("UNKNOWN");
		expect(classificationToFeedback("Unknown")).toBe("UNKNOWN");
	});
});
