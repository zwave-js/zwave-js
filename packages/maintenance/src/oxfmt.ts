import { format, type FormatConfig } from "oxfmt";

const defaultOptions: FormatConfig = {
	printWidth: 80,
	tabWidth: 4,
	useTabs: true,
	semi: true,
	singleQuote: false,
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
	const fileOptions: FormatConfig = filename.endsWith("_sidebar.md")
		? {
				useTabs: false,
				tabWidth: 2,
			}
		: {};
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
