/**
 * Transformer to replace the CC value definition `V.defineCCValues(CommandClasses.Basic, { ... })`
 * with an import and an export statement
 */

import path from "node:path";
import ts from "typescript";

/**
 * Creates a transformer that transforms V.defineCCValues() declarations in CC files:
 * Replaces `export const FooCCValues = V.defineCCValues(...)` with:
 * - `import { FooCCValues } from "./_CCValues.generated.js";`
 * - `export { FooCCValues };`
 */
export function createDefineCCValuesTransformer(): ts.TransformerFactory<
	ts.SourceFile
> {
	return (context: ts.TransformationContext) => (file: ts.SourceFile) => {
		// Bail early if the filename does not end with "CC.ts"
		if (!file.fileName.endsWith("CC.ts")) {
			return file;
		}

		const ccValuesDeclaration = file.statements
			.filter((s): s is ts.VariableStatement =>
				s.kind === ts.SyntaxKind.VariableStatement
			)
			.filter((s) =>
				s.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)
			)
			.find((s) =>
				s.declarationList.declarations.some(
					(d) =>
						d.name.getText(file).endsWith("CCValues")
						&& d.initializer?.getText(file).startsWith(
							"V.defineCCValues",
						),
				)
			);

		if (!ccValuesDeclaration) return file;

		const valueDeclarationName = ccValuesDeclaration.declarationList
			.declarations
			.find((d) => d.name.getText(file).endsWith("CCValues"))
			?.name.getText(file);

		if (!valueDeclarationName) return file;

		const f = context.factory;

		// Find the correct path to import from
		let importLocation = "";
		let currentDir = path.dirname(file.fileName);
		while (!currentDir.endsWith("cc")) {
			importLocation += "../";
			currentDir = path.dirname(currentDir);
		}
		importLocation ||= "./";
		importLocation += "_CCValues.generated.js";

		const statementIndex = file.statements.indexOf(ccValuesDeclaration);
		const importStatement = f.createImportDeclaration(
			undefined,
			f.createImportClause(
				undefined,
				undefined,
				f.createNamedImports([
					f.createImportSpecifier(
						false,
						undefined,
						f.createIdentifier(valueDeclarationName),
					),
				]),
			),
			f.createStringLiteral(importLocation),
			undefined,
		);
		const exportStatement = f.createExportDeclaration(
			undefined,
			false,
			f.createNamedExports([
				f.createExportSpecifier(
					false,
					undefined,
					f.createIdentifier(valueDeclarationName),
				),
			]),
			undefined,
			undefined,
		);

		return f.updateSourceFile(file, [
			...file.statements.slice(0, statementIndex),
			importStatement,
			exportStatement,
			...file.statements.slice(statementIndex + 1),
		]);
	};
}
