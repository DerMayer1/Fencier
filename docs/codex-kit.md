# Codex Kit

Phase 4 introduces the Codex Kit: versioned prompts, checklists, and skill drafts for Codex CLI workflows.

The kit is deterministic. It does not call a model, inspect the repository, or write files. It provides inspectable text artifacts that the CLI can print.

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

Phase 4 only creates and exposes the kit. Installing skills into Codex skill directories belongs to a later phase.
