# Migration 0.0.1

Applied by `pythia-workspace update` when `migratedVersion < 0.0.1`.

## Step 1

**Target**: `.pythia/workflows/`
**Kind**: auto
**Check**: Directory `.pythia/workflows/` exists

**Op:**
```
op: ensure-dir
path: .pythia/workflows/
```

**Success condition**: `.pythia/workflows/` directory exists
**Failure condition**: Directory could not be created
