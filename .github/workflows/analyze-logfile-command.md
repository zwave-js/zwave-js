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

engine:
  id: copilot

imports:
  - shared/zwave-log-analysis.md

steps:
  - name: Parse command
    id: parse_command
    uses: actions/github-script@v9
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

  - name: Download logfile
    env:
      LOGFILE_URL: ${{ steps.parse_command.outputs.url }}
      LOGFILE_PATH: /tmp/gh-aw/agent/logfile.log
    run: |
      mkdir -p /tmp/gh-aw/agent
      # 2 GB is the cap for plaintext logs; the decompress step rejects
      # compressed uploads over 250 MB
      curl -fsSL --max-filesize 2147483648 --connect-timeout 15 --max-time 600 --retry 3 --retry-delay 2 -o "$LOGFILE_PATH" "$LOGFILE_URL"
      node .github/bot-scripts/decompressLogfile.cjs
      wc -l "$LOGFILE_PATH"

safe-outputs:
  add-comment:
    discussions: true
    # Post as zwave-js-bot like the other bot comments
    github-token: ${{ secrets.BOT_TOKEN }}

# The agent analyzes the downloaded logfile through the zwave-log-analyzer
# MCP server and posts via the add-comment safe output - it needs neither
# the GitHub MCP toolset nor read access to the repository through it
tools:
  github: false

# Network stays open: the log-analyzer MCP server is fetched with npx at
# startup, and the logfile is downloaded in a step above
network: defaults

timeout-minutes: 30
---

# Z-Wave JS Logfile Analysis

A maintainer requested an analysis of a Z-Wave JS driver logfile by commenting on an issue or discussion. The logfile has been downloaded to `/tmp/gh-aw/agent/logfile.log` on this runner.

This is the query to answer about the logfile:

"${{ steps.parse_command.outputs.query }}"

If the query is empty, analyze the log file and provide insights about any issues, errors, or notable events.

Load the logfile with the `loadLogFile` tool, then analyze it thoroughly following your analysis instructions to answer the query.

Finally, post your findings as a comment on the issue or discussion using the `add-comment` safe output.
