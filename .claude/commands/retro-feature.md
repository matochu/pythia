# Command: /retro-feature

**Purpose**: Generate a retrospective report for a feature by collecting all Architect Retrospective and Developer Retrospective entries across **all plans** of the feature. Output is saved to `{feature-dir}/notes/{feature-slug}.retro.md`.

## Instructions for user

- Provide **FEATURE_ID** or path to feature directory (e.g. `feat-2026-02-migrate-cypress-to-playwright`).
- No gate — can be run at any time (in-progress or completed feature).
- Existing `notes/{feature-slug}.retro.md` will be **overwritten** with a fresh report.

## Instructions for model

You are the **Architect**. **Doc context = this feature** (feat doc + all plans/ + all reports/).

**Input**: Feature directory path. Discover all artifacts automatically.

---

### Discovery Phase

1. **List all plan files**: glob `plans/*.plan.md` in feature directory.
2. **List all implementation reports**: glob `reports/*.implementation.md`.
3. **List all review files**: glob `reports/*.review.md`.
4. **List all audit files**: glob `reports/*.audit.md`.
5. **Check existing feature retro**: check if `notes/{feature-slug}.retro.md` exists (will be overwritten).

---

### Collection Phase

For each plan file found:

**From `plans/{slug}.plan.md`**:
- Extract plan title, Plan-Version, status, date created
- Extract all `### v{N} — {round-ref} — {date}` blocks from `## Architect Retrospective` section
- Extract revision log (how many rounds, which triggers)
- Extract risks from Technical Risks section
- Extract acceptance criteria and their status

**From `reports/{slug}.implementation.md`** (if exists):
- Extract all `## Implementation Round I{n}` blocks
- From each round: extract `### Developer Retrospective` section
- Extract `### Out-of-Plan Work` section (if exists)
- Extract BLOCKER/PROBLEM issues — these are materialized risks
- Extract deviations from plan

**From `reports/{slug}.review.md`** (if exists):
- Count review rounds, extract final Verdict per round
- Extract key concerns (BLOCKED, CONCERN-HIGH findings)

