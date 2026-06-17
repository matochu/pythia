# Migration 0.0.2

Applied by `pythia-workspace update` when `migratedVersion < 0.0.2`.

## Step 1

**Target**: `.pythia/workflows/migration-test-artifact.md`
**Kind**: auto
**Check**: File `.pythia/workflows/migration-test-artifact.md` exists with `status: draft` frontmatter

**Op:**
```
op: write-if-missing
path: .pythia/workflows/migration-test-artifact.md
content: ---
status: draft
---

# Migration Test Artifact

PLACEHOLDER — requires llm step to become valid.
```

**Success condition**: File exists with `status: draft` frontmatter
**Failure condition**: File could not be written

## Step 2

**Target**: `.pythia/workflows/migration-test-artifact.md`
**Kind**: llm
**Check**: File `.pythia/workflows/migration-test-artifact.md` has `status: active` in frontmatter

**Apply**: Update the frontmatter `status` field from `draft` to `active`. Replace `PLACEHOLDER — requires llm step to become valid.` with `# Migration complete.`

**Success condition**: File has `status: active` in frontmatter and does not contain `PLACEHOLDER`
**Failure condition**: File still has `status: draft` or contains `PLACEHOLDER`
