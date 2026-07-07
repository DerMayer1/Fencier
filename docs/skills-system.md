# Skills System

Fencier skill drafts are future Codex skills represented as plain text.

The Codex Kit defines the skill content. The CLI installs those drafts into a local repository folder:

```txt
.fencier/
  skills/
    fencier-scope-control/
      SKILL.md
```

This keeps installation inspectable and local-first. The files are generated from the versioned kit and can be refreshed with `--force`.

List and inspect drafts:

```bash
fencier codex skill list
fencier codex skill show fencier-scope-control
```

Install drafts locally:

```bash
fencier codex skill path
fencier codex skill install fencier-scope-control
fencier codex skill install all --force
```

Without `--force`, Fencier refuses to overwrite existing local skill files.

Later phases can install these drafts into global Codex skill directories.

Current skill draft IDs:

- `fencier-scope-control`
- `fencier-implementation`
- `fencier-review`
- `fencier-fix-audit`
