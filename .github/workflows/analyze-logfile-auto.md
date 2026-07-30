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
      uses: actions/checkout@v6

    - name: Enable Corepack
      run: corepack enable

    - name: Setup Node.js
      uses: actions/setup-node@v6
      with:
        node-version: 22
        cache: 'yarn'

    # Provides fflate for decompressing zipped logfile uploads
    - name: Install dependencies
      run: yarn workspaces focus @zwave-js/mcp-server-dev --production

    - name: Extract log file from discussion body
      uses: actions/github-script@v9
      id: extract
      with:
        github-token: ${{ secrets.BOT_TOKEN }}
        result-encoding: string
        script: |
          const bot = require(`${process.env.GITHUB_WORKSPACE}/.github/bot-scripts/index.cjs`);
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
      uses: actions/github-script@v9
      id: feedback
      env:
        LOGFILE: ${{ steps.extract.outputs.result }}
        SHOULD_CONTINUE: ${{ steps.extract.outputs.shouldContinue }}
      with:
        github-token: ${{ secrets.BOT_TOKEN }}
        result-encoding: string
        script: |
          if (process.env.SHOULD_CONTINUE !== "true") return "SKIP";

          const bot = require(`${process.env.GITHUB_WORKSPACE}/.github/bot-scripts/index.cjs`);
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

engine:
  id: copilot

imports:
  - shared/zwave-log-analysis.md

steps:
  - name: Checkout repository
    uses: actions/checkout@v6
    with:
      persist-credentials: false

  - name: Get logfile URL from discussion
    id: get_logfile_url
    uses: actions/github-script@v9
    with:
      github-token: ${{ secrets.BOT_TOKEN }}
      result-encoding: string
      script: |
        const bot = require(`${process.env.GITHUB_WORKSPACE}/.github/bot-scripts/index.cjs`);
        return bot.extractLogfileUrlFromDiscussion({github, context});

  - name: Download logfile
    env:
      LOGFILE_URL: ${{ steps.get_logfile_url.outputs.result }}
    run: |
      mkdir -p /tmp/gh-aw/agent
      curl -fsSL --max-filesize 52428800 --connect-timeout 15 --max-time 120 --retry 3 --retry-delay 2 -o /tmp/gh-aw/agent/logfile.log "$LOGFILE_URL"
      wc -l /tmp/gh-aw/agent/logfile.log

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

A user opened a GitHub discussion asking for help and attached a Z-Wave JS driver logfile. The logfile has been downloaded to `/tmp/gh-aw/agent/logfile.log` on this runner.

This is the discussion content (sanitized):

"${{ steps.sanitized.outputs.text }}"

Determine the user's question or problem from the discussion content. If no specific question can be identified, analyze the log for any issues, errors, or notable events that could explain the problem described in the discussion.

Load the logfile with the `loadLogFile` tool, then analyze it thoroughly following your analysis instructions to answer the user's question.

Finally, post your findings as a comment on the discussion using the `add-comment` safe output.
