// oxlint-disable

/**
 * Discovers device config files for multi-endpoint Z-Wave devices that do not
 * yet define endpoint labels. Uses the OpenSmartHouse DB as the data source,
 * since endpoint counts are only known at runtime (discovered via Multi Channel
 * CC 0x60) and are not stored in the local config files.
 *
 * Usage:
 *   yarn config:find-multi-endpoints             (uses cached .tmpoh data)
 *   yarn config:find-multi-endpoints --download  (downloads OH data first)
 *
 * Output: ranked JSON array to stdout, progress/errors to stderr.
 * Pipe through `jq` for formatted display, e.g.:
 *   yarn config:find-multi-endpoints | jq '.[] | {configFilePath, endpointCount, label}'
 */

import { formatId } from "@zwave-js/shared";
import JSON5 from "json5";
import fs from "node:fs/promises";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { ConfigManager } from "../src/ConfigManager.js";
import type { DeviceConfigIndexEntry } from "../src/devices/DeviceConfig.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Mirrors paths used in importConfig.ts
const processedDir = path.join(
	__dirname,
	"../../../packages/config",
	"config/devices",
);
const ohTempDir = path.join(__dirname, "../../../.tmpoh");

// OpenSmartHouse API URLs — mirrors importConfig.ts
const ohUrlIDs =
	"https://opensmarthouse.org/dmxConnect/api/zwavedatabase/device/list.php?filter=&manufacturer=-1&limit=100000";
const ohUrlDevice = (id: number) =>
	`https://opensmarthouse.org/dmxConnect/api/zwavedatabase/device/read.php?device_id=${id}`;

/** Retrieves the list of device IDs from the OpenSmartHouse DB */
async function fetchIDsOH(): Promise<number[]> {
	const { default: ky } = await import("ky");
	const data = (await ky.get(ohUrlIDs).json()) as any;
	return data.devices.map((d: any) => d.id);
}

/** Fetches one device from the OpenSmartHouse DB and writes it to the cache */
async function fetchAndStoreDeviceOH(id: number): Promise<void> {
	const { default: ky } = await import("ky");
	const source = await ky.get(ohUrlDevice(id)).json();
	await fs.writeFile(
		path.join(ohTempDir, `${id}.json`),
		JSON.stringify(source, null, "\t"),
		"utf8",
	);
}

/** Downloads all device information from the OpenSmartHouse DB into .tmpoh */
async function downloadDevicesOH(IDs?: number[]): Promise<void> {
	if (!IDs?.length) {
		process.stderr.write("Fetching database IDs...");
		IDs = await fetchIDsOH();
		process.stderr.write("\r\x1b[K");
	}
	await fs.mkdir(ohTempDir, { recursive: true });
	for (let i = 0; i < IDs.length; i++) {
		process.stderr.write(
			`Fetching device config ${i + 1} of ${IDs.length}...`,
		);
		await fetchAndStoreDeviceOH(IDs[i]);
		process.stderr.write("\r\x1b[K");
	}
	process.stderr.write("Download complete!\n");
}

export interface EndpointInfo {
	/** Endpoint number (1-based; 0 = root, excluded from results) */
	number: number;
	/** Generic device class ID from the OH database */
	genericClassId: number | null;
	/** Generic device class name from the OH database, e.g. "GENERIC_TYPE_SWITCH_BINARY" */
	genericClassName: string | null;
	/** Specific device class ID from the OH database */
	specificClassId: number | null;
	/** Specific device class name from the OH database */
	specificClassName: string | null;
}

export interface MultiEndpointCandidate {
	/** Relative path from the repo root to the config file */
	configFilePath: string;
	/** Device manufacturer name */
	manufacturer: string;
	/** Device model label */
	label: string;
	manufacturerId: string;
	productType: string;
	productId: string;
	/** Number of non-root endpoints reported by the OH database */
	endpointCount: number;
	/** Per-endpoint device class information from the OH database */
	endpoints: EndpointInfo[];
	/** URL to a device manual or product page from the OH documents list, if available */
	manualUrl: string | null;
	/**
	 * True when the existing config has root-level associations.
	 * Adding an endpoints block to such a file requires migrating the root
	 * associations under endpoints["0"] — flag for human review instead of
	 * auto-applying.
	 */
	hasRootAssociations: boolean;
}

