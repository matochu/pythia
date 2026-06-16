# Changelog

All notable changes to this project will be documented in this file.

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
