// oxlint-disable prefer-set-has
import { projectRoot } from "@zwave-js/maintenance";
import { runCodegen } from "@zwave-js/maintenance/runCodegen";
import {
	createValidateArgsTransformer,
	generateValidateArgsFiles,
} from "@zwave-js/transformers/validateArgs";
import c from "ansi-colors";
import type ts from "typescript";
import { generateCCAPIInterface } from "./generateCCAPIInterface.js";
import { generateCCExports } from "./generateCCExports.js";
// import { generateCCValuesInterface } from "./generateCCValuesInterface.js";
import { generateCCValueDefinitions } from "./generateCCValueDefinitions.js";
import { createDefineCCValuesTransformer } from "./transformers/defineCCValues.js";
// import { lintCCConstructors } from "./lintCCConstructor";

const argv = process.argv.slice(2);

const transformSourceFiles = async () => {
	console.log("Transforming source files...");
	await runCodegen({
		packageDir: projectRoot,
		srcDir: "src",
		outDir: "src_gen",
		tsConfigPath: "tsconfig.json",
		getTransformers: (filePath, content) => {
			const transformers: ts.TransformerFactory<ts.SourceFile>[] = [];

			// validateArgs transformer for files importing @zwave-js/transformers
			if (content.includes("from \"@zwave-js/transformers\"")) {
				transformers.push(createValidateArgsTransformer());
			}

			// defineCCValues transformer for CC files
			if (filePath.endsWith("CC.ts")) {
				transformers.push(createDefineCCValuesTransformer());
			}

			return transformers.length > 0 ? transformers : undefined;
		},
		generateAuxiliaryFiles: [
			generateValidateArgsFiles,
		],
		unchangedFileHandling: "symlink",
	});
};

const codegen = () =>
	Promise.all([
		generateCCAPIInterface(),
		// generateCCValuesInterface(),
		generateCCExports(),
		generateCCValueDefinitions(),
	]).then(() => transformSourceFiles());

(async () => {
	if (argv.includes("codegen")) {
		await codegen();
	}
})().catch((e) => {
	console.error(c.red(e.stack));
	console.error(" ");
	process.exit(1);
});
