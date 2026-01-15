/* oxlint-disable typescript/no-unnecessary-type-assertion */
import { type AllowedConfigValue, tryParseParamNumber } from "@zwave-js/core";
import {
	type JSONObject,
	ObjectKeyMap,
	type ReadonlyObjectKeyMap,
	pick,
} from "@zwave-js/shared";
import { isArray, isObject } from "alcalzone-shared/typeguards";
import { throwInvalidConfig } from "../utils_safe.js";
import {
	type ConditionalItem,
	conditionApplies,
	evaluateDeep,
	validateCondition,
} from "./ConditionalItem.js";
import type { ConditionalDeviceConfig } from "./DeviceConfig.js";
import type { DeviceID } from "./shared.js";

export class ConditionalParamInformation
	implements ConditionalItem<ParamInformation>
{
	public constructor(
		parent: ConditionalDeviceConfig,
		parameterNumber: number,
		valueBitMask: number | undefined,
		definition: JSONObject,
	) {
		this.parent = parent;
		this.parameterNumber = parameterNumber;
		this.valueBitMask = valueBitMask;
		// No need to validate here, this should be done one level higher
		this.condition = definition.$if;

		if (typeof definition.label !== "string") {
			throwInvalidConfig(
				"devices",
				`packages/config/config/devices/${parent.filename}:
Parameter #${parameterNumber} has a non-string label`,
			);
		}
		this.label = definition.label;

		if (
			definition.description != undefined
			&& typeof definition.description !== "string"
		) {
			throwInvalidConfig(
				"devices",
				`packages/config/config/devices/${parent.filename}:
Parameter #${parameterNumber} has a non-string description`,
			);
		}
		this.description = definition.description;

		if (
			typeof definition.valueSize !== "number"
			|| definition.valueSize <= 0
		) {
			throwInvalidConfig(
				"devices",
				`packages/config/config/devices/${parent.filename}:
Parameter #${parameterNumber} has an invalid value size`,
			);
		}
		this.valueSize = definition.valueSize;

		if (
			definition.minValue != undefined
			&& typeof definition.minValue !== "number"
		) {
			throwInvalidConfig(
				"devices",
				`packages/config/config/devices/${parent.filename}:
Parameter #${parameterNumber} has a non-numeric property minValue`,
			);
		}
		this.minValue = definition.minValue;

		if (
			definition.maxValue != undefined
			&& typeof definition.maxValue !== "number"
		) {
			throwInvalidConfig(
				"devices",
				`packages/config/config/devices/${parent.filename}:
Parameter #${parameterNumber} has a non-numeric property maxValue`,
			);
		}
		this.maxValue = definition.maxValue;

		if (
			definition.unsigned != undefined
			&& typeof definition.unsigned !== "boolean"
		) {
			throwInvalidConfig(
				"devices",
				`packages/config/config/devices/${parent.filename}:
Parameter #${parameterNumber} has a non-boolean property unsigned`,
			);
		}
		this.unsigned = definition.unsigned === true;

		if (
			definition.unit != undefined
			&& typeof definition.unit !== "string"
		) {
			throwInvalidConfig(
				"devices",
				`packages/config/config/devices/${parent.filename}:
Parameter #${parameterNumber} has a non-string unit`,
			);
		}
		this.unit = definition.unit;

		if (definition.readOnly != undefined && definition.readOnly !== true) {
			throwInvalidConfig(
				"devices",
				`packages/config/config/devices/${parent.filename}:
		Parameter #${parameterNumber}: readOnly must true or omitted!`,
			);
		}
		this.readOnly = definition.readOnly;

		if (
			definition.writeOnly != undefined
			&& definition.writeOnly !== true
		) {
			throwInvalidConfig(
				"devices",
				`packages/config/config/devices/${parent.filename}:
		Parameter #${parameterNumber}: writeOnly must be true or omitted!`,
			);
		}
		this.writeOnly = definition.writeOnly;

		if (definition.defaultValue == undefined) {
			if (!this.readOnly) {
				throwInvalidConfig(
					"devices",
					`packages/config/config/devices/${parent.filename}:
Parameter #${parameterNumber} is missing defaultValue, which is required unless the parameter is readOnly`,
				);
			}
		} else if (typeof definition.defaultValue !== "number") {
			throwInvalidConfig(
				"devices",
				`packages/config/config/devices/${parent.filename}:
Parameter #${parameterNumber} has a non-numeric property defaultValue`,
			);
		}
		this.defaultValue = definition.defaultValue;

		if (
			definition.recommendedValue != undefined
			&& typeof definition.recommendedValue !== "number"
		) {
			throwInvalidConfig(
				"devices",
				`packages/config/config/devices/${parent.filename}:
Parameter #${parameterNumber} has a non-numeric property recommendedValue`,
			);
		}
		this.recommendedValue = definition.recommendedValue;

		if (
			definition.allowManualEntry != undefined
			&& definition.allowManualEntry !== false
		) {
			throwInvalidConfig(
				"devices",
				`packages/config/config/devices/${parent.filename}:
Parameter #${parameterNumber}: allowManualEntry must be false or omitted!`,
			);
		}
		// Default to allowing manual entry, except if the param is readonly
		this.allowManualEntry = definition.allowManualEntry ?? !this.readOnly;

		if (
			definition.destructive != undefined
			&& typeof definition.destructive !== "boolean"
		) {
			throwInvalidConfig(
				"devices",
				`packages/config/config/devices/${parent.filename}:
Parameter #${parameterNumber} has a non-boolean property destructive`,
			);
		}
		this.destructive = definition.destructive;

		if (
			isArray(definition.options)
			&& !definition.options.every(
				(opt: unknown) =>
					isObject(opt)
					&& typeof opt.label === "string"
					&& typeof opt.value === "number",
			)
		) {
			throwInvalidConfig(
				"devices",
				`packages/config/config/devices/${parent.filename}:
Parameter #${parameterNumber}: options is malformed!`,
			);
		}

		this.options = definition.options?.map(
			(opt: any) =>
				new ConditionalConfigOption(opt.value, opt.label, opt.$if),
		) ?? [];

		if (
			definition.hidden != undefined
			&& typeof definition.hidden !== "boolean"
		) {
			throwInvalidConfig(
				"devices",
				`packages/config/config/devices/${parent.filename}:
Parameter #${parameterNumber} has a non-boolean property hidden`,
			);
		}
		this.hidden = definition.hidden;

		// Parse and validate the allowed field
		if (definition.allowed != undefined) {
			// Validate mutual exclusivity with minValue/maxValue
			if (this.minValue != undefined || this.maxValue != undefined) {
				throwInvalidConfig(
					"devices",
					`packages/config/config/devices/${parent.filename}:
Parameter #${parameterNumber}: "allowed" cannot be used together with "minValue" or "maxValue"!`,
				);
			}

			// Validate mutual exclusivity with allowManualEntry: false
			if (this.allowManualEntry === false) {
				throwInvalidConfig(
					"devices",
					`packages/config/config/devices/${parent.filename}:
Parameter #${parameterNumber}: "allowed" cannot be used with "allowManualEntry: false"!`,
				);
			}

			// Validate it's an array
			if (!isArray(definition.allowed)) {
				throwInvalidConfig(
					"devices",
					`packages/config/config/devices/${parent.filename}:
Parameter #${parameterNumber}: "allowed" must be an array!`,
				);
			}

			// Validate array is not empty
			if (definition.allowed.length === 0) {
				throwInvalidConfig(
					"devices",
					`packages/config/config/devices/${parent.filename}:
Parameter #${parameterNumber}: "allowed" array must contain at least one entry!`,
				);
			}

			// Parse each value definition
			const parsedValues: AllowedConfigValue[] = [];
			for (let i = 0; i < definition.allowed.length; i++) {
				const def = definition.allowed[i];

				if (!isObject(def)) {
					throwInvalidConfig(
						"devices",
						`packages/config/config/devices/${parent.filename}:
Parameter #${parameterNumber}: allowed[${i}] must be an object!`,
					);
				}

				// Check for single value
				if ("value" in def) {
					if (typeof def.value !== "number") {
						throwInvalidConfig(
							"devices",
							`packages/config/config/devices/${parent.filename}:
Parameter #${parameterNumber}: allowed[${i}].value must be a number!`,
						);
					}
					parsedValues.push({ value: def.value });
				} // Check for range
				else if ("range" in def) {
					if (!isArray(def.range)) {
						throwInvalidConfig(
							"devices",
							`packages/config/config/devices/${parent.filename}:
Parameter #${parameterNumber}: allowed[${i}].range must be an array!`,
						);
					}

					if (def.range.length !== 2) {
						throwInvalidConfig(
							"devices",
							`packages/config/config/devices/${parent.filename}:
Parameter #${parameterNumber}: allowed[${i}].range must have exactly 2 elements [from, to]!`,
						);
					}

					const [from, to] = def.range;
					const step = def.step;

					if (typeof from !== "number" || typeof to !== "number") {
						throwInvalidConfig(
							"devices",
							`packages/config/config/devices/${parent.filename}:
Parameter #${parameterNumber}: allowed[${i}].range elements must be numbers!`,
						);
					}

					if (step !== undefined && typeof step !== "number") {
						throwInvalidConfig(
							"devices",
							`packages/config/config/devices/${parent.filename}:
Parameter #${parameterNumber}: allowed[${i}].step must be a number if provided!`,
						);
					}

					parsedValues.push({
						from,
						to,
						...(step !== undefined && { step }),
					});
				} else {
					throwInvalidConfig(
						"devices",
						`packages/config/config/devices/${parent.filename}:
Parameter #${parameterNumber}: allowed[${i}] must have either "value" or "range" property!`,
					);
				}
			}

			this.allowed = parsedValues;
		}
	}

	// IMPORTANT: Changes to these properties can affect the device config hash,
	// which may prompt users to re-interview their devices.
	//
	// Whenever adding, removing or changing properties of this class,
	// make sure that these changes do not cause the hash to change unintentionally.
	// For example, adding a new optional property with a default value of `undefined`
	// is fine, unless the constructor always sets it to a concrete value.
	//
	// In all other case, make sure to increase the `maxHashVersion` in DeviceConfig.ts
	// and add appropriate, backwards-compatible handling for the new version
	// in `areHashesEqual`

	private parent: ConditionalDeviceConfig;
	public readonly parameterNumber: number;
	public readonly valueBitMask?: number;
	public readonly label: string;
	public readonly description?: string;
	public readonly valueSize: number;
	public readonly allowed?: readonly AllowedConfigValue[];
	public readonly minValue?: number;
	public readonly maxValue?: number;
	public readonly unsigned?: boolean;
	public readonly defaultValue: number;
	public readonly recommendedValue?: number;
	public readonly unit?: string;
	public readonly readOnly?: true;
	public readonly writeOnly?: true;
	public readonly allowManualEntry: boolean;
	public readonly destructive?: boolean;
	public readonly options: readonly ConditionalConfigOption[];
	public readonly hidden?: boolean;

	public readonly condition?: string;

	public evaluateCondition(
		deviceId?: DeviceID,
	): ParamInformation | undefined {
		if (!conditionApplies(this, deviceId)) return;

		const ret = {
			...pick(this, [
				"parameterNumber",
				"valueBitMask",
				"label",
				"description",
				"valueSize",
				"allowed",
				"minValue",
				"maxValue",
				"unsigned",
				"defaultValue",
				"recommendedValue",
				"unit",
				"readOnly",
				"writeOnly",
				"allowManualEntry",
				"destructive",
				"hidden",
			]),
			options: evaluateDeep(this.options, deviceId, true),
		};

		// If allowed is defined, compute the envelope (minValue/maxValue) for backwards compatibility
		if (ret.allowed && ret.allowed.length > 0) {
			let globalMin = Infinity;
			let globalMax = -Infinity;

			for (const def of ret.allowed) {
				if ("value" in def) {
					globalMin = Math.min(globalMin, def.value);
					globalMax = Math.max(globalMax, def.value);
				} else {
					globalMin = Math.min(globalMin, def.from);
					globalMax = Math.max(globalMax, def.to);
				}
			}

			ret.minValue = globalMin;
			ret.maxValue = globalMax;
		} // Infer minValue from options if possible
		else if (ret.minValue == undefined) {
			if (ret.allowManualEntry === false && ret.options.length > 0) {
				ret.minValue = Math.min(...ret.options.map((o) => o.value));
			} else {
				throwInvalidConfig(
					"devices",
					`packages/config/config/devices/${this.parent.filename}:
Parameter #${this.parameterNumber} is missing required property "minValue"!`,
				);
			}
		}
		if (ret.allowed == undefined && ret.maxValue == undefined) {
			if (ret.allowManualEntry === false && ret.options.length > 0) {
				ret.maxValue = Math.max(...ret.options.map((o) => o.value));
			} else {
				throwInvalidConfig(
					"devices",
					`packages/config/config/devices/${this.parent.filename}:
Parameter #${this.parameterNumber} is missing required property "maxValue"!`,
				);
			}
		}

		// After inferring minValue/maxValue, create the allowed array if not already set
		if (ret.allowed == undefined) {
			ret.allowed = [{ from: ret.minValue!, to: ret.maxValue! }];
		}

		// @ts-expect-error TS doesn't understand that we set min/maxValue and allowed
		return ret;
	}
}

