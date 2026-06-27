# Changelog

All notable changes to this project will be documented in this file.

## [0.3.8] - 2026-06-27

### Features

- **Typed relation links** — body links may carry a `#@label` relation fragment (`path#@based-on`, `path#anchor@source`, `https://...#@source`). The vocabulary is defined in `.pythia/config/relation.md` (columns `label · description · reverse`; defaults: `source`, `related`, `based-on`). Sync renders typed `[kind:relType]` trailing reference entries and `[kind:reverseLabel]` reverse `## Used by` backlinks. The checker validates labels against the configured vocabulary.
- **Canonical `## Related` body section** — cross-document relations are authored as typed items in a `## Related` section (`- [text](path#@label) — description`). All legacy section forms (`## Related Documents`, `## Sources`, `## Related Contexts`, `**Builds on**`, `**Canonical Criteria**`, `builds_on` metadata) are migrated to `## Related` in Step 3 of the 0.3.8 migration. **Authoring rule** (post-migration): prefer inline prose links over a standalone `## Related` section — the section is a migration output form, not the recommended authoring pattern. See `skills/workflow/references/cross-document-links.md`.
- **Backtick-path reference capture** — backtick-quoted `.md` paths (e.g. `` `tools/lib/md.js` ``) that resolve to existing files on disk are added to the computed `## References` region on sync (no hash; same treatment as external URLs).
- **Artifact metadata contract** — workflow artifacts now use a shared inferred-path metadata schema with runtime validation and schema/reference drift checks.
- **Machine-owned workflow references** — `refs-owned.js` detects phantom `## References` and `## Used by` entries, and hooks warn before agents hand-edit sync-owned trailing reference blocks.
- **`kind: brainstorm` context sub-kind** — `artifact-metadata.md` and `metadata-contract.json` include `brainstorm` alongside `research` as valid context sub-kinds.
- **`migrate:check` post-update helper** — after `pythia update`, run `/migrate check <from> to <to>` or `npm --prefix .pythia run migrate:check -- <from> <to>` to verify migration results: state summaries, `migrate:verify`, strict metadata checks, `refs:owned` phantom checks, paths.md invariants, reference freshness, STALE grouping, and PASS/WARN/FAIL reporting. `--apply-sync` runs `refs:sync --dry-run` previews, asks for approval, syncs STALE refs and `refs-owned.phantom_reference` files when metadata/non-syncable refs-owned checks are clean, reruns checks, and reports the git owner for `.pythia`.
- **Post-update verification hint** — `pythia update` now prints an agent-facing `/migrate check <from> to <to>` skill invocation after all migrations complete successfully.
- **`/migrate check` skill** — new section in `skills/migrate/SKILL.md` with full verification procedure: state collection, verify, metadata scan, refs-owned scan, inputs freshness, STALE grouping by root cause, PASS/WARN/FAIL terminal states, and remediation flow with sync consent batch.
- **npm script taxonomy** — `.pythia/package.json` now ships a consistent set of named scripts: `refs:sync`, `refs:check`, `refs:rdeps`, `refs:owned` (reference graph); `check:metadata`, `check:structure`, `check:links`, `check:cross-refs`, `check:role-boundary` (artifact validators). All skills and docs use `npm --prefix .pythia run <script>` — no direct `node .pythia/runtime/` commands in agent-facing instructions.

### Changed

