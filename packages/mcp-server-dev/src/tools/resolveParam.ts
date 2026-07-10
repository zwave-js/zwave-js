import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import {
	DeviceConfig,
	clearTemplateCache,
	readJsonWithTemplate,
} from "@zwave-js/config";
import { tryParseParamNumber } from "@zwave-js/core";
import { num2hex } from "@zwave-js/shared";
import { parse as parseJsonC } from "jsonc-parser";
import { readFile } from "node:fs/promises";
import { DEVICES_DIR, fs } from "../configEnv.js";
import type { ToolHandler } from "../types.js";
import { errorResult, jsonResult } from "./results.js";

export const TOOL_NAME = "resolve_config_param";

interface ResolveConfigParamArgs {
	filename: string;
	parameter: number;
	valueBitMask?: number;
	firmwareVersion?: string;
}

function paramLabel(parameter: number, valueBitMask?: number): string {
	return `#${parameter}${
		valueBitMask != undefined ? ` [${num2hex(valueBitMask)}]` : ""
	}`;
}

/**
 * Resolves templates AND evaluates $if conditionals for the given firmware,
 * returning every matching parameter variant. The device IDs are plain
 * top-level fields, so they are read from the raw JSON instead of resolving
 * templates a second time before DeviceConfig.from.
 */
export async function resolveParamsForFirmware(
	filename: string,
	parameter: number,
	valueBitMask: number | undefined,
	firmwareVersion: string,
) {
	const raw = parseJsonC(await readFile(filename, "utf8"));
	const firstDevice = (raw?.devices as any[] | undefined)?.[0];
	const deviceId = {
		manufacturerId: Number(raw?.manufacturerId),
		productType: Number(firstDevice?.productType),
		productId: Number(firstDevice?.productId),
		firmwareVersion,
	};
	const config = await DeviceConfig.from(fs, filename, true, {
		rootDir: DEVICES_DIR,
		deviceId,
	});
	return [...(config.paramInformation?.values() ?? [])]
		.filter((p) =>
			p.parameterNumber === parameter
			&& (valueBitMask == undefined || p.valueBitMask === valueBitMask)
		);
}

async function handleResolveConfigParam(
	args: ResolveConfigParamArgs,
): Promise<CallToolResult> {
	const { filename, parameter, valueBitMask, firmwareVersion } = args;

	if (!filename) return errorResult("Error: filename argument is required");
	if (typeof parameter !== "number") {
		return errorResult("Error: parameter (number) argument is required");
	}

	// Read files fresh so edits between calls are not served from the cache
	clearTemplateCache();

	try {
		if (firmwareVersion != undefined) {
			const matches = await resolveParamsForFirmware(
				filename,
				parameter,
				valueBitMask,
				firmwareVersion,
			);
			if (matches.length === 0) {
				return errorResult(
					`No parameter ${
						paramLabel(parameter, valueBitMask)
					} found in ${filename} for firmware ${firmwareVersion}.`,
				);
			}
			return jsonResult(matches.length === 1 ? matches[0] : matches);
		} else {
			// Templates only, conditionals preserved (matches the editor preview)
			const json = await readJsonWithTemplate(fs, filename, DEVICES_DIR);
			const params = json.paramInformation;
			if (!Array.isArray(params)) {
				return errorResult(
					`${filename} has no paramInformation array.`,
				);
			}
			const matches = params.filter((p) => {
				if (typeof p !== "object" || p === null) return false;
				const key = (p as Record<string, unknown>)["#"];
				if (typeof key !== "string") return false;
				const parsed = tryParseParamNumber(key);
				return parsed?.parameter === parameter
					&& (valueBitMask == undefined
						|| parsed.valueBitMask === valueBitMask);
			});
			if (matches.length === 0) {
				return errorResult(
					`No parameter ${
						paramLabel(parameter, valueBitMask)
					} found in ${filename}.`,
				);
			}
			return jsonResult(matches.length === 1 ? matches[0] : matches);
		}
	} catch (error: any) {
		return errorResult(`Failed to resolve parameter: ${String(error)}`);
	}
}

export const resolveParamTool: ToolHandler<ResolveConfigParamArgs> = {
	name: TOOL_NAME,
	description:
		"Resolve a device config parameter to its canonical JSON, with all "
		+ "$import templates applied. By default conditionals ($if) are kept "
		+ "as-is (matching the config editor preview); pass firmwareVersion to "
		+ "fully evaluate conditionals for a specific firmware. Returns all "
		+ "matching parameter variants when more than one exists.",
	inputSchema: {
		type: "object",
		properties: {
			filename: {
				type: "string",
				description: "Absolute path to the device config file",
			},
			parameter: {
				type: "number",
				description: "The parameter number to resolve",
			},
			valueBitMask: {
				type: "number",
				description:
					"Optional value bitmask for partial parameters (as a number, "
					+ "e.g. 255 for 0xff)",
			},
			firmwareVersion: {
				type: "string",
				description:
					"Optional firmware version (e.g. \"1.5\") to fully evaluate "
					+ "$if conditionals instead of preserving them",
			},
		},
		required: ["filename", "parameter"],
	},
	handler: handleResolveConfigParam,
};
