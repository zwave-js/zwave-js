import { ESLintUtils, type TSESTree } from "@typescript-eslint/utils";
import fs from "node:fs";
import path from "node:path";

interface PackageInfo {
	packageName: string;
	packageDir: string;
}

const packageInfoCache = new Map<string, PackageInfo | undefined>();

function getPackageInfo(filename: string): PackageInfo | undefined {
	// Find the package directory by looking for package.json
	let dir = path.dirname(filename);
	while (dir !== path.dirname(dir)) {
		if (packageInfoCache.has(dir)) {
			return packageInfoCache.get(dir);
		}

		const packageJsonPath = path.join(dir, "package.json");
		if (fs.existsSync(packageJsonPath)) {
			try {
				const packageJson = JSON.parse(
					fs.readFileSync(packageJsonPath, "utf8"),
				);
				const info: PackageInfo = {
					packageName: packageJson.name,
					packageDir: dir,
				};
				packageInfoCache.set(dir, info);
				return info;
			} catch {
				packageInfoCache.set(dir, undefined);
				return undefined;
			}
		}
		dir = path.dirname(dir);
	}
	return undefined;
}

function isRelativeImport(source: string): boolean {
	return source.startsWith("./") || source.startsWith("../");
}

export const noWorkspaceSelfImport = ESLintUtils.RuleCreator.withoutDocs({
	create(context) {
		const packageInfo = getPackageInfo(context.filename);
		if (!packageInfo) {
			return {};
		}

		const { packageName } = packageInfo;

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
