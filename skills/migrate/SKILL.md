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
node .pythia/runtime/migrate/verify.js <version>
```

If verify passes → proceed to commit.

### 5b. On failure: restore

If any llm step cannot meet its success condition, or if `migrate:verify` fails:

```bash
npm --prefix .pythia run migrate:restore -- <version>
# or:
node .pythia/runtime/migrate/restore.js <version>
```

This rolls back the auto-applied changes from backup. **No version bump is written.**
Stop and report the failure to the user.

### 6. Commit

```bash
npm --prefix .pythia run migrate:commit -- <version>
# or:
node .pythia/runtime/migrate/commit.js <version>
```

This bumps `migratedVersion` in `.pythia/manifest.json` and prunes old backups.

### 7. Check for more

```bash
npm --prefix .pythia run migrate:status
```

Repeat for any remaining pending migrations.

## Engine invocation reference

No `--target` flag — engine commands always run from their materialized location at
`.pythia/runtime/migrate/<script>.js` and derive the workspace root from that path. Most accept `--dry-run`.

```bash
npm --prefix .pythia run migrate:status
npm --prefix .pythia run migrate:apply    -- <version>   [--dry-run]
npm --prefix .pythia run migrate:check    -- <from> <to> [--apply-sync]
npm --prefix .pythia run migrate:verify   -- <version>
npm --prefix .pythia run migrate:commit   -- <version>   [--retention <n>]
npm --prefix .pythia run migrate:restore  -- <version>   [--dry-run]
```

Or directly (when package may be unavailable):

```bash
node .pythia/runtime/migrate/status.js
node .pythia/runtime/migrate/apply.js    <version>
node .pythia/runtime/migrate/check.js    <from> <to> [--apply-sync]
node .pythia/runtime/migrate/verify.js   <version>
node .pythia/runtime/migrate/commit.js   <version>
node .pythia/runtime/migrate/restore.js  <version>
```

## State authority

If unresolved mixed state exists and the runtime version differs from `manifest.frameworkVersion`: the pending state's own `migrationVersion`/`frameworkVersion` is authoritative. Complete or restore using the current `.pythia/runtime/` commands. Do not allow `update` to overwrite the runtime until the pending state is resolved.

## No preview / dry-run for llm steps

Preview mode: describe what changes you would make but write nothing. Do not commit.

---

## /migrate check

Post-update structured verification. Run after `pythia update` to confirm the migration applied correctly and identify safe follow-up sync work.

### Trigger

```
/migrate check <from> to <to>
```

Example: `/migrate check 0.3.6 to 0.3.8`

`<from>` = version before update, `<to>` = version after update.

### Procedure

**1. Run the structured check helper**

Prefer the materialized runtime helper:

```bash
npm --prefix .pythia run migrate:check -- <from> <to>
# or directly:
node .pythia/runtime/migrate/check.js <from> <to>
```

The helper:
- finds the workspace from `.pythia/runtime/migrate/check.js`
- reads migration files and available `.pythia/backups/<version>/state.json`
- merges and deduplicates changedPaths
- runs `migrate:verify` for `<to>`
- scans changed markdown with strict artifact metadata checks
- scans changed markdown with `refs-owned.js` for phantom `## References` / `## Used by`
- checks `.pythia/config/paths.md` with the paths invariant checker
- runs `inputs.js check --all`
- groups STALE refs by changed dependency/root cause
- reports `PASS`, `WARN`, or `FAIL`

The helper is triage, not a replacement for agent review. When it reports `WARN`, inspect the reported files, identify the concrete format/content drift, and propose the exact remediation to the user before editing or syncing.

If `migrate:check` is unavailable because the runtime is older, use the manual fallback below.

**2. Interpret terminal state**

`/migrate check` always ends in exactly one of:

| State | Meaning |
|---|---|
| **PASS** | No issues; migration verified clean |
| **WARN** | Migration valid; follow-up available (stale refs, metadata advisories) |
| **FAIL** | Migration invalid; stop; do not commit further changes |

Severity rules:

| Result | Severity | Action |
|---|---|---|
| `verify.js` failure | **FAIL — stop** | Report to user; no sync/remediation |
| metadata/schema errors | **WARN** | Describe; recommend `/migrate` or manual repair; do not auto-fix |
| `refs-owned` phantom refs | **WARN** | Read the file; propose body-link or sync remediation; never edit trailing refs manually |
| `inputs check` INVALID | **WARN — investigate** | Read the file; may need manual repair |
| `inputs check` STALE | **WARN — syncable** | Offer sync remediation when safe |

`inputs check --all` exits 1 when STALE or INVALID refs exist. This is a WARN unless `migrate:check` also reports verify failure.
`migrate:check` exits `0` for PASS and WARN, and `1` only for FAIL, so do not treat shell success as a clean migration; read the printed status line.

