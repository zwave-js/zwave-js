import { format, type FormatOptions } from "oxfmt";

const defaultOptions: FormatOptions = {
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
};

export async function formatWithOxfmt(
	filename: string,
	sourceText: string,
	options?: Partial<FormatOptions>,
): Promise<string> {
	const { code } = await format(filename, sourceText, {
		...defaultOptions,
		...options,
	});
	return code;
}

export async function formatDeviceConfig(
	filename: string,
	sourceText: string,
): Promise<string> {
	return formatWithOxfmt(filename, sourceText, { printWidth: 120 });
}
