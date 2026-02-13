# Response Format Specifications

**Purpose**: Structured chat response formats for subagents to prevent information loss between workflow stages. Formats use plain Markdown (not YAML frontmatter) for simplicity and human readability.

## Reviewer Subagent Response Format

**Chat Response** (in addition to writing `{feature-dir}/reports/{plan-slug}.review.md`):

```markdown
# Review Complete: {plan-slug} R{round}

**Plan**: {plan-slug} v{version}  
**Round**: R{round}  
**Verdict**: {READY | NEEDS_REVISION}  
**Review File**: `{feature-dir}/reports/{plan-slug}.review.md` → `## {plan-slug} R{round} — YYYY-MM-DD`

## Summary
[2-3 sentence overview of review findings]

## Verdict
**Status**: {READY | NEEDS_REVISION}

**Rationale**: [Why this verdict]

**Findings**: {critical_findings_count} critical, {high_impact_findings_count} high-impact  
**Blocked Steps**: {if any} S{n}, S{m}, ...

## Critical Findings
{If any BLOCKED steps or critical issues}
- **S{n}**: [Brief description] — Impact: BLOCKED
- ...

## High Priority Concerns
{If any CONCERN-HIGH findings}
- **S{n}**: [Brief description] — Impact: HIGH
- ...

## Review Artifact
- **File**: `{feature-dir}/reports/{plan-slug}.review.md`
- **Section**: `## {plan-slug} R{round} — YYYY-MM-DD`
- **Link**: [Full file path + section anchor]

## Next Steps
{If NEEDS_REVISION}
1. Review findings in `{feature-dir}/reports/{plan-slug}.review.md` → `## {plan-slug} R{round} — YYYY-MM-DD`
2. Call `/replan-feature` with plan-slug `{plan-slug}` and review round `R{round}`
3. After revision, call `/review-plan-feature` again (max 2 rounds)

{If READY}
1. Review is complete. Plan is ready for implementation.
2. Call `/implement-plan-feature` with plan-slug `{plan-slug}`
```

**Key Information Preserved**:
- Verdict and rationale
- Count of critical/high-impact findings
- List of blocked step IDs
- Exact file path and section for next agent
- Clear next action instructions

## Developer Subagent Response Format

**Chat Response** (in addition to writing `{feature-dir}/reports/{plan-slug}.implementation.md`):

```markdown
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
- **Tests**: {passed | failed | skipped} — [brief note]
- **Build**: {passed | failed | skipped} — [brief note]
- **Validation**: {passed | failed | skipped} — [brief note]

## Critical Issues
{If any blocking issues or major deviations}
- **S{n}**: [Issue description] — [Why blocked/deviated]
- ...

## Implementation Artifact
- **File**: `{feature-dir}/reports/{plan-slug}.implementation.md`
- **Contains**: Full implementation report with details

## Next Steps
1. Review implementation report: `{feature-dir}/reports/{plan-slug}.implementation.md`
2. Call `/audit-implementation-feature` with plan-slug `{plan-slug}`
```

**Key Information Preserved**:
- Overall status (completed/partial/blocked)
- Step completion count
- List of blocked step IDs
- Deviation count and critical issues
- Validation results
- Exact file path for next agent

## Architect Subagent Response Formats

### A. Plan Creation/Revision Response

```markdown
# Plan {plan-slug} v{version}

**Plan File**: `{feature-dir}/plans/{plan-slug}.plan.md`  
**Version**: v{version}  
**Revision Source**: {initial | review_round_{round} | user_edits}  
**Last Review Round**: {R{round} link or "Initial plan — no review yet"}

## Summary
[Brief description of plan or changes]

## Plan Document
- **File**: `{feature-dir}/plans/{plan-slug}.plan.md`
- **Version**: v{version}
- **Last Review Round**: {R{round} link or "Initial plan — no review yet"}

## Changes from Previous Version
{If revision}
- **Source**: Review round R{round} | User edits
- **Key Changes**: [Brief list of main changes]
- **Plan Revision Log**: Updated with new entry

## Review Findings Assessment
{If revision from review}
- **Findings Analyzed**: {number} findings from review round R{round}
- **Accepted**: {number} findings accepted and included in plan
- **Rejected**: {number} findings rejected
- **Modified**: {number} findings modified/adapted

**Accepted Findings**:
- S{n}: [Finding description] — [Why accepted, how addressed]

**Rejected Findings**:
- S{n}: [Finding description] — [Why rejected: invalid/out of scope/contradicts objectives]

**Modified Findings**:
- S{n}: [Original finding] — [How modified] — [Reasoning]

