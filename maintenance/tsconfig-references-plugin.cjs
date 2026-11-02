"use strict";

const {
	plugin: workspacesPlugin,
} = require("@monorepo-utils/workspaces-to-typescript-project-references/lib/manager/workspaces");

// Workspace dependencies that must not become project references, keyed by the
// consuming package. These are built by `yarn bootstrap` instead.
const ignoredDependencies = {
	// Codegen replaces the `validateArgs` imports with generated local helpers,
	// so the compiled src_gen directory never references the transformers
	"@zwave-js/cc": ["@zwave-js/transformers"],
	// Only the tests import @zwave-js/serial. Building it requires the CC codegen, which runs this plugin
	"@zwave-js/eslint-plugin": ["@zwave-js/serial"],
};

exports.plugin = (options) => {
	const inner = workspacesPlugin(options);
	return {
		...inner,
		getDependencies(packageJSON) {
			const ignored = ignoredDependencies[packageJSON.name] ?? [];
			return inner
				.getDependencies(packageJSON)
				.filter((dep) => !ignored.includes(dep.name));
		},
	};
};
