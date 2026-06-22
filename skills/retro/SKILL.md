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
- **Update mode**: Existing `notes/{feature-slug}.retro.md` generated sections may be refreshed, but manual decision sections must be preserved.

## Instructions for model

You are the **[Architect (architect.md)](../../agents/architect.md)**. **Doc context = this feature** (feat doc + all plans/ + all reports/).

**Input**: Feature directory path. Discover all artifacts automatically.

### Discovery Phase

1. **List all plan files**: glob `plans/*.plan.md` in feature directory.
2. **List all implementation reports**: glob `reports/*.implementation.md`.
3. **List all review files**: glob `reports/*.review.md`.
4. **List all audit files**: glob `reports/*.audit.md`.
5. **List all feature context files**: glob `contexts/*.md` and `contexts/**/*.md` in feature directory. These include research contexts and other feature-scoped context artifacts.
6. **Check existing feature retro**: check if `notes/{feature-slug}.retro.md` exists. If it exists, read it before writing the new report.
7. **Preserve manual sections**: If existing retro contains `## Manual Notes`, `## Decisions`, or `## Follow-up Decisions`, preserve those sections verbatim in the rewritten report.

### Collection Phase

Extract from each artifact and distill into patterns: `[plan]`, `[codebase]`, `[process]`, `[risk]`, `[tooling]`, `[automation]`

**From plans**: Plan title, metadata Version, status, date created, `## Retrospective` blocks (including `[automation]` entries), `## Decision Log`, revision log, risks, acceptance criteria

**From implementation reports**: Implementation Round blocks, `## Retrospective` sections (including `[automation]` entries), `## Decision Log`, Out-of-Plan Work, BLOCKER/PROBLEM issues, deviations

**From review files**: Review rounds count, final Verdict per round, key concerns (including automation suggestions if marked `[automation]`), `## Retrospective`

**From audit files**: Final decision (ready | needs-fixes | plan-fix | re-plan), risk re-evaluation, automation suggestions noted in retrospective

**From context files / research contexts**: Context title/topic, source type when available, `## Retrospective` sections, and user-only `## Decision Log` sections. Treat research retrospectives as reusable findings; do not treat research conclusions as final architecture decisions unless a later plan/audit adopted them.

**Decision Log pipeline**:
- **Capture**: `/plan`, `/implement`, `/research`, and `/replan` write user-only `## Decision Log` entries as raw user decisions and corrections.
- **Synthesis**: `/retro` collects those entries, filters out local one-off corrections, and highlights only explicit or repeated user/workflow preferences in the feature retrospective.
- **Boundary**: `/retro` does not write user profile files directly. Profile promotion is a later audit/profile step.

### Analysis Phase

1. **Cross-plan patterns**: identify entries that appear in 2+ plans/rounds
2. **Risk tracking**: match predicted risks against materialized BLOCKERs/PROBLEMs
3. **Decision Log filtering**: Extract explicit user choices/corrections from `## Decision Log` in plans, implementation reports, and context/research files. Keep them as evidence, not as issues. Filter for signals worth carrying forward: repeated preferences, explicit "always/never" instructions, workflow rules, language/format rules, artifact placement rules, and agent behavior corrections. Do not invent labels or require structured fields.
4. **Knowledge distillation**: group codebase entries for knowledge base
5. **Process insights**: group process entries for systemic friction
6. **Automation opportunities**: Collect all `[automation]` entries from `## Retrospective` in plans and implementation reports, plus Reviewer findings. Identify repeating patterns or procedural workflows that appear across multiple plans or features — these are candidates for skill creation or process automation.
7. **Delta analysis** (if existing retro exists): Compare previous follow-ups, risks, automation candidates, and unresolved questions against current artifacts. Classify each as new, still-open, resolved, superseded, or unknown.
8. **Research/context synthesis**: Distill reusable findings from context/research `## Retrospective` sections and connect them to plans, reviews, implementations, or unresolved knowledge gaps.
9. **Cross-reference findings**: connect context/research findings → review findings → plan → implementation → audit

### Evidence Requirements

Every Key Discovery, Process Insight, Risk conclusion, Actionable Follow-up, and Automation Opportunity must include evidence. Evidence must name the artifact path and the relevant section, round, or status marker where possible.

Use this evidence shape in the report:

