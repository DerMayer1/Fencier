# Codex Agent Contract

Phase 3 makes Codex the primary instruction target.

The contract is installed as:

```bash
fencier init --codex
```

or:

```bash
fencier codex install
```

The generated `AGENTS.md` is the permanent repository-level operating contract for Codex CLI. It should be short, explicit, and enforceable through `fencier verify`.

## Contract Responsibilities

- tell Codex to read the user request, `AGENTS.md`, and `fencier.yaml`
- make the user request the source of truth
- keep changes inside requested scope
- prevent opportunistic refactors
- protect secrets and sensitive paths
- require `fencier verify` before finishing
- require explicit reporting of remaining verification risk

## Compatibility Adapters

Claude, Cursor, and Copilot files may mirror the same high-level rules, but they are not the main product path. They should stay thin until Codex prompts and skills are strong.

## Out Of Scope For Phase 3

- task-specific prompt libraries
- Codex skills
- session history
- benchmark runners
- UI surfaces

Those belong to later phases.
