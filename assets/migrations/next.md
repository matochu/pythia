# Migration next

Applied by `pythia-workspace update` when `migratedVersion < <version>`.

<!-- At release: rename this file to <frameworkVersion>.md and update the version condition above. -->

## Step 1

**Target**: `.pythia/config/paths.md`
**Kind**: auto
**Check**: Workflow docs checker lists use `structure.js` and include `artifact-metadata.js` for workflow artifacts.

**Op:**
```json
{
  "op": "merge-checker-basenames",
  "path": ".pythia/config/paths.md",
  "section": "Workflow docs",
  "rules": [
    {
      "glob": "*.plan.md",
      "replace": { "doc-structure.js": "structure.js" },
      "append": ["artifact-metadata.js"],
      "checkers": ["links.js", "plan-version-log.js", "plan-numbering.js", "cross-refs.js", "plans-index.js", "inputs-fresh.js", "structure.js", "artifact-metadata.js"]
    },
    {
      "glob": "*.review.md",
      "replace": { "doc-structure.js": "structure.js" },
      "append": ["role-boundary.js", "artifact-metadata.js"],
      "checkers": ["role-boundary.js", "links.js", "inputs-fresh.js", "structure.js", "artifact-metadata.js"]
    },
    {
      "glob": "*.implementation.md",
      "replace": { "doc-structure.js": "structure.js" },
      "append": ["role-boundary.js", "artifact-metadata.js"],
      "checkers": ["role-boundary.js", "links.js", "inputs-fresh.js", "structure.js", "artifact-metadata.js"]
    },
    {
      "glob": "*.audit.md",
      "replace": { "doc-structure.js": "structure.js" },
      "append": ["role-boundary.js", "artifact-metadata.js"],
      "checkers": ["role-boundary.js", "links.js", "inputs-fresh.js", "structure.js", "artifact-metadata.js"]
    },
    {
      "glob": "*.context.md",
      "append": ["artifact-metadata.js"],
      "checkers": ["links.js", "inputs-fresh.js", "artifact-metadata.js"]
    },
    {
      "glob": "feat-*.md",
      "append": ["artifact-metadata.js"],
      "checkers": ["links.js", "inputs-fresh.js", "artifact-metadata.js"]
    },
    {
      "glob": "*.retro.md",
      "append": ["artifact-metadata.js"],
      "checkers": ["links.js", "inputs-fresh.js", "artifact-metadata.js"]
    }
  ]
}
```

**Success condition**: `doc-structure.js` checker entries are replaced with `structure.js`; custom checker basenames are preserved; missing `artifact-metadata.js` entries are appended.

## Step 2

**Target**: `.pythia/`
**Kind**: auto
**Check**: Sync-eligible `.pythia/` data markdown contains `Schema: pythia-artifact-v1` body metadata.

**Op:**
```json
{
  "op": "migrate-artifact-metadata",
  "scopes": [
    {
      "name": "pythia-data-markdown",
      "root": ".pythia",
      "patterns": [
        "*.md"
      ],
      "dataOnly": true
    }
  ],
  "schema": "pythia-artifact-v1",
  "strict": true
}
```

**Success condition**: Existing sync-eligible `.pythia/` data markdown uses the universal body metadata contract and no legacy metadata/frontmatter carriers remain. README, config, runtime, backups, and generated instruction files are not migrated.

## Step 3

**Target**: `.pythia/`
**Kind**: auto
**Check**: Legacy frontmatter `inputs:` blocks are converted after metadata frontmatter is normalized.

**Op:**
```json
{
  "op": "sync-legacy-inputs",
  "glob": ".pythia"
}
```

**Success condition**: Existing legacy `inputs:` frontmatter under sync-eligible `.pythia/` data markdown is represented as body `## References` entries after artifact metadata migration runs, so hashes are computed from the final metadata-normalized body. Sync-eligible markdown follows `isPythiaSyncMarkdownRelPath`: includes `.pythia/**/*.md` data files and excludes `.pythia/README.md`, `.pythia/config/**`, `.pythia/runtime/**`, `.pythia/backups/**`, and generated instruction readmes.

## Step 4

**Target**: `.pythia/config/paths.md`
**Kind**: auto
**Check**: Workflow docs checker lists include `refs-owned.js` for all artifact globs.

**Op:**
```json
{
  "op": "merge-checker-basenames",
  "path": ".pythia/config/paths.md",
  "section": "Workflow docs",
  "rules": [
    {
      "glob": "*.plan.md",
      "append": ["refs-owned.js"],
      "checkers": ["links.js", "plan-version-log.js", "plan-numbering.js", "cross-refs.js", "plans-index.js", "inputs-fresh.js", "structure.js", "artifact-metadata.js", "refs-owned.js"]
    },
    {
      "glob": "*.review.md",
      "append": ["refs-owned.js"],
      "checkers": ["role-boundary.js", "links.js", "inputs-fresh.js", "structure.js", "artifact-metadata.js", "refs-owned.js"]
    },
    {
      "glob": "*.implementation.md",
      "append": ["refs-owned.js"],
      "checkers": ["role-boundary.js", "links.js", "inputs-fresh.js", "structure.js", "artifact-metadata.js", "refs-owned.js"]
    },
    {
      "glob": "*.audit.md",
      "append": ["refs-owned.js"],
      "checkers": ["role-boundary.js", "links.js", "inputs-fresh.js", "structure.js", "artifact-metadata.js", "refs-owned.js"]
    },
    {
      "glob": "*.context.md",
      "append": ["refs-owned.js"],
      "checkers": ["links.js", "inputs-fresh.js", "artifact-metadata.js", "refs-owned.js"]
    },
    {
      "glob": "feat-*.md",
      "append": ["refs-owned.js"],
      "checkers": ["links.js", "inputs-fresh.js", "artifact-metadata.js", "refs-owned.js"]
    },
    {
      "glob": "*.retro.md",
      "append": ["refs-owned.js"],
      "checkers": ["links.js", "inputs-fresh.js", "artifact-metadata.js", "refs-owned.js"]
    }
  ]
}
```

**Success condition**: All workflow artifact glob entries in `## Workflow docs` include `refs-owned.js` in their checker list.
