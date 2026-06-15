# Pythia Workspace Manager

`pythia-workspace` is an `npx`-distributable CLI that provisions and refreshes AI agent workspaces. It installs the canonical skills, generates AGENTS.md and CLAUDE.md from one instruction source, seeds a base `.pythia` structure, and materializes a version-pinned migration engine into `.pythia/runtime/`.

## Commands

```bash
npx pythia-workspace           # auto: update if workspace detected, else init
npx pythia-workspace init      # first-time provision of a fresh workspace
npx pythia-workspace update    # refresh an existing workspace
```

`init` accepts:

- `--target <dir>` — target directory (default: current working directory)
- `--dry-run` — print planned actions; write nothing
- `--yes` — non-interactive; use defaults
- `--reconfigure` — re-run interactive prompts even if already configured
- `--surfaces <list>` — comma-separated: `claude`, `codex` (default: both)
- `--git-strategy <strategy>` — `shared|pythia|ignore` (default: `ignore`)

`update` accepts `--target`, `--dry-run`, `--no-migrate`.

## What `init` does

1. Classifies target: **fresh** (empty protected zone) or **adopted** (existing `.pythia/workflows/**` files but no stamp)
2. Seeds `.pythia/` (`manifest.json`, `config.md`, `README.md`, `workflows/.gitkeep`)
3. Renders AGENTS.md and/or CLAUDE.md from `assets/instructions.md` based on selected surfaces
4. Installs skills to selected surface directories
5. Writes `.pythia/manifest.json` with `frameworkVersion`, `migratedVersion`, `surfaces`, `gitStrategy`, `generated`

## What `update` does

1. Checks for unresolved mixed-migration state — stops if any `state.json` has `llmRemaining: true`
2. Refreshes AGENTS.md, CLAUDE.md (backed up if locally modified)
3. Prunes and reinstalls skills
4. Manifest read-merge-write (preserves `migratedVersion`, `gitStrategy`, `surfaces`, unknown fields)
5. Materializes `.pythia/runtime/` (engine + migrations pinned to `frameworkVersion`)
6. Applies pending migrations; commits fully-auto, hands mixed off to the migrate skill
7. Leaves seed-if-missing files untouched

## Auto-detect rule

`npx pythia-workspace` (no command) runs `update` when `.pythia/manifest.json` or `.pythia/version.json` is present and parseable, else `init`. Corrupt or missing stamps are treated as absent (runs `init`).

## File classes

| Class | Files | Behavior |
|---|---|---|
| Managed | `manifest.json`, skills surfaces, `AGENTS.md`, `CLAUDE.md` | Regenerated every `init`/`update`; instruction files backed up on modification |
| Seed-if-missing | `.pythia/config.md`, `.pythia/README.md`, `.pythia/workflows/.gitkeep` | Written once on `init`; never overwritten |
| Protected zone | `.pythia/workflows/**` | Never touched by `update`; migrated only by the migration engine |
| Local runtime | `.pythia/runtime/`, `.pythia/backups/` | Gitignored; regenerable by `update` |

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

Legacy `.pythia/version.json` is detected and renamed to `manifest.json` on the next write. `update` preserves `migratedVersion`, `gitStrategy`, `surfaces`, and any unknown fields.

**`migratedVersion` baseline rule**: fresh empty `init` sets it to `frameworkVersion`; adopted (non-empty unversioned protected targets) and legacy targets missing the field default to `0.0.0`.

## Skills source of truth

`skills/` is the canonical, shipped source for all agent skills. `.claude/skills` and `.agents/skills` are generated surfaces.

## Migration system

See [docs/migrations.md](migrations.md) for the full runtime contract:
- Local engine at `.pythia/runtime/` pinned to `frameworkVersion`
- Skill invokes engine via `npm --prefix .pythia run migrate:<sub>` (never npx)
- State-file protocol at `.pythia/backups/<version>/state.json`
- Stage ownership: `update` = auto steps + fully-auto commit; migrate skill = llm steps + completion verify + commit/restore
- Migration file format and authoring/release flow: see [assets/migrations/README.md](../assets/migrations/README.md)
