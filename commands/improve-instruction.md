# Command: Improve Instruction

> **IMPORTANT**: This command provides a comprehensive, self-contained framework for improving existing instructions and commands by applying systematic quality enhancement principles. It includes all necessary methodologies, principles, and tools within a single document.

## Purpose

This command transforms vague, incomplete, or poorly structured instructions into deterministic, testable, and maintainable documentation. It applies systematic quality improvement principles including slow thinking methodology, structural analysis, ambiguity elimination, reasoning scaffolding, and safety enhancement. The command is completely self-contained and requires no external dependencies or additional documentation.

## Prerequisites

Before executing this command, ensure you have:

1. [ ] Identified the target instruction or command to improve
2. [ ] Obtained the current date for proper document timestamping
3. [ ] Read and understood the target instruction completely
4. [ ] Determined the scope of improvements needed (surgical vs full rewrite)

## Command Checklist

- [ ] Apply slow thinking mode: analysis → plan → execution
- [ ] Clarify purpose, audience, and constraints
- [ ] Diagnose structure and completeness gaps
- [ ] Eliminate ambiguities and normalize scales
- [ ] Add reasoning scaffolding and self-checks
- [ ] Enhance safety, accuracy, and controllability
- [ ] Create test cases, counterexamples, and acceptance criteria
- [ ] Choose update strategy (surgical edit vs full rewrite)
- [ ] Perform self-assessment using quality rubric
- [ ] Deliver comprehensive results package

## Core Improvement Principles

### 0. Slow Thinking Mode

**Principle**: Work in two phases: first analysis and planning, then execution.

**Implementation**:

1. **Analysis Phase**:

   - Do NOT generate final rewritten instruction
   - Document plan with clear steps
   - Focus on understanding current state
   - Identify improvement opportunities

2. **Planning Phase**:
   - Create 3-6 step execution plan
   - Define success criteria
   - Identify potential challenges
   - Plan resource requirements

**Output**: Short plan with 3-6 clear steps

### 1. Purpose, Audience, and Constraints Clarification

**Principle**: Explicitly define the instruction's core elements before improvement.

**Required Analysis**:

| Element                | Description                                          | Example                                                                 |
| ---------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------- |
| **Purpose**            | Instruction goal in one sentence                     | "Create standardized command documents for LLM execution"               |
| **Audience**           | Roles, experience level, available tools             | "Senior developers with TypeScript knowledge, access to project config" |
| **Constraints**        | Forbidden actions, tool restrictions, language rules | "No build commands, English comments only, no hallucination"            |
| **Expected Artifacts** | Specific output documents/sections                   | "Command file, updated documentation map, validation report"            |

**Output**: Analysis table and clarifying questions list

### 2. Structure and Completeness Diagnosis

**Principle**: Systematically identify gaps in instruction structure and content.

**Diagnostic Checklist**:

- [ ] **Clear Structure**: purpose → prerequisites → steps → verification → output → examples
- [ ] **Decision Boundaries**: when to ask user, when to stop, when to use tools
- [ ] **Thinking Rules**: analysis → plan → execution → self-check → summary
- [ ] **Safety Policies**: no inventions, source handling, insufficient data protocols
- [ ] **Test Cases**: examples, counterexamples, acceptance criteria
- [ ] **Quality Rubric**: evaluation criteria and versioning approach
- [ ] **Stop Conditions**: when instruction should pause for clarification

**Output**: List of gaps and risks with explanations

### 3. Ambiguity Elimination and Scale Normalization

**Principle**: Transform vague formulations into deterministic rules.

**Normalization Examples**:

| Before         | After                                | Rationale                |
| -------------- | ------------------------------------ | ------------------------ |
| "quickly"      | "within 30 seconds"                  | Specific time constraint |
| "many files"   | "5-10 files"                         | Quantified range         |
| "later"        | "within 24 hours"                    | Absolute time reference  |
| "good quality" | "score 4+ on 1-5 scale"              | Measurable criteria      |
| "when needed"  | "when error occurs OR user requests" | Clear triggers           |

**Scale Introduction**:

- **Complexity**: 1 (trivial) to 5 (critical system impact)
- **Risk**: 1 (low) to 5 (high failure probability)
- **Effort**: 1 (minutes) to 5 (days)
- **Priority**: 1 (nice-to-have) to 5 (blocking)

**Output**: "Before → After" table and scale descriptions

### 4. Reasoning Scaffolding

**Principle**: Embed mandatory thinking processes into instructions.

