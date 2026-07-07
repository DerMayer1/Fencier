# Deterministic Verifier

Phase 2 is the deterministic verification layer for Codex-produced work.

It is intentionally not the main product surface. Fencier should guide Codex with prompts, skills, and local instructions before execution, then use this verifier after execution to make risk visible.

## Command

```bash
fencier verify
```

Compatibility alias:

```bash
fencier check
```

## Responsibilities

- read local git changes
- parse `fencier.yaml`
- detect scope drift
- detect blocked and sensitive paths
- detect possible secrets in added lines
- flag critical paths changed without tests
- calculate transparent risk
- write safe Markdown and JSON audit reports

## Non-Responsibilities

- call an AI model
- decide whether code is correct
- replace human review
- store full patches by default
- expand into a UI surface

## Codex Loop Position

```txt
brief -> prompt/skill -> Codex edits -> fencier verify -> audit -> fix prompt if needed
```

The verifier should stay deterministic and inspectable. If a feature needs reasoning, instruction, or workflow shaping, it belongs in the prompt/skill layer first.
