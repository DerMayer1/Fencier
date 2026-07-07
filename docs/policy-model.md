# Policy Model

Fencier policies live in `fencier.yaml`. In the Codex-first architecture, the policy model is the deterministic verification contract used after Codex changes files.

Planned top-level fields:

- `version`
- `scope`
- `rules`
- `audit`
- `adapters`

Example:

```yaml
version: 1

scope:
  allowed_paths:
    - src/**
    - tests/**
  blocked_paths:
    - .env
    - .env.*
  sensitive_paths:
    - src/auth/**
    - src/billing/**
  ignored_paths:
    - dist/**
    - coverage/**

rules:
  max_files_changed: 8
  max_lines_changed: 500
  block_secret_patterns: true
  require_tests_for:
    - src/auth/**
```

Implemented verification behavior:

- `blocked_paths` create a failed verification.
- `sensitive_paths` create warnings.
- files outside `allowed_paths` create warnings when `allowed_paths` is configured.
- `ignored_paths` are removed from evaluation.
- `max_files_changed` and `max_lines_changed` create warnings when exceeded.
- `block_secret_patterns` detects possible secrets in added lines and creates failed verification.
- `require_tests_for` warns when critical paths change without any test file in the diff.

Risk score:

| Signal | Points |
|---|---:|
| blocked path changed | 50 |
| possible secret detected | 50 |
| sensitive path changed | 25 |
| critical path changed without tests | 25 |
| changed files above limit | 15 |
| changed lines above limit | 15 |
| outside allowed paths | 15 |

Risk levels:

| Score | Risk |
|---:|---|
| 0-19 | low |
| 20-49 | medium |
| 50-89 | high |
| 90+ | critical |