export type ParamInformation =
	& Omit<
		ConditionalParamInformation,
		| "condition"
		| "evaluateCondition"
		| "options"
		| "minValue"
		| "maxValue"
		| "allowed"
	>
	& {
		options: readonly ConfigOption[];
		minValue: NonNullable<ConditionalParamInformation["minValue"]>;
		maxValue: NonNullable<ConditionalParamInformation["maxValue"]>;
		allowed: NonNullable<ConditionalParamInformation["allowed"]>;
	};

export class ConditionalConfigOption implements ConditionalItem<ConfigOption> {
	public constructor(
		public readonly value: number,
		public readonly label: string,
		public readonly condition?: string,
	) {}

	public evaluateCondition(deviceId?: DeviceID): ConfigOption | undefined {
		if (!conditionApplies(this, deviceId)) return;

		return pick(this, ["value", "label"]);
	}
}

export interface ConfigOption {
	value: number;
	label: string;
}

export type ConditionalParamInfoMap = ReadonlyObjectKeyMap<
	{ parameter: number; valueBitMask?: number },
	ConditionalParamInformation[]
>;

export type ParamInfoMap = ReadonlyObjectKeyMap<
	{ parameter: number; valueBitMask?: number },
	ParamInformation
>;

export function parseConditionalParamInformationMap(
	definition: JSONObject,
	parent: ConditionalDeviceConfig,
	errorPrefix: string = "",
): ConditionalParamInfoMap {
	const paramInformation = new ObjectKeyMap<
		{ parameter: number; valueBitMask?: number },
		ConditionalParamInformation[]
	>();

	const filename = parent.filename;

	if (isArray(definition.paramInformation)) {
		// Check that every param has a param number
		if (!definition.paramInformation.every((entry: any) => "#" in entry)) {
			throwInvalidConfig(
				`device`,
				`packages/config/config/devices/${filename}: 
${errorPrefix}required property "#" missing in at least one entry of paramInformation`,
			);
		}

		// And a valid $if condition
		for (const entry of definition.paramInformation) {
			validateCondition(
				filename,
				entry,
				`${errorPrefix}At least one entry of paramInformation contains an`,
			);
		}

		for (const paramDefinition of definition.paramInformation) {
			const { ["#"]: paramNo, ...defn } = paramDefinition;
			const key = tryParseParamNumber(paramNo);
			if (!key) {
				throwInvalidConfig(
					`device`,
					`packages/config/config/devices/${filename}: 
${errorPrefix}found invalid param number "${paramNo}" in paramInformation`,
				);
			}

			if (!paramInformation.has(key)) paramInformation.set(key, []);
			paramInformation
				.get(key)!
				.push(
					new ConditionalParamInformation(
						parent,
						key.parameter,
						key.valueBitMask,
						defn,
					),
				);
		}
	} else if (isObject(definition.paramInformation)) {
		// Silently ignore this old format
	} else {
		throwInvalidConfig(
			`device`,
			`packages/config/config/devices/${filename}:
${errorPrefix}paramInformation must be an array!`,
		);
	}

	return paramInformation;
}
