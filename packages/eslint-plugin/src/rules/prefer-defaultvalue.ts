import type { AST } from "jsonc-eslint-parser";

import type { JSONCRule } from "../utils.js";

export const preferDefaultValue: JSONCRule.RuleModule = {
	create(context) {
		// if (!context.parserServices.isJSON) {
		// 	return {};
		// }

		return {
			// Disallow "(default)" in labels and descriptions
			"JSONProperty[key.value='label'], JSONProperty[key.value='description']"(
				node: AST.JSONProperty,
			) {
				debugger;
				if (
					node.value.type !== "JSONLiteral"
					|| typeof node.value.value !== "string"
				)
					return;

				const marker = "(default)";
				const markerIndex = node.value.raw
					.toLowerCase()
					.indexOf(marker);
				if (markerIndex === -1) return;

				let start = markerIndex;
				while (node.value.raw[start - 1] === " ") start--;
				let end = markerIndex + marker.length;
				while (node.value.raw[end] === " ") end++;

				const before = node.value.raw.slice(0, start);
				const after = node.value.raw.slice(end);
				const fixed =
					before
					+ (start < markerIndex && end > markerIndex + marker.length
						? " "
						: "")
					+ after;

				context.report({
					loc: node.value.loc,
					messageId: "no-default",
					fix: (fixer) =>
						fixer.replaceTextRange(node.value.range, fixed),
				});
			},
		};
	},
	meta: {
		docs: {
			description: `Ensures that the defaultValue property is used instead of mentioning in text that an option/value is the default`,
		},
		fixable: "code",
		schema: false,
		messages: {
			"no-default":
				"Do not use '(default)' in labels or descriptions. Use the 'defaultValue' property instead.",
		},
		type: "problem",
	},
};
