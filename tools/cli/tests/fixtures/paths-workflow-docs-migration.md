# Migration 99.0.0

Test fixture — mirrors a release migration that upgrades legacy Workflow docs checker entries in paths.md.
Not tied to assets/migrations/next.md (staging file changes during development).

## Step 1

**Target**: `.pythia/config/paths.md`
**Kind**: auto
**Check**: `.pythia/config/paths.md` Workflow docs section lists `role-boundary.js` (already upgraded)

**Op:**
```
op: replace-section
path: .pythia/config/paths.md
section: Workflow docs
content: |
  ## Workflow docs

  - *.plan.md  checker: links.js, plan-version-log.js, plan-numbering.js, cross-refs.js, plans-index.js, inputs-fresh.js, doc-structure.js
  - *.review.md  checker: role-boundary.js, links.js, inputs-fresh.js, doc-structure.js
  - *.implementation.md  checker: role-boundary.js, links.js, inputs-fresh.js, doc-structure.js
  - *.audit.md  checker: role-boundary.js, links.js, inputs-fresh.js, doc-structure.js
  - *.context.md  checker: links.js, inputs-fresh.js
  - feat-*.md  checker: links.js
  - *.retro.md  checker: links.js

```

**Success condition**: Workflow docs section includes `role-boundary.js`, `*.context.md`, and comma-separated checker basenames
