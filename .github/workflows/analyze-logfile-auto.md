---
on:
  discussion:
    types:
    - created
    - edited
  permissions:
    contents: read
    discussions: write
  reaction: none
  roles: all
  steps:
  - name: Checkout repository
    uses: actions/checkout@v7.0.1
    with:
      persist-credentials: false
  - name: Setup bot scripts
    uses: zwave-js/bot-workflows/actions/setup-bot@v1
  - id: extract
    name: Extract log file from discussion body
    uses: actions/github-script@v9.0.0
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
  - env:
      LOGFILE: ${{ steps.extract.outputs.result }}
      SHOULD_CONTINUE: ${{ steps.extract.outputs.shouldContinue }}
    id: feedback
    name: Classify logfile and give feedback
    uses: actions/github-script@v9.0.0
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
  - id: gate
    if: steps.feedback.outputs.result == 'OK'
    name: Gate agentic analysis
    run: "true"
permissions:
  contents: read
  discussions: read
if: needs.pre_activation.outputs.gate_result == 'success'
network: defaults
imports:
- zwave-js/bot-workflows/workflows/shared/hardening.md@75148e07b701ca92e052212a9b7710864068ef6e
- zwave-js/bot-workflows/workflows/shared/zwave-log-analysis.md@75148e07b701ca92e052212a9b7710864068ef6e
safe-outputs:
  add-comment:
    discussions: true
    github-token: ${{ secrets.BOT_TOKEN }}
steps:
- name: Setup bot scripts
  uses: zwave-js/bot-workflows/actions/setup-bot@v1
- id: get_logfile_url
  name: Get logfile URL from discussion
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
description: Automatically analyze Z-Wave JS logfiles posted in new discussions
engine: copilot
runs-on-slim: ubuntu-latest
source: zwave-js/bot-workflows/workflows/analyze-logfile-auto.md@79bf914044d6d648bee4f297b63f4f4a5562ea5c
timeout-minutes: 30
---
# Z-Wave JS Logfile Analysis

A user opened a GitHub discussion asking for help and attached a Z-Wave JS driver logfile. The logfile has been downloaded to `/tmp/gh-aw/agent/logfile.log` on this runner.

This is the discussion content (sanitized):

"${{ steps.sanitized.outputs.text }}"

Determine the user's question or problem from the discussion content. If no specific question can be identified, analyze the log for any issues, errors, or notable events that could explain the problem described in the discussion.

Load the logfile with the `loadLogFile` tool, then analyze it thoroughly following your analysis instructions to answer the user's question.

Finally, post your findings as a comment on the discussion using the `add-comment` safe output.