- Reference/input runtime modules moved under `tools/lib/references/`, with compatibility wrappers preserved for existing materialized runtime imports.
- Workflow path config now wires `refs-owned.js` alongside freshness, structure, and metadata checkers.
- Inputs sync now treats sync-zone references as derived from body links and cleans stale reverse `Used by` backlinks when consumers stop citing targets.
- `refs:sync -- <file> --dry-run` (`inputs.js sync --dry-run`) previews primary-file, legacy frontmatter, and reverse `## Used by` changes without writing.
- Artifact metadata v2 is rendered as markdown list items (`- key: value`) so Markdown renderers preserve one field per line; legacy bare `key: value` metadata is treated as non-canonical and fails strict checks/migration verification.
- Producer skill/reference docs now point agents to the canonical metadata contract and machine-owned reference boundary.
- Canonical H1 prefixes: `# Implementation Report:` → `# Report:`, `# Architect Audit:` → `# Audit:`, `# Feature Retrospective:` → `# Retrospective:`; migration normalizes legacy prefixes; bare-slug review H1s get `# Review: {slug}`.
- `Date:` bare body line removed from implementation report template; `updated` in `## Metadata` is the single date source.
- `cross-document-links.md` added as single source of truth for inline link rules, label vocabulary, trailing-refs prohibition, and the label decision tree. Producer skills now point to this reference instead of duplicating the block.
- `audit-format.md` and `response-formats.md` updated to lowercase v2 status values (`status: implemented`, `· status: implemented`).
- v1 bold-bullet parsing removed from runtime `parse.js` and `artifact-metadata.js` checker. Migration tool (`migration.js`) retains its own `legacyBoldBulletFields` for converting remaining v1 docs. `plan-version-log.js` checker updated to read lowercase `version` field.
- `verify.js` `[OK]` lines suppressed by default; pass `--verbose` to restore them.

### Fixed

- Migration maps YAML `type: research` to `kind: research` (previously only `type: research-context` was handled); `type: brainstorm-context` maps to `kind: brainstorm`.
- Migration `updated` fallback: `Updated` → `Date` (Title-case bare key in metadata section) → `created` (YAML frontmatter); `legacyPlainMetadataFields` now accepts Title-case keys.
- Migration moves `Plan:` and `Implementation:` body lines in audit files into `- plan:` / `- implementation:` metadata fields; bare body lines are removed after capture.
- **Retro preamble bare keys** — `convertArtifactMetadata` now reads `Date:` and `Feature:` bare key-value lines from the document preamble (before the first `##` heading), captures `Date` as `- updated:`, and strips both from the body (`Feature:` is a forbidden key).
- **`Date:` after `## Metadata` in implementation reports** — bare `Date: YYYY-MM-DD` lines between `## Metadata` and the next section are now captured as `- updated:` and stripped; `Date:` inside round bodies is preserved.
- **Phantom `## References`** — `inputs.js sync` no longer preserves entries that have no body citation and no `inputs:` frontmatter (`oldRef?.hash` guard removed from `shouldPreserveMissingWorkflowRef`). Phantom entries left by the `sync-legacy-inputs` migration are cleaned on the next sync run.
- **plan-format.md and skills aligned to lowercase v2 status enums** — `draft`, `active`, `implemented`, `blocked`, `archived`, `cancelled` (was Title-case). Migration tool already normalised these; prompt docs now match the contract.
- `applyMigrations` always returns `{ ranMigrations, completedAllPending }` on all exit paths (was `undefined` on early returns).
- `isSyncableRefsOwnedIssue` now requires all `refs-owned.*` codes in a message to be `phantom_reference`; files with `phantom_used_by` or `relation.unknown` are excluded from the auto-sync batch and must be resolved manually.
- `inputs.js sync --dry-run` — new flag previews primary-file refs, legacy frontmatter stripping, and reverse `## Used by` backlink changes without writing any files.

### Migration

- **0.3.8 migration** — updates `.pythia/config/paths.md` checker lists, migrates existing `.pythia` data markdown to list-form artifact metadata (including H1 normalization, YAML `type` → `kind` mapping, and `updated` recovery), converts legacy `inputs:` frontmatter, adds `refs-owned.js` to workflow artifact checks, converts all legacy relation expressions (`## Related Documents`, `## Sources`, `**Builds on**`, `builds_on`) to canonical `## Related` typed sections (Step 3), and rewrites bare `## References` / `## Used by` paths to canonical format: `/-absolute` for project-root targets (e.g. `/tools/lib/foo.js`), doc-relative for intra-`.pythia/` targets (Step 6).

## [0.3.7] - 2026-06-20

### Fixed

- Sync keeps plain bibliography and region prose in task/idea docs; drops missing internal paths with a stderr warning
- `Related Documents` and similar body sections stay in the body and are not copied to the typed References footer
- Project root for `inputs sync` / `check` / `rdeps` comes from `.pythia/manifest.json`, not `git rev-parse`
- Repo-root paths like `skills/plan/SKILL.md` resolve from the project root before doc-relative paths
- Post-save sync runs only on eligible `.pythia/**/*.md` (excludes runtime, config, backups, root README)

