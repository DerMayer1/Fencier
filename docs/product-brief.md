# Product Brief

Fencier keeps AI coding agents inside the task.

## Problem

AI coding agents can edit unrelated files, expand scope, touch sensitive areas, introduce secret-like values, and create large diffs that are hard to review.

## Solution

Fencier prepares Codex CLI sessions with repository instructions and deterministic context, then verifies the resulting local git diff against a project policy before changes land.

## Principles

- local-first
- no account required
- no telemetry by default
- policy-as-code
- Codex-first repository instructions
- prompts and skills before product UI
- deterministic verification after agent work
- human review still wins
- small useful surface area

## Non-Goals

Fencier is not an AI coding agent, SaaS dashboard, full SAST tool, complete secret scanner, CI platform, or replacement for code review.
