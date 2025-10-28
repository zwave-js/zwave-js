import spawn from "nano-spawn";

const project = process.argv[2] ?? "all";
const buildArgs = process.argv
	.slice(3)
	.filter((a) => a !== "-w" && a !== "--watch");

// FIXME: Parse package.json dependency graph to figure out if codegen and/or
// partial builds are necessary, instead of hardcoding it here.
// FIXME: dependency graph is needed to create CJS builds for affected packages

// Only cc, config and projects that depend on them need codegen and partial builds
const needsNoCodegen = [
	"@zwave-js/maintenance",
	"@zwave-js/nvmedit",
	"@zwave-js/core",
	"@zwave-js/eslint-plugin",
	"@zwave-js/shared",
	"@zwave-js/transformers",
];

const hasCodegen = ["@zwave-js/cc", "@zwave-js/config", "zwave-js"];

// zwave-js is the main entry point, but there are projects that depend on it
const dependsOnZwaveJs = [
	"@zwave-js/flash",
	// The eslint plugin doesn't actually depend on zwave-js, but it needs to be built too
	"@zwave-js/eslint-plugin",
	// The bindings-browser package doesn't actually depend on zwave-js, but it needs to be built too
	"@zwave-js/bindings-browser",
	// And CLI in the future
];

const execOptions = {
	stdio: "inherit" as const,
};

async function main() {
	// Always build the maintenance project, so codegen tasks work
	console.log("Building maintenance project...");
	await spawn(
		"yarn",
		[
			"workspace",
			"@zwave-js/maintenance",
			"run",
			"build",
			"--verbose",
			...buildArgs,
		],
		execOptions,
	);

	if (needsNoCodegen.includes(project)) {
		// We built the project or more than needed, so we're done
		return;
	}

	console.log("Building transformers...");
	await spawn(
		"yarn",
		[
			"workspace",
			"@zwave-js/transformers",
			"run",
			"build",
			"--verbose",
			...buildArgs,
		],
		execOptions,
	);

	// Execute codegen tasks, so the rest can be built
	console.log();
	console.log("Running codegen tasks...");
	if (hasCodegen.includes(project)) {
		// Only codegen for the project is enough
		await spawn(
			"yarn",
			["turbo", "run", "codegen", `--filter=${project}`],
			{
				...execOptions,
				env: {
					FORCE_COLOR: "1",
				},
			},
		);
	} else {
		// Codegen for all projects that need it
		await spawn(
			"yarn",
			[
				"turbo",
				"run",
				"codegen",
				...hasCodegen.map((project) => `--filter=${project}`),
			],
			{
				...execOptions,
				env: {
					FORCE_COLOR: "1",
				},
			},
		);
	}

	if (project === "all") {
		// Simply build all projects that depend on zwave-js - this will
		// build everything
		for (const project of dependsOnZwaveJs) {
			console.log();
			console.log(`Building ${project}...`);
			await spawn(
				"yarn",
				[
					"workspace",
					project,
					"run",
					"build",
					"--verbose",
					...buildArgs,
				],
				execOptions,
			);
		}
	} else {
		// Just build the single project
		console.log();
		console.log(`Building ${project}...`);
		await spawn(
			"yarn",
			["workspace", project, "run", "build", "--verbose", ...buildArgs],
			execOptions,
		);
	}

	// Perform ESM to CJS transformation
	console.log();
	console.log(`Transpiling to CommonJS...`);
	await spawn(
		"yarn",
		["workspaces", "foreach", "--all", "--parallel", "run", "postbuild"],
		execOptions,
	);
}

main()
	.then(() => process.exit(0))
	.catch(() => process.exit(1));