**From `reports/{slug}.audit.md`** (if exists):
- Extract final decision (ready | needs fixes | re-plan)
- Extract risk re-evaluation (which risks materialized, which didn't)

**From conversation history** (chat context):
- Review conversation history for important context not captured in artifacts
- Extract key decisions, clarifications, corrections that affected implementation
- Extract "lessons learned" mentioned in chat but not documented in files
- Document with clear attribution ("From chat discussion: ...")

**Skills used** (using `skill-search-and-fit` skill if available):
- Identify skills used during plan execution
- Evaluate quality and effectiveness
- Search for improved versions or alternatives
- Generate recommendations for skill improvements

---

### Analysis Phase

After collecting all raw data:

1. **Cross-plan patterns**: identify `[plan]`, `[codebase]`, `[process]`, `[risk]` entries that appear in 2+ plans or rounds — these are recurring patterns
2. **Risk tracking**: match `[risk]` entries from Architect Retrospective against materialized BLOCKERs/PROBLEMs in Developer Retrospectives
3. **Knowledge distillation**: group all `[codebase]` entries — these form the codebase knowledge base for this feature area
4. **Process insights**: group all `[process]` entries — identify systemic workflow friction points
5. **Cross-reference findings** between artifacts: connect review findings → plan changes → implementation outcomes → audit results

---

### Output

Write report to `{feature-dir}/notes/{feature-slug}.retro.md`:

```markdown
# Feature Retrospective — {feature-id} — {date}

**Generated**: {date}
**Feature**: [{feature-title}]({feature-id}.md)
**Plans covered**: {N} — {list of plan slugs with links}

---

## Plans Summary

| Plan | Version | Review rounds | Impl rounds | Status | Retro blocks |
|------|---------|---------------|-------------|--------|--------------|
| [{slug}](plans/{slug}.plan.md) | v{N} | {Rn count} | {In count} | {status} | A:{n} D:{n} |

---

## Architect Retrospective

*(All blocks collected from plans/{slug}.plan.md → ## Architect Retrospective)*

### {plan-slug}

#### v{N} — {round-ref} — {date}

- [plan] ...
- [codebase] ...
- [process] ...
- [risk] ...

*(repeat for each block across all plans)*

---

## Developer Retrospective

*(All blocks collected from reports/{slug}.implementation.md → ## Implementation Round I{n} → ### Developer Retrospective)*

### {plan-slug} — I{n} — {date}

- [project] ...
- [code] ...
- [tooling] ...

*(repeat for each round across all plans)*

---

## Key Discoveries

*(Evidence-backed discoveries — not generic, must reference specific artifacts)*

- **{discovery title}** — {description}. Evidence: {Plan Step N / Review R{n} S{n} / Implementation I{n} Issues section}

---

## Cross-Plan Patterns

### Recurring [codebase] Insights
- {insight} ← {plan-slug} v{N}, {plan-slug} v{M}

### Recurring [process] Friction
- {insight} ← ...

### Recurring [plan] Gaps
- {insight} ← ...

---

## Risk Register

| Risk (predicted) | Source | Materialized? | Evidence |
|-----------------|--------|---------------|----------|
| {risk text} | {plan-slug} v{N} {round-ref} | yes / no / partial | {BLOCKER/PROBLEM ref or "—"} |

---

## Challenges Encountered

*(With source references)*

- **{challenge}** — Source: {artifact + section}. Resolution: {how it was resolved or "unresolved"}

---

## Solutions Found

- **{solution}** — Context: {what problem it solved}. Reference: {artifact}

---

## Chat Context

*(Important context from conversation not captured in artifacts)*

- From chat discussion: {insight/decision/correction} — relevant to: {plan-slug / step N}

---

## Skills Improvement Recommendations

*(From skill-search-and-fit analysis, if performed)*

- {skill name}: {recommendation}

---

## Knowledge Gaps

*(What remained unknown or unresolved)*

- {gap description} — referenced in: {artifact}

---

## Recommendations for Future Plans

- [plan] {recommendation for future plans in this area}
- [process] {recommendation for workflow improvement}
- [codebase] {recommendation for codebase/test infrastructure}
- [tooling] {recommendation for tooling}
```

Also output a **structured summary in chat**:

```markdown
## Feature Retrospective Summary — {feature-id}

**Plans analyzed**: {N} ({list})
**Total Architect Retro blocks**: {count}
**Total Developer Retro blocks**: {count}
**Review rounds total**: {count} | **Impl rounds total**: {count}

### Key Discoveries
- {top 3-5 evidence-backed findings}

### Recurring Patterns
- {cross-plan patterns}

### Materialized Risks
- {risks that actually happened with evidence}

### Top Recommendations
- {top 3-5 actionable recommendations}

**Full report**: {feature-dir}/notes/{feature-slug}.retro.md
```

---

### Validation (before completing)

- Verify `notes/{feature-slug}.retro.md` is written
- Verify all plan files were processed (count matches discovered plans)
- Verify `## Architect Retrospective` contains entries from all plans that had retro blocks
- Verify `## Developer Retrospective` contains entries from all implementation rounds that had retro sections
- Verify `## Cross-Plan Patterns` contains actual synthesis (not copy-paste of individual entries)
- Verify `## Risk Register` cross-references `[risk]` entries against BLOCKERs/PROBLEMs in implementation reports
- Verify all discoveries in `## Key Discoveries` have evidence citations
- Verify chat summary is output in chat

**Critical**: Do NOT generate generic insights. All insights must reference specific artifacts and sections. Extract actual information from plan, review, implementation, and audit files.

See [agent-selection-guide](../agents/_agent-selection-guide.md): use Architect for retrospective analysis.
