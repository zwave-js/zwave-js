# Instructions for GitHub Copilot

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

## Testing

- Use `vitest` for testing.
- Do not create tests for functionality that interacts with (mock) devices, unless specifically instructed to do so.
- Unit tests must be located next to the code they test, but with a `.test.ts` extension instead of `.ts`.
