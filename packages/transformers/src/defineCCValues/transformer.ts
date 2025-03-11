import path from "node:path";
import { type PluginConfig, type TransformerExtras } from "ts-patch";
import type ts from "typescript";

/**
 * Transformer to replace the CC value definition `V.defineCCValues(CommandClasses.Basic, { ... })`
 * with an import and an export statement
 */
export default function transformer(
	program: ts.Program,
	_pluginConfig: PluginConfig,
	{ ts: t }: TransformerExtras,
): ts.TransformerFactory<ts.SourceFile> {
	const compilerOptions = program.getCompilerOptions();
	// Only enable the transforms if the custom condition is not set
	// Not sure why, but otherwise the LSP has issues and moving the transforms
	// to tsconfig.build.json results in some type references not working
	const shouldTransform = !compilerOptions.customConditions?.includes("@@dev")
		|| compilerOptions.customConditions?.includes("@@test_transformers");

	return (context: ts.TransformationContext) => (file: ts.SourceFile) => {
		if (!shouldTransform) return file;

		// Bail early if the filename does not end with "CC.ts"
		if (!file.fileName.endsWith("CC.ts")) {
			return file;
		}

		const ccValuesDeclaration = file.statements.filter((
			s,
		): s is ts.VariableStatement =>
			s.kind === t.SyntaxKind.VariableStatement
		)
			.filter((s) =>
				s.modifiers?.some((m) => m.kind === t.SyntaxKind.ExportKeyword)
			)
			.find((s) =>
				s.declarationList.declarations.some((d) =>
					d.name.getText().endsWith("CCValues")
					&& d.initializer?.getText(file).startsWith(
						"V.defineCCValues",
					)
				)
			);
		if (!ccValuesDeclaration) return file;

		const valueDeclarationName = ccValuesDeclaration.declarationList
			.declarations.find((d) => d.name.getText().endsWith("CCValues"))
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
				false,
				undefined,
				f.createNamedImports([f.createImportSpecifier(
					false,
					undefined,
					f.createIdentifier(valueDeclarationName),
				)]),
			),
			f.createStringLiteral(importLocation),
			undefined,
		);
		const exportStatement = f.createExportDeclaration(
			undefined,
			false,
			f.createNamedExports([f.createExportSpecifier(
				false,
				undefined,
				f.createIdentifier(valueDeclarationName),
			)]),
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
