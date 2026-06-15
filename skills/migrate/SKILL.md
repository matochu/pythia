# Skill: migrate

**Purpose**: Complete pending deep (llm) migrations using the local, version-pinned engine materialized by `update`. Invoke this skill when `pythia update` announces that one or more migrations need deep (llm) steps.

## When to use

Run this skill when you see a message like:
```
[update] migration 0.2.0: auto steps applied; deep migration pending — run the migrate skill to complete
```

Or when `npm --prefix .pythia run migrate:status` reports pending migrations with `llmRemaining`.

## Prerequisites

The local engine must be present at `.pythia/runtime/`. Check:

```bash
# Check engine is present and version matches
cat .pythia/package.json  # should show frameworkVersion matching manifest.frameworkVersion

# Check pending state
npm --prefix .pythia run migrate:status
```

If the runtime is **missing or stale** (`.pythia/package.json` `version` differs from `manifest.frameworkVersion`) and **no unresolved state exists**: run `npx pythia-workspace update` first, then return to this skill.

If unresolved state exists with a stale runtime: **do not run update**. Complete or restore the pending state using the local commands still present in `.pythia/runtime/`, or document a manual recovery blocker if `.pythia/runtime/` is missing.

## Procedure

For each migration version with `llmRemaining: true`:

### 1. Read the pending state

```bash
# View what the pending migration needs
npm --prefix .pythia run migrate:status
cat .pythia/backups/<version>/state.json
```

The `state.json` contains:
- `changedPaths`: files already modified by the auto steps
- `appliedSteps`: auto step numbers already applied
- `llmRemaining`: true (means there are llm steps to complete)
- `backups`: backup manifest for restore

### 2. Read the migration file

```bash
cat .pythia/runtime/migrations/<version>.md
```

Find all steps where `**Kind**: llm`. For each:
- Check the `**Check**` condition — if already satisfied, skip this step (idempotent)
- Read the `**Apply**` instruction and perform the edit on the **Target** file
- Verify the `**Success condition**` after editing

### 3. Confirm before editing protected artifacts

Always confirm before modifying files in `.pythia/workflows/**`. Show the user what you plan to change and get approval.

### 4. Complete all llm steps

For each llm step in order:
1. Check idempotency: if `**Check**` condition is already true, skip
2. Back up the file first (or confirm `.pythia/backups/<version>/` already has it)
3. Apply the `**Apply**` instruction
4. Verify `**Success condition**`
5. If `**Failure condition**` is met: trigger restore (step 6b)

### 5a. On success: verify the completed migration

```bash
npm --prefix .pythia run migrate:verify -- <version>
# or directly:
node .pythia/runtime/migrate/verify.js --target . <version>
```

If verify passes → proceed to commit.

### 5b. On failure: restore

If any llm step cannot meet its success condition, or if `migrate:verify` fails:

```bash
npm --prefix .pythia run migrate:restore -- <version>
# or:
node .pythia/runtime/migrate/restore.js --target . <version>
```

This rolls back the auto-applied changes from backup. **No version bump is written.**
Stop and report the failure to the user.

### 6. Commit

```bash
npm --prefix .pythia run migrate:commit -- <version>
# or:
node .pythia/runtime/migrate/commit.js --target . <version>
```

This bumps `migratedVersion` in `.pythia/manifest.json` and prunes old backups.

### 7. Check for more

```bash
npm --prefix .pythia run migrate:status
```

Repeat for any remaining pending migrations.

## Engine invocation reference

All engine commands accept `--target <dir>` (default: current directory) and most accept `--dry-run`.

```bash
npm --prefix .pythia run migrate:status
npm --prefix .pythia run migrate:apply    -- <version>   [--dry-run]
npm --prefix .pythia run migrate:verify   -- <version>
npm --prefix .pythia run migrate:commit   -- <version>   [--retention <n>]
npm --prefix .pythia run migrate:restore  -- <version>   [--dry-run]
```

Or directly (when package may be unavailable):

```bash
node .pythia/runtime/migrate/status.js
node .pythia/runtime/migrate/apply.js    <version>
node .pythia/runtime/migrate/verify.js   <version>
node .pythia/runtime/migrate/commit.js   <version>
node .pythia/runtime/migrate/restore.js  <version>
```

## State authority

If unresolved mixed state exists and the runtime version differs from `manifest.frameworkVersion`: the pending state's own `migrationVersion`/`frameworkVersion` is authoritative. Complete or restore using the current `.pythia/runtime/` commands. Do not allow `update` to overwrite the runtime until the pending state is resolved.

## No preview / dry-run for llm steps

Preview mode: describe what changes you would make but write nothing. Do not commit.
