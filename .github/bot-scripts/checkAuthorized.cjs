// @ts-check

/// <reference path="types.d.ts" />

const { authorizedUsers } = require("./users.cjs");

/**
 * @param {{github: Github, context: Context}} param
 */
async function main(param) {
	const { github, context } = param;
	const options = {
		owner: context.repo.owner,
		repo: context.repo.repo,
	};

	// console.log(`context.payload.issue:`);
	// console.dir(context.payload.issue);

	let isAuthorized;
	const user = context.payload.comment?.user?.login;
	if (!user) {
		console.log("No user found in comment");
		return false;
	}

	if (context.payload.discussion) {
		// Comment appears in a discussion
		console.log("Comment appears in a discussion");

		// In discussions, only the authorized users may execute any commands
		console.log(`Authorized users: ${authorizedUsers.join(", ")}`);
		console.log(`Commenting user: ${user}`);
		isAuthorized = authorizedUsers.includes(user);
		console.log(`Is authorized: ${isAuthorized}`);
	} else if (
		context.payload.issue?.html_url?.includes("/pull/")
	) {
		console.log("Comment appears in a PR, retrieving PR info...");
		// Only the pull request author and authorized users may execute this command
		const { data: pull } = await github.rest.pulls.get({
			...options,
			pull_number: context.payload.issue.number,
		});

		const allowed = [...authorizedUsers, pull.user.login];
		console.log(`Authorized users: ${allowed.join(", ")}`);
		console.log(`Commenting user: ${user}`);
		isAuthorized = allowed.includes(user);
		console.log(`Is authorized: ${isAuthorized}`);
	} else {
		// In issues, only the authorized users may execute any commands
		console.log("Comment appears in an issue");

		console.log(`Authorized users: ${authorizedUsers.join(", ")}`);
		console.log(`Commenting user: ${user}`);
		isAuthorized = authorizedUsers.includes(user);
		console.log(`Is authorized: ${isAuthorized}`);
	}

	if (isAuthorized) {
		// Let the user know we're working on it
		if (context.payload.discussion) {
			// For discussions, use GraphQL API to add reaction
			if (context.payload.comment?.node_id) {
				await github.graphql(
					`
					mutation($subjectId: ID!, $content: ReactionContent!) {
						addReaction(input: {subjectId: $subjectId, content: $content}) {
							reaction {
								content
							}
						}
					}
				`,
					{
						subjectId: context.payload.comment.node_id,
						content: "ROCKET",
					},
				);
			}
		} else if (context.payload.comment?.id) {
			// For issues/PRs, use REST API
			await github.rest.reactions.createForIssueComment({
				...options,
				comment_id: context.payload.comment.id,
				content: "rocket",
			});
		}
	} else {
		// Let the user know he can't do that
		if (context.payload.discussion?.node_id) {
			// For discussions, use GraphQL API to add comment
			await github.graphql(
				`
					mutation($discussionId: ID!, $body: String!) {
						addDiscussionComment(input: {discussionId: $discussionId, body: $body}) {
							comment {
								id
							}
						}
					}
				`,
				{
					discussionId: context.payload.discussion.node_id,
					body: `Sorry ${user}, you're not authorized to do that 🙁!`,
				},
			);
		} else if (context.payload.issue?.number) {
			// For issues/PRs, use REST API
			await github.rest.issues.createComment({
				...options,
				issue_number: context.payload.issue.number,
				body: `Sorry ${user}, you're not authorized to do that 🙁!`,
			});
		}
	}
	return isAuthorized;
}
module.exports = main;
