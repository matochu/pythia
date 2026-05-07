# Response Format Specifications

**Purpose**: Structured chat response formats for workflow skills. These formats preserve handoff information between `/plan`, `/review`, `/replan`, `/implement`, `/audit`, and retrospective work.

Formats use plain Markdown, not YAML frontmatter. They are response templates only; execution semantics live in the relevant skill files.

## Reviewer Response Format

**Chat Response** (in addition to writing `{feature-dir}/reports/{plan-slug}.review.md`):

````markdown
# Review Complete: {plan-slug} R{round}

**Plan**: {plan-slug} v{version}  
**Round**: R{round}  
**Verdict**: {READY | NEEDS_REVISION}  
**Review File**: `{feature-dir}/reports/{plan-slug}.review.md` -> `## {plan-slug} R{round} - YYYY-MM-DD`

## Summary
[2-3 sentence overview of review findings]

## Verdict
**Status**: {READY | NEEDS_REVISION}

**Rationale**: [Why this verdict]

**Findings**: {critical_findings_count} critical, {high_impact_findings_count} high-impact  
**Blocked Steps**: {if any} S{n}, S{m}, ...

## Critical Findings
{If any BLOCKED steps or critical issues}
- **S{n}**: [Brief description] - Impact: BLOCKED
- ...

## High Priority Concerns
{If any CONCERN-HIGH findings}
- **S{n}**: [Brief description] - Impact: HIGH
- ...

## Review Artifact
- **File**: `{feature-dir}/reports/{plan-slug}.review.md`
- **Section**: `## {plan-slug} R{round} - YYYY-MM-DD`
- **Link**: [Full file path + section anchor]

## Next Steps
{If NEEDS_REVISION}
Review result: NEEDS_REVISION · source: R{round}

**[r]** Replan - choose this to launch Architect subagent to revise the plan using this review.
**[q]** QA follow-up - choose this to launch QA Automation subagent for testability, validation coverage, and QA-risk assessment. If accepted, append the QA assessment summary to this review round.
**[v]** Re-review - choose this to rerun `/review` on the same plan after changes were made elsewhere.

Copy to run replan in another chat:

```text
/replan {feature-dir}/plans/{plan-slug}.plan.md R{round}
```

Copy to rerun review in another chat:

```text
/review {feature-dir}/plans/{plan-slug}.plan.md
```

{If READY}
Review result: READY · source: R{round}

**[i]** Implement - choose this to launch Developer subagent to execute this reviewed plan.
**[q]** QA follow-up - choose this to launch QA Automation subagent for pre-implementation test strategy and validation-risk assessment. If accepted, append the QA assessment summary to this review round.

Copy to run implement in another chat:

```text
/implement {feature-dir}/plans/{plan-slug}.plan.md v{version}
```

---
**Active context**: feat: {feat-id} · plan: {plan-slug} · review: R{round} · skill: /review
````

**Key Information Preserved**:
- verdict and rationale
- count of critical/high-impact findings
- blocked step IDs
- exact artifact path and section
- next workflow action

## Developer Response Format

**Chat Response** (in addition to writing `{feature-dir}/reports/{plan-slug}.implementation.md`):

````markdown
# Implementation Complete: {plan-slug}

**Plan**: {plan-slug} v{version}  
**Status**: {completed | partial | blocked}  
**Implementation File**: `{feature-dir}/reports/{plan-slug}.implementation.md`

## Summary
[2-3 sentence overview of what was implemented]

## Status
**Overall**: {completed | partial | blocked}

**Steps Completed**: {number}/{total}  
**Steps Blocked**: {if any} S{n}, S{m}, ...  
**Deviations**: {number} deviations from plan documented

## Validation Results
- **Tests**: {passed | failed | skipped} - [brief note]
- **Build**: {passed | failed | skipped} - [brief note]
- **Validation**: {passed | failed | skipped} - [brief note]

## Critical Issues
{If any blocking issues or major deviations}
- **S{n}**: [Issue description] - [Why blocked/deviated]
- ...

## Implementation Artifact
- **File**: `{feature-dir}/reports/{plan-slug}.implementation.md`
- **Contains**: Full implementation report with details

