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
    run: |
      mkdir -p /tmp/gh-aw/agent
      curl -fsSL --max-filesize 52428800 --connect-timeout 15 --max-time 120 --retry 3 --retry-delay 2 -o /tmp/gh-aw/agent/logfile.log "$LOGFILE_URL"
      wc -l /tmp/gh-aw/agent/logfile.log

safe-outputs:
  add-comment:
    discussions: true

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
