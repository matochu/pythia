# Command: /retro-feature

**Purpose**: Synthesize a retrospective report for a feature — not a copy of retro blocks, but distilled insights, patterns, and recommendations for future plans. Output is saved to `{feature-dir}/notes/{feature-slug}.retro.md`.

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
- Extract all `### v{N} — {round-ref} — {date}` blocks from `## Architect Retrospective` section (may be absent for cycles with no discoveries — that is expected)
- Extract all bullet points from `## Architect Observations` section (if present)
- Extract revision log (how many rounds, which triggers)
- Extract risks from Technical Risks section
- Extract acceptance criteria and their status

**From `reports/{slug}.implementation.md`** (if exists):
- Extract all `## Implementation Round I{n}` blocks
- From each round: extract `### Developer Retrospective` section (may be absent for rounds with no discoveries — that is expected)
- Extract `## Developer Observations` section if present (top-level, not inside rounds)
- Extract `### Out-of-Plan Work` section (if exists)
- Extract BLOCKER/PROBLEM issues — these are materialized risks
- Extract deviations from plan

**From `reports/{slug}.review.md`** (if exists):
- Count review rounds, extract final Verdict per round
- Extract key concerns (BLOCKED, CONCERN-HIGH findings)
- Extract `## Reviewer Observations` section (if present) — forward-looking signals from the Reviewer

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
6. **Observations synthesis**: collect all Architect Observations, Developer Observations, and Reviewer Observations — these are forward-looking signals; group by theme (tech debt, architectural concerns, future candidates) and include in Recommendations

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

| Plan | Version | Review rounds | Impl rounds | Status |
|------|---------|---------------|-------------|--------|
| [{slug}](plans/{slug}.plan.md) | v{N} | {Rn count} | {In count} | {status} |

---

## Codebase Knowledge Base

*(Distilled from all [codebase] entries across Architect and Developer Retrospectives — grouped by theme, not copied verbatim. Each entry references the source artifact.)*

### {theme — e.g. "WAMR API", "Build System", "Permission Model"}

- {synthesized insight} ← {plan-slug} v{N} / I{n}

---

## Risk Analysis

*(Predicted risks vs what actually materialized — cross-referenced with BLOCKERs/PROBLEMs)*

| Risk (predicted) | Source | Materialized? | Evidence |
|-----------------|--------|---------------|----------|
| {risk text} | {plan-slug} v{N} {round-ref} | yes / no / partial | {BLOCKER/PROBLEM ref or "—"} |

---

## Key Discoveries

*(Evidence-backed discoveries that were not anticipated — not generic, must reference specific artifacts)*

- **{discovery title}** — {description}. Evidence: {artifact + section}

---

## Process Insights

*(Recurring [process] friction, workflow failures, what slowed down delivery — synthesized, not copied)*

- **{insight}** — observed in: {artifact refs}

---

## Forward-Looking: Observations & Improvements

*(Synthesized from Architect Observations, Developer Observations, and chat context — grouped by theme. These are candidates for future plans, tech debt backlog, or workflow changes.)*

### Technical Debt / Future Work
- {item} ← {source}

### Workflow / Process Improvements
- {item} ← {source}

### Architectural Concerns
- {item} ← {source}

---

## Recommendations for Future Plans

- [plan] {recommendation for future plans in this area}
- [process] {recommendation for workflow improvement}
- [codebase] {recommendation for codebase/test infrastructure}
- [tooling] {recommendation for tooling}

---

## Knowledge Gaps

*(What remained unknown or unresolved at the end of the feature)*

- {gap description} — referenced in: {artifact}
```

Also output a **structured summary in chat**:

```markdown
## Feature Retrospective Summary — {feature-id}

**Plans analyzed**: {N} ({list})
**Review rounds total**: {count} | **Impl rounds total**: {count}

### Key Discoveries
- {top 3-5 evidence-backed findings}

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
- Verify `## Codebase Knowledge Base` contains synthesized entries grouped by theme — not raw copy of retro blocks
- Verify `## Risk Analysis` cross-references `[risk]` entries against BLOCKERs/PROBLEMs in implementation reports
- Verify `## Key Discoveries` entries are evidence-backed and reference specific artifacts
- Verify `## Forward-Looking` section incorporates content from Architect Observations, Developer Observations, Reviewer Observations, and chat context (if any)
- Verify chat summary is output in chat

**Critical**: Do NOT copy retro blocks verbatim into the output. Raw blocks remain in their source artifacts (plans, implementation reports). The retro report is synthesis only — distilled insights, patterns, and recommendations. All claims must reference specific artifacts.

See [agent-selection-guide](../agents/_agent-selection-guide.md): use Architect for retrospective analysis.
