import { reportProblem } from "@zwave-js/maintenance";
import type { JSONObject } from "@zwave-js/shared";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { ConfigManager } from "../src/ConfigManager.js";
import { ConditionalDeviceConfig } from "../src/devices/DeviceConfig.js";

import { lintConfigFiles } from "./lintConfigFiles.js";

vi.mock("@zwave-js/maintenance", () => ({
	reportProblem: vi.fn(),
}));

vi.mock("@zwave-js/shared", async (importOriginal) => ({
	...(await importOriginal<typeof import("@zwave-js/shared")>()),
	enumFilesRecursive: vi.fn(async () => []),
}));

vi.mock("alcalzone-shared/async", async (importOriginal) => ({
	...(await importOriginal<typeof import("alcalzone-shared/async")>()),
	wait: vi.fn(async () => {}),
}));

let definition: JSONObject;

beforeEach(() => {
	vi.clearAllMocks();
	vi.spyOn(console, "log").mockImplementation(() => {});
	vi.spyOn(console, "warn").mockImplementation(() => {});
	vi.spyOn(process, "exit").mockImplementation(() => {
		throw new Error("lint exited");
	});
	vi.spyOn(ConfigManager.prototype, "loadManufacturers").mockResolvedValue();
	vi.spyOn(ConfigManager.prototype, "loadDeviceIndex").mockResolvedValue();
	vi.spyOn(ConfigManager.prototype, "getIndex").mockReturnValue([
		{
			manufacturerId: "0xffff",
			productType: "0x0001",
			productId: "0x0001",
			firmwareVersion: { min: "0.0", max: "255.255" },
			filename: "test.json",
		},
	]);
	vi.spyOn(ConditionalDeviceConfig, "from").mockImplementation(
		async () => new ConditionalDeviceConfig("test.json", true, definition),
	);
	definition = {
		manufacturer: "Test Manufacturer",
		manufacturerId: "0xffff",
		label: "Test Device",
		description: "Endpoint group test device",
		devices: [{ productType: "0x0001", productId: "0x0001" }],
		firmwareVersion: { min: "0.0", max: "255.255" },
	};
});

afterEach(() => {
	vi.restoreAllMocks();
});

test("warns about an authored single-member group", async () => {
	definition.endpointGroups = {
		1: { label: "Output", endpoints: [0] },
	};

	await lintConfigFiles();

	expect(reportProblem).toHaveBeenCalledExactlyOnceWith({
		severity: "warn",
		filename: "packages/config/config/devices/test.json",
		message:
			"Endpoint group 1 contains only one endpoint. Consider using an endpoint label.",
		annotation: false,
	});
	expect(process.exit).not.toHaveBeenCalled();
});

test("warns about authored single-member groups even when inactive", async () => {
	definition.endpointGroups = {
		1: {
			$if: "firmwareVersion > 255.255",
			label: "Output",
			endpoints: [1],
		},
	};

	await lintConfigFiles();

	expect(reportProblem).toHaveBeenCalledExactlyOnceWith(
		expect.objectContaining({
			severity: "warn",
			message: expect.stringContaining("contains only one endpoint"),
		}),
	);
	expect(process.exit).not.toHaveBeenCalled();
});

test("allows groups without endpoint configs alongside root associations", async () => {
	definition.endpointGroups = {
		1: { label: "Output", endpoints: [0, 1] },
	};
	definition.associations = {
		1: { label: "Lifeline", maxNodes: 1, isLifeline: true },
	};

	await lintConfigFiles();

	expect(reportProblem).not.toHaveBeenCalled();
	expect(process.exit).not.toHaveBeenCalled();
});

test("reports unconditional overlapping membership", async () => {
	definition.endpointGroups = {
		1: { label: "Output", endpoints: [0, 1] },
		2: { label: "Other Output", endpoints: [0, 2] },
	};

	await expect(lintConfigFiles()).rejects.toThrow("lint exited");

	expect(reportProblem).toHaveBeenCalledWith(
		expect.objectContaining({
			severity: "error",
			message: expect.stringContaining(
				"Endpoint 0 belongs to multiple active endpoint groups: 1 and 2",
			),
		}),
	);
});

test("checks firmware boundaries from endpoint group conditions", async () => {
	definition.endpointGroups = {
		1: {
			$if: "firmwareVersion <= 2.0",
			label: "Output",
			endpoints: [0, 1],
		},
		2: {
			$if: "firmwareVersion >= 2.0",
			label: "Other Output",
			endpoints: [0, 2],
		},
	};

	await expect(lintConfigFiles()).rejects.toThrow("lint exited");

	expect(reportProblem).toHaveBeenCalledExactlyOnceWith(
		expect.objectContaining({
			severity: "error",
			filename: expect.stringContaining(":2.0)"),
			message: expect.stringContaining(
				"Endpoint 0 belongs to multiple active endpoint groups: 1 and 2",
			),
		}),
	);
});

test("allows mutually exclusive overlapping membership", async () => {
	definition.endpointGroups = {
		1: {
			$if: "firmwareVersion < 2.0",
			label: "Output",
			endpoints: [0, 1],
		},
		2: {
			$if: "firmwareVersion >= 2.0",
			label: "Other Output",
			endpoints: [0, 2],
		},
	};

	await lintConfigFiles();

	expect(reportProblem).not.toHaveBeenCalled();
	expect(process.exit).not.toHaveBeenCalled();
});