**Scaffolding Elements**:

1. **Forced Process**: analysis → plan → execution → self-check → summary
2. **Self-Audit Questions**:
   - "What did I miss?"
   - "What data is still needed?"
   - "Are there contradictions with previous rules?"
   - "What could go wrong?"
3. **Stopping Points**: Mandatory clarification requests

**Implementation Examples**:

```markdown
## Self-Check Point

Before proceeding to the next step, verify:

- [ ] All prerequisites are met
- [ ] No conflicting requirements exist
- [ ] Required data is available
- [ ] Safety conditions are satisfied

**If any item is unclear, STOP and request clarification.**
```

**Output**: List of specific self-check points

### 5. Safety, Accuracy, and Controllability Enhancement

**Principle**: Add policies and controls to prevent errors and ensure quality.

**Safety Enhancements**:

1. **Fact Policy**: "Do not invent facts; when data is insufficient — ask for clarification"
2. **Tool Usage**: Prescribe when and how to use external tools/sources
3. **Conflict Resolution**: Specify how to handle conflicting data
4. **Stop Conditions**: Define when to refuse execution
5. **Fallback Strategies**: Provide alternatives when primary approach fails

**Implementation Examples**:

```markdown
## Safety Rules

- **No Hallucination**: If information is not explicitly provided, request it
- **Source Priority**: Config files > Documentation > Code comments > Assumptions
- **Stop Conditions**:
  - Missing required configuration
  - Conflicting requirements
  - Insufficient permissions
- **Fallback**: Use default values only when explicitly allowed
```

**Output**: List of safety rules and stop-conditions

### 6. Test Cases and Acceptance Criteria

**Principle**: Create practical examples and validation criteria.

**Test Development**:

1. **Positive Examples** (minimum 3):

   - Basic use case
   - Typical use case
   - Complex use case

2. **Counterexamples**:

   - When instruction cannot be applied
   - When instruction needs modification
   - Edge cases and limitations

3. **Acceptance Criteria**:
   - Measurable success indicators
   - Quality checkpoints
   - Validation procedures

**Example Test Case**:

```markdown
## Test Case: Basic Command Creation

**Input**: Create command for file validation
**Prerequisites**: Project config available, target directory exists
**Steps**: Follow command creation process
**Expected Output**:

- Command file created in correct location
- All required sections present
- Links validated and functional
- Documentation map updated
  **Success Criteria**: Command can be executed successfully by another LLM
```

**Output**: Set of examples, counterexamples, and acceptance criteria

### 7. Update Strategy Selection

**Principle**: Choose appropriate improvement approach based on scope and impact.

**Strategy Options**:

1. **Surgical Edit**:

   - Preserves existing structure
   - Eliminates specific gaps and ambiguities
   - Minimal disruption to existing content
   - Suitable for minor improvements

2. **Full Rewrite**:
   - Creates new deterministic structure
   - Implements all improvement principles
   - Comprehensive quality enhancement
   - Suitable for major improvements

**Decision Framework**:

| Factor        | Surgical Edit     | Full Rewrite            |
| ------------- | ----------------- | ----------------------- |
| **Scope**     | < 30% changes     | > 50% changes           |
| **Structure** | Sound foundation  | Major structural issues |
| **Time**      | Quick improvement | Comprehensive overhaul  |
| **Risk**      | Low disruption    | Higher impact           |

**Output**: Strategy description and decision rationale

### 8. Quality Rubric Assessment

**Principle**: Evaluate instruction quality using standardized criteria.

**Quality Dimensions** (0-5 scale):

| Dimension           | 1                | 3                | 5                   |
| ------------------- | ---------------- | ---------------- | ------------------- |
| **Clarity**         | Unclear language | Generally clear  | Crystal clear       |
| **Determinism**     | Many ambiguities | Some ambiguities | Fully deterministic |
| **Testability**     | No test criteria | Basic tests      | Comprehensive tests |
| **Safety**          | No safety rules  | Basic safety     | Robust safety       |
| **Completeness**    | Major gaps       | Minor gaps       | Complete coverage   |
| **Maintainability** | Hard to update   | Moderate effort  | Easy to maintain    |

**Assessment Process**:

1. Score each dimension
2. Identify improvement opportunities
3. Create action plan to reach target scores
4. Prioritize improvements by impact

**Output**: Quality scores and improvement plan

## Step-by-Step Execution

### Step 1: Initial Analysis and Planning

