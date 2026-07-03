import { type AddressInfo } from "node:net";
import { afterAll, beforeAll, beforeEach, test } from "vitest";
import { getAvailableFirmwareUpdatesBulk } from "./FirmwareUpdateService.js";
import type {
	FirmwareUpdateBulkInfo,
	FirmwareUpdateDeviceID,
} from "./_Types.js";

// Mock update service. Devices with productId 0x0001 are known and have one
// update, all others are unknown and get omitted from the response
let requestCount = 0;
let requestedDevices: any[][] = [];
let server: import("node:http").Server;

beforeAll(async () => {
	const { createServer } = await import("node:http");
	server = createServer((req, res) => {
		let body = "";
		req.on("data", (chunk) => (body += chunk));
		req.on("end", () => {
			requestCount++;
			const { devices } = JSON.parse(body);
			requestedDevices.push(devices);

			const response: FirmwareUpdateBulkInfo[] = devices
				.filter((d: any) => d.productId === "0x0001")
				.map((d: any) => ({
					manufacturerId: d.manufacturerId,
					productType: d.productType,
					productId: d.productId,
					firmwareVersion: d.firmwareVersion + ".0",
					updates: [
						{
							version: "2.0.0",
							changelog: "Fixes everything",
							channel: "stable",
							files: [
								{
									target: 0,
									url: "https://example.com/firmware.gbl",
									integrity: "sha256:abcd",
								},
							],
							downgrade: false,
							normalizedVersion: "2.0.0",
						},
					],
				}));

			res.setHeader("content-type", "application/json");
			res.end(JSON.stringify(response));
		});
	});
	await new Promise<void>((resolve) => server.listen(0, resolve));
	process.env.ZWAVEJS_FW_SERVICE_URL = `http://127.0.0.1:${
		(server.address() as AddressInfo).port
	}`;
});

afterAll(async () => {
	delete process.env.ZWAVEJS_FW_SERVICE_URL;
	await new Promise((resolve) => server.close(resolve));
});

beforeEach(() => {
	requestCount = 0;
	requestedDevices = [];
});

const options = { userAgent: "test" };

// The device cache is module state and persists across tests,
// so each test must use a unique manufacturerId
function testDevices(manufacturerId: number): {
	known: FirmwareUpdateDeviceID;
	unknown: FirmwareUpdateDeviceID;
} {
	return {
		known: {
			manufacturerId,
			productType: 0x0001,
			productId: 0x0001,
			firmwareVersion: "1.0",
		},
		unknown: {
			manufacturerId,
			productType: 0x0001,
			productId: 0x0002,
			firmwareVersion: "1.0",
		},
	};
}

test("updates for known devices are returned and cached", async (t) => {
	const { known } = testDevices(0x0001);

	const result1 = await getAvailableFirmwareUpdatesBulk([known], options);
	t.expect(result1.get(known)?.map((u) => u.version)).toStrictEqual([
		"2.0.0",
	]);

	// The second call must be answered from the cache
	const result2 = await getAvailableFirmwareUpdatesBulk([known], options);
	t.expect(result2.get(known)?.map((u) => u.version)).toStrictEqual([
		"2.0.0",
	]);
	t.expect(requestCount).toBe(1);
});

test("devices unknown to the service are not re-requested", async (t) => {
	const { known, unknown } = testDevices(0x0002);

	const result1 = await getAvailableFirmwareUpdatesBulk(
		[known, unknown],
		options,
	);
	t.expect(result1.has(known)).toBe(true);
	t.expect(result1.has(unknown)).toBe(false);
	t.expect(requestCount).toBe(1);

	// The unknown device was omitted from the response, but must still be
	// cached, so subsequent calls do not cause another request
	const result2 = await getAvailableFirmwareUpdatesBulk(
		[known, unknown],
		options,
	);
	t.expect(result2.has(known)).toBe(true);
	t.expect(result2.has(unknown)).toBe(false);
	t.expect(requestCount).toBe(1);
});

test("concurrent calls for the same devices share a single request", async (t) => {
	const { known, unknown } = testDevices(0x0003);

	const [result1, result2] = await Promise.all([
		getAvailableFirmwareUpdatesBulk([known, unknown], options),
		getAvailableFirmwareUpdatesBulk([known, unknown], options),
	]);
	t.expect(result1.has(known)).toBe(true);
	t.expect(result2.has(known)).toBe(true);
	t.expect(requestCount).toBe(1);
});

test("only stale devices are re-requested", async (t) => {
	const { known, unknown } = testDevices(0x0004);

	await getAvailableFirmwareUpdatesBulk([known], options);
	t.expect(requestedDevices[0]).toHaveLength(1);

	// The known device is cached, so only the unknown one may be requested
	await getAvailableFirmwareUpdatesBulk([known, unknown], options);
	t.expect(requestCount).toBe(2);
	t.expect(requestedDevices[1]).toHaveLength(1);
	t.expect(requestedDevices[1][0].productId).toBe("0x0002");
});
