# Pythia Migration System

This document describes the protected-zone migration runtime contract for `pythia-workspace`.

## Overview

When artifact formats in `.pythia/workflows/**` change, existing workspaces must migrate those artifacts to match the new format. The migration system handles this without `update` touching protected-zone files directly.

Two stages own different parts of the work:

| Stage | Owned state | Entry point |
|---|---|---|
| `update` (CLI) | auto steps, fully-auto commit, mixed hand-off | `npx pythia-workspace update` |
| `migrate` skill (LLM/agent) | llm steps, completion verify, commit/restore | `npm --prefix .pythia run migrate:<sub>` |

`npx pythia-workspace update` is the only thing that (re)materializes the local runtime at a new `frameworkVersion`. Everything else uses the local pinned copy.

## Local Engine (`.pythia/runtime/`)

`init`/`update` write **`.pythia/package.json`** (the registration entry point) and materialize the engine + migration files into **`.pythia/runtime/`**:

```
.pythia/
  package.json          ← registration: name, frameworkVersion, migrate:* scripts
  runtime/
    migrate/
      ops.js            ← 7 auto ops
      semver.js         ← numeric semver comparison
      status.js         ← list pending migrations
      apply.js          ← run auto steps, write state.json
      verify.js         ← validate changedPaths
      commit.js         ← bump migratedVersion, prune backups
      restore.js        ← roll back from backup manifest
      state.js          ← state-file helpers
    migrations/
      0.1.0.md          ← versioned migration files (pinned to frameworkVersion)
```

`.pythia/runtime/` is gitignored and regenerable — `update` is the single writer. The engine, migration set, and `manifest.frameworkVersion` are always the same version, so a later skill run cannot drift to a newer published package.

### Invoking the local engine

The **skill and hooks** invoke the engine through the local, stable npm script registration:

```bash
npm --prefix .pythia run migrate:status
npm --prefix .pythia run migrate:apply    -- <version>
npm --prefix .pythia run migrate:verify   -- <version>
npm --prefix .pythia run migrate:commit   -- <version>
npm --prefix .pythia run migrate:restore  -- <version>
```

Or directly, if the npm prefix form is inconvenient:

```bash
node .pythia/runtime/migrate/status.js   [--target <dir>]
node .pythia/runtime/migrate/apply.js    [--target <dir>] <version>
node .pythia/runtime/migrate/verify.js   [--target <dir>] <version>
node .pythia/runtime/migrate/commit.js   [--target <dir>] <version>
node .pythia/runtime/migrate/restore.js  [--target <dir>] <version>
```

**Never use `npx pythia-workspace <engine-sub>`** for deep migration work. `npx` is only the installer/updater that materializes `.pythia/runtime/`; nothing else uses it.

## Stage Ownership

```
npx pythia-workspace update
  ├─ check for unresolved mixed state → STOP if found (tell user to run migrate skill)
  ├─ managed refresh (AGENTS.md, CLAUDE.md, skills)
  ├─ manifest read-merge-write (preserve migratedVersion, gitStrategy, surfaces)
  ├─ materialize .pythia/runtime/ (pinned to frameworkVersion)
  ├─ for each pending migration in (migratedVersion, frameworkVersion]:
  │    ├─ apply auto steps (backup + state.json)
  │    ├─ fully-auto? → verify(changedPaths) → commit(bump + prune)
  │    └─ mixed (has llm)?  → leave auto-applied, DO NOT verify/restore, announce skill
  └─ done

migrate skill (LLM/agent)
  ├─ check .pythia/backups/<v>/state.json for llmRemaining steps
  ├─ back up + perform each llm step (verify each Success condition)
  ├─ run verify(changedPaths) on the COMPLETED migration
  ├─ success → commit (bump + prune)
  └─ failure (op error or completion-verify failure) → restore (no bump)
```

**Mixed migrations are never verified by `update`** — their auto-only intermediate state is intentionally not final. Verify runs only on completed migrations (fully-auto by `update`, mixed by the skill after llm steps).