## Next Steps
{If completed}
Implementation result: completed · source: I{round}

**[a]** Audit - choose this to launch Architect subagent ([architect.md](../../../agents/architect.md)) to audit the active implementation report.
**[q]** QA validation guidance - choose this to launch QA Automation subagent ([qa-automation.md](../../../agents/qa-automation.md)) to identify validation gaps, weak test evidence, and follow-up implementation work needed before audit.

Copy to run audit in another chat:

```text
/audit {feature-dir}/reports/{plan-slug}.implementation.md I{round}
```

{If partial}
Implementation result: partial · source: I{round}

**[a]** Audit anyway - choose this to launch Architect subagent ([architect.md](../../../agents/architect.md)) to audit the active partial implementation report.
**[r]** Replan - choose this to launch Architect subagent ([architect.md](../../../agents/architect.md)) if remaining work requires plan/spec changes.
**[q]** QA validation guidance - choose this to launch QA Automation subagent ([qa-automation.md](../../../agents/qa-automation.md)) to identify what validation/test work is still needed to complete the implementation report credibly.

Copy to run audit in another chat:

```text
/audit {feature-dir}/reports/{plan-slug}.implementation.md I{round}
```

Copy to run replan in another chat:

```text
/replan {feature-dir}/plans/{plan-slug}.plan.md I{round}
```

{If blocked}
Implementation result: blocked · source: I{round}

**[r]** Replan - choose this to launch Architect subagent ([architect.md](../../../agents/architect.md)) if the blocker is caused by plan/spec problems.
**[q]** QA validation guidance - choose this to launch QA Automation subagent ([qa-automation.md](../../../agents/qa-automation.md)) when the blocker may be caused by missing, weak, or unclear validation strategy.

Copy to run replan in another chat:

```text
/replan {feature-dir}/plans/{plan-slug}.plan.md I{round}
```

---
**Active context**: feat: {feat-id} · plan: {plan-slug} · implementation: I{round} · skill: /implement
````

**Key Information Preserved**:
- overall status
- step completion and blocked step counts
- deviation count
- validation result summary
- exact implementation artifact path
- active implementation round for custom continuation

## Architect Response Formats

### A1. Plan Creation Response

Use after `/plan` successfully writes a new plan or direct plan update.

````markdown
# Plan {plan-slug} v{version}

**Plan File**: `{feature-dir}/plans/{plan-slug}.plan.md`  
**Version**: v{version}  
**Revision Source**: {initial | user_edits}  
**Last Review Round**: {R{round} link or "Initial plan - no review yet"}

## Summary
[Brief description of the plan]

## Plan Document
- **File**: `{feature-dir}/plans/{plan-slug}.plan.md`
- **Version**: v{version}
- **Last Review Round**: {R{round} link or "Initial plan - no review yet"}
- **Plans Index**: {updated | appended | skipped}

## Next Steps
Plan saved: `{feature-dir}/plans/{plan-slug}.plan.md` v{version}

**[a]** Architect analysis - analyze alternative solutions and trade-offs
**[q]** Questions - ask deep questions about the plan before review
**[r]** Review - launch `/review` in a separate context now; next step after review is `/replan`
**[p]** rePlan - run `/replan` when a review artifact already exists

Or copy this to run review in another chat:

```text
/review {feature-dir}/plans/{plan-slug}.plan.md
```
````

### A2. Plan Revision Response

Use after `/replan` successfully writes a revised plan. `/replan` has a narrower handoff than `/plan`; do not include `[a]`, `[q]`, or `[p]` here.

````markdown
# Plan Revised: {plan-slug} v{version}

**Plan File**: `{feature-dir}/plans/{plan-slug}.plan.md`  
**Version**: v{version}  
**Revision Source**: {review_round_{round} | implementation_round_{round} | user_edits}  
**Last Review Round**: {R{round} link or unchanged value}

## Summary
[Brief description of the revision]

## Plan Document
- **File**: `{feature-dir}/plans/{plan-slug}.plan.md`
- **Version**: v{version}
- **Last Review Round**: {R{round} link or unchanged value}

