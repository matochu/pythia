# Pythia Workspace Manager

`pythia-workspace` is an `npx`-distributable CLI that provisions and refreshes AI agent workspaces. It installs the canonical skills, generates AGENTS.md and CLAUDE.md from one instruction source, seeds a base `.pythia` structure, and materializes a version-pinned migration engine into `.pythia/runtime/`.

## Layout and terminology

The CLI **`target-dir`** (default: cwd) is the **project root** — the directory that *contains* `.pythia/`, not `.pythia/` itself.

```
~/my-app/                      ← PROJECT ROOT (CLI target-dir)
├── package.json               ← your project
├── skills/                    ← project-level assets (when present)
├── AGENTS.md / CLAUDE.md      ← managed instruction files
└── .pythia/                   ← PYTHIA WORKSPACE
    ├── manifest.json          ← workspace registration + migration state
    ├── package.json           ← runtime registration (frameworkVersion; npm --prefix .pythia)
    ├── config/settings.md     ← user config (seed-if-missing)
    ├── config/paths.md        ← checker / post-hook routing
    ├── runtime/inputs.js      ← freshness sync/check (materialized by update)
    └── workflows/             ← feature artifacts (sync zone for ## References)
        └── features/feat-…/
            ├── plans/*.plan.md
            ├── contexts/*.context.md
            └── reports/*.review.md · …
```

| Term | Path | Role |
|---|---|---|
| **Project root** | `target-dir` / parent of `.pythia/` | Host repo: your code, skills surfaces, managed AGENTS/CLAUDE |
| **Pythia workspace** | `.pythia/` | Workflow state, config, runtime, migrations |
| **Sync zone** | `.pythia/**/*.md` minus `runtime/`, `config/`, `backups/`, `README.md` | Markdown that gets `## References` / `## Used by` via `inputs.js sync` |

### Git vs path resolution

Git is **VCS / backup only**. It does **not** define where workflow links resolve.

| Layer | Path | When (`gitStrategy`) |
|---|---|---|
| **Project git** | `{project-root}/.git` | `shared` — `.pythia/` tracked in the project repo |
| **Pythia git** | `{project-root}/.pythia/.git` | `pythia` (default) — separate local repo for `.pythia/` only |
| **None** | — | `ignore` — CLI does not run `git init` |

`inputs.js` (sync / check / rdeps) resolves link targets from the **project root**, discovered by walking up to `.pythia/manifest.json` (or legacy `version.json`, or `.pythia/package.json`). No `git rev-parse`.

Example: a plan under `.pythia/workflows/…/plans/` links to `skills/plan/SKILL.md` → resolved as `{project-root}/skills/plan/SKILL.md`.

Post-save hook (see `config/paths.md` → Post-commands) runs `.pythia/runtime/inputs.js sync` on edited sync-zone markdown.

### Two root finders in runtime (known divergence)

Not all runtime scripts use the same anchor. Today:

| Module | Root discovery | Used for |
|---|---|---|
| `repo-root.js` → `projectRoot()` | Walk up to `.pythia/manifest.json` (or `version.json` / `.pythia/package.json`) | `inputs.js`, `cross-refs.js`, `pythia health` |
| `event.js` → `repoRoot(event)` | Walk up to first `.git` from `event.cwd` | `post.js` / `pre.js` hook routing (`loadZones`, edited-path resolution) |

In the common case — project git at `{project-root}/.git` — both resolve to the same directory. They can **diverge** when git lives above the pythia project (monorepo: git root = repo root, `.pythia/` lives in a subfolder): hooks treat the git toplevel as cwd root; inputs treat the **manifest parent** as project root.

Hooks stay git-based for historical host compatibility (`event.cwd`, Claude `CLAUDE_PROJECT_DIR`). Unifying on manifest-based `projectRoot()` is a future cleanup, not required for 0.3.6.

### `inputs.js check --all`

Batch freshness pass over the sync zone (default tree: `.pythia/`):