```markdown
- **Evidence**: `plans/{plan-slug}.plan.md` -> `## Risks`; `reports/{plan-slug}.implementation.md` -> `## Implementation Round I{n}`
```

If evidence is weak or inferred, label it explicitly as `Evidence strength: weak` and explain what is missing.

### Output

Write report to `{feature-dir}/notes/{feature-slug}.retro.md`:

**Sections**:

- Executive Summary (2-4 bullets: outcome, strongest lesson, highest-risk open item, best next action)
- Plans Summary (table with versions, review/impl rounds, status)
- Delta Since Previous Retro (if prior retro existed): new, still-open, resolved, superseded, unknown
- Evidence Map (artifact → sections/rounds used)
- Codebase Knowledge Base (distilled insights grouped by theme)
- Risk Analysis (predicted vs materialized)
- Key Discoveries (evidence-backed findings)
- Process Insights (recurring friction)
- Actionable Follow-ups: Table with Follow-up | Priority | Evidence | Applies to | Candidate owner/skill | Status
- **Unfixed Issues & Recommendations**: Table of issues not addressed during implementation, grouped by priority with suggested next actions for team:
  - Column headers: Issue | Priority | Next Action (team decides)
  - `[high]` unfixed → Team evaluates: Quick fix in next round? Separate plan? Risk to next feature?
  - `[mid]` unfixed → Suggested for next sprint or future replan
  - `[low]` unfixed → Suggested for backlog; not urgent
  - `[nit]` unfixed → Track in backlog if resource available
- **Automation Opportunities**: Synthesized list of repeating operations, procedural workflows, or patterns identified across plans/implementation/review rounds that could be automated via new skills or process tooling. For each include:
  - Description
  - Trigger
  - Inputs
  - Expected output
  - Candidate skill/tool
  - Where observed
  - Frequency
  - Estimated benefit/impact
  - Confidence
- Forward-Looking Improvements
- Recommendations for Future Plans: Each item must use `Recommendation → Evidence → Applies to → Candidate owner/skill`
- Knowledge Gaps
- Unresolved Questions
- Preserved Manual Notes / Decisions (only when preserved from previous retro)

Also output a **structured summary in chat** using Retrospective Response Format from [response-formats.md](../workflow/references/response-formats.md): include Summary, Key Lessons, Actionable Follow-ups, Retrospective Artifact, Next Steps, and Active context footer.

### Next-step chooser handling

After emitting Retrospective Response, halt and wait for user input.

When the next user input is exactly one of the offered chooser keys:

- **`[a]` / `a`**: stay in current Architect context and convert evidence-backed retrospective recommendations into concrete follow-up proposals. Do not edit plan/feature docs unless user approves.
- **`[q]` / `q`**: stay in current context and ask 3-5 deep questions about unresolved lessons, root causes, missing evidence, or recurring workflow failures.
- **`[n]` / `n`**: start a next-plan proposal flow in the current Architect context using evidence-backed retro findings. Do not continue with free-form discussion in place when this chooser action is selected. Do not create a plan until user confirms direction.
- **`[p]` / `p`**: run `/retro-all` in current context as a workflow step, not as free-form discussion.
- **`[x]` / `x`**: finish and stop.
- Any key not offered for current retro scope: reprint valid keys and stop.

Do not treat arbitrary custom user messages as chooser input.

Every `/retro` response must end with:

```markdown
---
**Active context**: role: Retrospective · feat: {feat-id} · skill: /retro
```

### Validation

**Trailing refs — forbidden**: Never hand-write or edit `## References` / `## Used by` sections in any `.pythia/**/*.md` file (including the retro artifact). These sections are machine-owned; `inputs.js sync` builds them from body link scans and rdeps backlink scans. Manual entries create phantom records that `refs-owned.js` flags as errors.

- After writing `{feature-dir}/notes/{feature-slug}.retro.md`, run workflow-doc validation per [/validate skill](../validate/SKILL.md) if the validator supports retrospective documents.
- If validation support is unavailable for retro documents, state that explicitly in the response and still verify manually that required retro sections, evidence entries, preserved manual sections, `## Next Steps`, and active context footer are present.
- Do not claim the retro artifact matches the format contract unless validation exits `0`.

**See also**: [/retro-all skill](../retro-all/SKILL.md), [/plan skill](../plan/SKILL.md)
