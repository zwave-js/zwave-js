# Instructions for GitHub Copilot

> **Note for AI assistants:** `CLAUDE.md` and `AGENTS.md` are symlinks pointing to this file (`.github/copilot-instructions.md`). Always edit this file directly, never the symlinks, or they will be replaced with regular files and break.

This repository holds the Z-Wave JS driver library, a TypeScript implementation of a Z-Wave controller software stack and supporting tools.

## Project structure

- The `packages/` directory contains all of the packages in this monorepo.
  - `packages/zwave-js`: The main driver library (name: `zwave-js`)
  - `packages/shared`: Internal utilities shared between packages (name: `@zwave-js/shared`)
  - `packages/core`: Core definitions, utilities and types used by other packages and applications (name: `@zwave-js/core`)
  - `packages/cc`: Command Class definitions and implementations (name: `@zwave-js/cc`)
  - `packages/config`: Functionality related to device configuration and all configuration files (name: `@zwave-js/config`)
  - `packages/eslint-plugin`: A custom ESLint plugin, used internally throughout the project (name: `@zwave-js/eslint-plugin`)
  - `packages/flash`: Command-line based Z-Wave firmware flashing tool (name: `@zwave-js/flash`)
  - `packages/host`: Host abstractions layer for integration tests (name: `@zwave-js/host`)
  - `packages/nvmedit`: Utilities and a command-line tool for editing the contents of Z-Wave controller memory/NVM (name: `@zwave-js/nvmedit`)
  - `packages/serial`: Serial port abstraction and Serial API message implementation (name: `@zwave-js/serial`)
  - `packages/testing`: Utilities for testing (name: `@zwave-js/testing`)
  - `packages/transformers`: Plugins for the TypeScript compiler used to auto-generate code at build time (name: `@zwave-js/transformers`)
- Device configuration files are located in `packages/config/config/devices` and have a `.json` extension.

## Tools and Tasks

- Build the entire project: `yarn build`
- Build a specific package: `yarn build <package-name>`, e.g. `yarn build zwave-js` or `yarn build @zwave-js/cc`
- Run tests: `yarn test:ts`
- Run tests for a specific file: `yarn test:ts <file>`
- Format all code: `yarn fmt`
- Check configuration files for semantic errors: `yarn lint:zwave`
- Detect and fix linting issues in TypeScript code: `yarn lint:ts:fix`

## Common Guidelines

- All code and comments and other text are written in American English
- Follow existing code style patterns as much as possible
- Prefer `async`/`await` over callbacks and Promises wherever possible
- After making code changes, always run `yarn fmt` to fix the formatting
- Do not preserve backwards compatibility (e.g., keeping unused methods, re-exporting removed types, renaming to `_unused`) unless explicitly asked. When refactoring or iterating on new features, remove unused code completely.

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

## Reviewing Pull Requests

The rules to apply for reviewing pull requests depend on which files were changed:

- If the PR changes device configuration files (`*.json` files in `packages/config/config/devices`), follow the [review-config-pr](prompts/review-config-pr.prompt.md) prompt to review the changes.
