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

## Step 4

**Target**: `.pythia/config/paths.md`
**Kind**: auto
**Check**: `.pythia/config/paths.md` Workflow docs section lists `role-boundary.js` (already upgraded)

**Op:**
```
op: replace-once
path: .pythia/config/paths.md
find: ## Workflow docs

- *.plan.md  checker: tools/checks/doc-structure.js
- *.review.md  checker: tools/checks/doc-structure.js
- *.implementation.md  checker: tools/checks/doc-structure.js
- *.audit.md  checker: tools/checks/doc-structure.js

replace: ## Workflow docs

- *.plan.md  checker: links.js, plan-version-log.js, plan-numbering.js, cross-refs.js, plans-index.js, inputs-fresh.js, doc-structure.js
- *.review.md  checker: role-boundary.js, links.js, inputs-fresh.js, doc-structure.js
- *.implementation.md  checker: role-boundary.js, links.js, inputs-fresh.js, doc-structure.js
- *.audit.md  checker: role-boundary.js, links.js, inputs-fresh.js, doc-structure.js
- *.context.md  checker: links.js, inputs-fresh.js
- feat-*.md  checker: links.js
- *.retro.md  checker: links.js

```

**Success condition**: Workflow docs section includes `role-boundary.js`, `*.context.md`, and comma-separated checker basenames
**Failure condition**: paths.md missing or replace pattern ambiguous — migration fails and restores from backup. Basename-only checker lines (`checker: doc-structure.js`) are not matched by this step.
