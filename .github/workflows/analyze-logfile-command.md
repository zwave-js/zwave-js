---
description: Analyze a Z-Wave JS logfile on demand via /analyze-logfile <url>

on:
  slash_command:
    name: analyze-logfile
    events: [issue_comment, discussion_comment]
  # Only maintainers may trigger the analysis
  roles: [admin, maintainer, write]

permissions:
  contents: read
  discussions: read
  issues: read

engine: copilot

imports:
  - zwave-js/bot-workflows/workflows/shared/hardening.md@75148e07b701ca92e052212a9b7710864068ef6e
  - zwave-js/bot-workflows/workflows/shared/zwave-log-analysis.md@84a2fbd5f9604b357c8615466c3aaa86fad58d8e

steps:
  - name: Parse command
    id: parse_command
    uses: actions/github-script@v9.0.0
    env:
      COMMENT_BODY: ${{ github.event.comment.body }}
    with:
      script: |
        const body = process.env.COMMENT_BODY ?? "";
        const match =
          /^\/analyze-logfile\s+(?<url>https?:\/\/\S+)\s*\n?(?<query>[\s\S]*)/m
            .exec(body);
        if (!match?.groups?.url) {
          core.setFailed(
            "No valid URL provided. Please use the format: /analyze-logfile <url>",
          );
          return;
        }
        core.setOutput("url", match.groups.url.trim());
        core.setOutput("query", (match.groups.query || "").trim());
        // The safeoutputs MCP server runs in a container without the GitHub
        // event context, so add_comment cannot auto-target the triggering
        // item. Pass the target through to the prompt instead.
        core.setOutput(
          "item_number",
          context.payload.discussion?.number ?? context.payload.issue?.number,
        );
        core.setOutput("reply_to_id", context.payload.comment?.node_id ?? "");

  - name: Download logfile
    uses: zwave-js/bot-workflows/actions/download-logfile@v1
    with:
      url: ${{ steps.parse_command.outputs.url }}

safe-outputs:
  add-comment:
    discussions: true
    # Post as the bot account like the other bot comments
    github-token: ${{ secrets.BOT_TOKEN }}

# Network stays open: the log-analyzer MCP server is fetched with npx at
# startup, and the logfile is downloaded in a step above
network: defaults

timeout-minutes: 30
source: zwave-js/bot-workflows/workflows/analyze-logfile-command.md@53b6db7db2a2157e33b684f0609a3b021d918163
---

# Z-Wave JS Logfile Analysis

A maintainer requested an analysis of a Z-Wave JS driver logfile by commenting on an issue or discussion. The logfile has been downloaded to `/tmp/gh-aw/agent/logfile.log` on this runner.

This is the query to answer about the logfile:

"${{ steps.parse_command.outputs.query }}"

If the query is empty, analyze the log file and provide insights about any issues, errors, or notable events.

Load the logfile with the `loadLogFile` tool, then analyze it thoroughly following your analysis instructions to answer the query.

Finally, post your findings as a comment using the `add_comment` safe output. You MUST pass `item_number: ${{ steps.parse_command.outputs.item_number }}` explicitly — automatic targeting does not work in this workflow. If the following comment node ID is not empty, also pass it as `reply_to_id` so the findings appear as a threaded reply to the command: "${{ steps.parse_command.outputs.reply_to_id }}"
