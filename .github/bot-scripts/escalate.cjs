// @ts-check

/// <reference path="types.d.ts" />

const {
	AUTO_ANALYSIS_COMMENT_TAG,
	AUTO_ANALYSIS_START_TAG,
	AUTO_ANALYSIS_END_TAG,
} = require("./utils.cjs");

/**
 * @param {{github: Github, context: Context, core: any}} param
 */
async function main(param) {
	const { github, context, core } = param;

	// Check if the discussion is still open before escalating
	// Need to fetch discussion details since webhook payload doesn't include open/closed status
	const discussionResponse = await github.graphql(
		`
		query($owner: String!, $repo: String!, $number: Int!) {
			repository(owner: $owner, name: $repo) {
				discussion(number: $number) {
					closed
				}
			}
		}
	`,
		{
			owner: context.repo.owner,
			repo: context.repo.repo,
			number: context.payload.discussion.number,
		},
	);

	if (discussionResponse.repository.discussion.closed) {
		console.log("Discussion is already closed, skipping escalation");
		return;
	}

	try {
		// Get the current date for the template
		const currentDate = new Date().toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});

		// Create a new issue referencing the original discussion using GitHub's template
		const issueTitle = context.payload.discussion.title;
		const issueBody =
			`### Discussed in https://github.com/${context.repo.owner}/${context.repo.repo}/discussions/${context.payload.discussion.number}

<div type='discussions-op-text'>

<sup>Originally posted by **@${context.payload.discussion.user.login}** ${currentDate}</sup>

${context.payload.discussion.body}

</div>`;

		// Create the issue
		const createIssueResponse = await github.rest.issues.create({
			owner: context.repo.owner,
			repo: context.repo.repo,
			title: issueTitle,
			body: issueBody,
		});

		const newIssue = createIssueResponse.data;
		core.info(`Created issue #${newIssue.number}: ${newIssue.html_url}`);

		// Find the bot's analysis comment in the discussion
		const analysisContent = await findBotAnalysisComment(github, context);

		if (analysisContent) {
			// Add the analysis to the new issue
			await github.rest.issues.createComment({
				owner: context.repo.owner,
				repo: context.repo.repo,
				issue_number: newIssue.number,
				body: `## Analysis

${analysisContent}`,
			});
			core.info("Added analysis comment to the new issue");
		}

		// Comment in the original discussion with escalation info
		const escalationComment = `Escalated to an issue: #${newIssue.number}`;

		const escalationCommentResponse = await github.graphql(
			`
			mutation addDiscussionComment($discussionId: ID!, $body: String!) {
				addDiscussionComment(input: {discussionId: $discussionId, body: $body}) {
					comment {
						id
						url
					}
				}
			}
			`,
			{
				discussionId: context.payload.discussion.node_id,
				body: escalationComment,
			},
		);

		const escalationCommentId =
			escalationCommentResponse.addDiscussionComment.comment.id;

		// Mark the escalation comment as an answer
		await github.graphql(
			`
			mutation markDiscussionCommentAsAnswer($id: ID!) {
				markDiscussionCommentAsAnswer(input: {id: $id}) {
					discussion {
						id
					}
				}
			}
			`,
			{
				id: escalationCommentId,
			},
		);

		// Close the discussion as resolved
		await github.graphql(
			`
			mutation closeDiscussion($discussionId: ID!) {
				closeDiscussion(input: {discussionId: $discussionId, reason: RESOLVED}) {
					discussion {
						id
						closed
					}
				}
			}
			`,
			{
				discussionId: context.payload.discussion.node_id,
			},
		);

		core.info(
			`Successfully escalated discussion to issue #${newIssue.number} and closed discussion`,
		);
	} catch (error) {
		core.error(`Escalation failed: ${error.message}`);
		core.setFailed(`Escalation failed: ${error.message}`);
	}
}

/**
 * Find the bot's analysis comment and extract the analysis content
 * @param {Github} github
 * @param {Context} context
 * @returns {Promise<string|null>}
 */
async function findBotAnalysisComment(github, context) {
	const queryComments = /* GraphQL */ `
		query Discussion($owner: String!, $repo: String!, $number: Int!) {
			repository(owner: $owner, name: $repo) {
				discussion(number: $number) {
					comments(first: 100) {
						nodes {
							id
							author {
								login
							}
							body
						}
					}
				}
			}
		}
	`;

	const queryVars = {
		owner: context.repo.owner,
		repo: context.repo.repo,
		number: context.payload.discussion.number,
	};

	try {
		const queryResult = await github.graphql(queryComments, queryVars);
		const comments = queryResult.repository.discussion.comments.nodes;

		// Find the comment from zwave-js-bot that contains the AUTO_ANALYSIS_COMMENT_TAG
		const botComment = comments.find(
			(c) =>
				c.author.login === "zwave-js-bot"
				&& c.body.includes(AUTO_ANALYSIS_COMMENT_TAG),
		);

		if (!botComment) {
			return null;
		}

		// Extract content between AUTO_ANALYSIS_START_TAG and AUTO_ANALYSIS_END_TAG
		const startIndex = botComment.body.indexOf(AUTO_ANALYSIS_START_TAG);
		const endIndex = botComment.body.indexOf(AUTO_ANALYSIS_END_TAG);

		if (startIndex === -1 || endIndex === -1) {
			return null;
		}

		const analysisContent = botComment.body
			.substring(startIndex + AUTO_ANALYSIS_START_TAG.length, endIndex)
			.trim();

		return analysisContent;
	} catch (error) {
		console.error("Error finding bot analysis comment:", error);
		return null;
	}
}

module.exports = main;
