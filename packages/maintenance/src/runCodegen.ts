/**
 * Generic codegen runner for transforming source files.
 * Used to generate auxiliary files and transform source files with TypeScript transformers.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { Project, type SourceFile } from "ts-morph";
import ts from "typescript";

const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

export interface CodegenConfig {
	/** Absolute path to the package directory */
	packageDir: string;
	/** Source directory relative to packageDir */
	srcDir: string;
	/** Output directory relative to packageDir */
	outDir: string;
	/** Path to tsconfig.json relative to packageDir */
	tsConfigPath: string;
	/**
	 * Returns transformer factories to apply for a given file path and content.
	 * Return undefined or empty array to skip transformation.
	 */
	getTransformers?: (
		filePath: string,
		content: string,
	) => ts.TransformerFactory<ts.SourceFile>[] | undefined;
	/**
	 * Generators for auxiliary files (e.g., ._validateArgs.ts, _CCValues.generated.ts).
	 * Each generator receives the ts-morph source files and srcDir.
	 * Returns a map of relative paths (from srcDir) to content.
	 */
	generateAuxiliaryFiles?: Array<
		(
			sourceFiles: SourceFile[],
			srcDir: string,
		) => Promise<Map<string, string>>
	>;
	/**
	 * What to do with unchanged source files.
	 * - "symlink": Create symlinks (default)
	 * - "copy": Copy the file
	 * - "ignore": Don't include in output
	 */
	unchangedFileHandling?: "symlink" | "copy" | "ignore";
	/**
	 * Filter function to select which source files to process.
	 * Receives relative path from srcDir.
	 * Default: excludes .test.ts files and files in /test/ directories.
	 */
	fileFilter?: (relativePath: string) => boolean;
	/**
	 * Whether to clean the output directory before generating.
	 * Set to false when updating original source files in place (srcDir === outDir).
	 * Default: true
	 */
	cleanOutDir?: boolean;
}

/**
 * Runs code generation for a package.
 * 1. Optionally cleans and recreates the output directory
 * 2. Creates a ts-morph project for type analysis
 * 3. Runs all auxiliary file generators
 * 4. Transforms source files with provided transformers
 * 5. Handles unchanged files (symlink/copy/ignore)
 */
export async function runCodegen(config: CodegenConfig): Promise<void> {
	const srcDir = path.join(config.packageDir, config.srcDir);
	const outDir = path.join(config.packageDir, config.outDir);
	const tsConfigPath = path.join(config.packageDir, config.tsConfigPath);

	// Clean and recreate output directory (unless disabled)
	if (config.cleanOutDir !== false) {
		await fs.rm(outDir, { recursive: true, force: true });
	}
	await fs.mkdir(outDir, { recursive: true });

	// Create ts-morph project for type analysis
	const project = new Project({
		tsConfigFilePath: tsConfigPath,
		compilerOptions: {
			// Use @@dev condition so ts-morph can resolve types from source files
			customConditions: ["@@dev"],
		},
	});

	// Get source files from the project and filter to srcDir
	const fileFilter = config.fileFilter
		?? ((relativePath: string) =>
			!relativePath.endsWith(".test.ts")
			&& !relativePath.includes("/test/"));

	const sourceFiles = project.getSourceFiles()
		.filter((sf) => {
			const filePath = sf.getFilePath();
			// Only include files within srcDir
			if (!filePath.startsWith(srcDir + path.sep)) return false;
			// Apply user filter
			return fileFilter(path.relative(srcDir, filePath));
		})
		.toSorted((a, b) => a.getFilePath().localeCompare(b.getFilePath()));

	// Track which files have been generated (auxiliary files)
	const generatedFiles = new Set<string>();

	// Run auxiliary file generators in parallel
	if (config.generateAuxiliaryFiles?.length) {
		const results = await Promise.all(
			config.generateAuxiliaryFiles.map((generator) =>
				generator(sourceFiles, srcDir)
			),
		);
		for (const auxiliaryFiles of results) {
			for (const [relativePath, content] of auxiliaryFiles) {
				const outPath = path.join(outDir, relativePath);
				const absolutePath = path.join(srcDir, relativePath);

				await fs.mkdir(path.dirname(outPath), { recursive: true });
				await fs.writeFile(outPath, content);
				generatedFiles.add(relativePath);
				console.log(`  Generated: ${relativePath}`);

				// Add generated file to ts-morph project so transformers can access it
				project.createSourceFile(absolutePath, content, {
					overwrite: true,
				});
			}
		}
	}

	// Process source files
	for (const sf of sourceFiles) {
		const filePath = sf.getFilePath();
		const relativePath = path.relative(srcDir, filePath);
		const outPath = path.join(outDir, relativePath);
		await fs.mkdir(path.dirname(outPath), { recursive: true });

		const content = sf.getFullText();
		const transformers = config.getTransformers?.(filePath, content);

		if (transformers?.length) {
			// Transform the file using AST transformations
			const tsSourceFile = ts.createSourceFile(
				filePath,
				content,
				ts.ScriptTarget.ESNext,
				true,
				ts.ScriptKind.TS,
			);

			// Apply transformations
			const transformResult = ts.transform(tsSourceFile, transformers);
			const transformedFile = transformResult.transformed[0];
			const printed = printer.printFile(transformedFile);
			transformResult.dispose();

			await fs.writeFile(outPath, printed);
			console.log(`  Transformed: ${relativePath}`);
		} else {
			// Handle unchanged files
			const handling = config.unchangedFileHandling ?? "symlink";
			if (handling === "ignore") {
				continue;
			} else if (handling === "copy") {
				await fs.copyFile(filePath, outPath);
			} else {
				// symlink
				const relativeToOut = path.relative(
					path.dirname(outPath),
					filePath,
				);
				try {
					await fs.symlink(relativeToOut, outPath);
				} catch (e: unknown) {
					if ((e as NodeJS.ErrnoException).code === "EEXIST") {
						await fs.unlink(outPath);
						await fs.symlink(relativeToOut, outPath);
					} else {
						throw e;
					}
				}
			}
		}
	}

	console.log(`  Processed ${sourceFiles.length} files`);
}