## Changes from Previous Version
- **Source**: {Review round R{round} | Implementation round I{round} | User edits}
- **Key Changes**: [Brief list of main changes]
- **Plan Revision Log**: Updated with new entry

## Findings / Issue Assessment
{If revision was triggered by review or implementation}
- **Findings Analyzed**: {number}
- **Accepted/New Step/Amended**: {number}
- **Rejected**: {number}
- **Modified**: {number}

## Next Steps
Revised plan saved: `{feature-dir}/plans/{plan-slug}.plan.md` v{version}

**[r]** Review - launch `/review` in a separate context on the revised plan.

Or copy this to run review in another chat:

```text
/review {feature-dir}/plans/{plan-slug}.plan.md
```
````

**Key Information Preserved**:
- plan path and version
- revision source and last review round
- Plans Index result for `/plan`
- review/replan handoff without mixing `/plan` and `/replan` chooser semantics

### B. Audit Response

```markdown
# Architect Audit: {plan-slug}

**Plan**: {plan-slug} v{version}  
**Implementation File**: `{feature-dir}/reports/{plan-slug}.implementation.md`  
**Audit File**: `{feature-dir}/reports/{plan-slug}.audit.md`  
**Conformance**: {done | partial | no}  
**Implementation quality**: {pass | concerns | fail}  
**Acceptance Criteria Met**: {number}/{total}  
**Decision**: {ready | needs-fixes | plan-fix | re-plan}

## Summary
[2-3 sentence overview of audit findings]

## Conformance Assessment
**Status**: {done | partial | no}

**Details**: [What was done vs plan]

## Acceptance Criteria
**Met**: {number}/{total}
- [ ] Criterion 1 - {status}
- [ ] Criterion 2 - {status}
- ...

## Implementation quality check
**Status**: {pass | concerns | fail}
- Test/criteria integrity: [brief]
- Maintainability: [brief]
- Architecture and design: [brief]
- Out-of-plan work: [brief]

## Risk Re-evaluation
[Reassess risks from plan - any new risks or mitigated risks]

## Decision
**Verdict**: {ready | needs-fixes | plan-fix | re-plan}

**Reasoning**: [Why this verdict]

## Audit Artifact
- **File**: `{feature-dir}/reports/{plan-slug}.audit.md`
- **Contains**: Full audit report with details

## Plan Update (if Verdict is "ready")
- **File**: `{feature-dir}/plans/{plan-slug}.plan.md`
- **Changes**: Document status updated to `Implemented`; step statuses and acceptance criteria updated as applicable

## Feature Document Update (if Verdict is "ready")
- **File**: `{feature-dir}/{feature-id}.md`
- **Section**: `## Plans`
- **Changes**: Plan entry updated by slug with current title and status

## Suggested git commit (if Verdict is "ready")

Repository-only message for the code repo. Do not include plan slugs, plan numbers, `.pythia/`, workflow paths, or other planning artifact references.

- **Subject**: `feat: ...` (<= 72 chars)
- **Body**: imperative bullets for code changes
- **Optional**: `Files: N` (repo paths only)

## Next Steps
{If ready}
Audit result: ready · source: A{round}

**[t]** Retro - choose this to run `/retro` in the current Architect context and synthesize lessons from plan/review/implementation/audit.
**[x]** Finish - choose this to stop the workflow here; implementation is accepted.

Copy to run retro in another chat:

```text
/retro {feature-dir}
```

{If needs-fixes}
Audit result: needs-fixes · source: A{round}

**[i]** Fix implementation - choose this to launch Developer subagent ([developer.md](../../../agents/developer.md)) in refinement mode using the audit findings.
**[q]** QA validation guidance - choose this to launch QA Automation subagent ([qa-automation.md](../../../agents/qa-automation.md)) if audit concerns are validation/test-evidence related.
**[v]** Re-audit - choose this to rerun `/audit` on the same implementation after fixes were made elsewhere.

Copy to run implementation refinement in another chat:

```text
/implement {feature-dir}/plans/{plan-slug}.plan.md A{round}
```

Copy to rerun audit in another chat:

