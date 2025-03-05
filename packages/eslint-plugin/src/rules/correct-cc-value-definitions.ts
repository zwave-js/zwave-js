import { ESLintUtils, TSESTree } from "@typescript-eslint/utils";
import { type Node, SyntaxKind } from "typescript";

// const isFixMode = process.argv.some((arg) => arg.startsWith("--fix"));

export const correctCCValueDefinitions = ESLintUtils.RuleCreator.withoutDocs({
	create(context) {
		let isInDefineCCValues = false;

		return {
			CallExpression(
				node: TSESTree.CallExpression,
			) {
				if (
					context.sourceCode.getText(node.callee)
						=== "V.defineCCValues"
				) {
					isInDefineCCValues = true;
					return;
				}
			},
			"CallExpression:exit"(
				node: TSESTree.CallExpression,
			) {
				if (
					context.sourceCode.getText(node.callee)
						=== "V.defineCCValues"
				) {
					isInDefineCCValues = false;
					return;
				}
			},
			Identifier(node: TSESTree.Identifier) {
				// Limit the scope to V.defineCCValues calls
				if (!isInDefineCCValues) return;
				// Only look at identifiers that are not property keys, because they
				// cause false positives
				if (
					node.parent.type === TSESTree.AST_NODE_TYPES.Property
					&& node.parent.key === node
				) {
					// Ignore property keys
					return;
				}

				const services = ESLintUtils.getParserServices(context);

				// Figure out if the identifier is a local symbol that was referenced
				const symbol = services.getTypeAtLocation(node).getSymbol();
				if (
					symbol?.valueDeclaration?.getSourceFile().fileName
						=== context.filename
				) {
					// If the value declaration is not an import specifier, and
					// it is defined at the top level of the file, it is a local
					// symbol and needs to be exported to be transformed correctly

					switch (symbol.valueDeclaration.kind) {
						case SyntaxKind.ImportSpecifier:
							// All good
							return;
						case SyntaxKind.FunctionDeclaration: {
							// Always a problem, must be imported from elsewhere
							break;
						}
						case SyntaxKind.VariableDeclaration: {
							// Find the corresponding variable statement
							let cur: Node = symbol.valueDeclaration;
							while (
								cur.parent
								&& cur.parent.kind
									!== SyntaxKind.VariableStatement
							) {
								cur = cur.parent;
							}
							if (
								!cur
								|| cur.parent.kind !== SyntaxKind.SourceFile
							) {
								// Not a top-level variable statement, this should be okay
								return;
							}
							break;
						}
					}
					context.report({
						node,
						messageId: "local-symbol",
						data: { name: symbol.getName() },
					});
				}
			},
		};
	},
	meta: {
		docs: {
			description:
				"Ensure the definition of CC values can be transformed correctly",
		},
		type: "problem",
		fixable: undefined,
		schema: [],
		messages: {
			"local-symbol":
				"To use {{name}} in CC value definitions, it must be imported from another module",
		},
	},
	defaultOptions: [],
});
