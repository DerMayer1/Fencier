# Architecture

Fencier is a local-first TypeScript monorepo. The architecture is intentionally small: keep policy decisions in a pure core package, keep environment access in the CLI package, and make every generated report traceable back to structured inputs. The primary user surface is the terminal, especially Codex CLI workflows.

The Phase 2 engine is a deterministic verifier. It should validate Codex output after a session; it should not grow into the main product surface.

The Phase 4 Codex Kit is the first prompt/skill layer. It should stay deterministic and versioned: list and show prompts, checklists, and skill drafts without calling a model.

The Phase 5 local skill installer materializes Codex Kit skill drafts under `.fencier/skills`. The installer belongs in the CLI because it touches the filesystem; the Codex Kit remains the pure source of artifact content.

The Phase 6 workflow layer composes operational Codex runbooks from existing artifacts. It should not create new policy semantics; it checks setup status and prints deterministic session material.

## Package Boundaries

### `packages/core`

The core package owns deterministic verification logic.

Responsibilities:

- policy schema and default policy
- diff data types
- path policy verification
- secret-like pattern detection on added lines
- test requirement heuristics
- finding creation
- risk score weights and risk level derivation

Rules:

- no filesystem access
- no Git commands
- no terminal output
- no process globals
- no audit file writing
- functions should accept structured data and return structured data

### `packages/cli`

The CLI package owns local orchestration.

Responsibilities:

- command definitions
- git diff collection
- local file reads and writes
- `fencier.yaml` creation
- `.fencier/audits` creation
- human-readable terminal output
- Markdown and JSON audit report writing
- Codex `AGENTS.md` installation
- compatibility adapter file installation
- Codex CLI briefing output
- local Codex skill draft installation into `.fencier/skills`
- Codex readiness checks and runbook composition

Rules:

- keep business rules out of command handlers
- convert local state into core input types
- never store full patches by default
- never print or persist full secret values

### `packages/adapters`

The adapters package owns agent instruction metadata and template content. Codex is the primary target; other adapters are compatibility outputs.

Responsibilities:

- supported instruction target list
- primary Codex `AGENTS.md` template
- target instruction file paths
- compatibility adapter template content
- adapter selection helpers

Rules:

- no filesystem writes
- no terminal output
- no policy evaluation
- no Git commands

### `packages/codex-kit`

The Codex Kit package owns versioned Codex workflow artifacts.

Responsibilities:

- prompt template catalog
- task checklist catalog
- draft Codex skill content
- deterministic rendering helpers

Rules:

- no filesystem writes
- no Git commands
- no model calls
- no CLI output
- artifacts should be inspectable as plain text

## Phase 2 Verification Flow

1. A coding agent changes files in a local repository.
2. `fencier verify` reads `fencier.yaml`.
3. The CLI collects changed files with Git:
   - `git diff --numstat`
   - `git diff --name-status`
   - `git diff --unified=0`
   - untracked files for default verification
4. The CLI converts Git output into `DiffFile[]`.
5. `packages/core` verifies the diff against policy and returns `PolicyResult`.
6. The CLI prints a summary.
7. Unless `--no-audit` is used, the CLI writes Markdown and JSON reports to `.fencier/audits/`.

`fencier check` remains available as a compatibility alias for `fencier verify`.

## Codex CLI Flow

1. `fencier init --codex` creates `fencier.yaml`, `.fencier/audits/`, and `AGENTS.md`.
2. Codex CLI reads `AGENTS.md` as the local operating contract.
3. `fencier codex skill install <id|all>` writes local `SKILL.md` files under `.fencier/skills` when repository-local skill material is needed.
4. `fencier codex prepare` checks policy, adapter, local skills, and latest audit status.
5. `fencier codex runbook <prompt>` prints a deterministic session package with brief, prompt, checklist, and completion commands.
6. Codex CLI performs the requested code task.
7. `fencier verify` evaluates the resulting diff.
8. The final response should mention Fencier findings or confirm verification passed.

## Core Evaluation Order

The evaluator currently applies rules in this order:

1. remove `ignored_paths`
2. summarize changed files and changed lines
3. check max file and line limits
4. check blocked paths
5. check files outside allowed paths
6. check sensitive paths
7. check critical paths without tests
8. scan added lines for possible secrets
9. calculate risk score
10. derive `pass`, `warn`, or `fail`

## Audit Contract

Audits are review artifacts, not source archives.

Audit reports may include:

- timestamp
- repo path
- branch and commit when available
- policy version
- status
- risk level
- score
- findings
- changed file metadata
- masked secret previews

Audit reports must not include:

- full patch text by default
- full secret values
- source code lines containing secrets
- remote telemetry payloads

## Extension Points

Current and future packages should preserve these boundaries:

- `packages/adapters`: own Codex-first instruction templates, but do not write files or evaluate policy.
- `packages/codex-kit`: own prompts, checklists, and skill drafts, but do not install files or inspect repos.
- `packages/cli`: own Codex-oriented workflow commands and runbooks, but do not duplicate policy logic.
- `packages/benchmark`: run fixture scenarios against the core engine and CLI outputs.
