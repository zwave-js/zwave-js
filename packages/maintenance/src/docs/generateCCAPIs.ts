/*!
 * This method returns the original source code for an interface or type so it can be put into documentation
 */

import { CommandClasses, getCCName } from "@zwave-js/core";
import { num2hex } from "@zwave-js/shared";
import c from "ansi-colors";
import esMain from "es-main";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isMainThread } from "node:worker_threads";
import { Piscina } from "piscina";
import {
	type JSDocTagStructure,
	type MethodDeclaration,
	type OptionalKind,
	Project,
	type SourceFile,
	SyntaxKind,
	type Type,
	TypeFormatFlags,
	type ts,
} from "ts-morph";
import { formatWithDprint } from "../dprint.js";
import {
	getCommandClassFromClassDeclaration,
	projectRoot,
	tsConfigFilePathForDocs as tsConfigFilePath,
} from "../tsAPITools.js";
import {
	type EmbeddedType,
	collectTypeNamesFromText,
	createTypeRenderContext,
	docsifyRoute,
	docsifySlugify,
	ensureReturnTypeNode,
	fixTypePrinterErrors,
	formatTransformedSignature,
	getJsDocDescription,
	renderEmbeddedTypesSection,
	resolveDeclByName,
	transformSignature,
	tryDistributeCompoundParameter,
	typeRegistry,
} from "./renderTypes.js";

