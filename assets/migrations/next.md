# Migration next

Applied by `pythia-workspace update` when `migratedVersion < <version>`.

<!-- At release: rename this file to <frameworkVersion>.md and update the version condition above. -->

## Step 1

**Target**: `.pythia/config/paths.md`
**Kind**: auto
**Check**: `.pythia/config/paths.md` Workflow docs section lists `role-boundary.js` and `*.context.md` (already upgraded)

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

**Success condition**: Workflow docs section includes comma-separated checker basenames and `*.context.md`

## Step 2

**Target**: `.pythia/config/paths.md`
**Kind**: auto
**Check**: `.pythia/config/paths.md` header documents Post-commands `command:` entries

**Op:**
```
op: replace-once
path: .pythia/config/paths.md
skip_if: command: script/from/repo-root
find: |
  - `- path/or/glob  source: other/path` — generated-cache entry with source annotation

Any line that does not start with `- ` inside a zone section is ignored.
replace: |
  - `- path/or/glob  source: other/path` — generated-cache entry with source annotation
  - `- path/or/glob  command: script/from/repo-root [args]` — Post-commands: mutating commands run synchronously after write (before read-only checkers); edited-file appended as final arg; stderr failures warn-only (hook exit stays 0).

Any line that does not start with `- ` inside a zone section is ignored.
```

**Success condition**: paths.md header includes the Post-commands `command:` format line

## Step 3

**Target**: `.pythia/config/paths.md`
**Kind**: auto
**Check**: `.pythia/config/paths.md` contains `## Post-commands` with `.pythia/runtime/inputs.js sync`

**Op:**
```
op: replace-section
path: .pythia/config/paths.md
section: Post-commands
after_section: Workflow docs
content: |
  ## Post-commands

  - *.plan.md  command: .pythia/runtime/inputs.js sync
  - *.context.md  command: .pythia/runtime/inputs.js sync
  - *.review.md  command: .pythia/runtime/inputs.js sync
  - *.implementation.md  command: .pythia/runtime/inputs.js sync
  - *.audit.md  command: .pythia/runtime/inputs.js sync
  - feat-*.md  command: .pythia/runtime/inputs.js sync

```

**Success condition**: Post-commands zone lists inputs.js sync for plan, context, review, implementation, audit, and feat globs

## Step 4

**Target**: `.pythia/workflows/`
**Kind**: auto
**Check**: no workflow doc under `.pythia/workflows/` retains frontmatter `inputs:` (legacy freshness block)

**Op:**
```
op: sync-legacy-inputs
glob: .pythia/workflows
```

**Success condition**: legacy `inputs:` frontmatter migrated to typed `## References`; body links plus stored refs and legacy deps preserved on sync
