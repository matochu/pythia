# Pythia Workspace Manager

`pythia-workspace` is an `npx`-distributable CLI that provisions and refreshes AI agent workspaces. It installs the canonical skills, generates AGENTS.md and CLAUDE.md from one instruction source, seeds a base `.pythia` structure, and materializes a version-pinned migration engine into `.pythia/runtime/`.

## Commands

```bash
npx pythia-workspace [target-dir]           # auto: update if workspace detected, else init
npx pythia-workspace init [target-dir]      # first-time provision of a fresh workspace
npx pythia-workspace update [target-dir]    # refresh an existing workspace (one-step, even if old)
```

`target-dir` is a positional argument (default: current working directory).

`init` accepts:

- `--dry-run` — print planned actions; write nothing
- `--yes` — non-interactive; use defaults
- `--reconfigure` — re-run interactive prompts even if already configured
- `--surfaces <list>` — comma-separated: `claude`, `codex` (default: both)
- `--git-strategy <strategy>` — `shared|pythia|ignore` (default: `pythia`)

`update` accepts `--dry-run`, `--yes`, `--no-migrate`.

## What `init` does

1. Classifies target: **fresh** (no pre-existing content under `.pythia/`) or **adopted** (any pre-existing content anywhere under `.pythia/` — not just `workflows/` — but no stamp)
2. Seeds `.pythia/` (`manifest.json`, `config.md`, `README.md`, `workflows/.gitkeep`)
3. Renders AGENTS.md and/or CLAUDE.md from `assets/instructions.md` based on selected surfaces
4. Installs skills to selected surface directories
5. Writes `.pythia/manifest.json` with `frameworkVersion`, `migratedVersion`, `surfaces`, `gitStrategy`, `generated`

## What `update` does

1. Checks for unresolved mixed-migration state — stops if any `state.json` has `llmRemaining: true`
2. Resolves `surfaces`/`gitStrategy`: read from manifest if present; otherwise prompt (interactive) or default to both surfaces + `pythia` (non-interactive)
3. Applies git-strategy side effect (e.g. `git init .pythia/.git` for `pythia` strategy — see note below)
4. Seeds any missing base files (`.pythia/config.md`, `.pythia/README.md`, `.pythia/workflows/.gitkeep`) — same seed-if-missing behavior as `init`, so an old `.pythia` that never ran `init` catches up in one step
5. Refreshes AGENTS.md, CLAUDE.md (backed up if locally modified)
6. Prunes only skills `pythia` previously installed (tracked via manifest `installedSkills`) that are gone from the package, then reinstalls current skills — never touches user-authored skills
7. Materializes `.pythia/runtime/` (engine + migrations pinned to `frameworkVersion`)
8. Plans migrations from the pre-update `migratedVersion` baseline (`0.0.0` for adopted/legacy workspaces without a stamp; `frameworkVersion` for fresh workspaces)
9. Applies pending migrations; commits fully-auto, hands mixed off to the migrate skill; when no migration remains pending, writes `migratedVersion = frameworkVersion`

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
| Seed-if-missing | `.pythia/config.md`, `.pythia/README.md`, `.pythia/workflows/.gitkeep` | Written once, by `init` **and** `update`; never overwritten after |
| Migratable | all of `.pythia/` | Mutable by the migration engine's auto ops (backed up before each mutation); not touched outside of `update`'s explicit steps above |
| Local runtime / backups | `.pythia/runtime/`, `.pythia/backups/` | Gitignored; runtime is regenerable by `update`; backups contain migration backups and pre-update adopted-workspace snapshots |

## Instruction files

AGENTS.md and CLAUDE.md are generated from `assets/instructions.md` with `{tool, skillsPath}` substitution:

| Output | `tool` | `skillsPath` |
|---|---|---|
| `AGENTS.md` | `Codex` | `.agents/skills` |
| `CLAUDE.md` | `Claude Code` | `.claude/skills` |

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
  }
}
```

Legacy `.pythia/version.json` is detected and renamed to `manifest.json` on the next write. `update` preserves `gitStrategy`, `surfaces`, and any unknown fields. It uses the pre-update `migratedVersion` as the migration baseline, then advances `migratedVersion` to `frameworkVersion` after a successful update with no pending migration state.

**`migratedVersion` baseline rule**: fresh `init`/`update` (no pre-existing `.pythia/` content) starts at `frameworkVersion`; adopted (any pre-existing content anywhere under `.pythia/`, unversioned) and legacy targets missing the field start from `0.0.0`. After update finishes with no pending migration, `migratedVersion` is advanced to `frameworkVersion`.

## Skills source of truth

`skills/` is the canonical, shipped source for all agent skills. `.claude/skills` and `.agents/skills` are generated surfaces.

## Migration system

See [docs/migrations.md](migrations.md) for the full runtime contract:
- Local engine at `.pythia/runtime/` pinned to `frameworkVersion`
- Skill invokes engine via `npm --prefix .pythia run migrate:<sub>` (never npx)
- State-file protocol at `.pythia/backups/<version>/state.json`
- Stage ownership: `update` = auto steps + fully-auto commit; migrate skill = llm steps + completion verify + commit/restore
- Migration file format and authoring/release flow: see [assets/migrations/README.md](../assets/migrations/README.md)