async function main() {
	const args = process.argv.slice(2);
	const shouldDownload = args.includes("--download") || args.includes("-D");

	const configManager = new ConfigManager();
	process.stderr.write("Loading device config index...");
	await configManager.loadDeviceIndex();
	process.stderr.write("\r\x1b[K");

	if (shouldDownload) {
		await downloadDevicesOH();
	}

	let ohFiles: string[] = [];
	try {
		const files = await fs.readdir(ohTempDir);
		ohFiles = files.filter(
			(f) => f.endsWith(".json") && f !== "manufacturers.json",
		);
	} catch {
		// Directory does not exist
	}

	if (!ohFiles.length) {
		process.stderr.write(
			"No OpenSmartHouse cache found. Populate it first:\n"
				+ "  yarn config:find-multi-endpoints --download\n"
				+ "Or use the import script:\n"
				+ "  yarn config -s oh -D\n",
		);
		process.exit(1);
	}

	process.stderr.write(
		`Scanning ${ohFiles.length} cached OH device files...\n`,
	);

	const candidates: MultiEndpointCandidate[] = [];
	const seenConfigPaths = new Set<string>();

	for (const file of ohFiles) {
		const content = await fs.readFile(
			path.join(ohTempDir, file),
			"utf8",
		);
		let json: any;
		try {
			json = JSON.parse(content);
		} catch {
			continue;
		}

		// Identify non-root endpoints; number field may be int or string
		const allEndpoints: any[] = json.endpoints ?? [];
		const nonRootEndpoints = allEndpoints.filter(
			(ep) => ep.number !== 0 && ep.number !== "0",
		);
		if (!nonRootEndpoints.length) continue;

		const manufacturerId = formatId(json.manufacturer?.reference ?? 0);
		const deviceRefs: string[] = (json.device_ref ?? "")
			.split(",")
			.map((r: string) => r.trim())
			.filter(Boolean);

		for (const ref of deviceRefs) {
			const parts = ref.split(":");
			if (parts.length !== 2) continue;
			const productType = formatId(parts[0]);
			const productId = formatId(parts[1]);

			// Find the matching config entry in the local index
			const match = configManager
				.getIndex()
				?.find(
					(e: DeviceConfigIndexEntry) =>
						e.manufacturerId === manufacturerId
						&& e.productType === productType
						&& e.productId === productId,
				);
			if (!match) continue;

			const relativeConfigPath = path.join(
				"packages/config/config/devices",
				match.filename,
			);
			// Multiple OH device refs may resolve to the same config file
			if (seenConfigPaths.has(relativeConfigPath)) continue;
			seenConfigPaths.add(relativeConfigPath);

			// Read and parse the existing config to check for an endpoints block
			const absoluteConfigPath = path.join(processedDir, match.filename);
			const configContent = await fs.readFile(
				absoluteConfigPath,
				"utf8",
			).catch(() => null);
			if (!configContent) continue;

			let parsedConfig: any;
			try {
				parsedConfig = JSON5.parse(configContent);
			} catch {
				continue;
			}

			// Skip configs that already have an endpoints block
			if (parsedConfig.endpoints) continue;

			const endpointInfos: EndpointInfo[] = nonRootEndpoints.map(
				(ep) => ({
					number: typeof ep.number === "string"
						? parseInt(ep.number, 10)
						: (ep.number as number),
					genericClassId: ep.generic_class?.id ?? null,
					genericClassName: ep.generic_class?.name ?? null,
					specificClassId: ep.specific_class?.id ?? null,
					specificClassName: ep.specific_class?.name ?? null,
				}),
			);

			// Prefer manual-type documents (type_id 2) for the documentation URL
			const docs: any[] = json.documents ?? [];
			const manualUrl = docs.find(
				(d) =>
					String(d.type_id) === "2"
					|| d.type?.label === "Manual",
			)?.url
				?? docs[0]?.url
				?? null;

			const hasRootAssociations = !!parsedConfig.associations
				&& Object.keys(parsedConfig.associations).length > 0;

			candidates.push({
				configFilePath: relativeConfigPath,
				manufacturer: json.manufacturer?.label ?? "",
				label: json.label ?? "",
				manufacturerId,
				productType,
				productId,
				endpointCount: nonRootEndpoints.length,
				endpoints: endpointInfos,
				manualUrl,
				hasRootAssociations,
			});
		}
	}

	// Rank by endpoint count descending, then by endpoint class diversity descending
	candidates.sort((a, b) => {
		if (b.endpointCount !== a.endpointCount) {
			return b.endpointCount - a.endpointCount;
		}
		const diversityA = new Set(
			a.endpoints.map((e) => e.genericClassId),
		).size;
		const diversityB = new Set(
			b.endpoints.map((e) => e.genericClassId),
		).size;
		return diversityB - diversityA;
	});

	// Emit the ranked candidate list as JSON for piping / post-processing
	console.log(JSON.stringify(candidates, null, 2));
	process.stderr.write(
		`\nFound ${candidates.length} multi-endpoint devices without endpoint labels.\n`,
	);
}

void main().catch((e: unknown) => {
	console.error(e);
	process.exit(1);
});
