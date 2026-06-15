# Pythia Workspace

This directory (`.pythia/`) holds local workspace state managed by the `pythia-workspace` CLI.

## Contents

- `version.json` — installed framework version + generated-file hash manifest (managed by CLI)
- `config.md` — workspace configuration: language settings and paths (seed-once; edit freely)
- `README.md` — this file (seed-once)
- `workflows/` — feature workflow artifacts (plans, reviews, reports, audits)

## Usage

```bash
npx pythia-workspace update    # refresh skills and instruction files
npx pythia-workspace update --dry-run   # preview what would change
```

See the [Pythia README](../README.md) and [docs/workspace-manager.md](../docs/workspace-manager.md) for the full CLI reference.

> `.pythia/` is gitignored — workspace state is local only.
