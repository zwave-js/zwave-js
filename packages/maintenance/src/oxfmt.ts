import { format, type FormatConfig } from "oxfmt";

const defaultOptions: FormatConfig = {
	printWidth: 80,
	tabWidth: 4,
	useTabs: true,
	semi: true,
	singleQuote: false,
	sortImports: {
		ignoreCase: false,
		order: "asc",
		groups: [
			["side_effect"],
			["builtin"],
			["external", "type-external"],
			["internal", "type-internal"],
			["parent", "type-parent"],
			["sibling", "type-sibling"],
			["index", "type-index"],
		],
	},
	quoteProps: "as-needed",
	trailingComma: "all",
	bracketSpacing: true,
	arrowParens: "always",
	endOfLine: "lf",
	experimentalOperatorPosition: "start",
};

export async function formatWithOxfmt(
	filename: string,
	sourceText: string,
	options?: Partial<FormatConfig>,
): Promise<string> {
	const fileOptions: FormatConfig = {};
	if (filename.endsWith(".md")) {
		fileOptions.embeddedLanguageFormatting = "off";
	}
	if (filename.endsWith("_sidebar.md")) {
		fileOptions.useTabs = false;
		fileOptions.tabWidth = 2;
	}
	const { code, errors } = await format(filename, sourceText, {
		...defaultOptions,
		...fileOptions,
		...options,
	});
	if (errors.length) {
		throw new Error(
			errors
				.map((error) => error.codeframe ?? error.message)
				.join("\n\n"),
		);
	}
	return code;
}

export async function formatDeviceConfig(
	filename: string,
	sourceText: string,
): Promise<string> {
	return formatWithOxfmt(filename, sourceText, { printWidth: 120 });
}
