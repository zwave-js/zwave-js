import {
	AST_NODE_TYPES,
	ESLintUtils,
	type TSESTree,
} from "@typescript-eslint/utils";

const vHelperMethods = new Set([
	"staticProperty",
	"staticPropertyWithName",
	"staticPropertyAndKeyWithName",
	"dynamicPropertyWithName",
	"dynamicPropertyAndKeyWithName",
]);

function isAsConstExpression(
	node: TSESTree.Node,
): node is TSESTree.TSAsExpression {
	return (
		node.type === AST_NODE_TYPES.TSAsExpression
		&& node.typeAnnotation.type === AST_NODE_TYPES.TSTypeReference
		&& node.typeAnnotation.typeName.type === AST_NODE_TYPES.Identifier
		&& node.typeAnnotation.typeName.name === "const"
	);
}

function isVHelperCall(
	node: TSESTree.CallExpression,
): boolean {
	return (
		node.callee.type === AST_NODE_TYPES.MemberExpression
		&& node.callee.object.type === AST_NODE_TYPES.Identifier
		&& node.callee.object.name === "V"
		&& node.callee.property.type === AST_NODE_TYPES.Identifier
		&& vHelperMethods.has(node.callee.property.name)
	);
}

export const consistentCCValueDefinitions = ESLintUtils.RuleCreator.withoutDocs(
	{
		create(context) {
			return {
				CallExpression(node) {
					if (!isVHelperCall(node)) return;

					for (const arg of node.arguments) {
						// Direct `as const` on an argument
						if (isAsConstExpression(arg)) {
							context.report({
								node: arg,
								messageId: "no-as-const",
								fix(fixer) {
									return fixer.replaceText(
										arg,
										context.sourceCode.getText(
											arg.expression,
										),
									);
								},
							});
						}

						// `as const` on the expression body of an arrow function argument.
						// Block-body arrow functions are excluded because their return statements
						// are copied verbatim by the codegen.
						if (
							arg.type === AST_NODE_TYPES.ArrowFunctionExpression
							&& arg.body.type !== AST_NODE_TYPES.BlockStatement
							&& isAsConstExpression(arg.body)
						) {
							const body = arg.body;
							context.report({
								node: body,
								messageId: "no-as-const",
								fix(fixer) {
									return fixer.replaceText(
										body,
										context.sourceCode.getText(
											body.expression,
										),
									);
								},
							});
						}
					}
				},
			};
		},
		meta: {
			docs: {
				description:
					"Disallows unnecessary `as const` in CC value definitions, since the V helper type parameters are already `const`-annotated",
			},
			type: "suggestion",
			fixable: "code",
			schema: [],
			messages: {
				"no-as-const": "Unnecessary `as const` in CC value definition.",
			},
		},
		defaultOptions: [],
	},
);
