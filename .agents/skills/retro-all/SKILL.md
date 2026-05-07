---
name: retro-all
description: Generate or update the consolidated project-level retrospective across features and append the new run to the persistent retro report.
applyTo: []
---

# Skill: /retro-all

**Purpose**: Generate or update the consolidated project-level retrospective by aggregating retrospective data across all features (or a specific subset). Output is saved to `.pythia/notes/retro-project.md` — a single persistent file, updated on each run (new blocks appended, existing blocks never deleted).

## Input Formats

Choose any of the following:

```
/retro-all                               # Analyze all features in .pythia/workflows/features/
/retro-all feat-2026-01-xxx feat-2026-02-yyy  # Scope to specific features only
/retro-all --since YYYY-MM-DD           # Include features modified after date
/retro-all --format summary             # Output format (summary | detailed)
```

**When no args**: analyzes **all features** in `.pythia/workflows/features/`.

**When FEATURE_IDs provided**: scope analysis to those specific features (space-separated).

**When --since provided**: include only features with modification date >= specified date.

**When --format provided**: use summary (default) or detailed format.

## Instructions for user

- **Minimal case**: Just say `/retro-all` — skill aggregates all features.
- **Scope to specific features**: `/retro-all feat-2026-01-xxx feat-2026-02-yyy` (space-separated).
- **Filter by date**: `/retro-all --since 2026-01-15` (features modified after this date).
- **Output format**: `/retro-all --format detailed` (for more comprehensive report).
- **Output**: Appended to `.pythia/notes/retro-project.md` (single persistent file, never deleted).

## Instructions for model

You are the **[Architect (architect.md)](../../agents/architect.md)**. Doc context = project level (`.pythia/workflows/features/` tree).

**Input**: Optional list of FEATURE_IDs. Default: all features.

### Discovery Phase

1. **List all feature directories**: glob `.pythia/workflows/features/feat-*/`.
2. **Filter scope**: if specific features provided, restrict to those.
3. **For each feature**, determine data source:
   - If `notes/retro.md` exists → use as primary source (pre-aggregated)
   - Otherwise → collect raw from `plans/*.plan.md` and `reports/*.implementation.md`
4. **Get current date**: `date +%Y-%m-%d` — use for the run header block.
5. **Check existing file**: if `.pythia/notes/retro-project.md` exists, read it to understand what was already recorded — avoid duplicating entries from previous runs.

### Collection Phase

**For features with `notes/retro.md`** (already aggregated by `/retro`):

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

### Analysis Phase

1. **Cluster by tag**: group all entries by tag (`[plan]`, `[codebase]`, `[process]`, `[risk]`, `[tooling]`)
2. **Identify cross-feature patterns**: entries that appear (verbatim or semantically similar) in 2+ features
3. **Build codebase knowledge base**: all unique `[codebase]` insights — these are stable facts about the codebase worth preserving
4. **Build process improvement list**: all `[process]` insights ranked by frequency (appearing in most features = highest priority to fix)
5. **Risk analysis**: which risks were predicted and materialized (cross-feature), which were predicted but did not materialize
6. **Feature deep-dive** (if specific features were passed as input): apply `/retro` analysis depth to those features before consolidation

### Output

**File structure**: `.pythia/notes/retro-project.md` is a single persistent file. Each run appends a new dated section. Older sections are never deleted — they are the project's knowledge history.

**Sections**:

- Run header with date and scope
- Features Summary (table with plans, review/impl rounds, retro source, status)
- Codebase Knowledge Base (unique insights with source references)
- Process Improvement Register (ranked by frequency)
- Cross-Feature Patterns (by tag: [plan], [risk], [tooling])
- Risk Register (cross-feature tracking)
- Recommendations (high/medium priority)
- Source Index (references to all source artifacts)

Also output a **structured summary in chat** with features analyzed, total blocks collected, new insights, and top patterns.

**Critical**: Do NOT generate generic insights. Every entry must have a source reference. Cross-feature patterns must be verified (not assumed).

**See also**: [/retro skill](../retro/SKILL.md), [/plan skill](../plan/SKILL.md)