**3. Remediation flow for STALE refs**

`/migrate check` never silently fixes files.

If the helper reports STALE artifacts and no FAIL/metadata blockers, ask for explicit permission before applying sync:

```bash
npm --prefix .pythia run migrate:check -- <from> <to> --apply-sync
# or directly:
node .pythia/runtime/migrate/check.js <from> <to> --apply-sync
```

`--apply-sync` still prompts before writing. It prints:
- proposed `inputs.js sync <file>` commands
- `sync --dry-run` preview for every stale or syncable phantom-reference artifact
- `Approve sync? [y/n]`
- before/after inputs freshness counts
- `.pythia` git owner and changed files after sync

Decision rules:

| Condition | Action |
|---|---|
| STALE only | Offer `--apply-sync` |
| `refs-owned.phantom_reference` only | Offer `--apply-sync`; sync removes trailing refs not backed by body links |
| STALE + `refs-owned.phantom_reference` | Offer `--apply-sync`; batch includes both stale and phantom-reference files |
| STALE + INVALID | Offer sync only for STALE; report INVALID separately |
| INVALID only | Do not sync; investigate |
| metadata/schema errors | Do not sync; inspect files and propose explicit format updates |
| `refs-owned.phantom_used_by` or unknown relation | Do not sync automatically; inspect the files and propose a body-link/relation fix |
| verify FAIL | Stop |

Never edit trailing `## References` or `## Used by` manually. They are machine-owned and must be changed only by `inputs.js sync`.

If the user approves a format fix, edit only the document body/frontmatter required by the artifact contract, then rerun `migrate:check`. If trailing refs become stale or phantom-reference-only after that body edit, use the sync approval flow.

**4. Git ownership guard**

When reporting remediation results, do not assume the workspace root owns `.pythia`.

Detect ownership first:

```bash
git -C .pythia rev-parse --show-toplevel 2>/dev/null
```

- If this returns `.pythia`, report status with `git -C .pythia status --short`
- If it fails but the workspace root is a git repo, use `git status --short -- .pythia`
- If neither works, report `WARN: .pythia git root not found; cannot show diff guard`

`migrate:check --apply-sync` performs this guard automatically after approved sync.

**5. Manual fallback when `migrate:check` is unavailable**

1. List runtime migration files and backup state:
   ```bash
   ls .pythia/runtime/migrations
   ls .pythia/backups
   ```
2. For versions in `(from, to]`, read existing state summaries:
   ```bash
   cat .pythia/backups/<version>/state.json
   ```
   Missing state for a version that has a migration file = WARN. No migration file for an intermediate semver gap = INFO.
3. Merge and deduplicate all `changedPaths`.
4. Run:
   ```bash
   node .pythia/runtime/migrate/verify.js <to>
   node .pythia/runtime/inputs.js check --all
   ```
5. For changed workflow artifact markdown, run:
   ```bash
   node .pythia/runtime/checks/artifact-metadata.js --strict <file>
   node .pythia/runtime/checks/refs-owned.js <file>
   ```
6. For `.pythia/config/paths.md`, verify `role-boundary.js` is present and `doc-structure.js` is absent.
7. For STALE refs, use dry-run before asking for approval:
   ```bash
   node .pythia/runtime/inputs.js sync <file> --dry-run
   ```

**6. Report format**

**PASS example:**

```
migrate check 0.3.6 → 0.3.8

status: PASS
state: 0.3.8 (102 files, 9 types)
verify 0.3.8: OK
metadata scan: OK
refs-owned scan: OK
inputs check: OK

Summary: no issues found
```

**WARN example (migration valid, sync available):**

```
migrate check 0.3.6 → 0.3.8

status: WARN
state: 0.3.8 (102 files)
verify 0.3.8: OK
metadata scan: OK
refs-owned scan: OK
inputs check: WARN — 7 STALE, 0 INVALID
  stale root: ../../../../config/paths.md (7)

Follow-up: rerun with --apply-sync to preview and approve inputs.js sync.
Summary: migration valid; refs need follow-up
```

**WARN example after approved sync:**

```
Before: 7 STALE, 0 INVALID
After:  0 STALE, 0 INVALID
Refs-owned after sync: OK
Git owner: .pythia repo
Changed files:
  M workflows/features/.../file1.context.md

Summary: migration valid; stale refs synced
```

**FAIL example:**

```
migrate check 0.3.6 → 0.3.8

status: FAIL
verify 0.3.8: FAIL
  [FAIL] .pythia/workflows/.../1-example.plan.md: missing required field: status

Summary: stop; do not sync or proceed
```
