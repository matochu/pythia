# Pythia Workspace Path Registry

## Edit source

- skills/
- assets/instructions.md

## Generated cache

- .claude/skills source: skills/
- .agents/skills source: skills/
- CLAUDE.md source: assets/instructions.md
- AGENTS.md source: assets/instructions.md

## Protected

- .pythia/workflows/\*\*
- .pythia/config/settings.md
- .pythia/config/paths.md
- .pythia/README.md

## Runtime

- .pythia/runtime/\*\*
- .pythia/backups/\*\*

## Workflow docs

- \*.plan.md: links.js, plan-version-log.js, plan-numbering.js, cross-refs.js, plans-index.js, inputs-fresh.js, structure.js, artifact-metadata.js
- \*.review.md: role-boundary.js, links.js, inputs-fresh.js, structure.js, artifact-metadata.js
- \*.implementation.md: role-boundary.js, links.js, inputs-fresh.js, structure.js, artifact-metadata.js
- \*.audit.md: role-boundary.js, links.js, inputs-fresh.js, structure.js, artifact-metadata.js
- \*.context.md: links.js, inputs-fresh.js, artifact-metadata.js
- feat-\*.md: links.js, inputs-fresh.js, artifact-metadata.js
- \*.retro.md checker: links.js, inputs-fresh.js, artifact-metadata.js

## Scripts

- tools/bin/inputs.js
- tools/checks/
- tools/hooks/
