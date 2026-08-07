---
description: Automatically analyze Z-Wave JS logfiles posted in new discussions

on:
  discussion:
    types: [created, edited]
  # Discussions are created by regular users; gating happens via the
  # deterministic logfile classification below, not via repo roles
  roles: all
  reaction: none
  steps:
    - name: Checkout repository
      uses: actions/checkout@v7.0.1
      with:
        # This pre-activation job runs third-party packages; don't persist the
        # workflow token in .git for them to read
        persist-credentials: false

    - name: Setup bot scripts
      uses: zwave-js/bot-workflows/actions/setup-bot@v1

    - name: Extract log file from discussion body
      uses: actions/github-script@v9.0.0
      id: extract
      with:
        github-token: ${{ secrets.BOT_TOKEN }}
        result-encoding: string
        script: |
          const bot = require(`${process.env.BOT_SCRIPTS_DIR}/index.cjs`);
          const extractResult = await bot.extractLogfileInDiscussion({github, context});

          if (!extractResult) {
            // No log file required
            core.setOutput("shouldContinue", "false");
            return;
          }

          if (extractResult === "ERROR_FETCH" || extractResult === "ERROR_CODE_BLOCK_TOO_LONG" || extractResult === "MISSING_LOGFILE") {
            core.setOutput("shouldContinue", "false");
            await bot.ensureLogfileFeedbackInDiscussion({github, context}, extractResult);
            return;
          }

          core.setOutput("shouldContinue", "true");
          return extractResult;

    - name: Classify logfile and give feedback
      uses: actions/github-script@v9.0.0
      id: feedback
      env:
        LOGFILE: ${{ steps.extract.outputs.result }}
        SHOULD_CONTINUE: ${{ steps.extract.outputs.shouldContinue }}
      with:
        github-token: ${{ secrets.BOT_TOKEN }}
        result-encoding: string
        script: |
          if (process.env.SHOULD_CONTINUE !== "true") return "SKIP";

          const bot = require(`${process.env.BOT_SCRIPTS_DIR}/index.cjs`);
          const classification = bot.classifyLogfile(process.env.LOGFILE);
          console.log('Classification:', classification);

          const feedback = bot.classificationToFeedback(classification);
          await bot.ensureLogfileFeedbackInDiscussion({github, context}, feedback);

          return feedback;

    # The step outcome (success vs. skipped) is exposed as a pre-activation
    # output and gates the agent job below
    - name: Gate agentic analysis
      id: gate
      if: steps.feedback.outputs.result == 'OK'
      run: "true"
  permissions:
    contents: read
    discussions: write

# Only run the (expensive) agentic analysis when the pre-checks confirmed
# a valid Z-Wave JS logfile with the correct log level
if: needs.pre_activation.outputs.gate_result == 'success'

permissions:
  contents: read
  discussions: read

# The logfile extraction in the pre-activation job needs a full runner
# image for corepack/yarn
runs-on-slim: ubuntu-latest

engine: copilot

imports:
  - zwave-js/bot-workflows/workflows/shared/hardening.md@75148e07b701ca92e052212a9b7710864068ef6e
  - zwave-js/bot-workflows/workflows/shared/zwave-log-analysis.md@0fedb405bbe6acb4060d6e31f547994b28892866

steps:
  - name: Setup bot scripts
    uses: zwave-js/bot-workflows/actions/setup-bot@v1

  - name: Get logfile URL from discussion
    id: get_logfile_url
    uses: actions/github-script@v9.0.0
    with:
      github-token: ${{ secrets.BOT_TOKEN }}
      result-encoding: string
      script: |
        const bot = require(`${process.env.BOT_SCRIPTS_DIR}/index.cjs`);
        return bot.extractLogfileUrlFromDiscussion({github, context});

  - name: Download logfile
    uses: zwave-js/bot-workflows/actions/download-logfile@v1
    with:
      url: ${{ steps.get_logfile_url.outputs.result }}

safe-outputs:
  add-comment:
    discussions: true
    # Post as the bot account like the other bot comments
    github-token: ${{ secrets.BOT_TOKEN }}

# Network stays open: the log-analyzer MCP server is fetched with npx at
# startup, and the logfile is downloaded in a step above
network: defaults

timeout-minutes: 30
source: zwave-js/bot-workflows/workflows/analyze-logfile-auto.md@43d9dd67ab9c49d08c85002b35b6a02f300dde2f
---

# Z-Wave JS Logfile Analysis

A user opened a GitHub discussion asking for help and attached a Z-Wave JS driver logfile. The logfile has been downloaded to `/tmp/gh-aw/agent/logfile.log` on this runner.

This is the discussion content (sanitized):

"${{ steps.sanitized.outputs.text }}"

Determine what the user wants to know. The discussion follows a support template, so the problem is described in prose spread over sections like "Describe the issue", "Steps to reproduce the behavior" and "Device information". Read all of them. The description of what happens and what the user expected instead is the question to answer, even when the body contains no question mark and nothing phrased as a question. When a node ID is given, the problem is about that node. Screenshots are not available to you, so rely on the surrounding text.

Only when the discussion describes no concrete symptom at all, report the most severe problems you find in the log instead.

Load the logfile with the `loadLogFile` tool, then analyze it thoroughly following your analysis instructions to answer the user's question.

Finally, post your findings as a comment on the discussion using the `add_comment` safe output. You MUST pass `item_number: ${{ github.event.discussion.number }}` explicitly — automatic targeting does not work in this workflow.
