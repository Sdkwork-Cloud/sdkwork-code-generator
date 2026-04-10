# OpenAPI Generator Hardening Design

## Goal

Turn the current request code generator into a reliable OpenAPI 3.x request-generation core by fixing pipeline bugs, adding missing schema/parameter handling, expanding supported targets, and raising regression coverage so claimed support matches verified behavior.

## Current Problems

- Public package exports are incomplete; package root does not cleanly expose the parser and generator surface promised in the README.
- Core request extraction only reads `operation.parameters`, ignoring path-level parameters and reference resolution.
- Cookies are generated from the wrong source array in the base generator.
- Request body handling only understands `application/json`.
- Example generation is incomplete for `allOf` / `anyOf` / `oneOf`, enums, defaults, and deterministic array generation.
- Security schemes are defined in types but not reflected in generated request examples.
- Test coverage only verifies 3 concrete generators out of the advertised support matrix.
- `sdk` and some higher-level modules are still placeholders; this phase should not overclaim full SDK-project generation.

## Approaches Considered

### 1. Patch individual generators only

Fastest, but it preserves a weak core. Bugs would keep reappearing across languages because the extraction pipeline remains inconsistent.

### 2. Harden the shared pipeline first, then expand target coverage

Recommended. Fix parameter merging, reference resolution, request-body/media-type selection, auth placeholder injection, and example generation in shared code so all generators improve together. Then validate the full matrix and add a small number of high-value new targets.

### 3. Jump straight to full SDK-project generation

Not recommended for this pass. The current repository does not yet have a trustworthy request-generation core, and `src/sdk/` is still a placeholder. Building on that would compound defects.

## Selected Design

Use approach 2.

1. Restore package exports so the documented public API is usable.
2. Refactor the shared OpenAPI request pipeline to:
   - merge path-item and operation parameters
   - resolve component `$ref` parameters and request bodies
   - synthesize auth placeholders from security requirements
   - select request bodies from JSON, form, multipart, text, or first available media type
3. Make example generation deterministic and composition-aware.
4. Add a smoke-test matrix that exercises every registered language/library pair.
5. Add two pragmatic new targets with broad utility: `shell/curl` and `rust/reqwest`.
6. Update docs so the README no longer overstates unsupported higher-level SDK generation.

## Error Handling

- Unsupported content types should fall back to first available media type instead of silently returning empty bodies.
- Unresolvable refs should degrade gracefully to placeholders rather than crashing generation.
- Unsupported language/library requests should continue to throw explicit errors.

## Testing Strategy

- Red-green tests for pipeline bugs and new language targets.
- Regression tests for cookies, path-level params, security injection, media-type selection, and schema composition.
- Full matrix smoke test for all registered generators.
- Final verification with `npm.cmd test -- --runInBand`, `npm.cmd run build`, and `npm.cmd run lint`.
