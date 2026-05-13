import path from "pathe";

/** The absolute path of the embedded configuration directory */
export const configDir = import.meta.url.startsWith("file:")
	? path.join(
		import.meta.dirname,
		/src\/[^/\\]+\.ts$/.test(import.meta.url)
			? ".."
			: "../..",
		"config",
	)
	: import.meta.resolve("/config");
