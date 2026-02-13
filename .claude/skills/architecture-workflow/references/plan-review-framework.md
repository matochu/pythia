# Plan Review Framework

**Purpose**: Structured questions for Reviewer subagent to systematically review plans and identify problems. Focuses on identifying issues, gaps, risks, and ambiguities without providing solutions.

## Review Dimensions

When reviewing a plan, systematically check these dimensions:

### 1. Clarity

**Questions to ask:**
- Are all requirements clearly specified?
- Are there any ambiguous terms or concepts?
- Are success criteria measurable?
- Are acceptance criteria specific and verifiable?

**Finding Types to identify:**
- **ambiguity**: Unclear terms, vague requirements, ambiguous success criteria
- **gap**: Missing clarity on requirements or expectations

### 2. Completeness

**Questions to ask:**
- Are all edge cases covered?
- Are error scenarios defined?
- Are integration points specified?
- Are dependencies listed?
- Are all required steps present?
- Are validation methods specified?

**Finding Types to identify:**
- **gap**: Missing edge cases, undefined error scenarios, unspecified integration points, missing dependencies
- **missing-validation**: No validation method specified for steps or acceptance criteria

### 3. Feasibility

**Questions to ask:**
- Is the proposed approach technically sound?
- Are time estimates realistic?
- Are all required tools/libraries available?
- Can each step be executed as described?
- Are there any blocking dependencies?

**Finding Types to identify:**
- **infeasible**: Step cannot be executed as described, approach is technically unsound
- **wrong-assumption**: Incorrect assumptions about tools, libraries, or capabilities
- **risk**: Feasibility concerns that may cause problems during implementation

### 4. Risks

**Questions to ask:**
- What could go wrong during implementation?
- Are there thread safety issues?
- Are there performance concerns?
- Are there security implications?
- Are there architectural risks (deadlocks, race conditions, circular dependencies)?
- Are there integration risks?

**Finding Types to identify:**
- **risk**: Potential problems during implementation (thread safety, performance, security, architectural risks)
- **wrong-assumption**: Incorrect assumptions that could lead to problems

### 5. Testability

**Questions to ask:**
- How will we test this?
- Are test scenarios defined?
- Can we write unit tests?
- Can we test integration points?
- Are validation methods specified and executable?

**Finding Types to identify:**
- **missing-validation**: No validation method specified
- **gap**: Missing test scenarios or unclear testing approach

## Review Process

1. **Read the plan completely** - Understand the full context
2. **Check each dimension systematically** - Use the questions above for each dimension
3. **Identify findings** - Map identified issues to Finding Types (gap, risk, ambiguity, infeasible, missing-validation, wrong-assumption)
4. **Document in review report** - Use review format specification to document findings
5. **Assign severity** - Classify as BLOCKED, CONCERN-HIGH, CONCERN-MEDIUM, CONCERN-LOW, or OK

## Finding Types Mapping

- **gap**: Missing information, undefined scenarios, unspecified requirements
- **risk**: What could go wrong, potential problems, concerns
- **ambiguity**: What is unclear, vague requirements, ambiguous terms
- **infeasible**: Step cannot be executed, approach is technically unsound
- **missing-validation**: No validation method specified
- **wrong-assumption**: Incorrect assumption about tools, capabilities, or requirements

## Critical Reminder

**DO NOT provide recommendations or solutions.** Only identify problems, gaps, risks, and ambiguities. Do not write "do X", "use Y", "rewrite Z". Focus on **what is wrong** and **why it matters**, not **how to fix it**.
