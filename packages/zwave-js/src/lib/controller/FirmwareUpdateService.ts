import {
	type Firmware,
	RFRegion,
	ZWaveError,
	ZWaveErrorCodes,
	digest,
	extractFirmware,
	guessFirmwareFileFormat,
} from "@zwave-js/core";
import {
	Bytes,
	ObjectKeyMap,
	type Timer,
	formatId,
	getenv,
	padVersion,
	setTimer,
} from "@zwave-js/shared";
import type { Options as KyOptions } from "ky";
import type PQueue from "p-queue";
import { getHttpClient } from "../driver/httpClient.js";
import type {
	FirmwareUpdateBulkInfo,
	FirmwareUpdateDeviceID,
	FirmwareUpdateFileInfo,
	FirmwareUpdateInfo,
} from "./_Types.js";

function serviceURL(): string {
	return getenv("ZWAVEJS_FW_SERVICE_URL") || "https://firmware.zwave-js.io";
}
const DOWNLOAD_TIMEOUT = 60000;
const CHECK_TIMEOUT = 30000; // The initial check after releasing new updates can be pretty slow. Give it some time.
// const MAX_FIRMWARE_SIZE = 10 * 1024 * 1024; // 10MB should be enough for any conceivable Z-Wave chip

const MAX_CACHE_SECONDS = 60 * 60 * 24; // Cache for a day at max
const CLEAN_CACHE_INTERVAL_MS = 60 * 60 * 1000; // Remove stale entries from the cache every hour

// Cache for individual device firmware updates
const deviceFirmwareCache = new ObjectKeyMap<
	FirmwareUpdateDeviceID,
	CachedDeviceResponse
>();
interface CachedDeviceResponse {
	updates: FirmwareUpdateInfo[];
	staleDate: number;
}

// Queue requests to the firmware update service. Only allow few parallel requests so we can make some use of the cache.
let requestQueue: PQueue | undefined;

let cleanCacheTimeout: Timer | undefined;
function cleanCache() {
	cleanCacheTimeout?.clear();
	cleanCacheTimeout = undefined;

	const now = Date.now();
	for (const [deviceKey, cached] of deviceFirmwareCache) {
		if (cached.staleDate < now) {
			deviceFirmwareCache.delete(deviceKey);
		}
	}

	if (deviceFirmwareCache.size > 0) {
		cleanCacheTimeout = setTimer(
			cleanCache,
			CLEAN_CACHE_INTERVAL_MS,
		).unref();
	}
}

/** Calculates cache expiry time based on response headers */
function calculateCacheExpiry(response: Response): number {
	// Check if we can cache the response
	if (response.status === 200 && response.headers.has("cache-control")) {
		const cacheControl = response.headers.get("cache-control")!;
		const age = response.headers.get("age");
		const date = response.headers.get("date");

		let maxAge: number | undefined;
		const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
		if (maxAgeMatch) {
			maxAge = Math.max(0, parseInt(maxAgeMatch[1], 10));
		}

		if (maxAge) {
			let currentAge: number;
			if (age) {
				currentAge = parseInt(age, 10);
			} else if (date) {
				currentAge = (Date.now() - Date.parse(date)) / 1000;
			} else {
				currentAge = 0;
			}
			currentAge = Math.max(0, currentAge);

			if (maxAge > currentAge) {
				return Date.now()
					+ Math.min(MAX_CACHE_SECONDS, maxAge - currentAge) * 1000;
			}
		}
	}

	// Default fallback cache duration
	return Date.now() + (MAX_CACHE_SECONDS * 1000);
}

async function makeRequest<T>(
	url: string,
	config: KyOptions,
): Promise<{ data: T; expiry: number }> {
	const ky = await getHttpClient();
	const response = await ky(url, config);
	const responseJson = await response.json<T>();

	return { data: responseJson, expiry: calculateCacheExpiry(response) };
}

function hasExtension(pathname: string): boolean {
	return /\.[a-z0-9_]+$/i.test(pathname);
}