1. Walk all sync-eligible `.pythia/**/*.md`
2. For each file with `## References`, compare stored hash per ref to the current content of the target file
3. Exit `0` if all fresh; exit `1` if any **STALE** (target changed) or **MISSING** / invalid ref

Does not modify files — read-only audit. Run explicitly when you care about document consistency:

```bash
node .pythia/runtime/inputs.js check --all
```

Single-file check: `node .pythia/runtime/inputs.js check path/to/doc.md`.

**Not** part of `pythia health` — stale or missing refs during active editing are normal; health only verifies the inputs runtime is installed and executable.

## Commands

```bash
npx pythia-workspace [target-dir]           # auto: update if workspace detected, else init
npx pythia-workspace init [target-dir]      # first-time provision of a fresh workspace
npx pythia-workspace update [target-dir]    # refresh an existing workspace (one-step, even if old)
npx pythia-workspace version [target-dir]   # show installed framework version, surfaces, migration status
npx pythia-workspace health [target-dir]    # verify minimal files, runtime, surfaces, and hook wiring
npx pythia-workspace uninstall [target-dir] # remove managed surfaces and runtime (preserves workflows/)
```

`target-dir` is a positional argument (default: current working directory).

`init` accepts:

- `--dry-run` — print planned actions; write nothing
- `--yes` — non-interactive; use defaults
- `--reconfigure` — re-run interactive prompts even if already configured
- `--surfaces <list>` — comma-separated: `claude`, `codex`, `cursor` (default: `claude`, `codex`; Cursor is opt-in)
- `--git-strategy <strategy>` — `shared|pythia|ignore` (default: `pythia`)

`update` accepts `--dry-run`, `--yes`, `--no-migrate`.

`version` reads `.pythia/manifest.json` and prints framework version, migrated version, surfaces, installed skill count, pending migration status, and npm registry status (`registry:` line). When `registryCheck.checkedAt` is older than 24 hours (or missing), it runs `npm view pythia-workspace version` and stores the result in `manifest.registryCheck`. Exits `1` when no workspace manifest is found. Writes only `registryCheck` when refreshing stale cache.

`health` verifies a workspace has the minimum expected layout: valid manifest fields, protected `.pythia/config/*` seeds, materialized runtime essentials, installed skill surfaces, host hook wiring for enabled surfaces, and managed instruction files. Also checks `findUnresolvedMixedStates` (fail), `paths.md` Workflow docs invariants (warn, same rules as `migrate:verify`), missing runtime checkers (warn), and **inputs runtime** (`inputs.project-root` — manifest anchor resolves to project root; `inputs.cli` — `inputs.js check` runs against `.pythia/config/paths.md`). Document freshness (`inputs check --all`) is intentionally **not** included — use it separately when auditing workflow docs. Pending `migratedVersion` behind `frameworkVersion` is **warn**. Exits `0` when no fail-level checks remain, `1` otherwise. Use `--json` for machine-readable output. Default target is cwd (omit `[target-dir]`).

`uninstall` accepts:

- `--dry-run` — print planned removals; write nothing
- `--yes` — skip the confirmation prompt (`[y/N]`); **required** in non-interactive environments (no TTY)

Without `--yes` on a TTY, uninstall prompts before removing anything. Without `--yes` and without a TTY, uninstall prints an error and exits `1` without removing anything. On a non-workspace target it prints `not a pythia workspace` and exits `0`.

## What `init` does

`init` completes **full workspace bootstrap** in one command — no follow-up `update` required for first-time setup.

Fixed lifecycle order (same sequence previewed by `--dry-run init`):

