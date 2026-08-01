export function getenv(key: string): string | undefined {
	return typeof process !== "undefined" ? process.env[key] : undefined;
}

/**
 * Identifies the JavaScript runtime and its version, as a bare version on Node.js
 * (e.g. `24.18.0`) and prefixed with the runtime name elsewhere (e.g. `Bun 1.3.14`).
 */
export function getRuntimeVersion(): string {
	const globals = globalThis as {
		Deno?: { version?: { deno?: string } };
		Bun?: { version?: string };
		tjs?: { version?: string };
	};

	// Deno and Bun both populate process.versions.node with a fabricated Node.js
	// version, so their own globals have to be checked before falling back to it
	if (typeof globals.Deno?.version?.deno === "string") {
		return `Deno ${globals.Deno.version.deno}`;
	}
	if (typeof globals.Bun?.version === "string") {
		return `Bun ${globals.Bun.version}`;
	}
	if (typeof globals.tjs?.version === "string") {
		return `txiki.js ${globals.tjs.version}`;
	}
	if (typeof process !== "undefined" && process.versions?.node) {
		return process.versions.node;
	}
	return "unknown";
}
