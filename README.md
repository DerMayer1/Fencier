# Fencier

Keep Codex inside the task.

[![CI](https://github.com/DerMayer1/Fencier/actions/workflows/ci.yml/badge.svg)](https://github.com/DerMayer1/Fencier/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/node-%3E%3D22-339933.svg)](package.json)
[![pnpm](https://img.shields.io/badge/pnpm-11.7.0-F69220.svg)](package.json)

Fencier is a local-first operating layer for Codex CLI. It prepares repository instructions, generates deterministic Codex runbooks, installs local skills, and verifies the resulting git diff before work lands.

It does not replace Codex. It gives Codex rails.

```text
fencier init --codex
        |
        v
fencier codex runbook implementation
        |
        v
Codex edits the repository
        |
        v
fencier verify
        |
        v
PASS / WARN / FAIL + local audit report
```

## The Problem

AI coding agents are fast, but they drift.

You ask for a focused change. The agent touches unrelated files, expands scope, refactors nearby code, edits sensitive paths, or forgets to run the project checks.

Fencier makes that behavior visible and harder to ship unnoticed.

## What It Does

Fencier gives a repository four things:

1. A policy file: `fencier.yaml`
2. A Codex operating contract: `AGENTS.md`
3. Prompt, checklist, and skill material for Codex sessions
4. A deterministic verifier for the local git diff

The current CLI can:

- initialize a Fencier-governed repository
- install `AGENTS.md` for Codex CLI
- install local Codex skills under `.fencier/skills`
- print Codex runbooks for implementation, bugfix, review, refactor, security, and audit-fix tasks
- check whether the repository is ready for a governed Codex session
- verify changed files against `fencier.yaml`
- detect blocked paths, sensitive paths, possible secrets, missing tests for critical paths, oversized diffs, and files outside scope
- write local Markdown and JSON audit reports

## Quick Start

From a git repository:

```bash
fencier init --codex
fencier codex skill install all --force
fencier codex prepare
fencier codex runbook implementation
```

Then let Codex do the requested work.

Before finishing:

```bash
fencier verify
fencier audit show latest
```

If the repository is already initialized, `fencier init --codex` is safe to re-run. It keeps the existing `fencier.yaml` and `AGENTS.md` unless `--force` is provided.

## How It Works

Before a Codex session:

```text
fencier init --codex
  -> creates fencier.yaml
  -> creates .fencier/audits/
  -> installs AGENTS.md

fencier codex skill install all --force
  -> writes .fencier/skills/<skill>/SKILL.md

fencier codex prepare
  -> checks policy, AGENTS.md, local skills, and latest audit status

fencier codex runbook implementation
  -> prints repo brief + prompt + checklist + completion commands
```

After a Codex session:

```text
fencier verify
  -> reads fencier.yaml
  -> collects the local git diff
  -> evaluates deterministic policy rules
  -> prints PASS, WARN, or FAIL
  -> writes an audit report unless --no-audit is used
```

Fencier does not prove code is correct. It proves the agent's diff was checked against explicit local boundaries.

## Example Output

```text
Fencier Verification

Status: PASS
Risk: LOW
Score: 0

Changed files: 0
Changed lines: +0 / -0

Policy findings:
- None
```

When a diff violates policy, findings are explicit:

```text
Policy findings:
- HIGH: Sensitive path changed: .github/workflows/ci.yml
- MEDIUM: Changed files exceed max_files_changed: 12 > 8
- HIGH: Possible secret detected in added line
```

The verification flow is deliberately mechanical:

```text
git diff
   |
   v
changed files + changed lines + added lines
   |
   v
fencier.yaml policy
   |
   v
scope checks + sensitive path checks + secret checks + test checks
   |
   v
status + risk + score + audit
```

## Commands

### Repository Setup

```bash
fencier init
fencier init --codex
fencier codex install
```

### Codex Workflow

```bash
fencier codex brief
fencier codex prepare
fencier codex runbook implementation
fencier codex fix-audit brief
```

### Prompts, Checklists, and Skills

```bash
fencier codex prompt list
fencier codex prompt show implementation

fencier codex checklist list
fencier codex checklist show security

fencier codex skill list
fencier codex skill show fencier-scope-control
fencier codex skill path
fencier codex skill install all --force
```

### Verification and Audits

```bash
fencier verify
fencier verify --no-audit
fencier check
fencier audit list
fencier audit show latest
```

### Adapters

```bash
fencier adapters list
fencier adapters install codex
fencier adapters install all
```

## Policy Model

Fencier reads `fencier.yaml` from the repository root.

```yaml
version: 1

scope:
  allowed_paths:
    - packages/**
    - docs/**
  blocked_paths:
    - .env
    - .env.*
    - secrets/**
  sensitive_paths:
    - .github/workflows/**
    - src/auth/**
    - src/payments/**

rules:
  max_files_changed: 8
  max_lines_changed: 500
  block_secret_patterns: true
  require_tests_for:
    - src/auth/**
    - src/payments/**
```

The verifier currently checks:

- changed file count
- changed line count
- blocked paths
- files outside allowed paths
- sensitive paths
- possible secret-like values in added lines
- critical paths changed without matching tests

## Architecture

Fencier is a TypeScript monorepo.

```text
                 +----------------------+
                 |      @fencier/cli    |
                 | commands + git + I/O |
                 +----------+-----------+
                            |
        +-------------------+-------------------+
        |                   |                   |
        v                   v                   v
+---------------+   +---------------+   +--------------------+
| @fencier/core |   | adapters      |   | codex-kit          |
| policy engine |   | AGENTS.md     |   | prompts + skills   |
| pure logic    |   | templates     |   | checklists         |
+---------------+   +---------------+   +--------------------+
```

The boundary is intentional:

- `@fencier/core` has no filesystem access.
- `@fencier/adapters` owns instruction templates but does not write files.
- `@fencier/codex-kit` owns prompts, checklists, and skill text but does not inspect repositories.
- `@fencier/cli` owns local orchestration.

## Development

```bash
pnpm install
pnpm run ci
pnpm run pack:cli
```

Run the CLI from source after building:

```bash
node packages/cli/dist/index.js doctor
node packages/cli/dist/index.js codex prepare
node packages/cli/dist/index.js verify --no-audit
```

For local development, link the CLI:

```bash
cd packages/cli
npm link
```

Then from the repository root:

```bash
fencier doctor
fencier codex prepare
fencier verify --no-audit
```

## Status

Fencier is early-stage and local-first.

Implemented:

- deterministic diff verification
- local audit reports
- Codex `AGENTS.md` adapter
- compatibility adapter templates
- Codex prompts, checklists, and local skills
- Codex runbooks and readiness checks
- idempotent initialization
- local CLI packaging check
- GitHub Actions CI

Not implemented yet:

- npm publication
- global Codex skill installation
- richer benchmark suite
- policy rule plugins

## Documentation

- [Architecture](docs/architecture.md)
- [Codex Kit](docs/codex-kit.md)
- [Deterministic Verifier](docs/deterministic-verifier.md)
- [Policy Model](docs/policy-model.md)
- [Quality Bar](docs/quality-bar.md)
- [Release](docs/release.md)
- [Security](docs/security.md)

## License

MIT
