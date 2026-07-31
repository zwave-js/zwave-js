import esbuild from "esbuild";

await esbuild.build({
	entryPoints: ["src/boot.ts"],
	bundle: true,
	// External rather than linked: txiki.js eagerly loads and parses a referenced source
	// map at startup, which costs more memory than the entire rest of the driver
	sourcemap: "external",
	outdir: "build",
	// quickjs-ng supports everything up to ES2023
	target: "es2023",
	// Keep ESM instead of an IIFE, which would put the whole bundle into a single
	// function scope and blow past quickjs's JS_MAX_LOCAL_VARS limit of 65534
	format: "esm",
	// txiki.js is neither Node nor a browser, but the browser condition selects the
	// WebCrypto-based crypto primitives and the Node-free package entry points
	platform: "neutral",
	conditions: ["browser"],
	// The neutral platform configures no main fields at all, so CommonJS-only
	// dependencies without an exports map would not resolve
	mainFields: ["module", "main"],
	// tjs: modules are provided by the runtime
	external: ["tjs:*"],
	logLevel: "info",
	logLimit: 0,
	keepNames: true,
});
