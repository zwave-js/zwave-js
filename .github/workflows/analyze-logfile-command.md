---
on:
  roles:
  - admin
  - maintainer
  - write
  slash_command:
    events:
    - issue_comment
    - discussion_comment
    name: analyze-logfile
permissions:
  contents: read
  discussions: read
  issues: read
network: defaults
imports:
- zwave-js/bot-workflows/workflows/shared/hardening.md@75148e07b701ca92e052212a9b7710864068ef6e
- zwave-js/bot-workflows/workflows/shared/zwave-log-analysis.md@75148e07b701ca92e052212a9b7710864068ef6e
safe-outputs:
  add-comment:
    discussions: true
    github-token: ${{ secrets.BOT_TOKEN }}
steps:
- env:
    COMMENT_BODY: ${{ github.event.comment.body }}
  id: parse_command
  name: Parse command
  uses: actions/github-script@v9.0.0
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
  uses: zwave-js/bot-workflows/actions/download-logfile@v1
  with:
    url: ${{ steps.parse_command.outputs.url }}
description: Analyze a Z-Wave JS logfile on demand via /analyze-logfile <url>
engine: copilot
source: zwave-js/bot-workflows/workflows/analyze-logfile-command.md@79bf914044d6d648bee4f297b63f4f4a5562ea5c
timeout-minutes: 30
---
# Z-Wave JS Logfile Analysis

A maintainer requested an analysis of a Z-Wave JS driver logfile by commenting on an issue or discussion. The logfile has been downloaded to `/tmp/gh-aw/agent/logfile.log` on this runner.

This is the query to answer about the logfile:

"${{ steps.parse_command.outputs.query }}"

If the query is empty, analyze the log file and provide insights about any issues, errors, or notable events.

Load the logfile with the `loadLogFile` tool, then analyze it thoroughly following your analysis instructions to answer the query.

Finally, post your findings as a comment on the issue or discussion using the `add-comment` safe output.
