# OpenAPI Generator Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the request code generator trustworthy by hardening the shared OpenAPI pipeline, expanding verified target support, and aligning exported/package behavior with documented usage.

**Architecture:** Strengthen shared extraction and example-generation logic inside `src/openapi/generator/` so fixes apply across all language generators. Add regression tests first, then implement small focused changes, then add new targets and a matrix smoke test for all registered generators.

**Tech Stack:** TypeScript, Jest with ts-jest, ESLint, Vite build

---

### Task 1: Add failing regression tests for shared pipeline bugs

**Files:**
- Modify: `test/openapi/generator/languages/base-generator.test.ts`
- Create: `test/openapi/generator/languages/example-generator.test.ts`

- [ ] Step 1: Add tests for cookie extraction, path-item parameter merging, request-body media selection, and security placeholder injection.
- [ ] Step 2: Run targeted Jest commands and confirm the new tests fail for the expected reasons.
- [ ] Step 3: Add tests for deterministic arrays, enum/default precedence, and `allOf` / `anyOf` / `oneOf` example generation.
- [ ] Step 4: Run targeted Jest commands and confirm these tests fail.

### Task 2: Fix shared OpenAPI extraction and example generation

**Files:**
- Modify: `src/openapi/generator/generator.ts`
- Modify: `src/openapi/generator/example-generator.ts`
- Modify: `src/openapi/generator/languages/example/index.ts`
- Modify: `src/types/code.ts`
- Modify: `src/types/openapi.ts`

- [ ] Step 1: Implement merged-parameter extraction and `$ref` resolution for parameters and request bodies.
- [ ] Step 2: Fix cookie propagation and add auth placeholder synthesis from security schemes.
- [ ] Step 3: Add media-type selection and expose selected content type in generation context.
- [ ] Step 4: Make example generation deterministic and composition-aware.
- [ ] Step 5: Re-run targeted tests until green.

### Task 3: Restore package exports and add full support-matrix smoke tests

**Files:**
- Modify: `src/openapi/index.ts`
- Modify: `src/index.ts` if needed
- Create: `test/openapi/generator/languages/support-matrix.test.ts`

- [ ] Step 1: Export parser and generator surfaces from the package root.
- [ ] Step 2: Add a matrix smoke test that iterates every registered language/library pair and validates generated output is non-empty and structurally plausible.
- [ ] Step 3: Run the matrix test and fix any shared breakages it reveals.

### Task 4: Add new high-value targets

**Files:**
- Modify: `src/types/code.ts`
- Modify: `src/openapi/generator/factory.ts`
- Modify: `src/openapi/generator/languages/index.ts`
- Modify: `src/openapi/generator/languages/language-registry.ts`
- Create: `src/openapi/generator/languages/shell/index.ts`
- Create: `src/openapi/generator/languages/shell/curl/index.ts`
- Create: `src/openapi/generator/languages/rust/index.ts`
- Create: `src/openapi/generator/languages/rust/reqwest/index.ts`
- Create: `test/openapi/generator/languages/shell/curl.test.ts`
- Create: `test/openapi/generator/languages/rust/reqwest.test.ts`
- Modify: `test/openapi/generator/languages/test-data.ts`

- [ ] Step 1: Add `shell/curl` support.
- [ ] Step 2: Add `rust/reqwest` support.
- [ ] Step 3: Extend the support-matrix config and make the new tests pass.

### Task 5: Align docs and verify end-to-end

**Files:**
- Modify: `README.md`

- [ ] Step 1: Update README examples and supported capabilities to match the actual exported surface and implemented scope.
- [ ] Step 2: Run `npm.cmd test -- --runInBand`.
- [ ] Step 3: Run `npm.cmd run build`.
- [ ] Step 4: Run `npm.cmd run lint`.