// Support directly loading this file in a worker
import { register } from "tsx/esm/api";
register();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function stripQuotes(str: string): string {
	return str.replaceAll(/^['"]|['"]$/g, "");
}

function expectLiteralString(strType: string, context: string): void {
	if (strType === "string") {
		console.warn(
			c.yellow(
				`WARNING: Received type "string" where a string literal was expected.
		Make sure to define this string or the entire object using "as const".
		Context: ${context}`,
			),
		);
	}
}

function expectLiteralNumber(numType: string, context: string): void {
	if (numType === "number") {
		console.warn(
			c.yellow(
				`WARNING: Received type "number" where a number literal was expected.
Make sure to define this number or the entire object using "as const".
Context: ${context}`,
			),
		);
	}
}

const docsDir = path.join(projectRoot, "docs");
const ccDocsDir = path.join(docsDir, "api/CCs");
const formattedValueTypeCache = new Map<string, string>();

function fixPrinterErrors(text: string): string {
	// The text includes one too many tabs at the start of each line
	return fixTypePrinterErrors(text.replaceAll(/^\t(\t*)/gm, "$1"));
}

function printMethodDeclaration(method: MethodDeclaration): string {
	ensureReturnTypeNode(method);
	method = method.toggleModifier("public", false);
	method.getDecorators().forEach((d) => d.remove());
	const start = method.getStart();
	const end = method.getBody()!.getStart();
	const ret = method
		.getText()
		.slice(0, end - start)
		.trim() + ";";
	return fixPrinterErrors(ret);
}

function printOverload(method: MethodDeclaration): string {
	method = method.toggleModifier("public", false);
	return fixPrinterErrors(method.getText());
}

export interface CCDocFileResult {
	generatedIndex: string;
	generatedSidebar: any;
	pageRoute: string;
	embeds: EmbeddedType[];
	/** Names of all documentable types referenced on the page */
	referenced: string[];
	unresolved: Record<string, string>;
}

async function processCCDocFile(
	file: SourceFile,
	linkTargets: ReadonlyMap<string, string>,
): Promise<CCDocFileResult | undefined> {
	const APIClass = file
		.getClasses()
		.find((c) => c.getName()?.endsWith("CCAPI"));
	if (!APIClass) return;

	const ccId = getCommandClassFromClassDeclaration(
		file.compilerNode,
		APIClass.compilerNode,
	);
	if (ccId == undefined) return;
	const ccName = getCCName(ccId);
	console.log(`generating documentation for ${ccName} CC...`);

	const filename = APIClass.getName()!.replace("CCAPI", "") + ".md";
	let text = `# ${ccName} CC

?> CommandClass ID: \`${num2hex((CommandClasses as any)[ccName])}\`
`;
	const generatedIndex = `\n- [${ccName} CC](api/CCs/${filename}) · \`${
		num2hex(
			(CommandClasses as any)[ccName],
		)
	}\``;
	const generatedSidebar = `\n\t- [${ccName} CC](api/CCs/${filename})`;

	const pageRoute = `api/CCs/${filename.replace(/\.md$/, "")}`;
	const ctx = createTypeRenderContext(
		file.getProject(),
		pageRoute,
		linkTargets,
	);

	// Enumerate all useful public methods
	const ignoredMethods = new Set([
		"supportsCommand",
		"isSetValueOptimistic",
	]);
	const methods = APIClass.getInstanceMethods()
		.filter((m) => m.hasModifier(SyntaxKind.PublicKeyword))
		.filter((m) => !ignoredMethods.has(m.getName()));

	if (methods.length) {
		text += `## ${ccName} CC methods\n\n`;
	}

	for (const method of methods) {
		const signatures = method.getOverloads();
		const targets = signatures.length > 0 ? signatures : [method];
		const print = signatures.length > 0
			? printOverload
			: printMethodDeclaration;

		let printed: string[];

		// Compound options parameters read better as one overload per variant.
		// Hand-written overloads take precedence.
		const distribution = signatures.length === 0
			? (() => {
				try {
					return tryDistributeCompoundParameter(method, ctx);
				} catch {
					return undefined;
				}
			})()
			: undefined;

		if (distribution) {
			printed = distribution.variants.map((variant) => {
				const param = method
					.getParameters()[distribution.parameterIndex];
				let removedParam:
					| ReturnType<typeof param.getStructure>
					| undefined;
				if (variant.empty) {
					// The "none" branch of an optional AllOrNone parameter:
					// print the method without the parameter
					removedParam = param.getStructure();
					param.remove();
				} else {
					param
						.getTypeNodeOrThrow()
						.replaceWithText(variant.typeText);
				}
				transformSignature(method, ctx);
				const signature = formatTransformedSignature(
					printMethodDeclaration(method),
				);
				if (removedParam) {
					method.insertParameter(
						distribution.parameterIndex,
						removedParam,
					);
				}
				return variant.promotedComments.length
					? variant.promotedComments.join("\n") + "\n" + signature
					: signature;
			});
		} else {
			printed = targets.map((target) => {
				// Capture the unprocessed signature so transform failures
				// degrade to today's output instead of breaking the page
				const verbatim = print(target);
				try {
					const { changed } = transformSignature(target, ctx);
					// Overlong single lines (e.g. from inferred return types)
					// deserve wrapping even without a transformation
					const needsFormatting = changed
						|| verbatim.split("\n").some((line) =>
							line.length > 80
						);
					if (!needsFormatting) return verbatim;
					return formatTransformedSignature(print(target));
				} catch (e: any) {
					ctx.warnings.push(
						`Falling back to unprocessed signature for ${ccName}.${method.getName()}: ${e.message}`,
					);
					return verbatim;
				}
			});
		}

		text += `### \`${method.getName()}\`
\`\`\`ts
${printed.join("\n\n")}
\`\`\`

`;
		const doc = method.getStructure().docs?.[0];
		if (typeof doc === "string") {
			text += doc + "\n\n";
		} else if (doc != undefined) {
			if (typeof doc.description === "string") {
				let description = doc.description.trim();
				if (!description.endsWith(".")) {
					description += ".";
				}
				text += description + "\n\n";
			}
			if (doc.tags) {
				const paramTags = doc.tags
					.filter(
						(
							t,
						): t is OptionalKind<JSDocTagStructure> & {
							text: string;
						} => t.tagName === "param"
							&& typeof t.text === "string",
					)
					.map((t) => {
						const firstSpace = t.text.indexOf(" ");
						if (firstSpace === -1) return undefined;
						return [
							t.text.slice(0, firstSpace),
							t.text.slice(firstSpace + 1),
						] as const;
					})
					.filter((t) => !!t);

				if (paramTags.length > 0) {
					text += "**Parameters:**  \n\n";
					text += paramTags
						.map(
							([param, description]) =>
								`* \`${param}\`: ${description.trim()}`,
						)
						.join("\n");
					text += "\n\n";
				}
			}
		}
	}

	// List defined value IDs
	const valueIDsConst = (() => {
		for (const stmt of file.getVariableStatements()) {
			if (!stmt.hasExportKeyword()) continue;
			for (const decl of stmt.getDeclarations()) {
				if (decl.getName()?.endsWith("CCValues")) {
					return decl;
				}
			}
		}
	})();
	if (valueIDsConst) {
		let hasPrintedHeader = false;

		const type = valueIDsConst.getType();
		const formatValueType = (type: Type<ts.Type>): string => {
			const typeText = type.getText(
				valueIDsConst,
				TypeFormatFlags.NoTruncation,
			);
			if (formattedValueTypeCache.has(typeText)) {
				return formattedValueTypeCache.get(typeText)!;
			}
			const prefix = "type _ = ";
			let ret = formatWithDprint(
				"type.ts",
				prefix + typeText,
			)
				.trim()
				.slice(prefix.length, -1);

			// There is probably an official way to do this, but I can't find it
			ret = ret
				.replaceAll(/\(?typeof CommandClasses\)?/g, "CommandClasses")
				.replaceAll(/^(\s+)readonly /gm, "$1")
				.replaceAll(/;$/gm, ",");

			formattedValueTypeCache.set(typeText, ret);
			return ret;
		};

		const sortedProperties = type
			.getProperties()
			.toSorted((a, b) => a.getName().localeCompare(b.getName()));

		for (const value of sortedProperties) {
			let valueType = value.getTypeAtLocation(valueIDsConst);
			let callSignature = "";

			// Remember the options type before resolving dynamic values
			const optionsType = valueType
				.getPropertyOrThrow("options")
				.getTypeAtLocation(valueIDsConst);

			const getOptions = (prop: string): string =>
				optionsType
					.getPropertyOrThrow(prop)
					.getTypeAtLocation(valueIDsConst)
					.getText(valueIDsConst);

			// Do not document internal CC values
			if (getOptions("internal") === "true") continue;

			// "Unwrap" dynamic value IDs
			if (valueType.getCallSignatures().length === 1) {
				const signature = valueType.getCallSignatures()[0];

				callSignature = `(${
					signature.compilerSignature
						.declaration!.parameters.map((p) => p.getText())
						.join(", ")
				})`;

				// This used to be true. leaving it here in case it becomes true again
				// // The call signature has a single argument
				// // args: [arg1: type1, arg2: type2, ...]
				// callSignature = `(${signature
				// 	.getParameters()[0]
				// 	.getTypeAtLocation(valueIDsConst)
				// 	.getText(valueIDsConst)
				// 	// Remove the [] from the tuple
				// 	.slice(1, -1)})`;

				if (!callSignature.includes(":")) debugger;

				valueType = signature.getReturnType();
			} else if (valueType.getCallSignatures().length > 1) {
				throw new Error(
					"Type of value ID had more than 1 call signature",
				);
			}

			const idType = valueType
				.getPropertyOrThrow("endpoint")
				.getTypeAtLocation(valueIDsConst)
				.getCallSignatures()[0]
				.getReturnType();

			const metaType = valueType
				.getPropertyOrThrow("meta")
				.getTypeAtLocation(valueIDsConst);

			const getMeta = (prop: string): string =>
				metaType
					.getPropertyOrThrow(prop)
					.getTypeAtLocation(valueIDsConst)
					.getText(valueIDsConst);

			const tryGetMeta = (
				prop: string,
				onSuccess: (meta: string) => void,
			): void => {
				const symbol = metaType.getProperty(prop);
				if (symbol) {
					const type = symbol
						.getTypeAtLocation(valueIDsConst)
						.getText(valueIDsConst);
					onSuccess(type);
				}
			};

			if (!hasPrintedHeader) {
				text += `## ${ccName} CC values\n\n`;
				hasPrintedHeader = true;
			}

			const formattedValueType = formatValueType(idType);
			collectTypeNamesFromText(callSignature, ctx);
			collectTypeNamesFromText(formattedValueType, ctx);

			text += `### \`${value.getName()}${callSignature}\`

\`\`\`ts
${formattedValueType}
\`\`\`
`;

			tryGetMeta("label", (label) => {
				// If the label is definitely not dynamic, ensure it has a literal type
				if (!callSignature) {
					expectLiteralString(
						label,
						`label of value "${value.getName()}"`,
					);
				} else if (label === "string") {
					label = "_(dynamic)_";
				}
				text += `\n* **label:** ${stripQuotes(label)}`;
			});
			tryGetMeta("description", (description) => {
				// If the description is definitely not dynamic, ensure it has a literal type
				if (!callSignature) {
					expectLiteralString(
						description,
						`description of value "${value.getName()}"`,
					);
				} else if (description === "string") {
					description = "_(dynamic)_";
				}
				text += `\n* **description:** ${stripQuotes(description)}`;
			});

			// TODO: This should be moved to TypeScript somehow
			const minVersion = getOptions("minVersion");
			expectLiteralNumber(
				minVersion,
				`minVersion of value "${value.getName()}"`,
			);

			text += `
* **min. CC version:** ${minVersion}
* **readable:** ${getMeta("readable")}
* **writeable:** ${getMeta("writeable")}
* **stateful:** ${getOptions("stateful")}
* **secret:** ${getOptions("secret")}
`;

			tryGetMeta("type", (meta) => {
				text += `* **value type:** \`${meta}\`\n`;
			});
			tryGetMeta("default", (meta) => {
				text += `* **default value:** ${meta}\n`;
			});
			tryGetMeta("min", (meta) => {
				text += `* **min. value:** ${meta}\n`;
			});
			tryGetMeta("max", (meta) => {
				text += `* **max. value:** ${meta}\n`;
			});
			tryGetMeta("minLength", (meta) => {
				text += `* **min. length:** ${meta}\n`;
			});
			tryGetMeta("maxLength", (meta) => {
				text += `* **max. length:** ${meta}\n`;
			});
		}
	}

	text += renderEmbeddedTypesSection(ctx);

	for (const warning of ctx.warnings) {
		console.warn(c.yellow(`${ccName} CC: ${warning}`));
	}

	text = text.replaceAll("\r\n", "\n");
	text = formatWithDprint(filename, text);

	await fsp.writeFile(path.join(ccDocsDir, filename), text, "utf8");

	return {
		generatedIndex,
		generatedSidebar,
		pageRoute,
		embeds: [...ctx.embeds.values()],
		referenced: [...ctx.referenced.keys()],
		unresolved: Object.fromEntries(ctx.unresolved),
	};
}

/** Reads all hand-written API pages once; path → content */
async function readApiPages(): Promise<Map<string, string>> {
	const apiDocsDir = path.join(docsDir, "api");
	const files = (await fsp.readdir(apiDocsDir, { withFileTypes: true }))
		.filter((e) => e.isFile() && e.name.endsWith(".md"))
		.map((e) => path.join(apiDocsDir, e.name));
	const contents = await Promise.all(
		files.map((f) => fsp.readFile(f, "utf8")),
	);
	return new Map(files.map((f, i) => [f, contents[i]]));
}

/**
 * Detects link targets for types documented on hand-written API pages:
 * a `### TypeName` heading directly followed by an import marker and/or a
 * TS code block with the definition. Only exact-name headings are used, so
 * the plugin is never fed ambiguous data from e.g. migration guides.
 */
function collectLinkTargets(
	apiPages: ReadonlyMap<string, string>,
): Map<string, { route: string; definition?: string }> {
	const candidates = new Map<
		string,
		{ route: string; definition?: string }[]
	>();

	const headingDefinitionRegex =
		/^#{2,4}\s+(?<heading>.+?)\s*$\r?\n+(?:\s*<!-- #import (?<symbol>\w+) from ".*?".*?-->\s*\r?\n+)?(?:`{3,4}ts\r?\n(?<fence>[\s\S]*?)\r?\n`{3,4})?/gm;

	for (const [file, content] of apiPages) {
		const pagePath = path
			.relative(docsDir, file)
			.replaceAll(path.sep, "/");
		for (const match of content.matchAll(headingDefinitionRegex)) {
			const { heading, symbol, fence } = match.groups!;
			if (!symbol && !fence) continue;
			const name = symbol
				?? heading.replaceAll("`", "").trim();
			// Method and property headings also precede code fences; only
			// PascalCase headings above an actual type definition count
			if (!/^[A-Z][$\w]*$/.test(name)) continue;
			if (
				!symbol
				&& !/^(?:abstract\s+)?(?:interface|type|enum|class)\b/.test(
					fence.trim(),
				)
			) {
				continue;
			}
			if (docsifySlugify(heading) !== docsifySlugify(name)) continue;
			const route = docsifyRoute(pagePath, heading);
			if (!candidates.has(name)) candidates.set(name, []);
			candidates.get(name)!.push({
				route,
				definition: fence?.trim() || undefined,
			});
		}
	}

	const targets = new Map<string, { route: string; definition?: string }>();
	for (const [symbol, entries] of candidates) {
		// The shared types page is the canonical location
		const preferred = entries.find((e) => e.route.includes("shared-types"));
		if (preferred) {
			targets.set(symbol, preferred);
		} else if (entries.length === 1) {
			targets.set(symbol, entries[0]);
		} else {
			console.warn(
				c.yellow(
					`Type ${symbol} is documented on multiple pages (${
						entries.map((e) => e.route).join(", ")
					}) and will not be linked. Move it to the shared types page to disambiguate.`,
				),
			);
		}
	}
	return targets;
}

// Threshold for inclusion on shared-types.md; types referenced on fewer pages
// belong on the page that uses them
const SHARED_TYPE_MIN_PAGES = 2;

function auditSharedTypes(
	ccPageRefCount: ReadonlyMap<string, number>,
	apiPages: ReadonlyMap<string, string>,
): void {
	const sharedPath = path.join(docsDir, "api/shared-types.md");
	const content = apiPages.get(sharedPath);
	if (content == undefined) return;

	const entries: { name: string; fence: string }[] = [];
	const entryRegex =
		/^#{2,4}\s+`(?<name>\w+)`[\s\S]*?```ts\r?\n(?<fence>[\s\S]*?)\r?\n```/gm;
	for (const match of content.matchAll(entryRegex)) {
		entries.push({ name: match.groups!.name, fence: match.groups!.fence });
	}

	const apiContents = [...apiPages]
		.filter(([file]) => file !== sharedPath)
		.map(([, text]) => text);

	for (const { name } of entries) {
		const wordRegex = new RegExp(`\\b${name}\\b`);
		// A type used only inside another entry's definition keeps that entry
		// self-contained and earns its place regardless of standalone usage
		const isCompanion = entries.some(
			(e) => e.name !== name && wordRegex.test(e.fence),
		);
		if (isCompanion) continue;

		const ccCount = ccPageRefCount.get(name) ?? 0;
		const apiCount = apiContents.filter((text) =>
			wordRegex.test(text)
		).length;
		if (
			ccCount < SHARED_TYPE_MIN_PAGES
			&& apiCount < SHARED_TYPE_MIN_PAGES
		) {
			console.warn(
				c.yellow(
					`Type ${name} is on shared-types.md but only referenced by ${ccCount} CC page(s) and ${apiCount} API page(s). Consider embedding it on the page that uses it instead.`,
				),
			);
		}
	}
}

// Types referenced on this many CC pages without a documented definition fail the build
const UNRESOLVED_PAGE_THRESHOLD = 3;
const MAX_TOOLTIP_DEFINITION_LENGTH = 1500;

function capDefinition(definition: string): string {
	if (definition.length <= MAX_TOOLTIP_DEFINITION_LENGTH) return definition;
	return definition.slice(0, MAX_TOOLTIP_DEFINITION_LENGTH) + "\n// …";
}

/** Generates CC documentation, returns true if there was an error */
async function generateCCDocs(
	program: Project,
	piscina: Piscina,
): Promise<boolean> {
	// Delete old cruft

	// Load the index file before it gets deleted
	const indexFilename = path.join(ccDocsDir, "index.md");
	let indexFileContent = await fsp.readFile(indexFilename, "utf8");
	const indexAutoGenToken = "<!-- AUTO-GENERATE: CC List -->";
	const indexAutoGenStart = indexFileContent.indexOf(indexAutoGenToken);
	if (indexAutoGenStart === -1) {
		console.error(
			c.red(`Marker for auto-generation in CCs/index.md missing!`),
		);
		return false;
	}

	await fsp.rm(ccDocsDir, { recursive: true, force: true });
	await fsp.mkdir(ccDocsDir, { recursive: true });

	// Find CC APIs
	const ccFiles = program.getSourceFiles("packages/cc/src/cc/**/*CC.ts");
	// .filter(
	// 	(s) =>
	// 		s.getFilePath().includes("BasicCC") ||
	// 		s.getFilePath().includes("AssociationCC"),
	// );
	let generatedIndex = "";
	let generatedSidebar = "";

	const apiPages = await readApiPages();
	const linkTargets = collectLinkTargets(apiPages);
	const linkTargetRoutes = Object.fromEntries(
		[...linkTargets].map(([name, { route }]) => [name, route]),
	);

	// Process them in parallel
	const tasks = ccFiles.map((f) =>
		piscina.run(
			{ filename: f.getFilePath(), linkTargets: linkTargetRoutes },
			{ name: "processCC" },
		)
	);
	const results: (CCDocFileResult | undefined)[] = await Promise.all(tasks);

	// name → docsify route + hover definition/description for the type-links plugin
	const typeLinks = new Map<
		string,
		{ href: string; definition?: string; description?: string }
	>();
	// Conflicting embed definitions must not be linked at all
	const droppedTypeLinks = new Set<string>();
	const unresolvedPages = new Map<
		string,
		{ pages: string[]; declPath: string }
	>();
	// How many CC pages reference each type; used to audit the shared-types page
	const ccPageRefCount = new Map<string, number>();

	for (const result of results) {
		if (!result) continue;
		generatedIndex += result.generatedIndex;
		generatedSidebar += result.generatedSidebar;

		for (const name of result.referenced) {
			ccPageRefCount.set(name, (ccPageRefCount.get(name) ?? 0) + 1);
		}

		for (const embed of result.embeds) {
			if (droppedTypeLinks.has(embed.name)) continue;
			const capped = capDefinition(embed.definition);
			const existing = typeLinks.get(embed.name);
			if (!existing) {
				typeLinks.set(embed.name, {
					href: docsifyRoute(result.pageRoute, embed.name),
					definition: capped,
					description: embed.description,
				});
			} else if (existing.definition !== capped) {
				typeLinks.delete(embed.name);
				droppedTypeLinks.add(embed.name);
				console.warn(
					c.yellow(
						`Type name ${embed.name} has conflicting definitions across CC pages and will not be linked`,
					),
				);
			}
		}

		for (const [name, declPath] of Object.entries(result.unresolved)) {
			if (!unresolvedPages.has(name)) {
				unresolvedPages.set(name, { pages: [], declPath });
			}
			unresolvedPages.get(name)!.pages.push(result.pageRoute);
		}
	}

	// Hand-written pages provide the canonical definitions for shared types.
	// Their JSDoc description comes from the source declaration, so tooltips
	// carry it too.
	for (const [name, { route, definition }] of linkTargets) {
		const decl = resolveDeclByName(program, name);
		typeLinks.set(name, {
			href: route,
			definition: definition && capDefinition(definition),
			description: decl && getJsDocDescription(decl),
		});
	}
	for (const [name, strategy] of typeRegistry) {
		if (typeof strategy === "object") {
			typeLinks.set(name, { href: `#/${strategy.link}` });
		}
	}

	await fsp.mkdir(path.join(docsDir, "generated"), { recursive: true });
	await fsp.writeFile(
		path.join(docsDir, "generated/type-links.json"),
		JSON.stringify(
			Object.fromEntries(
				[...typeLinks].toSorted(([a], [b]) => a.localeCompare(b)),
			),
			undefined,
			"\t",
		) + "\n",
		"utf8",
	);

	// Warn about types on the shared-types page that are not actually shared
	auditSharedTypes(ccPageRefCount, apiPages);

	// Frequently used types must be documented somewhere
	let hasErrors = false;
	for (
		const [name, { pages, declPath }] of [...unresolvedPages].toSorted(
			(a, b) => b[1].pages.length - a[1].pages.length,
		)
	) {
		const message =
			`Type ${name} (${declPath}) is referenced on ${pages.length} CC page(s) but has no documented definition. Add it to docs/api/shared-types.md or the type registry.`;
		if (pages.length >= UNRESOLVED_PAGE_THRESHOLD) {
			console.error(c.red(message));
			hasErrors = true;
		} else {
			console.warn(c.yellow(message));
		}
	}

	// Write the generated index file and sidebar
	indexFileContent = indexFileContent.slice(
		0,
		indexAutoGenStart + indexAutoGenToken.length,
	) + generatedIndex;
	indexFileContent = formatWithDprint("index.md", indexFileContent);
	await fsp.writeFile(indexFilename, indexFileContent, "utf8");

	const sidebarInputFilename = path.join(docsDir, "_sidebar.md");
	let sidebarFileContent = await fsp.readFile(sidebarInputFilename, "utf8");
	const sidebarAutoGenToken = "<!-- AUTO-GENERATE: CC Links -->";
	const sidebarAutoGenStart = sidebarFileContent.indexOf(sidebarAutoGenToken);
	if (sidebarAutoGenStart === -1) {
		console.error(
			c.red(`Marker for CC auto-generation in _sidebar.md missing!`),
		);
		return false;
	}
	sidebarFileContent = sidebarFileContent.slice(0, sidebarAutoGenStart)
		+ generatedSidebar
		+ sidebarFileContent.slice(
			sidebarAutoGenStart + sidebarAutoGenToken.length,
		);
	sidebarFileContent = formatWithDprint("_sidebar.md", sidebarFileContent);
	await fsp.writeFile(
		path.join(ccDocsDir, "_sidebar.md"),
		sidebarFileContent,
		"utf8",
	);

	return hasErrors;
}

async function main(): Promise<void> {
	const piscina = new Piscina({
		filename: path.join(__dirname, "generateCCAPIs.ts"),
		maxThreads: 4,
	});
	const program = new Project({ tsConfigFilePath });

	// Regenerate all CC documentation files
	const hasErrors = await generateCCDocs(program, piscina);

	if (hasErrors) {
		process.exit(1);
	}
}

// To be able to use this as a worker thread, export the available methods
let _program: Project | undefined;
function getProgram(): Project {
	if (!_program) {
		_program = new Project({ tsConfigFilePath });
	}
	return _program;
}

export async function processCC(
	task: { filename: string; linkTargets: Record<string, string> },
): Promise<CCDocFileResult | undefined> {
	const program = getProgram();
	const sourceFile = program.getSourceFileOrThrow(task.filename);
	try {
		return await processCCDocFile(
			sourceFile,
			new Map(Object.entries(task.linkTargets)),
		);
	} catch (e: any) {
		throw new Error(
			`Error processing CC file: ${task.filename}\n${e.stack}`,
		);
	}
}

// If this is NOT run as a worker thread, execute the main function
if (isMainThread) {
	if (esMain(import.meta)) {
		void main();
	}
}
