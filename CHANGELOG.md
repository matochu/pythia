# Changelog

All notable changes to this project will be documented in this file.

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
- **Adoption-baseline detection now matches the relaxed migration zone** — a workspace is considered "adopted" (`migratedVersion: 0.0.0`, must run migrations) if it has *any* pre-existing content under `.pythia/`, not just `.pythia/workflows/`; this was inconsistent with the migration zone already covering all of `.pythia/`

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
