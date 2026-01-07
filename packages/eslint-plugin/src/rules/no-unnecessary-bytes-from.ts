import { AST_NODE_TYPES, ESLintUtils } from "@typescript-eslint/utils";

export const noUnnecessaryBytesFrom = ESLintUtils.RuleCreator.withoutDocs({
	create(context) {
		return {
			CallExpression(node) {
				// Check if this is a Bytes.concat call
				if (
					node.callee.type === AST_NODE_TYPES.MemberExpression
					&& node.callee.object.type === AST_NODE_TYPES.Identifier
					&& node.callee.object.name === "Bytes"
					&& node.callee.property.type === AST_NODE_TYPES.Identifier
					&& node.callee.property.name === "concat"
				) {
					// Check the first argument (should be an array)
					if (
						node.arguments.length > 0
						&& node.arguments[0].type === AST_NODE_TYPES.ArrayExpression
					) {
						const arrayArg = node.arguments[0];

						// Check each element in the array
						for (const element of arrayArg.elements) {
							if (!element) continue;

							// Check if element is a Bytes.from call
							if (
								element.type === AST_NODE_TYPES.CallExpression
								&& element.callee.type === AST_NODE_TYPES.MemberExpression
								&& element.callee.object.type === AST_NODE_TYPES.Identifier
								&& element.callee.object.name === "Bytes"
								&& element.callee.property.type === AST_NODE_TYPES.Identifier
								&& element.callee.property.name === "from"
							) {
								// Check if the argument to Bytes.from is an array literal
								if (
									element.arguments.length > 0
									&& element.arguments[0].type === AST_NODE_TYPES.ArrayExpression
								) {
									context.report({
										node: element,
										messageId: "no-unnecessary-bytes-from",
										fix(fixer) {
											// Get the source text of the array argument
											const arraySource = context.sourceCode.getText(element.arguments[0]);
											return fixer.replaceText(element, arraySource);
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
		docs: {
			description:
				"Bytes.concat accepts plain arrays, so Bytes.from([...]) is unnecessary",
		},
		type: "suggestion",
		fixable: "code",
		schema: [],
		messages: {
			"no-unnecessary-bytes-from":
				"Unnecessary Bytes.from() call. Bytes.concat accepts plain arrays.",
		},
	},
	defaultOptions: [],
});
