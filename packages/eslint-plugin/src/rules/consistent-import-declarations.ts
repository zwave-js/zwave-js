import { ESLintUtils, TSESTree } from "@typescript-eslint/utils";
import type { ReportFixFunction } from "@typescript-eslint/utils/ts-eslint";

// const isFixMode = process.argv.some((arg) => arg.startsWith("--fix"));

export const consistentImportDeclarations = ESLintUtils.RuleCreator.withoutDocs(
	{
		create(context) {
			const importDeclarations = new Map<
				string,
				TSESTree.ImportDeclaration[]
			>();

			return {
				ImportDeclaration(node: TSESTree.ImportDeclaration) {
					const source = node.source.value;
					if (
						node.specifiers.length === 0
						|| node.specifiers.some((s) =>
							s.type !== TSESTree.AST_NODE_TYPES.ImportSpecifier
						)
					) {
						return;
					}

					if (importDeclarations.has(source)) {
						importDeclarations.get(source)!.push(node);
					} else {
						importDeclarations.set(source, [node]);
					}
				},
				"Program:exit"() {
					// Report all import declarations that exist multiple times
					for (const [source, nodes] of importDeclarations) {
						if (nodes.length >= 2) {
							// This is an import declaration that exists multiple times
							reportDuplicateImports(context, source, nodes);
						} else {
							reportImportType(context, nodes);
						}
					}
				},
			};
		},
		meta: {
			docs: {
				description:
					"Prevent public CC methods from using non-exported types",
			},
			type: "problem",
			fixable: "code",
			hasSuggestions: true,
			// Do not auto-fix these on the CLI
			// fixable: isFixMode ? undefined : "code",
			schema: [],
			messages: {
				"duplicate-import-declaration":
					"Module '{{source}}' is imported multiple times.",
				"prefer-import-type":
					"Prefer using `import type { ... }` over `import { type ... }` where possible.",
			},
		},
		defaultOptions: [],
	},
);

type Context = Parameters<typeof consistentImportDeclarations["create"]>[0];

function reportImportType(
	context: Context,
	nodes: TSESTree.ImportDeclaration[],
) {
	const node = nodes[0];
	const specifiers = node
		.specifiers as TSESTree.ImportSpecifier[];
	if (
		node.importKind !== "type"
		&& specifiers.every((s) => s.importKind === "type")
	) {
		context.report({
			node,
			messageId: "prefer-import-type",
			fix: function*(fixer) {
				yield fixer.insertTextAfterRange(
					[node.range[0], node.range[0] + "import".length],
					" type",
				);

				for (const specifier of specifiers) {
					if (specifier.importKind === "type") {
						yield fixer.replaceTextRange(
							[
								specifier.range[0],
								specifier.range[0] + "type ".length,
							],
							"",
						);
					}
				}
			},
		});
	}
}

function reportDuplicateImports(
	context: Context,
	source: string,
	nodes: TSESTree.ImportDeclaration[],
) {
	const firstImport = nodes[0];

	const fix: ReportFixFunction = (fixer) => {
		const allSpecifiers: TSESTree.ImportSpecifier[] = [];
		const obsoleteRanges: TSESTree.Range[] = [];
		let allTypeOnly = true;

		for (const node of nodes) {
			const specifiers = node
				.specifiers as TSESTree.ImportSpecifier[];
			allTypeOnly &&= node.importKind === "type"
				|| specifiers.every((s) => s.importKind === "type");
			allSpecifiers.push(...specifiers);
			if (node !== firstImport) {
				obsoleteRanges.push([
					node.range[0],
					// Include the trailing newline
					node.range[1] + 1,
				]);
			}
		}

		const newSpecifiers = allSpecifiers
			.map((s) => {
				const typeOnly = !allTypeOnly
					&& (s.importKind === "type"
						|| (s
								.parent as TSESTree.ImportDeclaration)
								.importKind
							=== "type");
				const importedName = (s.imported as TSESTree.Identifier)
					.name;
				const renamed = s.local.name !== importedName;
				return `${typeOnly ? "type " : ""}${
					renamed
						? `${importedName} as ${s.local.name}`
						: s.local.name
				}`;
			});

		const newText = `import ${allTypeOnly ? "type " : ""}{${
			newSpecifiers
				.map((s) => `\n\t${s},`)
				.join("")
		}\n} from ${firstImport.source.raw};`;

		return [
			fixer.replaceText(firstImport, newText),
			...obsoleteRanges.map((range) => fixer.removeRange(range)),
		];
	};

	context.report({
		loc: firstImport.loc,
		messageId: "duplicate-import-declaration",
		data: { source },
		fix,
	});
}
