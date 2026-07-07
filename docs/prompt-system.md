# Prompt System

Fencier prompts are task-specific Codex instructions. They sit between the permanent repository contract in `AGENTS.md` and the deterministic verifier in `fencier verify`.

Prompt goals:

- make task type explicit
- reduce scope drift
- preserve local-first behavior
- require verification before final response
- standardize final response content

Current prompt IDs:

- `implementation`
- `bugfix`
- `review`
- `refactor`
- `security`
- `fix-audit`

Use:

```bash
fencier codex prompt show implementation
```