test("reports overlap between strict firmware boundaries", async () => {
	definition.endpointGroups = {
		1: {
			$if: "firmwareVersion > 1.0",
			label: "Output",
			endpoints: [0, 1],
		},
		2: {
			$if: "firmwareVersion < 2.0",
			label: "Other Output",
			endpoints: [0, 2],
		},
	};

	await expect(lintConfigFiles()).rejects.toThrow("lint exited");

	expect(reportProblem).toHaveBeenCalledWith(
		expect.objectContaining({
			severity: "error",
			filename: expect.stringContaining(":1.0.1)"),
			message: expect.stringContaining(
				"Endpoint 0 belongs to multiple active endpoint groups: 1 and 2",
			),
		}),
	);
});

test("does not report overlap outside the configured firmware range", async () => {
	definition.firmwareVersion = { min: "1.0", max: "1.5" };
	definition.endpointGroups = {
		1: {
			$if: "firmwareVersion > 1.5",
			label: "Output",
			endpoints: [0, 1],
		},
		2: {
			$if: "firmwareVersion < 2.0",
			label: "Other Output",
			endpoints: [0, 2],
		},
	};

	await lintConfigFiles();

	expect(reportProblem).not.toHaveBeenCalled();
});

test("only checks supported firmware for configs without endpoint groups", async () => {
	definition.firmwareVersion = { min: "1.1", max: "1.5" };
	definition.label = [
		{ $if: "firmwareVersion !== 1.0", value: "Test Device" },
	];

	await lintConfigFiles();

	expect(reportProblem).not.toHaveBeenCalled();
});

test.each([false, true])(
	"rejects leading zeros in firmware condition boundaries with endpoint groups: %s",
	async (withGroups) => {
		definition.label = [
			{ $if: "firmwareVersion >= 1.03", value: "Test Device" },
			"Test Device",
		];
		if (withGroups) {
			definition.endpointGroups = {
				1: { label: "Output", endpoints: [0, 1] },
			};
		}

		await expect(lintConfigFiles()).rejects.toThrow("lint exited");

		expect(reportProblem).toHaveBeenCalledExactlyOnceWith({
			severity: "error",
			filename: "packages/config/config/devices/test.json",
			message:
				'Invalid firmware version "1.03" in a condition. Use x.y or x.y.z with integer components between 0 and 255 and no leading zeros.',
		});
	},
);

test.each(["01.3", "1.3.00", "256.0", "1.256", "1.0.256"])(
	"rejects invalid firmware version %s in a condition",
	async (version) => {
		definition.label = [
			{ $if: `firmwareVersion >= ${version}`, value: "Test Device" },
			"Test Device",
		];

		await expect(lintConfigFiles()).rejects.toThrow("lint exited");

		expect(reportProblem).toHaveBeenCalledExactlyOnceWith(
			expect.objectContaining({
				severity: "error",
				filename: "packages/config/config/devices/test.json",
				message: expect.stringContaining(
					`Invalid firmware version "${version}"`,
				),
			}),
		);
	},
);

test.each(["0.0", "1.3", "1.3.0", "255.255.255"])(
	"accepts valid firmware version %s in a condition",
	async (version) => {
		definition.label = [
			{ $if: `firmwareVersion >= ${version}`, value: "Test Device" },
			"Test Device",
		];

		await lintConfigFiles();

		expect(reportProblem).not.toHaveBeenCalled();
		expect(process.exit).not.toHaveBeenCalled();
	},
);

test("does not sample invalid firmware components between adjacent versions", async () => {
	definition.endpointGroups = {
		1: {
			$if: "firmwareVersion > 1.0.255",
			label: "Output",
			endpoints: [0, 1],
		},
		2: {
			$if: "firmwareVersion < 1.1",
			label: "Other Output",
			endpoints: [0, 2],
		},
	};

	await lintConfigFiles();

	expect(reportProblem).not.toHaveBeenCalled();
});

test("reports overlap for SDK version conditions", async () => {
	definition.endpointGroups = {
		1: {
			$if: "sdkVersion > 7.0",
			label: "Output",
			endpoints: [0, 1],
		},
		2: {
			$if: "sdkVersion < 7.1",
			label: "Other Output",
			endpoints: [0, 2],
		},
	};

	await expect(lintConfigFiles()).rejects.toThrow("lint exited");

	expect(reportProblem).toHaveBeenCalledWith(
		expect.objectContaining({
			severity: "error",
			filename: expect.stringContaining("SDK 7.0.1"),
			message: expect.stringContaining(
				"Endpoint 0 belongs to multiple active endpoint groups: 1 and 2",
			),
		}),
	);
});

test("reports invalid member indices through config parsing", async () => {
	definition.endpointGroups = {
		1: { label: "Output", endpoints: [1, 128] },
	};

	await expect(lintConfigFiles()).rejects.toThrow("lint exited");

	expect(reportProblem).toHaveBeenCalledExactlyOnceWith(
		expect.objectContaining({
			severity: "error",
			message: expect.stringContaining(
				"integer endpoint indices between 0 and 127",
			),
		}),
	);
});