### Changed

- `pythia health` verifies inputs runtime + project-root anchor + CLI smoke (`inputs.cli`); document freshness stays on `inputs check --all`
- `pythia update` backs up edited `AGENTS.md` / `CLAUDE.md` to `.pythia/backups/managed-overwrites/`
- `pythia update` prints inputs runtime wiring summary (not full-tree freshness)
- `cross-refs` fails when a References entry targets a missing file
- Sync sets generated `## References` / `## Used by` labels from target `title:` / `# H1` when body link text is a filename placeholder; body markdown links are never rewritten
- `kindForPath` covers workflow artifact types including retro and skill paths

### Documentation

- `docs/workspace-manager.md`: project root, workspace layout, git strategies, `inputs check --all`
- `README.md`: link to workspace terminology

## [0.3.6] - 2026-06-20

### Features

- **Link-derived inputs freshness** — workflow docs track dependencies in a typed trailing `## References` / `## Used by` region instead of frontmatter `inputs:`; cite sources as markdown links in the body and run `pythia update` to migrate legacy docs
- **`inputs.js sync`** — derives references from body links (fence-aware), merges stored refs and legacy frontmatter deps, refreshes hashes, and maintains reverse `## Used by` backlinks repo-wide
- **`inputs.js check` / `rdeps`** — validate stored reference hashes (`check --all` for workflow trees); `rdeps` lists dependents of a file and flags stale consumers
- **Post-commands hook zone** — `.pythia/config/paths.md` can declare `command:` entries that run synchronously after a workflow doc save and before read-only checkers (wired for plan, context, review, implementation, audit, and feature docs via `inputs.js sync`)
- **`sync-legacy-inputs` migration op** — auto-migrates remaining frontmatter `inputs:` blocks under `.pythia/workflows/` during workspace update

### Changed

- **Workflow skills** — `/plan`, `/replan`, `/research`, `/ctx`, `/feat`, and `/implement` cite dependencies as body links; trailing reference sections are maintained by hook sync, not hand-edited
- **`inputs-fresh.js` checker** — reads the trailing `## References` block instead of YAML frontmatter
- **`cross-refs.js` checker** — validates context backlinks and References/Used-by round-trips using structured parsing

## [0.3.5] - 2026-06-19

### Fixed

- **Hook path resolution** — `post.js` and `pre.js` resolve relative `file_path` values against the workspace root from the hook event, so guardrails still run when the hook process cwd differs from the agent session (common with Claude Code and Codex)
- **Windows zone matching in `pre.js`** — `editedPathForZoneMatch` uses `path.relative()` instead of a forward-slash `startsWith` check, so generated-cache and protected-path warnings match correctly on Windows
- **`pythia version` pending count** — semver gap and unresolved mixed migration state no longer double-count as two pending migrations; output shows a single pending item when either condition applies
- **Claude PostToolUse dedup** — `update` removes legacy non-managed hook groups that duplicate pythia runtime scripts without stripping the managed group's inner hooks

### Changed

- **Shared hook/restore helpers** — Codex/Cursor `hooks.json` merge, migration backup restore, and workflow checker iteration now use shared modules (`mergeHooksJson`, `restoreFromBackups`, `forEachWorkflowChecker`) used by CLI, health, and materialized runtime

## [0.3.4] - 2026-06-19

### Features

- **`health` command** — `pythia health [target-dir]` checks workspace layout: manifest, protected seeds, runtime, installed surfaces, hook wiring, and paths registry invariants (default target: current directory)
- **Cursor surface (opt-in)** — `pythia init --surfaces cursor` (or add `cursor` to `--surfaces`) installs `.cursor/skills` and merges Cursor hook wiring alongside Claude/Codex defaults
- **`replace-section` migration op** — versioned migrations can replace or insert whole `##` sections (used by 0.3.3 paths upgrade for legacy VS Code–formatted and basename-only Workflow docs blocks)

### Changed

