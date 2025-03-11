import fs from "node:fs/promises";
import { Project, SyntaxKind } from "ts-morph";

async function main() {
	const project = new Project({
		tsConfigFilePath: "packages/cc/tsconfig.json",
	});
	// project.addSourceFilesAtPaths("packages/cc/src/cc/**/*CC.ts");

	const sourceFiles = project.getSourceFiles().filter((file) =>
		file.getBaseNameWithoutExtension().endsWith("CC")
	);
	for (const file of sourceFiles) {
		// const filePath = path.relative(process.cwd(), file.getFilePath());

		const ccValuesDeclaration = file.getDescendantsOfKind(
			SyntaxKind.VariableDeclaration,
		).find((decl) => decl.getName().endsWith("CCValues"));

		const objectDotFreeze = ccValuesDeclaration?.getInitializerIfKind(
			SyntaxKind.CallExpression,
		)?.getExpressionIfKind(SyntaxKind.PropertyAccessExpression);
		if (objectDotFreeze?.getText() !== "Object.freeze") {
			continue;
		}

		const topLevelCallExpr = objectDotFreeze.getParentIfKind(
			SyntaxKind.CallExpression,
		);
		if (!topLevelCallExpr) continue;

		const defineCalls = ccValuesDeclaration
			?.getDescendantsOfKind(SyntaxKind.CallExpression)
			.filter((node) =>
				node.getExpression().getText() === "V.defineStaticCCValues"
				|| node.getExpression().getText()
					=== "V.defineDynamicCCValues"
			);
		if (!defineCalls?.length) continue;

		const firstDefineCallArg = defineCalls[0].getArguments()[0];
		const ccEnum =
			// CommandClasses.XYZ
			firstDefineCallArg?.asKind(SyntaxKind.PropertyAccessExpression)
			// CommandClasses["XYZ"]
			|| firstDefineCallArg?.asKind(SyntaxKind.ElementAccessExpression);
		if (ccEnum?.getExpression().getText() !== "CommandClasses") {
			continue;
		}

		const spreadsInDefineCalls = defineCalls
			.map((call) =>
				call.getArguments()[1].asKind(
					SyntaxKind.ObjectLiteralExpression,
				)
			)
			.filter((obj) => obj != undefined)
			.flatMap((obj) =>
				obj.getDescendantsOfKind(SyntaxKind.SpreadAssignment)
					.filter((s) =>
						s.getExpressionIfKind(SyntaxKind.CallExpression)
							?.getText().startsWith("V.")
					)
			);

		topLevelCallExpr.insertArgument(
			0,
			ccEnum.getText(),
		);

		topLevelCallExpr.getArguments()[1].replaceWithText(
			`{${
				spreadsInDefineCalls.map((s) => `\n${s.getText()}`).join(",")
			}\n}`,
		);

		objectDotFreeze.replaceWithText("V.defineCCValues");

		await file.save();
	}
}

void main().catch(async (e) => {
	await fs.writeFile(`${e.filePath}.old`, e.oldText);
	await fs.writeFile(`${e.filePath}.new`, e.newText);
	console.error(`Error refactoring file ${e.filePath}
  old text: ${e.filePath}.old
  new text: ${e.filePath}.new`);

	process.exit(1);
});
