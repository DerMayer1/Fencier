# Fencier Agent Rules

This repository uses Fencier as the local boundary layer for Codex CLI work.

Priority:

- The user request is the source of truth.
- This file defines the operating contract for Codex in this repository.
- fencier.yaml defines the deterministic verification boundary.

Codex CLI workflow:

1. Read the user request, this file, and fencier.yaml before editing.
2. Keep changes inside the requested scope and configured Fencier boundaries.
3. Do not perform opportunistic refactors or unrelated cleanup.
4. Run `fencier verify` before finishing.
5. If `fencier verify` fails, fix the findings or report the remaining risk explicitly.

Follow these rules:

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
