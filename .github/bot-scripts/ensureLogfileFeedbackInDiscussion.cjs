// @ts-check

/// <reference path="types.d.ts" />

const LOGFILE_COMMENT_TAG = "<!-- LOGFILE_COMMENT_TAG -->";

/**
 * @param {{github: Github, context: Context}} param
 * @param {string} feedback
 */
async function main(param, feedback) {
	const { github, context } = param;

	const discussion = context.payload.discussion;
	if (!discussion) return;

	const user = discussion.user.login;

	let message = "";
	switch (feedback) {
		case "OK":
			// No message needed, all is good
			message = "";
			break;

		case "ERROR_FETCH":
			message = `👋 Hey @${user}!

I was not able to download the logfile you provided. Please make sure the link is correct.
`;
			break;

		case "ERROR_CODE_BLOCK_TOO_LONG":
			message = `👋 Hey @${user}!

It looks like you copied the contents of a logfile. Please attach it as a file instead, so it is easier to work with.
_Note: You can just drag & drop files into the textbox. Just make sure to use a supported file extension like \`.log\` or \`.txt\`_
`;
			break;

		case "WRONG_LOG_LEVEL":
			message = `👋 Hey @${user}!

It looks like you attached a Z-Wave JS driver log, but with the wrong loglevel. Please make sure to set the loglevel to "Debug" when making a [driver log](https://zwave-js.github.io/zwave-js-ui/#/troubleshooting/generating-logs?id=driver-logs).
`;
			break;

		case "Z_UI":
			message = `👋 Hey @${user}!

It looks like you attached a Z-Wave JS UI log instead of a [driver log](https://zwave-js.github.io/zwave-js-ui/#/troubleshooting/generating-logs?id=driver-logs). Also remember to set the loglevel to "Debug".
`;
			break;

		case "HA_ONLY":
			message = `👋 Hey @${user}!

It looks like you attached a Home Assistant log that does not include Z-Wave JS driver logs.

As a reminder, here's how to create the correct logfile:
[Home Assistant Z-Wave Integration](https://www.home-assistant.io/integrations/zwave_js#how-do-i-access-the-z-wave-logs)
`;
			break;

		default:
			message = `👋 Hey @${user}!

It looks like you attached a logfile, but it doesn't look like it a **driver log** that came from Z-Wave JS.

Please double-check that you uploaded the correct logfile. If you did, disregard this comment.

As a reminder, here's how to create one:

- [Z-Wave JS  UI](https://zwave-js.github.io/zwave-js-ui/#/troubleshooting/generating-logs?id=driver-logs)
- [Home Assistant Z-Wave Integration](https://www.home-assistant.io/integrations/zwave_js#how-do-i-access-the-z-wave-logs)
- [ioBroker.zwave2 Adapter](https://github.com/AlCalzone/ioBroker.zwave2/blob/master/docs/en/troubleshooting.md#providing-the-necessary-information-for-an-issue)
`;
	}

	// Check if there is a comment from the bot already
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
			
							# replies(first: 100) {
							#   nodes {
							#     id
							#     author {
							#       login
							#     }
							#     body
							#   }
							# }
						}
					}
				}
			}
		}
	`;
	const updateCommentQuery = /* GraphQL */ `
		mutation updateComment($commentId: ID!, $body: String!) {
			updateDiscussionComment(input: {commentId: $commentId, body: $body}) {
				comment {
					id
				}
			}
		}
	`;
	const queryVars = {
		owner: context.repo.owner,
		repo: context.repo.repo,
		number: discussion.number,
	};

	try {
		// Existing comments are tagged with LOGFILE_COMMENT_TAG
		const queryResult = await github.graphql(queryComments, queryVars);
		const comments = queryResult.repository.discussion.comments.nodes;

		const existing = comments.find(
			(c) =>
				c.author.login === "zwave-js-bot"
				&& c.body.includes(LOGFILE_COMMENT_TAG),
		);

		if (existing) {
			message ||= "All good now, thanks!" + LOGFILE_COMMENT_TAG;

			// Update the existing comment
			const updateCommentVars = {
				commentId: existing.id,
				body: message,
			};

			await github.graphql(
				updateCommentQuery,
				updateCommentVars,
			);

			return;
		} else if (!message) {
			// No need to have a comment, all is ok
			console.log("No message to post, no need for a comment");
			return;
		}
	} catch {
		// Ok make a new one maybe
	}

	// Tag the message so it's easier to find the comments later
	message += LOGFILE_COMMENT_TAG;

	const addCommentQuery = /* GraphQL */ `
		mutation reply($discussionId: ID!, $body: String!) {
			addDiscussionComment(input: {discussionId: $discussionId, body: $body}) {
				comment {
					id
				}
			}
		}
	`;
	const addCommentVars = {
		discussionId: discussion.node_id,
		body: message,
	};

	await github.graphql(addCommentQuery, addCommentVars);
}

module.exports = main;