- **One-shot `init` bootstrap** — `pythia init` materializes runtime, applies pending migrations, and wires hooks in a single run; no mandatory follow-up `update` for first-time setup
- **Universal `AGENTS.md`** — generated from `assets/instructions.md` for all agent hosts (not Codex-branded); Codex hook wiring adds `MultiEdit` to the post-edit matcher set
- **Migration commit gate** — shared `commitMigrationVersion` runs only after verify passes; failed `replace-once` / `replace-section` steps no longer advance `migratedVersion`
- **Fresh workspace migration baseline** — new and adopted workspaces start at `migratedVersion: 0.0.0` so shipped migrations run on first bootstrap

### Fixed

- **`replace-once` false success** — migration fails when neither source nor replacement content exists, leaving manifest version unchanged
- **Cursor skills install** — `.cursor/skills` is included in active surfaces when requested (not skipped by the substitutions-only loop)
- **`uninstall` Cursor hooks** — removes pythia-managed entries from `.cursor/hooks.json`
- **Legacy hook detection** — install/uninstall/health recognize nested `{ hooks: [...] }` managed entries, not only top-level hook arrays
- **Checker sync on init** — warns when workflow doc types in `paths.md` reference checkers missing from materialized runtime

## [0.3.3] - 2026-06-18

### Features

- **Path registry** — `.pythia/config/paths.md` defines artifact zones, workflow doc types, and which checkers run on each; hooks and validation read from this file instead of hardcoded lists
- **JS guardrail hooks** — `pre`, `post`, and `stop` hooks materialize into `.pythia/runtime/hooks/` on `update`; `post` routes checkers from the path registry (data-driven, no per-artifact hardcoding)
- **Workflow checkers in JavaScript** — bash validators replaced with `tools/checks/` modules: `doc-structure`, `links`, `inputs-fresh`, `role-boundary`, `plan-version-log`, `plan-numbering`, `cross-refs`, `plans-index`, and skill guards
- **`version` command** — `pythia-workspace version [target-dir]` shows installed framework version, surfaces, and migration status
- **`uninstall` command** — `pythia-workspace uninstall [target-dir]` removes managed agent surfaces and runtime while preserving `.pythia/workflows/`
- **Registry update check** — `update` warns when a newer `pythia-workspace` is available on npm

### Changed

- **Config layout** — workspace config moves to `.pythia/config/settings.md`; path registry lives at `.pythia/config/paths.md` (migration renames existing files on `update`)
- **Expanded workflow doc coverage** — path registry now includes `*.context.md`, `feat-*.md`, and `*.retro.md` with appropriate checkers; plan/review/implementation/audit docs get role-specific checker sets

### Migration

- **0.3.3 migration** — ensures `config/` layout, renames legacy `config.md` and `paths.md`, and upgrades Workflow docs section to hardened checker lists (skipped when already current)

## [0.3.2] - 2026-06-16

### Fixed

- **Safe adopted-workspace update** — `update` now creates a gitignored pre-update snapshot at `.pythia/backups/pre-update-<timestamp>/.pythia/` before mutating an adopted `.pythia/` that has no committed local `.pythia/.git` history yet. This gives old workspaces a recovery point before seed/refresh/install/runtime work
- **Correct migration state advancement** — successful `update` now advances `migratedVersion` to the package `frameworkVersion` even when there are no versioned migration files. Adopted workspaces still plan from `0.0.0`, but they no longer remain permanently stale after a successful no-op migration pass
- **Pre-update state separation** — migration planning now uses the pre-update `migratedVersion` baseline instead of decisions based on a manifest that `update` just wrote during the same run

## [0.3.1] - 2026-06-16

### Fixed

