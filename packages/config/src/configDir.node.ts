import { fileURLToPath } from "node:url";
import path from "pathe";

/** The absolute path of the embedded configuration directory */
export const configDir = import.meta.url.startsWith("file:")
	? path.join(
		path.dirname(fileURLToPath(import.meta.url)),
		import.meta.url.endsWith("src/utils.ts")
			? ".."
			: "../..",
		"config",
	)
	: import.meta.resolve("/config");
