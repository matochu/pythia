# Retrospective Format Specification

**File**: `notes/{plan-slug}.retro.md`

## Required Structure

```markdown
# Retrospective: {plan-slug}

**Plan**: {Plan-Id} {Plan-Version}  
**Plan File**: `plans/{plan-slug}.plan.md`  
**Status**: Implemented  
**Retrospective Date**: YYYY-MM-DD

## Plan Summary

- **Plan Title**: {Title from plan}
- **Plan Version**: v{version}
- **Creation Date**: {date}
- **Implementation Date**: {date from implementation report}
- **Audit Date**: {date from audit report}
- **Review Rounds**: {number} rounds (R1, R2, ...)

## Key Discoveries

[What was learned during implementation]
- Discovery 1: [description with evidence from artifacts]
- Discovery 2: [description with evidence from artifacts]
- ...

**Evidence**: References to specific files/sections where discoveries were made

## Patterns Identified

[Recurring themes, approaches that worked well]
- Pattern 1: [description]
- Pattern 2: [description]
- ...

**Examples**: Where these patterns appeared (plan steps, review findings, implementation)

## Challenges Encountered

[Problems faced, blockers]
- Challenge 1: [description]
  - **Source**: [plan step / review finding / implementation issue]
  - **Impact**: [how it affected the plan]
- Challenge 2: [description]
  - ...

## Solutions Found

[How challenges were resolved]
- Solution 1: [description]
  - **Addresses**: [which challenge]
  - **Effectiveness**: [how well it worked]
- Solution 2: [description]
  - ...

## Review Insights

[Key findings from review rounds]
- **Review Rounds**: {number} rounds completed
- **Key Concerns**: [main concerns raised in reviews]
- **Most Impactful Findings**: [findings that led to plan changes]
- **Review Effectiveness**: [how well review process worked]

**Evidence**: References to specific review rounds and findings

## Implementation Insights

[Deviations, unexpected outcomes]
- **Deviations from Plan**: [list of deviations and why they occurred]
- **Unexpected Outcomes**: [positive or negative surprises]
- **Implementation Challenges**: [specific implementation issues]
- **What Went Well**: [aspects that exceeded expectations]

**Evidence**: References to implementation report sections

## Risk Assessment Retrospective

[Which risks materialized, which didn't]
- **Risk 1**: [from plan]
  - **Materialized**: Yes/No
  - **Actual Impact**: [what happened]
  - **Mitigation Effectiveness**: [how well mitigation worked]
- **Risk 2**: [from plan]
  - ...

**New Risks Discovered**: [risks not identified in plan but discovered during implementation]

## Chat Context

[Important context from conversation history not captured in artifacts]

**Purpose**: Capture key decisions, clarifications, feedback, or lessons learned mentioned in chat discussions but not documented in plan/review/implementation/audit artifacts.

- **Key Decisions**: [decisions made during chat discussions]
- **Clarifications**: [important clarifications that affected implementation]
- **User Feedback**: [feedback or concerns raised during execution]
- **Lessons Learned**: [insights mentioned in chat but not in artifacts]
- **Corrections**: [corrections or course corrections made during discussions]

**Attribution**: Each item should reference chat context (e.g., "From chat discussion about Step 3: ...")

## Skills Improvement Recommendations

[Analysis of skills used and recommendations for improvement]

**Skills Used**: [list of skills used during plan execution]
- `.cursor/skills/architecture-workflow` (primary workflow skill)
- [other skills used]

**Analysis Method**: Used `skill-search-and-fit` skill to:
- Evaluate current skills against quality criteria
- Search for improved versions or alternatives
- Identify gaps or conflicts in skill coverage
- Generate improvement recommendations

**Recommendations**:

### For `.cursor/skills/architecture-workflow`:
- **Current State**: [assessment of current skill based on retrospective findings]
- **Improvements Needed**: [specific improvements identified]
- **Alternative Skills Found**: [if any better alternatives discovered]
- **Quality Score**: [if evaluated]

### For Other Skills Used:
- **Skill 1**: [name]
  - **Current Assessment**: [quality/effectiveness]
  - **Improvements**: [recommendations]
  - **Alternatives**: [if found]

**Evidence**: References to retrospective findings that support skill improvement recommendations

## Recommendations for Future Plans

[What to do differently next time]
- **Planning**: [recommendations for plan creation]
- **Review Process**: [recommendations for review]
- **Implementation**: [recommendations for implementation]
- **Risk Management**: [recommendations for risk assessment]

## Knowledge Gaps Identified

[What we still don't know]
- Gap 1: [description]
- Gap 2: [description]
- ...

**Impact**: [how these gaps affected the plan/implementation]

## Artifacts Analyzed

- Plan: `plans/{plan-slug}.plan.md` (v{version})
- Review: `reports/{plan-slug}.review.md` ({rounds} rounds)
- Implementation: `reports/{plan-slug}.implementation.md`
- Audit: `reports/{plan-slug}.audit.md`
- Chat Context: Conversation history (important context not captured in artifacts)
- Skills Analysis: Using `skill-search-and-fit` skill for skills evaluation and improvement recommendations
```

## Key Fields

- **Plan Summary**: Basic metadata about the plan
- **Key Discoveries**: What was learned (with evidence citations)
- **Patterns Identified**: Recurring themes and successful approaches
- **Challenges Encountered**: Problems faced with sources
- **Solutions Found**: How challenges were resolved
- **Review Insights**: Key findings from review process
- **Implementation Insights**: Deviations and unexpected outcomes
- **Risk Assessment Retrospective**: Which risks materialized
- **Chat Context**: Important context from conversation not captured in artifacts
- **Skills Improvement Recommendations**: Analysis and recommendations for skills used
- **Recommendations**: What to do differently
- **Knowledge Gaps**: What we still don't know

## Evidence Requirements

All insights MUST reference specific artifacts:
- Plan sections (Step numbers, Risk IDs)
- Review rounds (R1, R2) and specific findings
- Implementation report sections
- Audit report sections

**Example citations**:
- "Plan Step 3 identified risk X, which materialized as described in Implementation Report section 'Deviations'"
- "Review R2 raised concern S5 about Y, which was addressed in Plan v3 Step 4"
- "Audit report Risk Re-evaluation section confirmed Risk 2 did not materialize"

## Analysis Approach

1. **Read all artifacts** (plan, review, implementation, audit)
2. **Extract specific information** from each artifact
3. **Identify patterns** across artifacts
4. **Cross-reference** findings between artifacts
5. **Synthesize insights** with evidence citations
6. **Generate actionable recommendations** based on actual experience

**Critical**: Do NOT generate generic insights. All insights must be grounded in specific evidence from the analyzed artifacts.
