import type {
	ASTNode,
	PropertyASTNode,
	SymbolInformation,
} from "vscode-json-languageservice";
import {
	type PropertyNameASTNode,
	type PropertyValueASTNode,
	getPropertyNameFromNode,
	getPropertyValueFromNode,
	isJSONDifferentToAST,
	nodeIsPropertyNameOrValue,
	positionBeforeOrEqual,
	rangeContains,
	rangeFromNode,
} from "./astUtils.js";
import type { ConfigDocument } from "./configDocument.js";
import { type Diagnostic, DiagnosticType } from "./diagnostics.js";

// Ported from the config editor VS Code extension. Substitutions vs. the
// original: ranges stay LSP ranges (no j2vRange), and the vscode.Range/Position
// methods are replaced by rangeContains()/positionBeforeOrEqual().

type ImportNode = PropertyValueASTNode | PropertyNameASTNode;
type ImportProperty = readonly [
	name: string,
	valueNode: ASTNode | undefined,
	node: ImportNode,
];

/**
 * For each import, pairs the resolved template with the properties that follow
 * it within the same block, exist in the template, and match `predicate`.
 * Imports whose template could not be resolved, or that have no matching
 * property, are dropped.
 */
function collectImportOverrides(
	config: ConfigDocument,
	importsAndSymbolsAfter:
		readonly (readonly [ImportNode, SymbolInformation[]])[],
	predicate: (
		name: string,
		resolvedImport: Record<string, unknown>,
	) => boolean,
): (readonly [Record<string, unknown>, ImportProperty[]])[] {
	const ret: (readonly [Record<string, unknown>, ImportProperty[]])[] = [];
	for (const [imp, symbols] of importsAndSymbolsAfter) {
		const importSpecifier = getPropertyValueFromNode(imp);
		if (typeof importSpecifier !== "string") continue;
		const resolvedImport = config.templates[importSpecifier];
		if (!resolvedImport) continue;

		const properties = symbols
			.map((s) => config.getNodeFromSymbol(s))
			.filter(nodeIsPropertyNameOrValue)
			.map((n) =>
				[getPropertyNameFromNode(n), n.parent.valueNode, n] as const
			)
			.filter(([name]) => predicate(name, resolvedImport));
		if (properties.length > 0) ret.push([resolvedImport, properties]);
	}
	return ret;
}

export function generateImportOverrideDiagnostics(
	config: ConfigDocument,
): Diagnostic[] {
	const ret: Diagnostic[] = [];

	const importsInParamInformation = config.symbols
		.filter(
			(s) =>
				s.name === "$import" && s.containerName === "paramInformation",
		)
		.map((s) => config.getNodeFromSymbol(s))
		.filter(nodeIsPropertyNameOrValue);

	const importsAndContainingBlocks = importsInParamInformation
		.filter(
			(
				n,
			): n is ASTNode & {
				parent: PropertyASTNode & { parent: ASTNode };
			} => !!n?.parent?.parent,
		)
		.map((n) => [n, n.parent.parent] as const);

	const symbolsInParamInformationWithRanges = config.symbols
		.filter((s) => s.containerName === "paramInformation")
		.map((s) => [s, s.location.range] as const);

	const importsAndSymbolsAfter = importsAndContainingBlocks
		.map(([imp, block]) => {
			const blockRange = rangeFromNode(config.text, block);
			const importRange = rangeFromNode(config.text, imp);
			// We're looking for symbols within the containing block
			return [
				imp,
				symbolsInParamInformationWithRanges
					.filter(([, r]) => rangeContains(blockRange, r))
					// but after the import
					.filter(([, r]) =>
						positionBeforeOrEqual(importRange.end, r.start)
					)
					.map(([s]) => s),
			] as const;
		})
		.filter(([, s]) => s.length > 0);

	const propertiesOverwritingImports = collectImportOverrides(
		config,
		importsAndSymbolsAfter,
		(name, resolvedImport) => name in resolvedImport,
	);

	for (const [imp, properties] of propertiesOverwritingImports) {
		for (const [name, valueNode, propNode] of properties) {
			const originalValue = imp[name];

			if (valueNode && !isJSONDifferentToAST(originalValue, valueNode)) {
				ret.push({
					type: DiagnosticType.UnnecessaryImportOverride,
					range: rangeFromNode(config.text, propNode.parent),
				});
			} else {
				ret.push({
					type: DiagnosticType.ImportOverride,
					range: rangeFromNode(config.text, propNode),
					value: getPropertyValueFromNode(propNode),
					originalValue,
				});
			}
		}
	}

	// Check for allowed/minValue-maxValue conflicts across import boundaries
	const allowedAndMinMaxConflicts = collectImportOverrides(
		config,
		importsAndSymbolsAfter,
		(name, resolvedImport) =>
			(name === "allowed"
				&& ("minValue" in resolvedImport
					|| "maxValue" in resolvedImport))
			|| ((name === "minValue" || name === "maxValue")
				&& "allowed" in resolvedImport),
	);

	for (const [imp, properties] of allowedAndMinMaxConflicts) {
		for (const [name, , propNode] of properties) {
			const templateHasMinMax = "minValue" in imp || "maxValue" in imp;
			const templateHasAllowed = "allowed" in imp;

			// Template has minValue/maxValue, local has allowed -> error on allowed
			if (templateHasMinMax && name === "allowed") {
				ret.push({
					type: DiagnosticType.AllowedMinMaxConflict,
					range: rangeFromNode(config.text, propNode),
					localHasAllowed: true,
					templateHasAllowed: false,
				});
			}

			// Template has allowed, local has minValue/maxValue -> error on minValue/maxValue
			if (
				templateHasAllowed
				&& (name === "minValue" || name === "maxValue")
			) {
				ret.push({
					type: DiagnosticType.AllowedMinMaxConflict,
					range: rangeFromNode(config.text, propNode),
					localHasAllowed: false,
					templateHasAllowed: true,
				});
			}
		}
	}

	return ret;
}
