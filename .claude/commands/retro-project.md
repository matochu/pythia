# Command: /retro-project

**Purpose**: Generate or update the consolidated project-level retrospective by aggregating retrospective data across all features (or a specific subset). Output is saved to `.pythia/notes/retro-project.md` — a single persistent file, updated on each run (new blocks appended, existing blocks never deleted).

## Instructions for user

- No arguments — analyzes **all features** in `.pythia/workflows/features/`.
- Optional: provide one or more `FEATURE_ID`s to scope analysis (e.g. `feat-2026-01-launcher-double-load-fix feat-2026-02-migrate-cypress-to-playwright`).
- If a feature has an existing `notes/retro.md` — use it as primary source; otherwise collect raw from plans/reports.
- Output is **appended** to `.pythia/notes/retro-project.md` (single persistent file). If file does not exist — create it. Never delete existing content.

## Instructions for model

You are the **Architect**. Doc context = project level (`.pythia/workflows/features/` tree).

**Input**: Optional list of FEATURE_IDs. Default: all features.

---

### Discovery Phase

1. **List all feature directories**: glob `.pythia/workflows/features/feat-*/`.
2. **Filter scope**: if specific features provided, restrict to those.
3. **For each feature**, determine data source:
   - If `notes/retro.md` exists → use as primary source (pre-aggregated)
   - Otherwise → collect raw from `plans/*.plan.md` and `reports/*.implementation.md`
4. **Get current date**: `date +%Y-%m-%d` — use for the run header block.
5. **Check existing file**: if `.pythia/notes/retro-project.md` exists, read it to understand what was already recorded — avoid duplicating entries from previous runs.

---

### Collection Phase

**For features with `notes/retro.md`** (already aggregated by `/retro-feature`):
- Read the file and extract all sections as-is
- Note: source = `{feature-id}/notes/retro.md`

**For features without `notes/retro.md`** (raw collection):
- Glob `plans/*.plan.md` → extract all `## Architect Retrospective` blocks
- Glob `reports/*.implementation.md` → extract all `### Developer Retrospective` blocks
- Note: source = raw artifacts

**From all features, collect**:
- All `[plan]` tagged entries
- All `[codebase]` tagged entries
- All `[process]` tagged entries
- All `[risk]` tagged entries
- All `[tooling]` tagged entries
- All materialized risks (BLOCKERs that matched a predicted `[risk]`)
- All recommendations from existing `notes/retro.md` files

---

### Analysis Phase

1. **Cluster by tag**: group all entries by tag (`[plan]`, `[codebase]`, `[process]`, `[risk]`, `[tooling]`)
2. **Identify cross-feature patterns**: entries that appear (verbatim or semantically similar) in 2+ features
3. **Build codebase knowledge base**: all unique `[codebase]` insights — these are stable facts about the codebase worth preserving
4. **Build process improvement list**: all `[process]` insights ranked by frequency (appearing in most features = highest priority to fix)
5. **Risk analysis**: which risks were predicted and materialized (cross-feature), which were predicted but did not materialize
6. **Feature deep-dive** (if specific features were passed as input): apply `/retro-feature` analysis depth to those features before consolidation

---

### Output

**File structure**: `.pythia/notes/retro-project.md` is a single persistent file. Each run appends a new dated section. Older sections are never deleted — they are the project's knowledge history.

File layout:

```markdown
# Project Retrospective

> Entry point for all project-level retrospective knowledge.
> Updated by `/retro-project`. Append-only — do not delete existing sections.

---

## Run: {date} — {scope description}

**Scope**: {N} features analyzed — {list of feature-ids}
**New since last run**: {features added in this run, or "full refresh"}

### Features Summary

| Feature | Plans | Review rounds | Impl rounds | Retro source | Status |
|---------|-------|---------------|-------------|--------------|--------|
| [{feature-id}]({path}/feat-XXX.md) | {N} | {Rn} | {In} | retro.md / raw | {active/completed} |

### Codebase Knowledge Base

*(Stable facts about the codebase — highest reuse value. Add only NEW insights not present in previous runs.)*

- **{insight}**
  - Source: {feature-id} → {plan-slug} v{N}
  - Confirmed by: {other feature if repeated}

### Process Improvement Register

*(Workflow friction ranked by frequency. Add only NEW entries or update frequency count.)*

| Pattern | Frequency | Features affected | Recommendation |
|---------|-----------|-------------------|----------------|
| {process issue} | {N features} | {list} | {action} |

### Cross-Feature Patterns

#### [plan] Recurring Gaps
- {pattern} ← {feature-id}, {feature-id}

#### [risk] Recurring Risks
- {pattern} ← {feature-id}, {feature-id}

#### [tooling] Recurring Issues
- {pattern} ← {feature-id}, {feature-id}

### Risk Register

| Risk | First seen | Recurred in | Materialized? | Status |
|------|-----------|-------------|---------------|--------|
| {risk text} | {feature-id} v{N} | {feature-ids} | yes/no/partial | open/resolved |

### Recommendations

#### High Priority (recurring across 2+ features)
- [process] {recommendation}
- [plan] {recommendation}

#### Medium Priority (single feature, high impact)
- [codebase] {recommendation}
- [tooling] {recommendation}

### Source Index

#### {feature-id}
- Architect Retro: [{plan-slug} v{N} {round-ref}]({path}/plans/{plan-slug}.plan.md#architect-retrospective)
- Developer Retro: [{plan-slug} I{n}]({path}/reports/{plan-slug}.implementation.md#implementation-round-i{n})
- Feature Retro: [{feature-id}/notes/retro.md]({path}/notes/retro.md) *(if exists)*

---

*(previous runs below — never delete)*
```

Also output a **structured summary in chat**:

```markdown
## Project Retrospective Summary — {date}

**Features analyzed**: {N}
**Total retro blocks collected**: Architect: {count} | Developer: {count}
**New insights added**: {count} (vs previous run)

### Top Cross-Feature Patterns
- {pattern} (seen in {N} features)

### Codebase Knowledge (top 3-5 new)
- {insight} ← {feature-id}

### Process Friction (top 3-5)
- {friction} ← {N} features

### Top Recommendations
- {recommendation}

**Entry point**: .pythia/notes/retro-project.md
```

---

### Validation (before completing)

- Verify new run block appended to `.pythia/notes/retro-project.md` (existing content preserved)
- Verify all features in scope were processed
- Verify `## Codebase Knowledge Base` contains unique, non-generic insights with source references
- Verify `## Process Improvement Register` is ranked by frequency
- Verify `## Cross-Feature Patterns` contains only entries appearing in 2+ features
- Verify `## Source Index` has references to all source artifacts
- Verify chat summary is output

**Critical**: Do NOT generate generic insights. Every entry must have a source reference. Cross-feature patterns must be verified (not assumed) — an insight appears in multiple features only if explicitly found in their artifacts.

See [agent-selection-guide](../agents/_agent-selection-guide.md): use Architect for retrospective analysis.