1. Classifies target: **fresh** or **adopted** (any pre-existing content under `.pythia/`)
2. Applies `gitStrategy` side effect (e.g. `git init .pythia/.git` for `pythia`)
3. Seeds base `.pythia/config/*` (settings, paths, README, workflows `.gitkeep`) — seed-if-missing only
4. Renders managed instruction files from `assets/instructions.md`
5. Installs skills to each selected surface (`.claude/skills`, `.agents/skills`, `.cursor/skills` when opted in)
6. **Hook runtime**: materializes `tools/{lib,checks,hooks}`, `inputs.js`, and shipped `package-paths.md` → `.pythia/runtime/`
7. Wires host hooks (Claude/Codex/Cursor) from materialized runtime scripts
8. **Migrate runtime**: materializes migration engine + versioned migration files (no duplicate lib/checks copy)
9. Writes `.pythia/package.json` and `manifest.json`
10. Applies pending migrations; fully-auto migrations verify + commit via shared `commitMigrationVersion`

Repeat `init` preserves existing `migratedVersion`. Adopted first init starts from `0.0.0` baseline and migrates in the same run.

## What `update` does

Same lifecycle refresh as `init` (steps 2–10), plus:

1. Checks for unresolved mixed-migration state — stops if any `state.json` has `llmRemaining: true`
2. Pre-update backup for adopted workspaces without committed `.pythia` git history
3. Prunes removed package skills (only entries in `installedSkills`)
4. Warns when workspace `paths.md` references checkers missing from `.pythia/runtime/checks/`
5. Refreshes `manifest.registryCheck` via npm (unless `--dry-run`)
6. Prints post-update **inputs runtime** summary (`inputs.project-root`, `inputs.cli`) — see [Layout and terminology](#layout-and-terminology)

## What `uninstall` does

1. Checks `isWorkspace(target)` — if false, prints `not a pythia workspace` and exits `0`
2. Prompts for confirmation unless `--yes` (or `--dry-run`)
3. Reads `manifest.json` and removes exactly what pythia installed:
   - Instruction files listed in `manifest.generated` (`CLAUDE.md`, `AGENTS.md`, …)
   - Skills from each `manifest.surfaces` entry that appear in `manifest.installedSkills`
   - `.pythia/runtime/` entirely
   - Pythia-managed hook entries from `.claude/settings.json` and `hooks.json` (`_managed: "pythia"` or hooks targeting `.pythia/runtime/hooks`)
   - `.codex/rules/default.rules` when it still matches the pythia-shipped template (header `# Pythia workspace guardrails`)
   - `.pythia/manifest.json` and legacy `.pythia/version.json`
4. **Preserves**: `.pythia/workflows/**`, user-added skills not in `installedSkills`, non-pythia hook entries, user-modified `.codex/rules/default.rules`, seed files under `.pythia/config/`

After uninstall, `isWorkspace(target)` returns `false`. Running uninstall again is a no-op.

## Registry update check

`update` and `version` compare **this workspace's** `manifest.frameworkVersion` against the latest `pythia-workspace` version on npm. Results are stored per-workspace in `manifest.registryCheck`:

```json
"registryCheck": {
  "checkedAt": "2026-06-17T12:00:00.000Z",
  "latestVersion": "0.3.3"
}
```

- **`update`**: always refreshes the registry check at the end (unless `--dry-run`), bypassing the 24h rate limit. Prints a one-line notice when `latestVersion !== frameworkVersion`.
- **`version`**: refreshes only when `checkedAt` is older than 24 hours; prints a `registry:` summary line either way.
- Network failures and missing npm are silent — they never block `update` or `version`.
- Legacy `SessionStart` hooks from earlier pythia versions are removed on the next `update`.

## `gitStrategy`

| Strategy | Effect |
|---|---|
| `shared` | `.pythia/` is tracked in the project's own (parent) git repo; no separate `.git` |
| `pythia` (default) | `update`/`init` run `git init .pythia/.git` once if absent, giving `.pythia/` its own local, untracked-by-parent repo |
| `ignore` | No git action taken; `.pythia/` is left exactly as found |

`pythia` creates repository ownership only; `init`/`update` still never run `git add` or `git commit` inside `.pythia/.git`. For an adopted workspace that has no committed `.pythia` history yet, `update` first writes a gitignored pre-update snapshot at `.pythia/backups/pre-update-<timestamp>/.pythia/` before seed/refresh/install/migration work. Once `.pythia/.git` has committed history, that history is the expected recovery point and the fallback snapshot is skipped.

## Auto-detect rule

`npx pythia-workspace [target-dir]` (no subcommand) runs `update` when `.pythia/` exists with any real content (managed manifest/version JSON, or any file/dir besides `.DS_Store`) — even without a manifest. An empty or absent `.pythia/` runs `init`.

## File classes

| Class | Files | Behavior |
|---|---|---|
| Managed | `manifest.json`, skills surfaces, `AGENTS.md`, `CLAUDE.md` | Regenerated every `init`/`update`; instruction files backed up on modification |
| Seed-if-missing | `.pythia/config/settings.md`, `.pythia/config/paths.md`, `.pythia/README.md`, `.pythia/workflows/.gitkeep` | Written once, by `init` **and** `update`; never overwritten after |
| Migratable | all of `.pythia/` | Mutable by the migration engine's auto ops (backed up before each mutation); not touched outside of `update`'s explicit steps above |
| Local runtime / backups | `.pythia/runtime/`, `.pythia/backups/` | Gitignored; runtime is regenerable by `update`; backups contain migration backups and pre-update adopted-workspace snapshots |

## Instruction files

`AGENTS.md` is **universal agent instructions** (no host branding — Cursor and other agents read it natively). `CLAUDE.md` remains Claude-branded.

Both are generated from `assets/instructions.md`:

| Output | Header / intro | `skillsPath` |
|---|---|---|
| `AGENTS.md` | `# Project Instructions` / agent instructions | `.agents/skills` |
| `CLAUDE.md` | `# Project Instructions (Claude Code)` | `.claude/skills` |

No managed `.cursor/rules/pythia.mdc` — Cursor uses root `AGENTS.md` plus opt-in `.cursor/skills` and hooks.

## Surfaces

| Key | Path | Default install |
|---|---|---|
| `claude` | `.claude/skills` | yes |
| `codex` | `.agents/skills` | yes |
| `cursor` | `.cursor/skills` | opt-in (`--surfaces cursor`) |

## Manifest (`manifest.json`)

`.pythia/manifest.json` is the workspace stamp and migration state record:

```json
{
  "frameworkVersion": "0.2.0",
  "migratedVersion": "0.1.0",
  "installedAt": "<ISO-8601>",
  "surfaces": [".claude/skills", ".agents/skills"],
  "gitStrategy": "ignore",
  "generated": {
    "AGENTS.md": "<sha256>",
    "CLAUDE.md": "<sha256>"
  },
  "registryCheck": {
    "checkedAt": "<ISO-8601>",
    "latestVersion": "0.3.3"
  }
}
```

Legacy `.pythia/version.json` is detected and renamed to `manifest.json` on the next write. `update` preserves `gitStrategy`, `surfaces`, and any unknown fields. It uses the pre-update `migratedVersion` as the migration baseline, then advances `migratedVersion` to `frameworkVersion` after a successful update with no pending migration state.

**`migratedVersion` baseline rule**: first `init`/`update` without an existing stamp starts from `0.0.0` so pending versioned migrations run in the same pass; repeat `init` preserves existing `migratedVersion`. After migrations finish with none pending, `migratedVersion` is advanced to `frameworkVersion`.

## Skills source of truth

`skills/` is the canonical, shipped source for all agent skills. `.claude/skills` and `.agents/skills` are generated surfaces.

## Migration system

See [docs/migrations.md](migrations.md) for the full runtime contract:
- Local engine at `.pythia/runtime/` pinned to `frameworkVersion`
- Skill invokes engine via `npm --prefix .pythia run migrate:<sub>` (never npx)
- State-file protocol at `.pythia/backups/<version>/state.json`
- Stage ownership: `update` = auto steps + fully-auto commit; migrate skill = llm steps + completion verify + commit/restore
- Migration file format and authoring/release flow: see [assets/migrations/README.md](../assets/migrations/README.md)
