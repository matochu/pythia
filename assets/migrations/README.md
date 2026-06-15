# Migration File Format

Migration files live at `assets/migrations/<semver>.md`. They are shipped with the package but the **authoritative runtime read path** is `.pythia/runtime/migrations/` (materialized by `init`/`update`).

## File Naming

Versioned files: `<major>.<minor>.<patch>.md` (e.g. `0.2.0.md`). Must be valid semver.

Staging file: `next.md` (git-tracked, **excluded from the published package** via `assets/migrations/.npmignore`). During development, migration steps accumulate in `next.md`. At release, `next.md` is renamed to `<frameworkVersion>.md` and its in-file version condition updated.

## File Structure

```markdown
# Migration <semver>

Applied by `pythia-workspace update` when `migratedVersion < <semver>`.

## Step 1

**Target**: `.pythia/workflows/<some-path>`
**Kind**: auto
**Check**: <!-- idempotent: condition that means "already applied" -->

**Op:**
\`\`\`
op: <op-name>
<op-specific fields>
\`\`\`

**Success condition**: <!-- what to verify after this step -->
**Failure condition**: <!-- what happens on failure -->

## Step 2

**Target**: `.pythia/workflows/<some-path>`
**Kind**: llm
**Check**: <!-- idempotent check -->

**Apply**: <!-- Natural-language instruction for the LLM agent -->

**Success condition**: <!-- verification criteria -->
**Failure condition**: <!-- restore trigger -->
```

## Step Kinds

### `auto` steps

Performed deterministically by the migration engine. Each step uses one of the 7 ops:

| Op | Required fields | Description |
|---|---|---|
| `ensure-dir` | `path` | Create directory if absent |
| `write-if-missing` | `path`, `content` | Write file only if not present |
| `set-frontmatter` | `path`, `key`, `value` | Set/update a YAML frontmatter key |
| `rename-frontmatter-key` | `path`, `from`, `to` | Rename a YAML frontmatter key |
| `rename-file` | `from`, `to` | Rename/move a file |
| `append-to-section` | `path`, `section`, `content` | Append to a named `##` section |
| `replace-once` | `path`, `find`, `replace` | Replace first occurrence of a string |

All ops:
- Apply only to `.pythia/workflows/**` paths
- Are idempotent (the `Check` field defines the short-circuit condition)
- Back up the target before mutating

### `llm` steps

Performed by the `migrate` skill (LLM/agent). The `Apply` instruction is natural language. The engine does not run these — it records them in `state.json` as `llmRemaining: true` so the skill can pick them up.

## Idempotency Rule

Every step **must** have a `Check` condition that detects whether the step has already been applied. The engine uses this to skip already-applied steps on re-run. For `auto` ops this is typically a file/field existence check; for `llm` steps the skill checks the condition before applying.

## Authoring and Release Flow

1. Add migration steps to `assets/migrations/next.md` during development.
2. A protected-zone format change also requires a `seed-if-missing` entry for any new file introduced.
3. At release: rename `next.md` → `<frameworkVersion>.md` and update the in-file version condition (`Applied by … when migratedVersion < <version>`).
4. Run `npm run release:check-migrations` to verify `next.md` is absent and a versioned file for the current `frameworkVersion` exists.
5. `npm pack --dry-run` must show `assets/migrations/<semver>.md` but **not** `assets/migrations/next.md`.

See [RELEASING.md](../../RELEASING.md) for the full release checklist.
