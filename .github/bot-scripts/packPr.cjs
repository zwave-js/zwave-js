// Publishes PR builds to npm

// @ts-check
/// <reference path="../bot-scripts/types.d.ts" />

const exec = require("@actions/exec");
const semver = require("semver");

/**
 * @param {{github: Github, context: Context}} param
 */
async function main(param) {
	const { github, context } = param;

	const pr = Number(process.env.PR_NUMBER);
	const version = process.env.VERSION;

	if (!pr || !version) {
		throw new Error("Missing required env variables PR_NUMBER or VERSION");
	}

	const options = {
		owner: context.repo.owner,
		repo: context.repo.repo,
	};

	let success = false;
	try {
		// Build it
		await exec.exec("yarn", ["run", "build"]);

		// Bump versions
		await exec.exec(
			"yarn",
			`workspaces foreach --all version ${version} --deferred`.split(" "),
		);
		await exec.exec("yarn", ["version", "apply", "--all"]);

		// Publish packages (OIDC authentication is handled by the workflow)
		await exec.exec(
			"yarn",
			`workspaces foreach --all -vti --no-private npm publish --tolerate-republish --tag next`
				.split(" "),
		);
		success = true;
	} catch (e) {
		console.error(e.message);
	}

	if (success) {
		github.rest.issues.createComment({
			...options,
			issue_number: pr,
			body: `🎉 The packages have been published.
You can now install the test version with
\`\`\`
yarn add zwave-js@${version}
\`\`\``,
		});
	} else {
		github.rest.issues.createComment({
			...options,
			issue_number: pr,
			body: `😥 Unfortunately I could not publish the new packages. Check out the logs to see what went wrong.`,
		});
	}
}

module.exports = main;
