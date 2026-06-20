# Pythia Workspace Path Registry

Path zones for this workspace. Format:
- `## Zone-Name` — H2 section header = zone key
- `- path/or/glob` — plain path entry
- `- path/or/glob  source: other/path` — generated-cache entry with source annotation
- `- path/or/glob  command: script/from/repo-root [args]` — Post-commands: mutating commands run synchronously after write (before read-only checkers); edited-file appended as final arg; stderr failures warn-only (hook exit stays 0).

Any line that does not start with `- ` inside a zone section is ignored.
A zone section ends at the next `## ` header or EOF.

## Edit source

- skills/
- assets/instructions.md

## Generated cache

- .claude/skills  source: skills/
- .agents/skills  source: skills/
- .cursor/skills  source: skills/
- CLAUDE.md  source: assets/instructions.md
- AGENTS.md  source: assets/instructions.md

## Protected

- .pythia/workflows/**
- .pythia/config/settings.md
- .pythia/config/paths.md
- .pythia/README.md

## Runtime

- .pythia/runtime/**
- .pythia/backups/**

## Workflow docs

- *.plan.md  checker: links.js, plan-version-log.js, plan-numbering.js, cross-refs.js, plans-index.js, inputs-fresh.js, doc-structure.js
- *.review.md  checker: role-boundary.js, links.js, inputs-fresh.js, doc-structure.js
- *.implementation.md  checker: role-boundary.js, links.js, inputs-fresh.js, doc-structure.js
- *.audit.md  checker: role-boundary.js, links.js, inputs-fresh.js, doc-structure.js
- *.context.md  checker: links.js, inputs-fresh.js
- feat-*.md  checker: links.js
- *.retro.md  checker: links.js

## Post-commands

- *.plan.md  command: .pythia/runtime/inputs.js sync
- *.context.md  command: .pythia/runtime/inputs.js sync
- *.review.md  command: .pythia/runtime/inputs.js sync
- *.implementation.md  command: .pythia/runtime/inputs.js sync
- *.audit.md  command: .pythia/runtime/inputs.js sync
- feat-*.md  command: .pythia/runtime/inputs.js sync

## Scripts

- tools/bin/inputs.js
- tools/checks/
- tools/hooks/
