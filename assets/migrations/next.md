# Migration next

Applied by `pythia-workspace update` when `migratedVersion < <version>`.

<!-- At release: rename this file to <frameworkVersion>.md and update the version condition above. -->

## Step 1

**Target**: `.pythia/config/`
**Kind**: auto
**Check**: `.pythia/config/` directory already exists

**Op:**
```
op: ensure-dir
path: .pythia/config
```

**Success condition**: `.pythia/config/` directory exists

## Step 2

**Target**: `.pythia/config/settings.md`
**Kind**: auto
**Check**: `.pythia/config/settings.md` already exists (already moved)

**Op:**
```
op: rename-file
from: .pythia/config.md
to: .pythia/config/settings.md
```

**Success condition**: `.pythia/config/settings.md` exists, `.pythia/config.md` absent

## Step 3

**Target**: `.pythia/config/paths.md`
**Kind**: auto
**Check**: `.pythia/config/paths.md` already exists (already moved)

**Op:**
```
op: rename-file
from: .pythia/paths.md
to: .pythia/config/paths.md
```

**Success condition**: `.pythia/config/paths.md` exists, `.pythia/paths.md` absent