```bash
# Get the current date for proper timestamping
date +%Y-%m-%d

# Create analysis workspace
mkdir -p analysis
```

**Actions**:

1. Read target instruction completely
2. Apply slow thinking mode
3. Create 3-6 step improvement plan
4. Document current state understanding

**Output**: Analysis plan and current state assessment

### Step 2: Core Elements Clarification

**Actions**:

1. Extract and formulate purpose in one sentence
2. Identify target audience (roles, experience, tools)
3. Define constraints (forbidden actions, tool restrictions)
4. Specify expected artifacts (output documents/sections)

**Output**: Purpose/Audience/Constraints/Artifacts table

### Step 3: Structure and Completeness Diagnosis

**Actions**:

1. Check for clear structure (purpose → prerequisites → steps → verification → output → examples)
2. Identify decision boundaries (when to ask, stop, use tools)
3. Look for explicit thinking rules
4. Assess safety policies and stop conditions
5. Check for test cases and acceptance criteria

**Output**: List of gaps and risks with explanations

### Step 4: Ambiguity Elimination

**Actions**:

1. Find vague terms ("quickly", "many", "later", "good quality")
2. Transform to specific values (time constraints, quantities, measurable criteria)
3. Introduce unified evaluation scales (1-5 for complexity, risk, effort, priority)
4. Standardize mandatory sections and output formats

**Output**: "Before → After" table for each ambiguity

### Step 5: Reasoning Scaffolding Addition

**Actions**:

1. Embed forced process: analysis → plan → execution → self-check → summary
2. Add self-audit questions after major blocks
3. Define mandatory stopping points for clarifications
4. Create self-check templates

**Output**: List of self-check points and reasoning framework

### Step 6: Safety Enhancement

**Actions**:

1. Add fact policy (no invention, ask for clarification)
2. Prescribe tool usage and source handling
3. Define conflict resolution procedures
4. Establish stop conditions and fallback strategies

**Output**: Safety rules and stop-conditions list

### Step 7: Test Development

**Actions**:

1. Create minimum 3 positive examples (basic, typical, complex)
2. Develop counterexamples (when not applicable, edge cases)
3. Formulate acceptance criteria (measurable success indicators)
4. Design validation procedures

**Output**: Test cases, counterexamples, and acceptance criteria

### Step 8: Strategy Selection

**Actions**:

1. Assess scope of changes needed
2. Evaluate structural soundness
3. Consider time and risk factors
4. Choose surgical edit or full rewrite approach

**Output**: Strategy decision and rationale

### Step 9: Quality Assessment

**Actions**:

1. Score each quality dimension (0-5 scale)
2. Identify improvement opportunities
3. Create action plan to reach target scores
4. Prioritize improvements by impact

**Output**: Quality scores and improvement plan

### Step 10: Results Delivery

**Required Deliverables**:

1. Short improvement plan
2. Original instruction audit (problems, gaps, ambiguities)
3. "Before → After" normalization table
4. Added rules list (reasoning, decision boundaries, safety, stop-conditions)
5. Surgical Edit — ready text
6. Full Rewrite — ready text
7. Test cases, counterexamples, acceptance criteria
8. Quality rubric with scores and improvement plan
9. Differentiated change list (before/after)
10. Questions to instruction author if perfect quality still lacks data

## Common Issues and Solutions

| Issue                                 | Solution                                                                    |
| ------------------------------------- | --------------------------------------------------------------------------- |
| Instruction becomes too verbose       | Focus on essential improvements; use surgical edit for minor issues         |
| Quality rubric scores remain low      | Prioritize clarity and determinism over completeness; iterate incrementally |
| Self-check points become repetitive   | Vary the type and focus of self-checks; make them context-specific          |
| Test cases are unrealistic            | Use real project scenarios; involve domain experts for validation           |
| Stop conditions are too restrictive   | Balance safety with usability; provide clear guidance for when to proceed   |
| Normalization creates rigid structure | Allow for flexibility where appropriate; document exceptions clearly        |

## Success Criteria

A successful instruction improvement results in:

1. **Reduced Ambiguity**: Fewer clarification requests during execution
2. **Improved Consistency**: Standardized instruction quality across the system
3. **Better Outcomes**: Higher success rates in instruction execution
4. **Enhanced Maintainability**: Easier updates and modifications
5. **Increased Safety**: Fewer errors and better error handling
6. **Better Testability**: Clear validation criteria and test cases

---

**Last Updated**: 2025-07-25
