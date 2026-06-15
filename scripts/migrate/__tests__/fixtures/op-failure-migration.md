# Migration 0.1.5

Applied by `pythia-workspace update` when `migratedVersion < 0.1.5`.

## Step 1

**Target**: `.pythia/workflows/nonexistent-file.md`
**Kind**: auto
**Check**: String `REPLACED` exists in `.pythia/workflows/nonexistent-file.md`

**Op:**
```
op: replace-once
path: .pythia/workflows/nonexistent-file.md
find: ORIGINAL
replace: REPLACED
```

**Success condition**: File contains `REPLACED`
**Failure condition**: File not found — op fails, migration must restore and not bump
