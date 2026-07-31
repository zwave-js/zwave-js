export function getenv(key: string): string | undefined {
	return typeof process !== "undefined" ? process.env[key] : undefined;
}

export interface RuntimeInfo {
	name: "node" | "deno" | "bun" | "other";
	/** The runtime's own version, not the Node.js version it claims compatibility with */
	version: string | undefined;
}

/** Determines which JavaScript runtime the library is executing on */
export function getRuntime(): RuntimeInfo {
	const globals = globalThis as {
		Deno?: { version?: { deno?: string } };
		Bun?: { version?: string };
	};

	// Deno and Bun both populate process.versions.node with a fabricated Node.js
	// version, so their own globals have to be checked before falling back to it
	if (typeof globals.Deno?.version?.deno === "string") {
		return { name: "deno", version: globals.Deno.version.deno };
	}
	if (typeof globals.Bun?.version === "string") {
		return { name: "bun", version: globals.Bun.version };
	}
	if (typeof process !== "undefined" && process.versions?.node) {
		return { name: "node", version: process.versions.node };
	}
	return { name: "other", version: undefined };
}
