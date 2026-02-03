/*
	Note to future self:

	If ESLint is ever extremely slow again, check if there are .js and/or .map files in the source directories
	and delete them:

	```bash
	find . -type f -name "*.map" | grep ./packages | grep /src/ | xargs -n1 rm
	find . -type f -name "*.js" | grep ./packages | grep /src/ | xargs -n1 rm
	```

	Running `TIMING=1 DEBUG=eslint:cli-engine yarn run lint:ts` helps detect the problem
*/

// @ts-check

import zjs from "@zwave-js/eslint-plugin";
import tseslint from "typescript-eslint";

import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type import("typescript-eslint").FlatConfig.LanguageOptions */
const tsparser = {
	parser: tseslint.parser,
	parserOptions: {
		project: "tsconfig.all.json",
		tsconfigRootDir: __dirname,
	},
};

/** @type import("typescript-eslint").FlatConfig.LanguageOptions */
const tsparser_browser = {
	parser: tseslint.parser,
	parserOptions: {
		project: "tsconfig.browser.json",
		tsconfigRootDir: __dirname,
	},
};

export default tseslint.config(
	{
		ignores: [
			"**/node_modules",
			"**/build",
			"**/*.js",
			"**/*.cjs",
			"**/*.mjs",
			// Ignore the browser bindings for now
			"packages/bindings-browser/**/*.ts",
			// And the editor extension
			".vscode/extensions/**",
			// Remove warning on this config file
			"eslint.config.mjs",
		],
	},
	{
		plugins: {
			"@zwave-js": zjs,
		},
		languageOptions: tsparser,
	},
	// Make sure we're not misusing Bytes.from
	{
		files: ["packages/**/*.ts"],
		rules: {
			"@zwave-js/no-unnecessary-bytes-from": "error",
		},
	},
	// Prevent self-imports in the CC package
	{
		files: ["packages/cc/src/**/*.ts"],
		rules: {
			"@zwave-js/no-workspace-self-import": "error",
		},
	},
	// Disable unnecessarily strict rules for test files
	{
		files: ["**/*.test.ts"],
		rules: {
			// Prevent debug logging in checked in tests
			"@zwave-js/no-debug-in-tests": "error",
			// Ensure consistent nodeId usage in MockNodeBehavior
			"@zwave-js/consistent-mock-node-behaviors": "error",
		},
	},
	{
		// Avoid import issues at runtime. It should be enough to do this in the barrel files
		files: [
			"packages/*/src/index.ts",
			"packages/*/src/index_*.ts",
		],
		languageOptions: tsparser,
		rules: {
			"@zwave-js/no-forbidden-imports": "error",
		},
	},
	// Enable CC-specific custom rules
	{
		files: ["packages/cc/src/**/*CC.ts"],
		rules: {
			"@zwave-js/ccapi-validate-args": "error",
			"@zwave-js/no-internal-cc-types": "error",
		},
	},
	{
		files: ["packages/cc/src/**"],
		rules: {
			"@zwave-js/consistent-cc-classes": "error",
		},
	},
	// Enable consistent mock node behaviors for mock CC behaviors
	{
		files: ["packages/zwave-js/src/lib/node/mockCCBehaviors/**/*.ts"],
		rules: {
			"@zwave-js/consistent-mock-node-behaviors": "error",
		},
	},
	// {
	// FIXME: Migrate these to oxlint
	// 	files: ["packages/**/*.ts"],
	// 	rules: {
	// 		"@zwave-js/no-forbidden-imports": "error",
	// 		"@zwave-js/consistent-import-declarations": "error",
	// 	},
	// },
	// Make sure that the browser barrel files are parsed with the correct conditions. This must come last.
	{
		files: ["packages/**/*.browser.ts", "packages/**/index_browser.ts"],
		languageOptions: tsparser_browser,
	},
);
