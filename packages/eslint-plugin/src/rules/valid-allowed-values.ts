import type { AST } from "jsonc-eslint-parser";
import { type JSONCRule, removeJSONProperty } from "../utils.js";

export const validAllowedValues: JSONCRule.RuleModule = {
	create(context) {
		return {
			"JSONProperty[key.value='paramInformation'] > JSONArrayExpression > JSONObjectExpression"(
				node: AST.JSONObjectExpression,
			) {
				const allowedProperty = node.properties.find((p) =>
					p.key.type === "JSONLiteral" && p.key.value === "allowed"
				);

				if (
					!allowedProperty
					|| allowedProperty.value.type !== "JSONArrayExpression"
				) {
					return;
				}

				const allowedArray = allowedProperty.value;

				// Check that array is not empty
				if (allowedArray.elements.length === 0) {
					context.report({
						loc: allowedProperty.loc,
						messageId: "empty-allowed-array",
					});
					return;
				}

				// Note: minValue/maxValue conflict is handled by no-unnecessary-min-max-value rule

				// Check mutual exclusivity with allowManualEntry: false
				const allowManualEntry = node.properties.find((p) =>
					p.key.type === "JSONLiteral"
					&& p.key.value === "allowManualEntry"
					&& p.value.type === "JSONLiteral"
					&& p.value.value === false
				);
				if (allowManualEntry) {
					context.report({
						loc: allowManualEntry.loc,
						messageId: "allowed-conflicts-with-allow-manual-entry",
						fix: removeJSONProperty(context, allowManualEntry),
					});
				}

				// Validate each element in the allowed array
				for (let i = 0; i < allowedArray.elements.length; i++) {
					const element = allowedArray.elements[i];

					if (!element || element.type !== "JSONObjectExpression") {
						context.report({
							loc: element?.loc ?? allowedProperty.loc,
							messageId: "allowed-element-not-object",
							data: { index: i.toString() },
						});
						continue;
					}

					const hasValue = element.properties.some((p) =>
						p.key.type === "JSONLiteral" && p.key.value === "value"
					);
					const hasRange = element.properties.some((p) =>
						p.key.type === "JSONLiteral" && p.key.value === "range"
					);

					// Must have either value OR range, but not both
					if (!hasValue && !hasRange) {
						context.report({
							loc: element.loc,
							messageId: "allowed-element-missing-value-or-range",
							data: { index: i.toString() },
						});
						continue;
					}

					if (hasValue && hasRange) {
						context.report({
							loc: element.loc,
							messageId: "allowed-element-both-value-and-range",
							data: { index: i.toString() },
						});
						continue;
					}

					// If it has a value property, check it's a number
					if (hasValue) {
						const valueProp = element.properties.find((p) =>
							p.key.type === "JSONLiteral"
							&& p.key.value === "value"
						);
						if (
							valueProp && valueProp.value.type !== "JSONLiteral"
						) {
							context.report({
								loc: valueProp.value.loc,
								messageId: "allowed-element-value-not-number",
								data: { index: i.toString() },
							});
						} else if (
							valueProp
							&& valueProp.value.type === "JSONLiteral"
							&& typeof valueProp.value.value !== "number"
						) {
							context.report({
								loc: valueProp.value.loc,
								messageId: "allowed-element-value-not-number",
								data: { index: i.toString() },
							});
						}
					}

					// If it has a range property, validate it
					if (hasRange) {
						const rangeProp = element.properties.find((p) =>
							p.key.type === "JSONLiteral"
							&& p.key.value === "range"
						);

						if (!rangeProp) continue;

						if (rangeProp.value.type !== "JSONArrayExpression") {
							context.report({
								loc: rangeProp.value.loc,
								messageId: "allowed-element-range-not-array",
								data: { index: i.toString() },
							});
							continue;
						}

						const rangeArray = rangeProp.value;

						// Range must have exactly 2 elements
						if (rangeArray.elements.length !== 2) {
							context.report({
								loc: rangeProp.value.loc,
								messageId: "allowed-element-range-wrong-length",
								data: { index: i.toString() },
							});
							continue;
						}

						// Both elements must be numbers
						const [fromElem, toElem] = rangeArray.elements;
						let fromValue: number | undefined;
						let toValue: number | undefined;

						if (
							!fromElem
							|| fromElem.type !== "JSONLiteral"
							|| typeof fromElem.value !== "number"
						) {
							context.report({
								loc: fromElem?.loc ?? rangeProp.value.loc,
								messageId:
									"allowed-element-range-element-not-number",
								data: {
									index: i.toString(),
									rangeIndex: "0",
								},
							});
						} else {
							fromValue = fromElem.value;
						}

						if (
							!toElem
							|| toElem.type !== "JSONLiteral"
							|| typeof toElem.value !== "number"
						) {
							context.report({
								loc: toElem?.loc ?? rangeProp.value.loc,
								messageId:
									"allowed-element-range-element-not-number",
								data: {
									index: i.toString(),
									rangeIndex: "1",
								},
							});
						} else {
							toValue = toElem.value;
						}

						// If step property exists, validate it's a number and positive
						const stepProp = element.properties.find((p) =>
							p.key.type === "JSONLiteral"
							&& p.key.value === "step"
						);
						let stepValue: number | undefined;
						let stepValid = true;

						if (stepProp) {
							if (
								stepProp.value.type !== "JSONLiteral"
								|| typeof stepProp.value.value !== "number"
							) {
								context.report({
									loc: stepProp.value.loc,
									messageId:
										"allowed-element-step-not-number",
									data: { index: i.toString() },
								});
								stepValid = false;
							} else {
								stepValue = stepProp.value.value;
								if (stepValue <= 0) {
									context.report({
										loc: stepProp.value.loc,
										messageId:
											"allowed-element-step-not-positive",
										data: {
											index: i.toString(),
											step: stepValue.toString(),
										},
									});
									stepValid = false;
								}
							}
						}

						// Semantic validation if both range elements are valid numbers
						if (fromValue !== undefined && toValue !== undefined) {
							// from must be <= to
							if (fromValue > toValue) {
								context.report({
									loc: rangeProp.value.loc,
									messageId: "allowed-element-range-inverted",
									data: {
										index: i.toString(),
										from: fromValue.toString(),
										to: toValue.toString(),
									},
								});
							} else if (stepValid && stepValue !== undefined) {
								// (to - from) must be evenly divisible by step
								if ((toValue - fromValue) % stepValue !== 0) {
									context.report({
										loc: stepProp!.value.loc,
										messageId:
											"allowed-element-step-not-divisible",
										data: {
											index: i.toString(),
											from: fromValue.toString(),
											to: toValue.toString(),
											step: stepValue.toString(),
										},
									});
								}
							}
						}
					}
				}

				// Validate that entries are sorted and non-overlapping
				type ParsedEntry =
					| { type: "value"; value: number }
					| {
						type: "range";
						from: number;
						to: number;
						step: number | undefined;
					};

				const parseEntry = (
					element: AST.JSONObjectExpression,
				): ParsedEntry | undefined => {
					const valueProp = element.properties.find((p) =>
						p.key.type === "JSONLiteral" && p.key.value === "value"
					);
					if (
						valueProp
						&& valueProp.value.type === "JSONLiteral"
						&& typeof valueProp.value.value === "number"
					) {
						return { type: "value", value: valueProp.value.value };
					}

					const rangeProp = element.properties.find((p) =>
						p.key.type === "JSONLiteral" && p.key.value === "range"
					);
					if (
						rangeProp
						&& rangeProp.value.type === "JSONArrayExpression"
						&& rangeProp.value.elements.length === 2
					) {
						const [from, to] = rangeProp.value.elements;
						if (
							from?.type === "JSONLiteral"
							&& typeof from.value === "number"
							&& to?.type === "JSONLiteral"
							&& typeof to.value === "number"
						) {
							const stepProp = element.properties.find((p) =>
								p.key.type === "JSONLiteral"
								&& p.key.value === "step"
							);
							let step: number | undefined;
							if (
								stepProp
								&& stepProp.value.type === "JSONLiteral"
								&& typeof stepProp.value.value === "number"
							) {
								step = stepProp.value.value;
							}
							return {
								type: "range",
								from: from.value,
								to: to.value,
								step,
							};
						}
					}

					return undefined;
				};

				const formatEntry = (entry: ParsedEntry): string => {
					if (entry.type === "value") return `value ${entry.value}`;
					return `range [${entry.from}, ${entry.to}]`;
				};

				const getStart = (entry: ParsedEntry): number =>
					entry.type === "value" ? entry.value : entry.from;

				const isValueInRange = (
					value: number,
					range: { from: number; to: number; step: number | undefined },
				): boolean => {
					if (value < range.from || value > range.to) return false;
					const step = range.step ?? 1;
					return (value - range.from) % step === 0;
				};

				// Check if two entries overlap (assuming they're sorted by start)
				const entriesOverlap = (
					prev: ParsedEntry,
					curr: ParsedEntry,
				): boolean => {
					if (prev.type === "range") {
						if (curr.type === "value") {
							return isValueInRange(curr.value, prev);
						} else {
							return prev.to >= curr.from;
						}
					}
					return false;
				};

				// Parse all entries first
				const entries: Array<{
					element: AST.JSONObjectExpression;
					parsed: ParsedEntry;
				}> = [];

				for (const element of allowedArray.elements) {
					if (!element || element.type !== "JSONObjectExpression") {
						continue;
					}
					const parsed = parseEntry(element);
					if (parsed) {
						entries.push({ element, parsed });
					}
				}

				if (entries.length < 2) return;

				// Check if entries are sorted
				let isSorted = true;
				for (let i = 1; i < entries.length; i++) {
					if (getStart(entries[i - 1].parsed) >= getStart(entries[i].parsed)) {
						isSorted = false;
						break;
					}
				}

				// Sort entries by start value to check for overlaps
				const sortedEntries = [...entries].sort(
					(a, b) => getStart(a.parsed) - getStart(b.parsed),
				);

				// Check for overlaps in the sorted order
				let hasOverlaps = false;
				for (let i = 1; i < sortedEntries.length; i++) {
					if (entriesOverlap(sortedEntries[i - 1].parsed, sortedEntries[i].parsed)) {
						hasOverlaps = true;
						break;
					}
				}

				// Report issues
				if (!isSorted && !hasOverlaps) {
					// Only sorting issue - provide a fix
					context.report({
						loc: allowedArray.loc,
						messageId: "allowed-entries-not-sorted-fixable",
						fix(fixer) {
							const sourceCode = context.sourceCode;
							const fullText = sourceCode.getText();
							// Get the text of each element using range
							const sortedTexts = sortedEntries.map(
								(e) => fullText.slice(e.element.range![0], e.element.range![1]),
							);
							// Find indentation from first element
							const firstElemStart = allowedArray.elements[0]!.loc.start;
							const lineStart = sourceCode.getIndexFromLoc({
								line: firstElemStart.line,
								column: 0,
							});
							const elemStart = sourceCode.getIndexFromLoc(firstElemStart);
							const indent = fullText.slice(lineStart, elemStart);

							const newContent = sortedTexts.join(",\n" + indent);
							return fixer.replaceTextRange(
								[
									allowedArray.elements[0]!.range![0],
									allowedArray.elements[allowedArray.elements.length - 1]!.range![1],
								],
								newContent,
							);
						},
					});
				} else if (!isSorted || hasOverlaps) {
					// Report individual issues without fix
					for (let i = 1; i < entries.length; i++) {
						const prev = entries[i - 1];
						const curr = entries[i];

						const prevStart = getStart(prev.parsed);
						const currStart = getStart(curr.parsed);

						if (prevStart >= currStart) {
							context.report({
								loc: curr.element.loc,
								messageId: "allowed-entries-not-sorted",
								data: {
									prev: formatEntry(prev.parsed),
									curr: formatEntry(curr.parsed),
								},
							});
						} else if (entriesOverlap(prev.parsed, curr.parsed)) {
							context.report({
								loc: curr.element.loc,
								messageId: "allowed-entries-overlap",
								data: {
									prev: formatEntry(prev.parsed),
									curr: formatEntry(curr.parsed),
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
			description: "Ensures that the allowed field has a valid structure",
		},
		fixable: "code",
		schema: false,
		messages: {
			"empty-allowed-array":
				`The "allowed" array must contain at least one entry.`,
			"allowed-conflicts-with-allow-manual-entry":
				`The "allowed" field cannot be used with "allowManualEntry: false".`,
			"allowed-element-not-object":
				`Element at index {{index}} must be an object.`,
			"allowed-element-missing-value-or-range":
				`Element at index {{index}} must have either a "value" or "range" property.`,
			"allowed-element-both-value-and-range":
				`Element at index {{index}} cannot have both "value" and "range" properties.`,
			"allowed-element-value-not-number":
				`Element at index {{index}}: "value" property must be a number.`,
			"allowed-element-range-not-array":
				`Element at index {{index}}: "range" property must be an array.`,
			"allowed-element-range-wrong-length":
				`Element at index {{index}}: "range" array must have exactly 2 elements [from, to].`,
			"allowed-element-range-element-not-number":
				`Element at index {{index}}: range[{{rangeIndex}}] must be a number.`,
			"allowed-element-step-not-number":
				`Element at index {{index}}: "step" property must be a number.`,
			"allowed-element-step-not-positive":
				`Element at index {{index}}: "step" must be positive (got {{step}}).`,
			"allowed-element-range-inverted":
				`Element at index {{index}}: range "from" ({{from}}) must be <= "to" ({{to}}).`,
			"allowed-element-step-not-divisible":
				`Element at index {{index}}: (to - from) must be evenly divisible by step. Range: {{from}}-{{to}}, step: {{step}}.`,
			"allowed-entries-not-sorted":
				`Entries in "allowed" must be sorted. {{prev}} must come after {{curr}}.`,
			"allowed-entries-not-sorted-fixable":
				`Entries in "allowed" must be sorted.`,
			"allowed-entries-overlap":
				`{{curr}} overlaps with {{prev}}.`,
		},
		type: "problem",
	},
};