## Per-Version State File

`migrate-apply` writes `.pythia/backups/<version>/state.json` — the inter-script contract between stages:

```json
{
  "migrationVersion": "0.2.0",
  "frameworkVersion": "0.2.0",
  "changedPaths": ["rel/path/to/file.md"],
  "appliedSteps": [1, 2],
  "llmRemaining": true,
  "backups": [
    { "path": "rel/path/to/file.md", "backupPath": ".pythia/backups/0.2.0/rel/path/to/file.md", "sha256": "abc123" }
  ]
}
```

- `migrate-verify` validates exactly `changedPaths` using inline structural checks per workflow-doc type
- `migrate-commit`/`migrate-restore` require the state file, validate `frameworkVersion`, and use `backups` to scope work; no absolute `targetRoot` is stored — state is portable across workspace moves and syncs
- The skill reads `state.json` to know which llm steps remain and which files changed

This file is a **public contract** — its schema must not be changed without a migration.

## Manifest (`manifest.json`)

`.pythia/manifest.json` replaces the legacy `.pythia/version.json`. `isWorkspace()` dual-detects both; the first write after a legacy workspace renames `version.json` → `manifest.json`.

Fields:

```json
{
  "frameworkVersion": "0.2.0",
  "migratedVersion": "0.1.0",
  "installedAt": "2026-06-15T00:00:00.000Z",
  "surfaces": [".claude/skills", ".agents/skills"],
  "gitStrategy": "ignore",
  "generated": {
    "AGENTS.md": "<sha256>",
    "CLAUDE.md": "<sha256>"
  }
}
```

**`update` preserves** `migratedVersion`, `gitStrategy`, and `surfaces` — it only overwrites `frameworkVersion`, `installedAt`, and `generated`. Unknown fields are also preserved (field-preservation invariant).

### Baseline rule

| Target state | `migratedVersion` written |
|---|---|
| Empty/newly seeded (fresh `init`) | `frameworkVersion` (already current) |
| Non-empty protected zone, no stamp (adopted) | `0.0.0` (must run migrations) |
| Legacy `version.json` without `migratedVersion` | `0.0.0` (treated as adopted) |

## Repeated Update While Migration Is Pending

If any `.pythia/backups/<version>/state.json` has `llmRemaining: true` (i.e., a mixed migration is half-applied and awaiting the skill), **`update` stops before managed refresh or runtime rematerialization**. The user must run the migrate skill to commit or restore that pending version first.

This prevents a new `frameworkVersion` from stranding half-applied protected edits with a mismatched runtime.

## Backups and Restore

- Backups: `.pythia/backups/<targetVersion>/<relpath>` (self-gitignored via `.pythia/backups/.gitignore`)
- Pruning: `commit` retains the N newest versions (config `backup-retention`, default 3)
- `restore` uses the `backups` manifest in `state.json` to roll back exactly the files that were changed; no bump is written on restore

## The 7 `auto` Ops

All auto ops:
- Apply only to `.pythia/workflows/**` (refuse other targets)
- Are idempotent (each has a `Check` condition that short-circuits if already applied)
- Back up the target file before mutating
- Record the changed path in `state.json`

| Op | Description |
|---|---|
| `ensure-dir` | Create a directory if absent |
| `write-if-missing` | Write a file only if not present |
| `set-frontmatter` | Set/update a YAML frontmatter key |
| `rename-frontmatter-key` | Rename a YAML frontmatter key |
| `rename-file` | Rename/move a file |
| `append-to-section` | Append text to a named `##` section |
| `replace-once` | Replace the first occurrence of a string |

## Migration File Format

See [migrations.md](../assets/migrations/README.md) for the full authoring contract and the `next.md` release flow.

Versioned migration files live at `assets/migrations/<semver>.md` in the package source. `init`/`update` materialize them into `.pythia/runtime/migrations/` — that copy is the authoritative runtime read path for `status`, `apply`, and the skill.
