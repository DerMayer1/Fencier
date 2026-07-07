# Security

Fencier should be conservative with user code and secrets.

## Local-First Promise

Fencier should run locally by default and should not upload source code, diffs, policies, verification results, or audit reports to a hosted service.

## Secret Handling

Secret detection should report possible secrets without printing or storing complete secret values. Audit reports should contain masked previews only.

The current scanner checks added lines from git patches and untracked files. It reports pattern id, file, optional line number, and a masked preview.

## Audit Storage

Audit reports are written to `.fencier/audits/` as Markdown and JSON. Full patches are not included by default.

## Limitations

Fencier verification does not prove a change is safe. It identifies risk signals and policy violations so humans and Codex can review or correct faster.

## Codex CLI Integration

Codex integration is file and terminal based. `fencier init --codex` and `fencier codex install` write `AGENTS.md`; `fencier codex brief` reads local setup status and the latest local audit report. Neither command uploads source code, policies, audits, or findings.