```text
/audit {feature-dir}/reports/{plan-slug}.implementation.md I{implementation_round}
```

{If plan-fix}
Audit result: plan-fix · source: A{round}

**[r]** Replan - choose this to update the current plan in Architect context using audit findings.
**[d]** Discuss decision - stay in the current Architect context and decide whether this is a local plan fix or a broader re-plan before editing artifacts.
**[v]** Re-audit - choose this to rerun `/audit` on the same implementation after plan or implementation changes were made elsewhere.

Copy to run replan in another chat:

```text
/replan {feature-dir}/plans/{plan-slug}.plan.md A{round}
```

Copy to rerun audit in another chat:

```text
/audit {feature-dir}/reports/{plan-slug}.implementation.md I{implementation_round}
```

{If re-plan}
Audit result: re-plan · source: A{round}

**[r]** Replan - choose this to start Architect replan with user-assisted scope decision.
**[d]** Discuss scope - stay in the current Architect context and clarify the new direction before replanning.
**[v]** Re-audit - choose this to rerun `/audit` on the same implementation after scope, plan, or implementation changes were made elsewhere.

Copy to run replan in another chat:

```text
/replan {feature-dir}/plans/{plan-slug}.plan.md A{round}
```

Copy to rerun audit in another chat:

```text
/audit {feature-dir}/reports/{plan-slug}.implementation.md I{implementation_round}
```

---
**Active context**: feat: {feat-id} · plan: {plan-slug} · audit: A{round} · skill: /audit
```

**Key Information Preserved**:
- conformance status
- implementation quality verdict
- acceptance criteria results
- audit decision
- exact artifact paths
- plan and feature document update status
- audit next-step chooser and active context

### C. Retrospective Response

```markdown
# Feature Retrospective Complete: {feat-id}

**Feature**: {feat-id}  
**Status**: {active | completed | blocked}  
**Retrospective File**: `{feature-dir}/notes/{feature-slug}.retro.md`  
**Artifacts Analyzed**: {plans_count} plans, {reviews_count} reviews, {implementations_count} implementation reports, {audits_count} audits

## Summary
[2-3 sentence overview: feature-level outcome, repeated patterns, and highest-impact lesson]

## Key Lessons
- **Planning**: {most important lesson about plan quality or decomposition}
- **Review**: {most important lesson about review quality or missed/handled concerns}
- **Implementation**: {most important lesson about execution, validation, or environment}
- **Audit**: {most important lesson about acceptance, follow-up, or quality gates}
- **Workflow**: {systemic workflow lesson, if any}

## Actionable Follow-ups
- **High priority**: {highest-value follow-up or decision}
- **Process improvement**: {skill/template/role/process change to consider}
- **Next feature/plan risk**: {risk to watch in the next plan or feature}

## Retrospective Artifact
- **File**: `{feature-dir}/notes/{feature-slug}.retro.md`
- **Contains**: full feature retrospective across plans, reports, evidence, patterns, and recommendations

## Next Steps

**[a]** Apply learnings - choose this to convert cross-plan lessons into concrete follow-up proposals.
**[q]** Deep questions - choose this to inspect unresolved patterns, unclear root causes, or weak evidence.
**[n]** Next plan - choose this to ask Architect ([architect.md](../../../agents/architect.md)) to propose the next plan using retro findings.
**[p]** Project retro - choose this to run `/retro-all` in the current context.
**[x]** Finish - choose this to stop.

Copy to run project-level retrospective in another chat:

```text
/retro-all
```

---
**Active context**: feat: {feat-id} · skill: /retro
```

**Key Information Preserved**:
- feature status and analyzed artifact counts
- concise summary before any next-step chooser
- key lessons by workflow stage
- actionable follow-ups and risks
- exact retrospective artifact path
- active retro context

## Format Rules

- Keep chat responses concise; the full reasoning belongs in the written artifact.
- Use current command names: `/plan`, `/review`, `/replan`, `/implement`, `/audit`.
- Do not include executable behavior that belongs in skill files.
- Do not add YAML frontmatter to chat responses.
- Preserve artifact paths and round/version identifiers exactly.
