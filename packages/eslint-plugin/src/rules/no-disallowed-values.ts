import type { AST } from "jsonc-eslint-parser";
import type { JSONCRule } from "../utils.js";

type ParsedEntry =
	| { type: "value"; value: number }
	| { type: "range"; from: number; to: number; step: number };

function parseAllowedEntries(
	allowedArray: AST.JSONArrayExpression,
): ParsedEntry[] {
	const entries: ParsedEntry[] = [];

	for (const element of allowedArray.elements) {
		if (!element || element.type !== "JSONObjectExpression") continue;

		const valueProp = element.properties.find(
			(p) => p.key.type === "JSONLiteral" && p.key.value === "value",
		);
		if (
			valueProp
			&& valueProp.value.type === "JSONLiteral"
			&& typeof valueProp.value.value === "number"
		) {
			entries.push({ type: "value", value: valueProp.value.value });
			continue;
		}

		const rangeProp = element.properties.find(
			(p) => p.key.type === "JSONLiteral" && p.key.value === "range",
		);
		if (
			rangeProp
			&& rangeProp.value.type === "JSONArrayExpression"
			&& rangeProp.value.elements.length === 2
		) {
			const [fromElem, toElem] = rangeProp.value.elements;
			if (
				fromElem?.type === "JSONLiteral"
				&& typeof fromElem.value === "number"
				&& toElem?.type === "JSONLiteral"
				&& typeof toElem.value === "number"
			) {
				const stepProp = element.properties.find(
					(p) =>
						p.key.type === "JSONLiteral" && p.key.value === "step",
				);
				let step = 1;
				if (
					stepProp
					&& stepProp.value.type === "JSONLiteral"
					&& typeof stepProp.value.value === "number"
				) {
					step = stepProp.value.value;
				}
				entries.push({
					type: "range",
					from: fromElem.value,
					to: toElem.value,
					step,
				});
			}
		}
	}

	return entries;
}

function isValueAllowed(value: number, entries: ParsedEntry[]): boolean {
	for (const entry of entries) {
		if (entry.type === "value") {
			if (entry.value === value) return true;
		} else {
			if (value >= entry.from && value <= entry.to) {
				if ((value - entry.from) % entry.step === 0) return true;
			}
		}
	}
	return false;
}

export const noDisallowedValues: JSONCRule.RuleModule = {
	create(context) {
		return {
			"JSONProperty[key.value='paramInformation'] > JSONArrayExpression > JSONObjectExpression"(
				node: AST.JSONObjectExpression,
			) {
				// Build the allowed entries from either explicit 'allowed' or minValue/maxValue
				let allowedEntries: ParsedEntry[] = [];

				const allowedProp = node.properties.find(
					(p) =>
						p.key.type === "JSONLiteral"
						&& p.key.value === "allowed",
				);
				if (
					allowedProp
					&& allowedProp.value.type === "JSONArrayExpression"
				) {
					allowedEntries = parseAllowedEntries(allowedProp.value);
				} else {
					// Fall back to minValue/maxValue
					const minValueProp = node.properties.find(
						(p) =>
							p.key.type === "JSONLiteral"
							&& p.key.value === "minValue",
					);
					const maxValueProp = node.properties.find(
						(p) =>
							p.key.type === "JSONLiteral"
							&& p.key.value === "maxValue",
					);
					if (
						minValueProp
						&& minValueProp.value.type === "JSONLiteral"
						&& typeof minValueProp.value.value === "number"
						&& maxValueProp
						&& maxValueProp.value.type === "JSONLiteral"
						&& typeof maxValueProp.value.value === "number"
					) {
						allowedEntries = [
							{
								type: "range",
								from: minValueProp.value.value,
								to: maxValueProp.value.value,
								step: 1,
							},
						];
					}
				}

				if (allowedEntries.length === 0) return;

				// Track whether we're using explicit 'allowed' or minValue/maxValue
				const hasExplicitAllowed = allowedProp !== undefined;
				let minValue: number | undefined;
				let maxValue: number | undefined;
				if (!hasExplicitAllowed) {
					const minProp = node.properties.find(
						(p) =>
							p.key.type === "JSONLiteral"
							&& p.key.value === "minValue",
					);
					const maxProp = node.properties.find(
						(p) =>
							p.key.type === "JSONLiteral"
							&& p.key.value === "maxValue",
					);
					if (
						minProp?.value.type === "JSONLiteral"
						&& typeof minProp.value.value === "number"
					) {
						minValue = minProp.value.value;
					}
					if (
						maxProp?.value.type === "JSONLiteral"
						&& typeof maxProp.value.value === "number"
					) {
						maxValue = maxProp.value.value;
					}
				}

				// Check defaultValue
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

				// Check option values
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
				"Ensures that defaultValue and option values are within the allowed range",
		},
		schema: false,
		messages: {
			"default-value-not-allowed":
				`Default value {{value}} is not in the allowed values.`,
			"default-value-outside-range":
				`Default value {{value}} is outside of the min/max value range {{min}}...{{max}}.`,
			"option-value-not-allowed":
				`Option value {{value}}{{label}} is not in the allowed values.`,
			"option-value-outside-range":
				`Option value {{value}}{{label}} is outside of the min/max value range {{min}}...{{max}}.`,
		},
		type: "problem",
	},
};
