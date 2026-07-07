# Release

Fencier is not published to a registry yet. The current release process validates the CLI package locally and keeps publication manual.

## Local Package Check

Build and test everything:

```bash
pnpm run ci
```

Create the CLI package tarball:

```bash
pnpm run pack:cli
```

The package should include only the compiled `dist` output declared by `packages/cli/package.json`.

## Local CLI Install

For development, link the CLI package:

```bash
cd packages/cli
npm link
```

Then validate the linked command from the repository root:

```bash
fencier doctor
fencier codex prepare
fencier verify --no-audit
```

## Release Checklist

- `pnpm run ci` passes locally.
- GitHub Actions CI passes on `main`.
- `pnpm run pack:cli` creates the expected CLI tarball.
- `fencier init --codex` is safe to re-run in an initialized repository.
- `fencier codex prepare` reports `READY` for a configured repository.
- `fencier verify --no-audit` reports expected policy status.

Publishing to npm should be added only after package names, ownership, and versioning policy are finalized.
