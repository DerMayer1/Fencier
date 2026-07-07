# Fencier

Keep AI coding agents inside the task.

Fencier is a local-first operating layer for Codex CLI. It prepares repository instructions, generates deterministic session context, and verifies Codex-produced diffs before they land. The verification layer detects scope drift, sensitive file changes, secret-like patterns, missing test updates, and other risk signals while keeping source code on the developer's machine.

## Status

Fencier is in early development. The current CLI can initialize a local policy file, install Codex CLI instructions, generate Codex session briefs and runbooks, inspect prompt/checklist/skill templates, install local skill drafts, run deterministic verification against local git changes, and write local audit reports.

## Why Fencier Exists

AI coding agents are fast, but they drift. They touch unrelated files, expand scope, refactor opportunistically, and sometimes change sensitive areas without enough review context.

Fencier does not try to make agents smarter. It prepares the working context, keeps the session inside explicit boundaries, and verifies the work agents produce.

## Planned Workflow

```bash
npx fencier init
npx fencier init --codex
npx fencier codex skill install all --force
npx fencier codex prepare
npx fencier codex runbook implementation
npx fencier codex brief
npx fencier verify
```

`fencier init --codex` is safe to re-run. If `fencier.yaml` already exists, Fencier keeps the existing policy instead of overwriting it unless `--force` is provided.

The current CLI can:

- read local git diffs
- evaluate changes against `fencier.yaml`
- run `fencier verify` as the deterministic validation step
- install `AGENTS.md` as the primary Codex repository contract
- re-run initialization without replacing an existing policy by default
- check whether a repository is ready for a Fencier-governed Codex session
- print Codex runbooks that combine brief, prompt, checklist, and completion commands
- list and show Codex prompt templates
- list and show Codex task checklists
- list and show draft Codex skills
- install draft Codex skills into `.fencier/skills`
- include untracked files in the default verification
- detect blocked paths
- detect sensitive paths
- detect possible secrets in added lines
- require tests for critical paths
- calculate a transparent risk score
- write Markdown and JSON audit reports
- warn when changes fall outside allowed paths
- warn when file or line limits are exceeded

Planned next:

- installation into global Codex skill directories
- richer Codex CLI workflow helpers
- stronger risk scoring signals
- reproducible local benchmarks

## Repository Structure

```txt
packages/
  core/   Policy engine and shared domain types
  cli/    Command-line interface
  adapters/ Codex-first agent instruction templates
  codex-kit/ Versioned prompts, checklists, and skill drafts
docs/     Product, architecture, policy, security, and adapter docs
```

Key docs:

- [Architecture](docs/architecture.md)
- [Codex Kit](docs/codex-kit.md)
- [Deterministic Verifier](docs/deterministic-verifier.md)
- [Quality Bar](docs/quality-bar.md)
- [Policy Model](docs/policy-model.md)
- [Release](docs/release.md)
- [Security](docs/security.md)

## Development

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm run pack:cli
```

After building locally:

```bash
node packages/cli/dist/index.js init
node packages/cli/dist/index.js init --codex
node packages/cli/dist/index.js verify
node packages/cli/dist/index.js check
node packages/cli/dist/index.js audit list
node packages/cli/dist/index.js audit show latest
node packages/cli/dist/index.js codex install
node packages/cli/dist/index.js codex brief
node packages/cli/dist/index.js codex prepare
node packages/cli/dist/index.js codex runbook implementation
node packages/cli/dist/index.js codex fix-audit brief
node packages/cli/dist/index.js codex prompt list
node packages/cli/dist/index.js codex prompt show implementation
node packages/cli/dist/index.js codex checklist list
node packages/cli/dist/index.js codex skill list
node packages/cli/dist/index.js codex skill path
node packages/cli/dist/index.js codex skill install fencier-scope-control
node packages/cli/dist/index.js codex skill install all --force
node packages/cli/dist/index.js adapters list
node packages/cli/dist/index.js adapters install codex
```

## License

MIT
