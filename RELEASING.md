# Release Process

## Versioning

Follows semantic versioning. Patch releases (0.x.Y) fix bugs or polish without breaking CLI behavior. Minor releases (0.X.0) introduce new features or change the workspace layout.

## Release Checklist

1. **Bump the version** in `package.json`.

2. **Update `CHANGELOG.md`**: rename the `## Unreleased` section to `## <version> - <date>`, or add a new dated section.

   To generate from conventional commits:

   ```bash
   npm run changelog
   ```

3. **Run build and tests**:

   ```bash
   npm run build
   npm test
   ```

4. **Verify pack output**:

   ```bash
   npm pack --dry-run
   ```

   Confirm only `dist/src/cli/`, `assets/`, `skills/`, `README.md`, `CHANGELOG.md` are listed.

5. **Commit and tag**:

   ```bash
   git add package.json CHANGELOG.md
   git commit -m "chore: release <version>"
   git tag v<version>
   git push origin main --tags
   ```

6. **CI publishes automatically**: pushing a `v*` tag triggers `.github/workflows/publish.yml`, which builds, tests, and publishes to npm with provenance.

   To publish manually (fallback):

   ```bash
   npm publish --provenance --access public
   ```

## CI Publish Requirements

- npm trusted publishing must be configured on npmjs.com for this package (Granular Access Tokens → OIDC → GitHub Actions). No secret token needed in the repo.
- The `package.json` version must match the pushed tag exactly (CI gate verifies this).
- The package must be public (`--access public`).

## What Gets Published

| Included | Source |
|---|---|
| `dist/src/cli/` | compiled CLI from `npm run build` |
| `assets/` | instruction source + seed files |
| `skills/` | canonical skills shipped to workspaces |
| `README.md`, `CHANGELOG.md` | docs |

Everything else (source `src/`, tests, scripts, `.pythia/`, `.claude/`) is excluded via the `files` field in `package.json`.