export interface GetAvailableFirmwareUpdateOptions {
	userAgent: string;
	apiKey?: string;
}

export interface GetAvailableFirmwareUpdateBulkOptions
	extends GetAvailableFirmwareUpdateOptions
{
	rfRegion?: RFRegion;
}

/** Converts the RF region to a format the update service understands */
function rfRegionToUpdateServiceRegion(
	rfRegion?: RFRegion,
): string | undefined {
	switch (rfRegion) {
		case RFRegion.Europe:
		case RFRegion["Europe (Long Range)"]:
			return "europe";
		case RFRegion.USA:
		case RFRegion["USA (Long Range)"]:
			return "usa";
		case RFRegion["Australia/New Zealand"]:
			return "australia/new zealand";
		case RFRegion["Hong Kong"]:
			return "hong kong";
		case RFRegion.India:
			return "india";
		case RFRegion.Israel:
			return "israel";
		case RFRegion.Russia:
			return "russia";
		case RFRegion.China:
			return "china";
		case RFRegion.Japan:
			return "japan";
		case RFRegion.Korea:
			return "korea";
	}
}

/**
 * Retrieves the available firmware updates for multiple devices in a single request.
 * Returns a map of device keys to their respective firmware update information.
 * Devices missing from the returned map are not known to the firmware update service.
 */
export async function getAvailableFirmwareUpdatesBulk(
	deviceIds: FirmwareUpdateDeviceID[],
	options: GetAvailableFirmwareUpdateBulkOptions,
): Promise<ObjectKeyMap<FirmwareUpdateDeviceID, FirmwareUpdateInfo[]>> {
	// Remove duplicates based on device fingerprint
	const uniqueDeviceIds = deviceIds.filter(
		(device, index) =>
			index
				=== deviceIds.findIndex((d) =>
					d.manufacturerId === device.manufacturerId
					&& d.productType === device.productType
					&& d.productId === device.productId
					&& d.firmwareVersion === device.firmwareVersion
				),
	);

	const now = Date.now();
	const freshDevices: FirmwareUpdateDeviceID[] = [];
	const staleDevices: FirmwareUpdateDeviceID[] = [];

	// Split devices into those with fresh cache and those needing updates
	for (const device of uniqueDeviceIds) {
		const cached = deviceFirmwareCache.get(device);
		if (cached && cached.staleDate > now) {
			freshDevices.push(device);
		} else {
			staleDevices.push(device);
		}
	}

	// If we have devices with stale cache, make a request for them
	if (staleDevices.length > 0) {
		const headers = new Headers({
			"User-Agent": options.userAgent,
			"Content-Type": "application/json",
		});
		if (options.apiKey) {
			headers.set("X-API-Key", options.apiKey);
		}

		const body: Record<string, any> = {
			devices: staleDevices.map((device) => ({
				manufacturerId: formatId(device.manufacturerId),
				productType: formatId(device.productType),
				productId: formatId(device.productId),
				firmwareVersion: device.firmwareVersion,
			})),
		};

		const rfRegion = rfRegionToUpdateServiceRegion(options.rfRegion);
		if (rfRegion) {
			body.region = rfRegion;
		}

		const url = `${serviceURL()}/api/v4/updates`;
		const config: KyOptions = {
			method: "POST",
			json: body,
			headers,
			timeout: CHECK_TIMEOUT,
		};

		if (!requestQueue) {
			// I just love ESM
			const PQueue = (await import("p-queue")).default;
			requestQueue = new PQueue({ concurrency: 2 });
		}

		const requestResult = await requestQueue.add(() =>
			makeRequest<FirmwareUpdateBulkInfo[]>(url, config)
		);
		const { data: result, expiry } = requestResult!;

		for (const deviceResponse of result) {
			// Find the original device info to get the RF region
			const originalDevice = staleDevices.find(
				(device) =>
					formatId(device.manufacturerId)
						=== deviceResponse.manufacturerId
					&& formatId(device.productType)
						=== deviceResponse.productType
					&& formatId(device.productId) === deviceResponse.productId
					&& padVersion(device.firmwareVersion)
						=== padVersion(deviceResponse.firmwareVersion),
			);

			if (originalDevice) {
				const updates: FirmwareUpdateInfo[] = deviceResponse.updates
					.map(
						(update) => ({
							device: originalDevice,
							...update,
							channel: update.channel ?? "stable",
						}),
					);

				deviceFirmwareCache.set(originalDevice, {
					updates,
					staleDate: expiry,
				});
			}
		}
	}

	// Build the final result map with all requested devices that have updates
	const ret = new ObjectKeyMap<
		FirmwareUpdateDeviceID,
		FirmwareUpdateInfo[]
	>();
	for (const deviceId of uniqueDeviceIds) {
		const updates = deviceFirmwareCache.get(deviceId)?.updates;
		if (updates) {
			ret.set(deviceId, updates);
		}
	}

	// Regularly clean the cache
	if (!cleanCacheTimeout) {
		cleanCacheTimeout = setTimer(
			cleanCache,
			CLEAN_CACHE_INTERVAL_MS,
		).unref();
	}

	return ret;
}

