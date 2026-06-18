# Release Process

## Versioning

Follows semantic versioning. Patch releases (0.x.Y) fix bugs or polish without breaking CLI behavior. Minor releases (0.X.0) introduce new features or change the workspace layout. Any change to the format of an existing artifact anywhere under `.pythia/` requires a migration step.

## Migration Authoring Rule

A change to an existing `.pythia/` artifact's format **must** include:
1. A migration step in `assets/migrations/next.md` (auto op or llm instruction)
2. A `seedIfMissing` entry in the CLI when a brand-new base file is introduced (seeded directly in code, not via a migration — see [docs/migrations.md](docs/migrations.md))

During development, `next.md` accumulates steps. It is git-tracked but **excluded from the published package** (via `assets/migrations/.npmignore`).

## Release Checklist

1. **Bump the version** in `package.json`.

2. **Update `CHANGELOG.md`**: add a `## [<version>] - <date>` section by hand, summarizing user-facing changes since the last release (there is no `npm run changelog` script — this is a manual step).

3. **Rename the migration staging file** (if any steps were added):

   ```bash
   # Rename next.md to the new version
   mv assets/migrations/next.md assets/migrations/<version>.md
   # Update the in-file version condition in the new file:
   # "Applied by ... when migratedVersion < <version>"
   ```

   If no protected-zone format changes were made in this release, skip this step.

4. **Verify migration release gate**:

   ```bash
   npm run release:check-migrations
   ```

   This fails only if `next.md` has unreleased steps for the current version without a matching `<version>.md`. If `next.md` is empty and no migration was needed this release, it passes with a WARN.

5. **Run tests**:

   ```bash
   npm test
   ```

6. **Verify pack output** (must include versioned migrations, must exclude `next.md`):

   ```bash
   npm pack --dry-run
   ```

   Confirm `tools/cli/`, `assets/migrations/<semver>.md`, `skills/`, `README.md`, `CHANGELOG.md` are listed. Confirm `assets/migrations/next.md` is **not** listed.

7. **Commit and tag**:

   ```bash
   git add package.json CHANGELOG.md assets/migrations/
   git commit -m "chore: release <version>"
   git tag v<version>
   git push origin main --tags
   ```

8. **CI publishes automatically**: pushing a `v*` tag triggers `.github/workflows/publish.yml`, which tests and publishes to npm with provenance.

   To publish manually (fallback):

   ```bash
   npm publish --provenance --access public
   ```

## CI Publish Requirements

- npm trusted publishing must be configured on npmjs.com for this package (OIDC → GitHub Actions). No secret token needed.
- The `package.json` version must match the pushed tag exactly (CI gate verifies this).
- The package must be public (`--access public`).

## What Gets Published

| Included | Source |
|---|---|
| `tools/cli/` | Workspace manager CLI (`pythia` bin) |
| `tools/migrate/` | Migration engine (materialized to `.pythia/runtime/migrate/` in workspaces) |
| `tools/checks/`, `tools/hooks/`, `tools/lib/` | Hook/check runtime sources (materialized to `.pythia/runtime/` on init/update) |
| `assets/migrations/<semver>.md` | Versioned migration files (`next.md` excluded) |
| `assets/base/`, `assets/instructions.md` | Seed files and instruction source |
| `skills/` | Canonical skills shipped to workspaces |
| `README.md`, `CHANGELOG.md` | Docs |

Everything else (`docs/`, tests, `.pythia/`, `.claude/`, `tsconfig`, `dist/`) is excluded via the `files` field in `package.json` or the root `.npmignore`.

## All-JS Package (No Build)

There is no compile step. The package ships `tools/` directly. The `bin` entry points to `./tools/cli/index.js`. No `tsc`, `dist/`, or `typescript` required to publish or run.
