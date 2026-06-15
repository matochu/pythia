# Changelog

All notable changes to this project will be documented in this file.

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