/**
 * Retrieves the available firmware updates for the node with the given fingerprint.
 * Return an empty array if no updates are available or the device is not known to the firmware update service.
 */
export async function getAvailableFirmwareUpdates(
	deviceId: FirmwareUpdateDeviceID,
	options: GetAvailableFirmwareUpdateOptions,
): Promise<FirmwareUpdateInfo[]> {
	// Use the bulk function for a single device
	const bulkResult = await getAvailableFirmwareUpdatesBulk(
		[deviceId],
		options,
	);
	return bulkResult.get(deviceId) || [];
}

export async function downloadFirmwareUpdate(
	file: FirmwareUpdateFileInfo,
): Promise<Firmware> {
	const [hashAlgorithm, expectedHash] = file.integrity.split(":", 2);

	if (hashAlgorithm !== "sha256") {
		throw new ZWaveError(
			`Unsupported hash algorithm ${hashAlgorithm} for integrity check`,
			ZWaveErrorCodes.Argument_Invalid,
		);
	}
	// TODO: Make request abort-able (requires AbortController, Node 14.17+ / Node 16)

	// Download the firmware file
	const ky = await getHttpClient();
	const downloadResponse = await ky.get(file.url, {
		timeout: DOWNLOAD_TIMEOUT,
		// TODO: figure out how to do maxContentLength: MAX_FIRMWARE_SIZE,
	});

	const rawData = new Uint8Array(await downloadResponse.arrayBuffer());

	const requestedPathname = new URL(file.url).pathname;
	// The response may be redirected, so the filename information may be different
	// from the requested URL
	let actualPathname: string | undefined;
	try {
		actualPathname = new URL(downloadResponse.url).pathname;
	} catch {
		// ignore
	}

	// Infer the file type from the content-disposition header or the filename
	let filename: string;
	const contentDisposition = downloadResponse.headers.get(
		"content-disposition",
	);
	if (
		contentDisposition?.startsWith(
			"attachment; filename=",
		)
	) {
		filename = contentDisposition
			.split("filename=")[1]
			.replace(/^"/, "")
			.replace(/[";]$/, "");
	} else if (actualPathname && hasExtension(actualPathname)) {
		filename = actualPathname;
	} else {
		filename = requestedPathname;
	}

	// Extract the raw data
	const format = guessFirmwareFileFormat(filename, rawData);
	const firmware = await extractFirmware(rawData, format);

	// Ensure the hash matches
	const actualHash = Bytes.view(
		await digest("sha-256", firmware.data),
	).toString("hex");

	if (actualHash !== expectedHash) {
		throw new ZWaveError(
			`Integrity check failed. Expected hash ${expectedHash}, got ${actualHash}`,
			ZWaveErrorCodes.FWUpdateService_IntegrityCheckFailed,
		);
	}

	return {
		data: firmware.data,
		// Don't trust the guessed firmware target, use the one from the provided info
		firmwareTarget: file.target,
	};
}
