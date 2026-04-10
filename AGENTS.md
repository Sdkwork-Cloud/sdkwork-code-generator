# Repository Guidelines

## Project Structure & Module Organization
Core source lives in `src/`. The main domains are `src/openapi/` for parsing and request-code generation, `src/mcp/` for MCP-related generators, `src/sdk/` for SDK-facing exports, `src/agent/` for agent helpers, and shared types/utilities in `src/types/`, `src/utils/`, and `src/core/`. Templates and prompt assets live in `templates/` and `prompts/`. Tests mirror source behavior under `test/`, especially `test/openapi/generator/languages/`. Treat `dist/` as generated output; do not edit it directly.

## Build, Test, and Development Commands
- `npm install`: install dependencies for Node 16+.
- `npm run build`: compile TypeScript and bundle with Vite into `dist/`.
- `npm run dev`: start Vite in development mode for local iteration.
- `npm test`: run the Jest suite once.
- `npm run test:coverage`: generate coverage reports in `coverage/`.
- `npm run lint`: run ESLint on the published generator/core modules under `src/index.ts`, `src/openapi/`, `src/types/`, `src/utils/`, `src/mcp/`, and `src/sdk/`.
- `npm run lint:fix`: apply safe ESLint fixes.
- `npm run format`: run Prettier on the same maintained source modules covered by `npm run lint`.

## Coding Style & Naming Conventions
Use TypeScript with strict compiler settings and the `@/` path alias for `src/*`. Prettier defines the baseline style: 2-space indentation, single quotes, semicolons, trailing commas where valid, and `printWidth` 80. Follow existing naming patterns: PascalCase for exported classes such as `OpenAPIParser`, lowercase directory names, and `index.ts` entrypoints. Add new generators under paths like `src/openapi/generator/languages/<language>/<library>/index.ts`.

## Testing Guidelines
Jest with `ts-jest` runs both `src/` and `test/` trees. Name tests `*.test.ts` or `*.spec.ts`; current examples use `axios.test.ts` and `requests.test.ts`. Place fixtures close to the tests, as in `test/openapi/generator/languages/test-data.ts`. There is no enforced coverage threshold in config, but new parsing or generation logic should ship with focused unit tests and pass `npm run test:coverage`.

## Commit & Pull Request Guidelines
Git history is minimal, so there is no strong existing commit convention beyond short imperative subjects. Prefer messages like `Add Kotlin generator tests` over vague summaries. PRs should include a concise description, the affected modules, test/lint results, and sample generated output when changing templates or generators. Link the relevant issue when one exists.