## Next Steps
1. Save plan to `{feature-dir}/plans/{plan-slug}.plan.md`
2. Call `/review-plan-feature` with plan-slug `{plan-slug}`
{If revision}
3. Reviewer will check "Addressed by Architect" for previous round
```

### B. Implementation Audit Response

```markdown
# Architect Audit: {plan-slug}

**Plan**: {plan-slug} v{version}  
**Implementation File**: `{feature-dir}/reports/{plan-slug}.implementation.md`  
**Audit File**: `{feature-dir}/reports/{plan-slug}.audit.md`  
**Conformance**: {done | partial | no}  
**Acceptance Criteria Met**: {number}/{total}  
**Decision**: {ready | needs_fixes | re_plan}

## Summary
[2-3 sentence overview of audit findings]

## Conformance Assessment
**Status**: {done | partial | no}

**Details**: [What was done vs plan]

## Acceptance Criteria
**Met**: {number}/{total}
- [ ] Criterion 1 — {status}
- [ ] Criterion 2 — {status}
- ...

## Risk Re-evaluation
[Reassess risks from plan — any new risks or mitigated risks]

## Decision
**Verdict**: {ready | needs_fixes | re_plan}

**Reasoning**: [Why this verdict]

**Next Steps**: [What to do next]

## Audit Artifact
- **File**: `{feature-dir}/reports/{plan-slug}.audit.md`
- **Contains**: Full audit report with details

## Plan Update (if Verdict is "ready")
- **File**: `{feature-dir}/plans/{plan-slug}.plan.md`
- **Changes**: Status updated to "Implemented", Steps marked with status, Acceptance criteria checkboxes marked

## Feature Document Update (if Verdict is "ready")
- **File**: `{feature-dir}/{feature-id}.md`
- **Section**: "## Detailed Implementation Plans (External)" → "**Existing External Plans:**"
- **Changes**: Plan added/updated in list with `**Status: Implemented**` marker
```

**Key Information Preserved**:
- Plan version and revision source
- Link to review round that triggered revision
- Conformance status and acceptance criteria results
- Decision and reasoning
- Exact file paths for all artifacts
- Plan update status (if verdict is "ready")
- Feature document update status (if verdict is "ready")

### C. Retrospective Response

```markdown
# Retrospective Complete: {plan-slug}

**Plan**: {plan-slug} v{version}  
**Status**: Implemented  
**Retrospective File**: `{feature-dir}/notes/{plan-slug}.retro.md`  
**Artifacts Analyzed**: {plan, review, implementation, audit}

## Summary
[2-3 sentence overview of retrospective findings]

## Key Insights
**Discoveries**: {number} key discoveries identified
**Patterns**: {number} patterns identified
**Challenges**: {number} challenges encountered
**Solutions**: {number} solutions found

## Highlights
- **Most Significant Discovery**: [brief description]
- **Most Impactful Pattern**: [brief description]
- **Most Critical Challenge**: [brief description]
- **Most Effective Solution**: [brief description]

## Risk Retrospective
**Risks Analyzed**: {number} risks from plan
**Risks Materialized**: {number} risks that actually occurred
**New Risks Discovered**: {number} risks discovered during implementation

## Recommendations
**For Planning**: {number} recommendations
**For Review Process**: {number} recommendations
**For Implementation**: {number} recommendations
**For Risk Management**: {number} recommendations

## Retrospective Artifact
- **File**: `{feature-dir}/notes/{plan-slug}.retro.md`
- **Contains**: Full retrospective report with detailed analysis
- **Sections**: Plan Summary, Key Discoveries, Patterns, Challenges, Solutions, Review Insights, Implementation Insights, Risk Retrospective, Recommendations, Knowledge Gaps

## Artifacts Analyzed
- Plan: `plans/{plan-slug}.plan.md` (v{version})
- Review: `reports/{plan-slug}.review.md` ({rounds} rounds) {if exists}
- Implementation: `reports/{plan-slug}.implementation.md` {if exists}
- Audit: `reports/{plan-slug}.audit.md` {if exists}
```

**Key Information Preserved**:
- Plan version and status
- Counts of discoveries, patterns, challenges, solutions
- Risk retrospective summary
- Recommendation counts by category
- Exact file path for retrospective report
- List of artifacts analyzed

## Format Benefits

1. **No Information Loss**: All critical data in structured format
2. **Human-Readable**: Plain Markdown with clear headers and sections
3. **Traceability**: Links to all artifacts and related information
4. **Clear Next Actions**: Explicit instructions for next steps
5. **Context Preservation**: Plan-slug, versions, rounds preserved throughout workflow

**Note**: Formats use plain Markdown (not YAML frontmatter) for simplicity. Key metadata (plan-slug, version, round, status) is clearly marked in headers for easy scanning. No automated parsing exists — formats are human-readable structured Markdown.
