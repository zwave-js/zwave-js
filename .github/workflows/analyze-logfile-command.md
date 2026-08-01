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
- zwave-js/bot-workflows/workflows/shared/hardening.md@main
- zwave-js/bot-workflows/workflows/shared/zwave-log-analysis.md@main
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
- 
  name: Download logfile
  uses: ./.github/actions/download-logfile
  with:
      url: ${{ steps.parse_command.outputs.url }}
description: Analyze a Z-Wave JS logfile on demand via /analyze-logfile <url>
engine: copilot
source: zwave-js/bot-workflows/workflows/analyze-logfile-command.md@d0de475bbe438b313321e0b1a22cbcbc8b3634a9
timeout-minutes: 30
---
# Z-Wave JS Logfile Analysis

A maintainer requested an analysis of a Z-Wave JS driver logfile by commenting on an issue or discussion. The logfile has been downloaded to `/tmp/gh-aw/agent/logfile.log` on this runner.

This is the query to answer about the logfile:

"${{ steps.parse_command.outputs.query }}"

If the query is empty, analyze the log file and provide insights about any issues, errors, or notable events.

Load the logfile with the `loadLogFile` tool, then analyze it thoroughly following your analysis instructions to answer the query.

Finally, post your findings as a comment on the issue or discussion using the `add-comment` safe output.
