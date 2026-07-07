# Quality Bar

Fencier should be built as a small but serious developer tool. Every feature should be easy to inspect, test, and explain.

## Engineering Rules

1. Keep `packages/core` pure.
   Core code must not read files, call Git, print output, or depend on process state.

2. Keep `packages/cli` thin.
   CLI code may touch the local environment, but policy decisions belong in `packages/core`.

3. Add tests with every new rule.
   A new policy rule needs at least one positive test and one negative or edge-case test.

4. Prefer structured data over strings.
   Git output and config files should be parsed into typed objects before evaluation.

5. Make scoring explicit.
   Risk weights live in `packages/core/src/risk.ts`; do not hardcode scoring values in output or CLI code.

6. Keep generated audits safe.
   Audit reports must not include full patches or full secret values by default.

7. Document behavior that exists.
   Planned behavior belongs in a clearly labeled planned section.

8. Fail predictably.
   Exit codes should stay stable:
   - `0`: pass or warn
   - `1`: fail
   - `3`: configuration or runtime usage error

9. Check overwrite conflicts before writing.
   Multi-file operations such as adapter installation should detect conflicts before creating or overwriting files.

10. Keep Phase 2 as verification.
   The verification engine should remain the deterministic post-Codex validation layer. New product surface should usually go into Codex prompts, skills, checklists, or helper commands before expanding policy rules.

## Security Rules

- Secret findings must use masked previews.
- Tests must assert that known secret suffixes are not present in findings or audit output.
- Local-first behavior is the default.
- No telemetry, hosted backend, or network upload belongs in the early product.

## Review Checklist

Before a phase is considered done:

- `pnpm run ci` passes.
- New behavior has tests.
- README and docs do not overclaim.
- CLI output is human-readable.
- JSON output is machine-readable.
- No generated report stores full secret values.
- Package boundaries remain intact.
- Verification remains deterministic and does not call a model.

## Naming Rules

- Use domain terms consistently: policy, finding, risk, audit, adapter.
- Use `possible secret`, not `leaked secret`, unless proven.
- Use `warn` for review-needed findings and `fail` for blocking findings.
- Keep rule ids stable once exposed in JSON audits.
