# Instructions for GitHub Copilot

> **Note for AI assistants:** `CLAUDE.md` and `AGENTS.md` are symlinks pointing to this file (`.github/copilot-instructions.md`). Always edit this file directly, never the symlinks, or they will be replaced with regular files and break.

## Agent skills and instructions

- Canonical agent skills live in `.agents/skills/`. The entries in `.claude/skills/` are symlinks to them for Claude Code. Always edit the canonical files, never the symlinks.
- The rules for authoring, editing and reviewing device configuration files live in `.agents/instructions/config-files.md`. Read and follow that file when working on `*.json` files in `packages/config/config/devices`.

## Tools and Tasks

- To compile the project, prefer building the entire project with `yarn build`. If absolutely necessary, you can build a single package with `yarn build <package-name>`.
- For any task that authors or reviews device configuration files, use the repository's `zwave-dev` MCP tools as the primary interface. Do not replace its template resolution and targeted diagnostics with manual `$import` tracing or repository-wide lint commands.

## Common Guidelines

- All code and comments and other text are written in American English
- Follow existing code style patterns as much as possible
- Prefer `async`/`await` over callbacks and Promises wherever possible
- After making code changes, always run `yarn fmt` to fix the formatting
- Do not preserve backwards compatibility (e.g., keeping unused methods, re-exporting removed types, renaming to `_unused`) unless explicitly asked. When refactoring or iterating on new features, remove unused code completely.
- In comments, never mention things you replaced or removed

## Commenting Style

Comments should explain the WHY, not the WHAT. The code itself shows what happens; comments should explain why that approach was chosen or what it achieves in context.

**When to write comments:**

- Non-obvious algorithmic decisions or workarounds
- Protocol-specific behavior or constraints (e.g., "These fields are only available for Z-Wave LR")
- References to specifications (e.g., "Implementation based on SDS13782")
- Edge cases, gotchas, or assumptions that aren't evident from code
- Complex conditional logic where the reasoning matters

**When NOT to write comments:**

- Self-explanatory code (prefer clear naming over comments)
- Describing what the next line does
- Documenting parameters or types (use JSDoc for public APIs instead)
- Basic control flow or straightforward operations

**Good comment examples:**

```typescript
// When requesting a non-existing parameter, a node SHOULD respond with the
// first available parameter. We use this for the first param only,
// because delayed responses might otherwise confuse the interview process
allowUnexpectedResponse: param === 1,

// For multicast and broadcast CCs, just use the highest implemented version to serialize
// Older nodes will ignore the additional fields
if (typeof cc.nodeId !== "number") {
```

**Avoid comments like:**

```typescript
// Set the value to 5
const timeout = 5;

// Check if the node is awake
if (node.isAwake) {
```

Keep comments concise (1-3 sentences), use professional technical tone, and assume the reader understands Z-Wave domain terminology.

## Testing

- Use `vitest` for testing.
- Unit tests must be located next to the code they test, but with a `.test.ts` extension instead of `.ts`.
- Do not create tests for functionality that interacts with (mock) devices, unless specifically instructed to do so.
- Do not create tests when you are assigned a Github issue to fix, unless specifically instructed to do so.
