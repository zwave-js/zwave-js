import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Find the repo root by looking for the packages directory marker
const repoRoot = path.normalize(
	__dirname.slice(0, __dirname.lastIndexOf(`${path.sep}packages${path.sep}`)),
);

const packageNameCache = new Map<string, string | undefined>();

function getPackageName(filename: string): string | undefined {
	// Check if the file is within the packages directory
	const packagesDir = path.join(repoRoot, "packages");
	if (!filename.startsWith(packagesDir + path.sep)) {
		return undefined;
	}

	// Extract the package folder name from the path
	const relativePath = filename.slice(packagesDir.length + 1);
	const packageFolder = relativePath.split(path.sep)[0];

	if (packageNameCache.has(packageFolder)) {
		return packageNameCache.get(packageFolder);
	}

	// Read the package.json to get the actual package name
	const packageJsonPath = path.join(
		packagesDir,
		packageFolder,
		"package.json",
	);
	try {
		const packageJson = JSON.parse(
			fs.readFileSync(packageJsonPath, "utf8"),
		);
		if (typeof packageJson.name === "string") {
			packageNameCache.set(packageFolder, packageJson.name);
			return packageJson.name;
		}
	} catch {
		// Ignore errors
	}

	packageNameCache.set(packageFolder, undefined);
	return undefined;
}

function isRelativeImport(source: string): boolean {
	return source.startsWith("./") || source.startsWith("../");
}

export const noWorkspaceSelfImport = ESLintUtils.RuleCreator.withoutDocs({
	create(context) {
		const packageName = getPackageName(context.filename);
		if (!packageName) {
			return {};
		}

		function checkImportSource(
			node:
				| TSESTree.ImportDeclaration
				| TSESTree.ExportAllDeclaration
				| TSESTree.ExportNamedDeclaration,
		) {
			const source = node.source;
			if (!source) return;

			const importPath = source.value;
			if (typeof importPath !== "string") return;

			// Skip relative imports - those are fine
			if (isRelativeImport(importPath)) return;

			// Check if the import matches the current package name
			// Handle both exact matches and subpath imports
			if (
				importPath === packageName
				|| importPath.startsWith(packageName + "/")
			) {
				context.report({
					node: source,
					messageId: "self-import",
					data: {
						packageName,
					},
				});
			}
		}

		return {
			ImportDeclaration: checkImportSource,
			ExportAllDeclaration: checkImportSource,
			ExportNamedDeclaration: checkImportSource,
		};
	},
	meta: {
		docs: {
			description:
				"Disallow importing from the same workspace package by name instead of using relative imports",
		},
		type: "problem",
		schema: [],
		messages: {
			"self-import":
				"Do not import from '{{packageName}}' within the same package. Use relative imports instead.",
		},
	},
	defaultOptions: [],
});
