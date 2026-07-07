# Codex Kit

Phase 4 introduced the Codex Kit: versioned prompts, checklists, and skill drafts for Codex CLI workflows.

The kit is deterministic. It does not call a model, inspect the repository, or write files. It provides inspectable text artifacts that the CLI can print.

Phase 5 keeps the kit pure and adds CLI-owned local skill installation. The installed files live under `.fencier/skills` so a repository can inspect exactly what Fencier generated before any future global Codex integration.

## Commands

List prompts:

```bash
fencier codex prompt list
```

Show a prompt:

```bash
fencier codex prompt show implementation
```

List checklists:

```bash
fencier codex checklist list
```

Show a checklist:

```bash
fencier codex checklist show security
```

List skill drafts:

```bash
fencier codex skill list
```

Show a skill draft:

```bash
fencier codex skill show fencier-scope-control
```

Print the local skill installation directory:

```bash
fencier codex skill path
```

Install one skill draft locally:

```bash
fencier codex skill install fencier-scope-control
```

Install or refresh every local skill draft:

```bash
fencier codex skill install all --force
```

## Prompt IDs

- `implementation`
- `bugfix`
- `review`
- `refactor`
- `security`
- `fix-audit`

## Skill Draft IDs

- `fencier-scope-control`
- `fencier-implementation`
- `fencier-review`
- `fencier-fix-audit`

## Phase Boundary

The Codex Kit package owns artifact definitions only. The CLI owns installation into `.fencier/skills`.

Installing directly into global Codex skill directories remains outside Phase 5.
