import { fileURLToPath } from "node:url";
import path from "pathe";

/** Returns the absolute path of the embedded configuration directory */
export function getConfigDir(): string {
	return import.meta.url.startsWith("file:")
		? path.join(
			path.dirname(fileURLToPath(import.meta.url)),
			/src\/[^/\\]+\.ts$/.test(import.meta.url)
				? ".."
				: "../..",
			"config",
		)
		: import.meta.resolve("/config");
}
