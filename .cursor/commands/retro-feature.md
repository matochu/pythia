# Command: /retro-feature

**Purpose**: Invoke Architect to analyze completed plan and generate retrospective report. Hermetic per feature; agent doc context = feature.

## Instructions for user

- Provide **FEATURE_ID** or path to feature doc and **plan slug** (e.g. `4-sync-cursor-to-claude`).
- Plan should have Status: "Implemented" (completed plan).

## Instructions for model

You are the **Architect**. **Doc context = this feature** (feat doc + plans/ + notes/ + reports/).

**Input**: Feature context + **plan slug** (required). 
- Plan path = `plans/{plan-slug}.plan.md`
- Review path = `reports/{plan-slug}.review.md` (if exists)
- Implementation path = `reports/{plan-slug}.implementation.md` (if exists)
- Audit path = `reports/{plan-slug}.audit.md` (if exists)

**Gate Logic** (execute before generating retrospective):

1. Check if plan file exists at `plans/{plan-slug}.plan.md`.
2. Parse plan file for `Status: Implemented` (search for line containing `Status`).
3. If plan status is not "Implemented":
   - Return error: "Cannot generate retrospective: plan must have Status: 'Implemented'. Current status: {status}. Complete plan implementation and audit first."
   - Do not proceed to retrospective generation.
4. If plan status is "Implemented":
   - Proceed to generate retrospective report.

**Output**:

1. **Retrospective report** written to `{feature-dir}/notes/{plan-slug}.retro.md` per format specification (see `references/retro-format.md`).
2. **Structured response** in chat using Architect Retrospective Response Format (plain Markdown) — see `references/response-formats.md` for format specification.

**Analysis Process**:

1. **Read plan file** (`plans/{plan-slug}.plan.md`):
   - Extract metadata (Plan-Id, Plan-Version, Status, Creation Date, Last review round)
   - Extract steps (with status markers if present)
   - Extract risks from "Risks / Unknowns" section
   - Extract acceptance criteria
   - Extract plan revision log

2. **Read review file** (if exists at `reports/{plan-slug}.review.md`):
   - Count review rounds (count `## {plan-slug} R{n}` headers)
   - Extract verdicts for each round
   - Extract key concerns (BLOCKED, CONCERN-HIGH findings)
   - Extract step-by-step analysis findings
   - Extract "Addressed by Architect" checkboxes (if filled)

3. **Read implementation file** (if exists at `reports/{plan-slug}.implementation.md`):
   - Extract executed steps and their status
   - Extract deviations from plan
   - Extract open issues
   - Extract files changed and commands executed
   - Extract any discoveries or unexpected outcomes mentioned

4. **Read audit file** (if exists at `reports/{plan-slug}.audit.md`):
   - Extract conformance assessment
   - Extract acceptance criteria check results
   - Extract risk re-evaluation (which risks materialized, which didn't)
   - Extract decision and reasoning
   - Extract audit date

5. **Collect important chat context** (from conversation history):
   - Review conversation history for important context not captured in artifacts
   - Extract key decisions made during discussions
   - Extract clarifications or corrections that affected implementation
   - Extract user feedback or concerns raised during execution
   - Extract any "lessons learned" mentioned in chat but not documented in artifacts
   - Document chat context in retrospective report with clear attribution (e.g., "From chat discussion: ...")

6. **Analyze skills used** (using `skill-search-and-fit` skill):
   - Identify skills used during plan execution (from plan steps, implementation report, commands executed)
   - For `.cursor/skills/architecture-workflow` skill specifically:
     - Analyze skill structure and usage patterns
     - Identify potential improvements based on retrospective findings
     - Check for conflicts or gaps in skill coverage
   - For other skills used:
     - Evaluate quality and effectiveness
     - Identify potential improvements or alternatives
   - Use `skill-search-and-fit` skill to:
     - Search for improved versions of skills used
     - Search for alternative skills that might work better
     - Evaluate current skills against quality criteria
     - Generate recommendations for skill improvements
   - Document skill analysis and recommendations in retrospective report

7. **Analyze patterns across all artifacts**:
   - Cross-reference findings between artifacts
   - Identify recurring themes
   - Connect review findings to plan changes
   - Connect implementation deviations to plan steps
   - Connect audit risk re-evaluation to original plan risks
   - Include chat context insights in pattern analysis

8. **Generate retrospective report** following format specification:
   - Include all required sections from `references/retro-format.md`
   - Provide evidence citations for all insights (reference specific sections/files)
   - Extract specific information from artifacts (not generic insights)
   - Include important chat context with clear attribution
   - Include skills improvement recommendations from skill-search-and-fit analysis
   - Synthesize patterns and discoveries with evidence

**Validation** (before completing):

- Verify plan status is "Implemented" (gate check passed)
- Verify report includes all required sections from `references/retro-format.md`:
  - Plan Summary
  - Key Discoveries (with evidence)
  - Patterns Identified
  - Challenges Encountered (with sources)
  - Solutions Found
  - Review Insights
  - Implementation Insights
  - Risk Assessment Retrospective
  - Chat Context (important context from conversation)
  - Skills Improvement Recommendations (from skill-search-and-fit analysis)
  - Recommendations for Future Plans
  - Knowledge Gaps Identified
- Verify report follows format specification
- Verify insights are extracted from actual artifacts (not generic)
- Verify all insights include evidence citations (references to specific files/sections)
- Verify report references specific plan steps, review rounds, implementation sections, audit sections
- Verify chat context section includes important context from conversation with clear attribution
- Verify skills improvement recommendations section includes analysis using skill-search-and-fit skill

**Retrospective format**: See `references/retro-format.md` for format specification:
- Plan Summary
- Key Discoveries (with evidence)
- Patterns Identified
- Challenges Encountered (with sources)
- Solutions Found
- Review Insights
- Implementation Insights
- Risk Assessment Retrospective
- Chat Context (important context from conversation not captured in artifacts)
- Skills Improvement Recommendations (from skill-search-and-fit analysis)
- Recommendations for Future Plans
- Knowledge Gaps Identified

**Critical**: 
- Do NOT generate generic insights. All insights must reference specific artifacts and sections.
- Extract actual information from plan, review, implementation, and audit files.
- Cross-reference findings between artifacts to identify patterns.
- Provide evidence citations for all insights (e.g., "Plan Step 3", "Review R2 S5", "Implementation Report: Deviations section").

See [agent-selection-guide](../agents/_agent-selection-guide.md): use Architect for retrospective analysis; use Developer for implementation; use Reviewer for plan review.
