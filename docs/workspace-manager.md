# Pythia Workspace Manager

`pythia-workspace` is an `npx`-distributable CLI that provisions and refreshes AI agent workspaces. It installs the canonical skills, generates AGENTS.md and CLAUDE.md from one instruction source, and seeds a base `.pythia` structure — recording an installed-version stamp so subsequent runs can auto-detect what to do.

## Commands

```bash
npx pythia-workspace           # auto: update if .pythia/version.json exists, else init
npx pythia-workspace init      # first-time provision of a fresh workspace
npx pythia-workspace update    # refresh an existing workspace
```

Both `init` and `update` accept:

- `--target <dir>` — target directory (default: current working directory)
- `--dry-run` — print planned actions; write nothing (no files, no `.bak`, no stamp)

## What `init` does

1. Seeds `.pythia/` (version.json, config.md, README.md, workflows/.gitkeep)
2. Renders AGENTS.md and CLAUDE.md from `assets/instructions.md` via the `{ tool, skillsPath }` substitution table
3. Installs skills into `.claude/skills` and `.agents/skills` from the canonical `skills/` source
4. Writes `.pythia/version.json` (framework version + generated-file hash manifest)

## What `update` does

1. Regenerates skills (prunes removed skills from surfaces)
2. Full-refreshes AGENTS.md and CLAUDE.md; if a file differs from its recorded hash it is backed up to `<file>.bak` before overwrite
3. Updates `.pythia/version.json` (new version + new manifest hashes)
4. Leaves seed-if-missing files untouched (`.pythia/config.md`, `.pythia/README.md`)

## Auto-detect rule

`npx pythia-workspace` (no command) runs `update` when `.pythia/version.json` is present in the target, else `init`. A corrupt or unreadable `version.json` is treated as absent (conservative: runs `init`).

## File classes

| Class | Files | Behavior |
|---|---|---|
| Managed | `.pythia/version.json`, skills surfaces, AGENTS.md, CLAUDE.md | Regenerated every `init`/`update`; instruction files backed up on modification |
| Seed-if-missing | `.pythia/config.md`, `.pythia/README.md`, `.pythia/workflows/.gitkeep` | Written once on `init`; never overwritten by `update` |

## Instruction files

AGENTS.md and CLAUDE.md are both generated from the single source `assets/instructions.md`. The only difference between the two outputs is the `{ tool, skillsPath }` substitution:

| Output | `tool` | `skillsPath` |
|---|---|---|
| AGENTS.md | `Codex` | `.agents/skills` |
| CLAUDE.md | `Claude Code` | `.claude/skills` |

## Local-modification detection and backup

`.pythia/version.json` carries a `generated` manifest mapping each generated instruction file's relative path to its sha256 at write time. On `update`:

- If a file's current sha256 matches the recorded hash → overwrite silently
- If a file is absent → write fresh, record hash
- If current sha256 ≠ recorded hash (or no recorded hash) → write `<file>.bak` (single deterministic backup, overwriting a prior `.bak`), then overwrite and record new hash

First adoption of a pre-existing unrecorded file is treated as "modified" → backup is made.

`--dry-run` writes nothing, including no `.bak`.

## Skills source of truth

`skills/` is the canonical, shipped source for all agent skills. `.claude/skills` and `.agents/skills` are generated surfaces installed by the CLI. This supersedes the earlier `.claude/skills`-canonical decision from feat-2026-05's architecture context.

## Version stamp

`.pythia/version.json` records:

```json
{
  "frameworkVersion": "0.1.0",
  "installedAt": "<ISO-8601>",
  "surfaces": [".claude/skills", ".agents/skills"],
  "generated": {
    "AGENTS.md": "<sha256>",
    "CLAUDE.md": "<sha256>"
  }
}
```

This file is the auto-detect signal and the backup baseline. It is local-only (`.pythia/` is gitignored).

## Assets vs templates

- `assets/` — CLI install assets: `instructions.md` (instruction source) and `base/` (seed files). Shipped with the package.
- `templates/` — Document templates (`command-template.md`, `feature-template.md`, etc.) for creating workflow documents. Separate namespace; the CLI does not touch these.

## Limits (v1)

- No protected-zone migrations or migration runner
- No hook installation/enforcement
- npm publish via CI on `v*` tag push (OIDC trusted publishing, no stored token); see `RELEASING.md`
- Skill content is not edited (byte-identical install from `skills/`)
- `.pythia/` remains gitignored; the stamp is local-only
- Single deterministic `.bak` per instruction file; managed-block markers are a documented later option