- **One-step `update` for old workspaces** — `update` now adopts a pre-existing `.pythia/` that was never provisioned by `init` (no `manifest.json` required) in a single run: it seeds any missing base files (`config.md`, `README.md`, `workflows/.gitkeep`) the same way `init` does, and stamps `migratedVersion: 0.0.0` so any actual pending migrations (when one exists for the artifact in question) still get applied on a later `update`. Base-file seeding is independent of the migration engine — it does not require or imply a versioned migration file for the current release
- **Migration zone relaxed to all of `.pythia/`** — the migration engine's auto ops were artificially restricted to `.pythia/workflows/`; they now operate anywhere inside `.pythia/`, with proper path-containment checks (rejects traversal escapes and absolute paths)
- **Skill pruning no longer deletes user-authored skills** — `update` tracks which skills it installed (`installedSkills` in manifest) and only prunes those that pythia previously installed and that have since been removed from the package; custom skills are never touched
- **`surfaces`/`gitStrategy` resolution** — `update` now reads these from the manifest when present, otherwise prompts (interactive) or applies non-interactive defaults, instead of silently guessing from disk state
- **Consistent `gitStrategy`/`surfaces` resolution across all CLI entry points** — the explicit `init` command, the explicit `update` command, and the bare auto-detect invocation (`pythia-workspace [target-dir]`) now resolve defaults through the same code path (explicit flag → manifest → interactive prompt → non-interactive default). Previously the auto-detect path bypassed both the prompt and the documented `pythia` default, silently writing `gitStrategy: "ignore"` and skipping the `git init .pythia/.git` side effect
- **Adoption-baseline detection now matches the relaxed migration zone** — a workspace is considered "adopted" (`migratedVersion: 0.0.0`, must run migrations) if it has _any_ pre-existing content under `.pythia/`, not just `.pythia/workflows/`; this was inconsistent with the migration zone already covering all of `.pythia/`

### Breaking

- **`--target <dir>` removed everywhere** — CLI (`init`/`update`), all materialized runtime scripts (`apply`/`status`/`verify`/`commit`/`restore`), and the generated `.pythia/package.json` scripts. Target is now a positional argument on the CLI (default: current directory) and auto-derived from the script's own materialized path for runtime scripts
- **Default `gitStrategy` changed from `ignore` to `pythia`** — fresh `init`/`update` now initializes a local `.pythia/.git` by default unless overridden. This is repository ownership only (a one-time `git init`, no auto-commit) — not a pre-update checkpoint or rollback mechanism; see [docs/workspace-manager.md](docs/workspace-manager.md#gitstrategy)

## [0.3.0] - 2026-06-16

### Features

- **Protected workspace migrations** — versioned migration engine for `.pythia/` workspace upgrades across agent installs (`scripts/migrate/`)
- **CLI workspace manager** — `pythia` binary with `init` and `update` commands for managing agent workspace lifecycle
- **Workflow document validation** — inline validator for plan, review, implementation, and audit report formats; enforces required section contracts per doc type
- **OIDC trusted publishing** — CI publishes to npm via GitHub Actions OIDC (no NPM_TOKEN required, `--provenance` for supply-chain transparency)
- **Release gate** — `release:check-migrations` fails only when `next.md` contains unreleased migration steps

### Package

- Initial npm publish of `pythia-workspace` as a public package
- Clean package payload: `src/cli/`, `scripts/migrate/`, `assets/`, `skills/` — tests excluded via `.npmignore`

## [0.2.0] - 2025-12-16

### Features

- **Skill-based AI workflow** — structured skill tree for AI agents: `/implement`, `/plan`, `/replan`, `/review`, `/audit`, `/feat`, `/research`, `/retro`
- **Agent definitions** — architect, developer, reviewer, researcher, QA automation, product manager roles with explicit scope and escalation rules
- **Workflow document formats** — plan, review, implementation report, and audit report format contracts with required sections
- **Inputs tracking** — `scripts/inputs.sh` for dependency tracking between workflow artifacts
- **/feat workflow** — Plans Index, adaptive PM mode, feature lifecycle management
- **Researcher subagent** — dedicated research sessions with context persistence

## [0.1.0] - 2025-09-17

### Features

- **`.pythia/` workspace** — structured directory for agent workflow artifacts: features, plans, contexts, reports
- **Initial skill set** — `/feat`, `/plan`, `/implement`, `/review` commands for AI-driven development workflow
- **Memory Bank** — context preservation system for IDE workflow continuity
- **MCP server integration** — task management tools via Model Context Protocol
- **Documentation automation** — templates and commands for tasks, proposals, and feature docs
