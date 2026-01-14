import type { AllowedConfigValue } from "@zwave-js/core";
import type { AST } from "jsonc-eslint-parser";
import {
	isValueAllowed,
	type JSONCRule,
	parseAllowedField,
} from "../utils.js";

function getAllowedEntriesAndRange(node: AST.JSONObjectExpression): {
	allowedEntries: AllowedConfigValue[];
	hasExplicitAllowed: boolean;
	minValue: number | undefined;
	maxValue: number | undefined;
} {
	const parsedAllowed = parseAllowedField(node);
	if (parsedAllowed) {
		return {
			allowedEntries: parsedAllowed,
			hasExplicitAllowed: true,
			minValue: undefined,
			maxValue: undefined,
		};
	}

	// Fall back to minValue/maxValue
	const minValueProp = node.properties.find(
		(p) => p.key.type === "JSONLiteral" && p.key.value === "minValue",
	);
	const maxValueProp = node.properties.find(
		(p) => p.key.type === "JSONLiteral" && p.key.value === "maxValue",
	);
	if (
		minValueProp
		&& minValueProp.value.type === "JSONLiteral"
		&& typeof minValueProp.value.value === "number"
		&& maxValueProp
		&& maxValueProp.value.type === "JSONLiteral"
		&& typeof maxValueProp.value.value === "number"
	) {
		return {
			allowedEntries: [
				{
					from: minValueProp.value.value,
					to: maxValueProp.value.value,
				},
			],
			hasExplicitAllowed: false,
			minValue: minValueProp.value.value,
			maxValue: maxValueProp.value.value,
		};
	}

	return {
		allowedEntries: [],
		hasExplicitAllowed: false,
		minValue: undefined,
		maxValue: undefined,
	};
}

export const noDisallowedDefaultValue: JSONCRule.RuleModule = {
	create(context) {
		return {
			"JSONProperty[key.value='paramInformation'] > JSONArrayExpression > JSONObjectExpression"(
				node: AST.JSONObjectExpression,
			) {
				const {
					allowedEntries,
					hasExplicitAllowed,
					minValue,
					maxValue,
				} = getAllowedEntriesAndRange(node);

				if (allowedEntries.length === 0) return;

				const defaultValueProp = node.properties.find(
					(p) =>
						p.key.type === "JSONLiteral"
						&& p.key.value === "defaultValue",
				);
				if (
					defaultValueProp
					&& defaultValueProp.value.type === "JSONLiteral"
					&& typeof defaultValueProp.value.value === "number"
				) {
					const defaultValue = defaultValueProp.value.value;
					if (!isValueAllowed(defaultValue, allowedEntries)) {
						if (hasExplicitAllowed) {
							context.report({
								loc: defaultValueProp.loc,
								messageId: "default-value-not-allowed",
								data: { value: defaultValue.toString() },
							});
						} else {
							context.report({
								loc: defaultValueProp.loc,
								messageId: "default-value-outside-range",
								data: {
									value: defaultValue.toString(),
									min: minValue?.toString() ?? "?",
									max: maxValue?.toString() ?? "?",
								},
							});
						}
					}
				}
			},
		};
	},
	meta: {
		// @ts-expect-error Something is off about the rule types
		docs: {
			description:
				"Ensures that defaultValue is within the allowed range",
		},
		schema: false,
		messages: {
			"default-value-not-allowed":
				`Default value {{value}} is not in the allowed values.`,
			"default-value-outside-range":
				`Default value {{value}} is outside of the min/max value range {{min}}...{{max}}.`,
		},
		type: "problem",
	},
};

export const noDisallowedOptionValues: JSONCRule.RuleModule = {
	create(context) {
		return {
			"JSONProperty[key.value='paramInformation'] > JSONArrayExpression > JSONObjectExpression"(
				node: AST.JSONObjectExpression,
			) {
				const {
					allowedEntries,
					hasExplicitAllowed,
					minValue,
					maxValue,
				} = getAllowedEntriesAndRange(node);

				if (allowedEntries.length === 0) return;

				const optionsProp = node.properties.find(
					(p) =>
						p.key.type === "JSONLiteral"
						&& p.key.value === "options",
				);
				if (
					optionsProp
					&& optionsProp.value.type === "JSONArrayExpression"
				) {
					for (const optionElement of optionsProp.value.elements) {
						if (
							!optionElement
							|| optionElement.type !== "JSONObjectExpression"
						) {
							continue;
						}
						const optionValueProp = optionElement.properties.find(
							(p) =>
								p.key.type === "JSONLiteral"
								&& p.key.value === "value",
						);
						const optionLabelProp = optionElement.properties.find(
							(p) =>
								p.key.type === "JSONLiteral"
								&& p.key.value === "label",
						);
						if (
							optionValueProp
							&& optionValueProp.value.type === "JSONLiteral"
							&& typeof optionValueProp.value.value === "number"
						) {
							const optionValue = optionValueProp.value.value;
							if (!isValueAllowed(optionValue, allowedEntries)) {
								const label = optionLabelProp
										&& optionLabelProp.value.type
											=== "JSONLiteral"
										&& typeof optionLabelProp.value.value
											=== "string"
									? optionLabelProp.value.value
									: undefined;
								if (hasExplicitAllowed) {
									context.report({
										loc: optionValueProp.loc,
										messageId: "option-value-not-allowed",
										data: {
											value: optionValue.toString(),
											label: label ? ` ("${label}")` : "",
										},
									});
								} else {
									context.report({
										loc: optionValueProp.loc,
										messageId: "option-value-outside-range",
										data: {
											value: optionValue.toString(),
											label: label ? ` ("${label}")` : "",
											min: minValue?.toString() ?? "?",
											max: maxValue?.toString() ?? "?",
										},
									});
								}
							}
						}
					}
				}
			},
		};
	},
	meta: {
		// @ts-expect-error Something is off about the rule types
		docs: {
			description:
				"Ensures that option values are within the allowed range",
		},
		schema: false,
		messages: {
			"option-value-not-allowed":
				`Option value {{value}}{{label}} is not in the allowed values.`,
			"option-value-outside-range":
				`Option value {{value}}{{label}} is outside of the min/max value range {{min}}...{{max}}.`,
		},
		type: "problem",
	},
};
