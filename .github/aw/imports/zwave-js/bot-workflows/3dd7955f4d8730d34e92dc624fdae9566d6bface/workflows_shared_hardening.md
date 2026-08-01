---
# Common engine/safety baseline for all zwave-js bot workflows. Workflows
# importing this still declare their own on:/on.steps:, permissions,
# network policy, and timeout - those legitimately differ per workflow.
engine:
  id: copilot

# Every bot workflow talks to GitHub exclusively through safe outputs or
# deterministic pre/post steps holding BOT_TOKEN - the agent itself never
# gets the GitHub MCP toolset
tools:
  github: false
---
