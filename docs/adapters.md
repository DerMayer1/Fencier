# Codex Instructions And Adapters

Fencier installs agent-specific instruction files that reinforce the same project boundaries across coding agents.

Codex CLI is the primary target. `AGENTS.md` is the main repository contract. Claude, Cursor, and Copilot outputs are compatibility adapters and should not drive the product architecture.

## Supported Targets

| Target | Role | File |
|---|---|---|
| Codex | primary | `AGENTS.md` |
| Claude Code | compatibility | `CLAUDE.md` |
| Cursor | compatibility | `.cursorrules` |
| GitHub Copilot | compatibility | `.github/copilot-instructions.md` |

## Commands

List supported targets:

```bash
fencier adapters list
```

Install the primary Codex contract:

```bash
fencier init --codex
fencier codex install
```

Install a compatibility adapter:

```bash
fencier adapters install codex
fencier adapters install claude
fencier adapters install cursor
fencier adapters install copilot
```

Install all adapters:

```bash
fencier adapters install all
```

Install during initialization:

```bash
fencier init --codex
fencier init --adapter codex
fencier init --all-adapters
```

Codex-specific helpers:

```bash
fencier codex install
fencier codex brief
```

`fencier codex brief` prints a deterministic session brief for Codex CLI. It does not call a model, upload code, or start a separate UI.

## Overwrite Behavior

Adapter installation does not overwrite existing files by default. If a target file already exists, Fencier reports the conflict and exits with code `3`.

Use `--force` to overwrite:

```bash
fencier adapters install codex --force
```

## Adapter Rules

All adapters currently share the same rules:

- Stay within the user's requested scope.
- Prefer the smallest correct change.
- Do not perform opportunistic refactors.
- Do not edit sensitive files unless the user explicitly asked for it.
- Do not move secrets, tokens, or API keys into client-side code.
- Do not print secrets in logs, tests, examples, or final messages.
- If auth, billing, payments, migrations, CI/CD, or infra files change, explain why.
- If critical logic changes, update tests or explain why tests were not changed.
- Before finishing, summarize files changed and notable risk.
- Recommend running `fencier verify` before committing.

The Codex contract also includes an explicit Codex CLI workflow: read `AGENTS.md` and `fencier.yaml`, stay inside scope, run `fencier verify`, and either fix or report remaining findings.

## Architecture

`packages/adapters` owns instruction metadata and template content only. It does not write files.

`packages/cli` owns local installation, directory creation, overwrite checks, and terminal output.

## Phase 3 Boundary

Phase 3 should stay focused on repository-level instruction contracts:

- make `AGENTS.md` the best possible Codex operating contract
- keep compatibility adapters thin
- avoid adding prompt libraries or skills here; those belong to Phase 4
- avoid expanding deterministic verification here; that belongs to Phase 2
