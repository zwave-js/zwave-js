import { CommandClasses } from "@zwave-js/core";
import { Bytes, isUint8Array } from "@zwave-js/shared";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, test } from "vitest";
import { ConfigManager } from "../ConfigManager.js";
import type { DeviceConfig } from "./DeviceConfig.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let configManager: ConfigManager;
let testConfig: DeviceConfig;
let proprietaryConfig: DeviceConfig;

beforeAll(async (t) => {
	configManager = new ConfigManager({
		deviceConfigPriorityDir: path.join(__dirname, "__fixtures/hash"),
	});

	testConfig = (await configManager.lookupDevice(
		0xffff,
		0xcafe,
		0xbeef,
		"1.0",
	))!;

	proprietaryConfig = (await configManager.lookupDevice(
		0xffff,
		0xdead,
		0xbeef,
		"1.0",
	))!;
});

test(
	"hash() works",
	async (t) => {
		t.expect(testConfig).toBeDefined();

		const hash = await testConfig.getHash();
		t.expect(isUint8Array(hash)).toBe(true);
	},
	// This test might take a while
	60000,
);

test(
	"hash() changes when changing a parameter info",
	async (t) => {
		t.expect(testConfig).toBeDefined();

		const hash1 = await testConfig.getHash();

		// @ts-expect-error
		testConfig.paramInformation!.get({ parameter: 2 })!.unit = "lightyears";
		const hash2 = await testConfig.getHash();

		t.expect(hash1).not.toStrictEqual(hash2);
	},
	// This test might take a while
	60000,
);

test(
	"hash() changes when removing a CC",
	async (t) => {
		t.expect(testConfig).toBeDefined();

		const hash1 = await testConfig.getHash();

		const removeCCs = new Map();
		removeCCs.set(CommandClasses["All Switch"], "*");
		// @ts-expect-error
		testConfig.compat!.removeCCs = removeCCs;

		const hash2 = await testConfig.getHash();

		t.expect(hash1).not.toStrictEqual(hash2);
	},
	// This test might take a while
	60000,
);

test(
	"hash() does not crash for devices with a proprietary field",
	async (t) => {
		t.expect(proprietaryConfig).toBeDefined();

		proprietaryConfig.getHash();
	},
	// This test might take a while
	60000,
);

test(
	"hash() includes no prefix for version 0",
	async (t) => {
		t.expect(testConfig).toBeDefined();

		const hash = await testConfig.getHash(0);
		const hashString = Bytes.view(hash).toString("utf8");
		t.expect(hashString.startsWith("$v0$")).toBe(false);
	},
	// This test might take a while
	60000,
);

test(
	"hash() includes no prefix for version 1",
	async (t) => {
		t.expect(testConfig).toBeDefined();

		const hash = await testConfig.getHash(1);
		const hashString = Bytes.view(hash).toString("utf8");
		t.expect(hashString.startsWith("$v1$")).toBe(false);
	},
	// This test might take a while
	60000,
);

test(
	"hash() produces different hashes for different algorithms",
	async (t) => {
		t.expect(testConfig).toBeDefined();

		const md5Hash = await testConfig.getHash(0);
		const sha256Hash = await testConfig.getHash(1);

		// Different algorithms should produce different hashes
		t.expect(md5Hash).not.toStrictEqual(sha256Hash);
	},
	// This test might take a while
	60000,
);
