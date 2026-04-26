---
name: retro
description: Generate or update a feature-level retrospective that synthesizes patterns, risks, and lessons from all plans and reports in the feature.
applyTo: []
---

# Skill: /retro

**Purpose**: Synthesize a retrospective report for a feature — not a copy of retro blocks, but distilled insights, patterns, and recommendations for future plans. Output is saved to `{feature-dir}/notes/{feature-slug}.retro.md`.

## Input Formats

Choose any of the following:

```
/retro                                  # Auto-detect FEATURE_ID from chat history
/retro feat-2026-01-123                # FEATURE_ID explicitly
/retro path/to/feature/directory       # Feature directory path explicitly
```

**When no args**: auto-detect FEATURE_ID from chat, infer feature directory.

## Instructions for user

- **Minimal case**: Just say `/retro` — skill will infer FEATURE_ID from chat context.
- **With FEATURE_ID**: `/retro feat-2026-01-123` (explicit feature).
- **With path**: `/retro path/to/feat-2026-01-123/` (explicit directory).
- **Gate**: None — can be run at any time (in-progress or completed feature).
- **Overwrite**: Existing `notes/{feature-slug}.retro.md` will be **overwritten** with fresh report.

## Instructions for model

You are the **[Architect (architect.md)](../agents/architect.md)**. **Doc context = this feature** (feat doc + all plans/ + all reports/).

**Input**: Feature directory path. Discover all artifacts automatically.

### Discovery Phase

1. **List all plan files**: glob `plans/*.plan.md` in feature directory.
2. **List all implementation reports**: glob `reports/*.implementation.md`.
3. **List all review files**: glob `reports/*.review.md`.
4. **List all audit files**: glob `reports/*.audit.md`.
5. **Check existing feature retro**: check if `notes/{feature-slug}.retro.md` exists (will be overwritten).

### Collection Phase

Extract from each artifact and distill into patterns: `[plan]`, `[codebase]`, `[process]`, `[risk]`, `[tooling]`

**From plans**: Plan title, Plan-Version, status, date created, Architect Retrospective blocks, Architect Observations, revision log, risks, acceptance criteria

**From implementation reports**: Implementation Round blocks, Developer Retrospective sections, Developer Observations, Out-of-Plan Work, BLOCKER/PROBLEM issues, deviations

**From review files**: Review rounds count, final Verdict per round, key concerns, Reviewer Observations

**From audit files**: Final decision (ready | needs fixes | re-plan), risk re-evaluation

### Analysis Phase

1. **Cross-plan patterns**: identify entries that appear in 2+ plans/rounds
2. **Risk tracking**: match predicted risks against materialized BLOCKERs/PROBLEMs
3. **Knowledge distillation**: group codebase entries for knowledge base
4. **Process insights**: group process entries for systemic friction
5. **Cross-reference findings**: connect review findings → plan → implementation → audit

### Output

Write report to `{feature-dir}/notes/{feature-slug}.retro.md`:

**Sections**:

- Plans Summary (table with versions, review/impl rounds, status)
- Codebase Knowledge Base (distilled insights grouped by theme)
- Risk Analysis (predicted vs materialized)
- Key Discoveries (evidence-backed findings)
- Process Insights (recurring friction)
- Forward-Looking: Observations & Improvements
- Recommendations for Future Plans
- Knowledge Gaps

Also output a **structured summary in chat** with top findings and recommendations.

**See also**: [/retro-all skill](../retro-all/SKILL.md), [/plan skill](../plan/SKILL.md)
