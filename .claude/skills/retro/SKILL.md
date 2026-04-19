---
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

You are the **[Architect (architect.md)](../../agents/architect.md)**. **Doc context = this feature** (feat doc + all plans/ + all reports/).

**Input**: Feature directory path. Discover all artifacts automatically.

### Discovery Phase

1. **List all plan files**: glob `plans/*.plan.md` in feature directory.
2. **List all implementation reports**: glob `reports/*.implementation.md`.
3. **List all review files**: glob `reports/*.review.md`.
4. **List all audit files**: glob `reports/*.audit.md`.
5. **Check existing feature retro**: check if `notes/{feature-slug}.retro.md` exists (will be overwritten).

### Collection Phase

Extract from each artifact and distill into patterns: `[plan]`, `[codebase]`, `[process]`, `[risk]`, `[tooling]`, `[automation]`

**From plans**: Plan title, Plan-Version, status, date created, Architect Retrospective blocks (including `[automation]` entries), Architect Observations, revision log, risks, acceptance criteria

**From implementation reports**: Implementation Round blocks, Developer Retrospective sections (including `[automation]` entries), Developer Observations, Out-of-Plan Work, BLOCKER/PROBLEM issues, deviations

**From review files**: Review rounds count, final Verdict per round, key concerns (including automation suggestions if marked `[automation]`), Reviewer Observations

**From audit files**: Final decision (ready | needs fixes | re-plan), risk re-evaluation, automation suggestions noted in retrospective

### Analysis Phase

1. **Cross-plan patterns**: identify entries that appear in 2+ plans/rounds
2. **Risk tracking**: match predicted risks against materialized BLOCKERs/PROBLEMs
3. **Codebase Observations triage**: Extract all observations from Architect Observations (plans), Developer Observations (implementation), and Reviewer Observations (reviews). Group by priority level: `[high]`, `[mid]`, `[low]`, `[nit]`. Identify which observations were addressed in implementation and which remain open. Use priority grouping to inform retrospective triage and help team decide on next actions (quick fix, separate plan, backlog, or defer).
4. **Knowledge distillation**: group codebase entries for knowledge base
5. **Process insights**: group process entries for systemic friction
6. **Automation opportunities**: Collect all `[automation]` entries from Architect Retrospective (plans), Developer Retrospective (implementation), and Reviewer findings (reviews). Identify repeating patterns or procedural workflows that appear across multiple plans or features — these are candidates for skill creation or process automation.
7. **Cross-reference findings**: connect review findings → plan → implementation → audit

### Output

Write report to `{feature-dir}/notes/{feature-slug}.retro.md`:

**Sections**:

- Plans Summary (table with versions, review/impl rounds, status)
- Codebase Knowledge Base (distilled insights grouped by theme)
- Risk Analysis (predicted vs materialized)
- Key Discoveries (evidence-backed findings)
- Process Insights (recurring friction)
- **Unfixed Observations & Recommendations** (new section): Table of observations not addressed during implementation, grouped by priority with suggested next actions for team:
  - Column headers: Observation | Priority | Next Action (team decides)
  - `[high]` unfixed → Team evaluates: Quick fix in next round? Separate plan? Risk to next feature?
  - `[mid]` unfixed → Suggested for next sprint or future replan
  - `[low]` unfixed → Suggested for backlog; not urgent
  - `[nit]` unfixed → Track in backlog if resource available
- **Automation Opportunities** (new section): Synthesized list of repeating operations, procedural workflows, or patterns identified across plans/implementation/review rounds that could be automated via new skills or process tooling. For each: description, where observed (which plans/rounds), frequency (number of occurrences across feature), estimated benefit/impact.
- Forward-Looking: Observations & Improvements
- Recommendations for Future Plans
- Knowledge Gaps

Also output a **structured summary in chat** with top findings, automation opportunities, unfixed observations with recommended actions, and recommendations.

**See also**: [/retro-all skill](../retro-all/SKILL.md), [/plan skill](../plan/SKILL.md)
