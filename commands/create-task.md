# Command: Create Task Document

> **IMPORTANT**: This command requires active execution of tasks, not just planning. Follow each step in the checklist by actually performing the actions, creating files, updating references, and validating the documentation.
>
> **NOTE ON FILE PATHS**: This command adapts to your project's documentation structure. It will create tasks in your project's `docs/workflows/tasks/` directory or equivalent.

## Purpose

This command provides step-by-step instructions for creating a comprehensive task document that defines actionable work to be done. Task documents serve as the primary unit of work tracking, ensuring clear objectives, measurable success criteria, and proper documentation of implementation details.

## Prerequisites

Before creating a task document, ensure you have:

1. [ ] A clear understanding of the work that needs to be done
2. [ ] Identified the objectives and deliverables
3. [ ] Determined the scope and boundaries of the task
4. [ ] Obtained the current date for proper document timestamping
5. [ ] Reviewed any related documentation, ideas, or proposals
6. [ ] Validated the task uniqueness against existing documentation
7. [ ] Prepared metadata for proper categorization
8. [ ] Prepared to write the task in English (all documentation must be in English)

## Workspace Usage

This command can be used in any project workspace:

```bash
# Reference the command
@create-task.md

# Execute with project context
Execute this command for my project at [project-path]

# Example usage
@create-task.md
Context: My application needs user authentication
Objective: Implement secure login/logout functionality
Priority: High
Timeline: 2 weeks
```

## Command Checklist

- [ ] Get current date using `date +%Y-%m-%d`
- [ ] Validate task uniqueness against existing documentation
- [ ] Define scope and objectives clearly
- [ ] Break down work into manageable steps
- [ ] Identify dependencies and related tasks
- [ ] Create task file with correct naming convention
- [ ] Fill in all template sections completely
- [ ] Create task tracking checklist with status indicators
- [ ] Add cross-references to related documentation
- [ ] Run documentation validation
- [ ] Generate workflows report
- [ ] Perform self-review using the Self-Validation Checklist
- [ ] Verify all checklist items are complete

## Step 1: Prepare for Task Creation

Before starting, gather all necessary information:

```bash
# Get the current date for proper timestamping
date +%Y-%m-%d

# Determine tasks directory based on project structure
# For standard Pythia structure: docs/workflows/tasks/
# For custom structure: adapt to your project's documentation layout
TASKS_PATH="docs/workflows/tasks"

# Create directory if it doesn't exist
mkdir -p "$TASKS_PATH"

# List existing tasks to avoid duplication
ls -la "$TASKS_PATH"

# Check Memory Bank for relevant context (if available)
if [ -d ".memory-bank" ]; then
    echo "Checking Memory Bank for related context..."
    # Search for related patterns
    find .memory-bank/patterns -name "*.md" -exec grep -l "keyword" {} \; 2>/dev/null || echo "No related patterns found"
    # Review recent sessions
    find .memory-bank/sessions -name "*.md" -mtime -7 -exec basename {} \; 2>/dev/null || echo "No recent sessions found"
fi

# Search for similar tasks - basic keyword search
grep -r "keyword" "$TASKS_PATH"

# Search for relevant context documents
CONTEXTS_PATH="docs/contexts"
find "$CONTEXTS_PATH" -type f -name "*.md" -exec grep -l "keyword" {} \;
```

### Enhanced Search Methods

For more effective task discovery to prevent duplication and identify related work:

```bash
# Search by topic across all tasks
find "$TASKS_PATH" -type f -name "*.md" -exec grep -l "search term" {} \;

# Search by feature area
grep -r --include="*feature-name*.md" "" "$TASKS_PATH"

# Find recent tasks in a specific area
find "$TASKS_PATH" -type f -name "*feature-name*.md" -mtime -30 | sort

# Search in both task title and content
find "$TASKS_PATH" -type f -name "*.md" -exec sh -c 'grep -l "term" {} && grep -l "another term" {}' \;

# Check for tasks with similar dependencies
grep -r --include="*.md" "dependency-name" "$TASKS_PATH"
```

Consider using more advanced search tools if available, such as:

```bash
# Using ripgrep for faster searching with context
rg -C 2 "search term" "$TASKS_PATH"

# Using fzf for interactive filtering of tasks
find "$TASKS_PATH" -type f -name "*.md" | fzf --preview "cat {}"
```

## Step 2: Create the Task File

Create a new file in the tasks directory using the naming convention:
`task-YYYY-MM-{descriptive-name}.md`

```bash
# Determine tasks directory based on project structure
TASKS_PATH="docs/workflows/tasks"

# Create new task file
TASK_NAME="implement-feature"
CURRENT_DATE=$(date +%Y-%m)
TASK_FILE="$TASKS_PATH/task-$CURRENT_DATE-$TASK_NAME.md"
touch "$TASK_FILE"
```

For example:

- `task-2025-03-implement-caching-layer.md`
- `task-2025-03-refactor-authentication.md`
- `task-2025-03-improve-error-handling.md`

### Context Document Integration

Before creating the task, review relevant context documents:

```bash
# Search for relevant context documents
CONTEXTS_PATH="docs/contexts"
find "$CONTEXTS_PATH" -type f -name "*.md" -exec grep -l "feature-name" {} \;

# Review context documents for insights
cat "$CONTEXTS_PATH/domain/context-YYYY-MM-topic.md"

# Extract key insights for task creation
grep -A 5 -B 5 "key-term" "$CONTEXTS_PATH/domain/context-YYYY-MM-topic.md"
```

Context documents should inform:

- Task scope and objectives
- Risk assessment and mitigation strategies
- Success criteria definition
- Technical approach and constraints

### Memory Bank Integration

If Memory Bank is available, check for relevant context:

```bash
# Check Memory Bank for related patterns and insights
if [ -d ".memory-bank" ]; then
    echo "Checking Memory Bank for relevant context..."

    # Search for related patterns
    find .memory-bank/patterns -name "*.md" -exec grep -l "keyword" {} \; 2>/dev/null || echo "No related patterns found"

    # Review recent sessions for similar work
    find .memory-bank/sessions -name "*.md" -mtime -7 -exec basename {} \; 2>/dev/null || echo "No recent sessions found"

    # Check for relevant decisions
    find .memory-bank/decisions -name "*.md" -exec grep -l "decision-keyword" {} \; 2>/dev/null || echo "No related decisions found"
fi
```

Memory Bank insights should inform:

- Previous architectural decisions and their rationale
- Reusable patterns from similar tasks
- Cross-task learnings and constraints
- Historical context for current task

## Step 3: Use the Task Template

Copy the content from the [Task Template](mdc:templates/task-template.md) and fill in all sections:

1. **Metadata**:
   - Creation Date
   - Last Updated
   - Status
   - Type
   - Priority
   - Complexity
2. **Title**: Concise, descriptive title of the task
3. **Summary**: Brief overview of what needs to be done
4. **Objectives**: Clear list of what this task aims to accomplish
5. **Context**: Background information and why this task is needed
   - **Context Documents**: Reference relevant context documents
   - **Context Analysis**: Key insights from context documents
6. **Scope**: What is in-scope and out-of-scope for this task
7. **Approach**: How the task will be implemented
8. **Steps**: Detailed breakdown of implementation steps with checkboxes
9. **Success Criteria**: Clear measures for determining when the task is complete
10. **Dependencies**: Other tasks or components this task depends on
11. **References**: Links to related documents and context documents

Ensure that every section is filled in with detailed information.

## Step 4: Create Implementation Steps

Break down the implementation into clear, manageable steps with checkboxes:

```markdown
## Implementation Steps

- [ ] **Phase 1: Research and Analysis**

  - [ ] Review existing codebase
  - [ ] Identify areas requiring changes
  - [ ] Document current architecture

- [ ] **Phase 2: Design**

  - [ ] Create architecture diagram
  - [ ] Design component interfaces
  - [ ] Get design approved

- [ ] **Phase 3: Implementation**

  - [ ] Implement core functionality
  - [ ] Add unit tests
  - [ ] Review code against standards

- [ ] **Phase 4: Validation**
  - [ ] Run integration tests
  - [ ] Fix any discovered issues
  - [ ] Document test results
```

## Step 5: Add Cross-References

Add references to related documents at the bottom of the task file:

```markdown
## References

- [Related Context Documents](mdc:docs/contexts/domain/context-YYYY-MM-topic.md)
- [Similar Task](mdc:docs/workflows/tasks/task-YYYY-MM-related.md)
- [Relevant Documentation](mdc:docs/documentation/topic.md)

## Status History

| Date       | Status    | Notes                   |
| ---------- | --------- | ----------------------- |
| YYYY-MM-DD | New       | Initial creation        |
| YYYY-MM-DD | In Review | Team discussion planned |
```

Ensure that references are bidirectional - update any related documents to reference this new task.

## Step 6: Generate Workflows Report

Use the `@report-workflows.md` command to update the workflows status report:

```bash
# Reference the command
@report-workflows.md

# Execute with project context
Execute this command for my project at [project-path]
```

This step ensures that the new task is properly tracked in the overall project workflow.

## Step 7: Validation and Verification

Run the documentation validation tools to ensure the new document is properly integrated:

```bash
# Validate task uniqueness
npm run docs:validate-uniqueness

# Validate documentation links
npm run docs:validate-links

# Check documentation coverage
npm run docs:check-coverage

# Validate metadata format
npm run docs:validate-metadata
```

Fix any issues reported by these tools.

### Self-Validation Checklist

Before finalizing the task document, verify that it meets these quality criteria:

- [ ] **Language Check**: Document is written entirely in English with clear, professional language
  - [ ] Verify all section headings are in English
  - [ ] Verify all descriptive content is in English
  - [ ] Check that no non-English terms remain in the document
  - [ ] Review automatically translated content for accuracy if applicable
- [ ] **Completeness**: All required sections are filled with meaningful content
- [ ] **Scope Clarity**: Clear boundaries between what is in-scope and out-of-scope
- [ ] **Actionable Steps**: Implementation steps are specific and actionable
- [ ] **Success Criteria**: Success criteria are measurable and objective
- [ ] **Dependencies**: All dependencies are identified with links to relevant documentation
- [ ] **Risk Assessment**: Potential risks and mitigations are documented
- [ ] **Consistency**: Task aligns with existing project standards and approaches
- [ ] **Formatting**: Document uses consistent Markdown formatting
- [ ] **Grammar and Spelling**: Document is free of typos and grammatical errors
- [ ] **Context Integration**: Task properly references and utilizes context documents
  - [ ] Relevant context documents are identified and linked
  - [ ] Context analysis informs task objectives and approach
  - [ ] Context insights are reflected in risk assessment and success criteria

Use tools to assist with validation:

```bash
# Check grammar and spelling (if aspell is available)
aspell --lang=en_US --mode=markdown check "$TASK_FILE"

# Check Markdown formatting consistency
npx markdownlint "$TASK_FILE"

# Validate task against template structure
npx task-validator "$TASK_FILE"
```

## Examples

### Creating a Basic Task

```bash
# Get the current date
date +%Y-%m-%d
# Output: 2025-03-24

# Determine tasks directory based on project structure
# For standard Pythia structure: docs/workflows/tasks/
# For custom structure: adapt to your project's documentation layout
TASKS_PATH="docs/workflows/tasks"

# Create the task file
TASK_FILE="$TASKS_PATH/task-2025-03-implement-form-validation.md"
touch "$TASK_FILE"

# Prepare metadata
cat << EOF > task-metadata.yaml
---
title: Form Validation Implementation
created: 2025-03-24
status: New
type: Feature
priority: High
complexity: Medium
---
EOF

# Copy metadata and template contents
cat task-metadata.yaml > "$TASK_FILE"
rm task-metadata.yaml

# Fill in all sections
# Generate workflows report
npm run docs:report-workflows
```

### Creating a Complex Development Task

```bash
# Determine tasks directory based on project structure
# For standard Pythia structure: docs/workflows/tasks/
# For custom structure: adapt to your project's documentation layout
TASKS_PATH="docs/workflows/tasks"

# Create comprehensive task with supporting research
TASK_FILE="$TASKS_PATH/task-2025-03-implement-offline-mode.md"
touch "$TASK_FILE"

# Include additional sections:
# - Technical architecture diagrams
# - Risk assessment
# - Performance considerations
# - Security implications
# - Testing strategy

# Generate workflows report
npm run docs:report-workflows
```

## Common Issues and Solutions

1. **Vague Objectives**:

   - Issue: Task objectives are too general or difficult to measure
   - Solution: Make objectives specific, measurable, and clearly define the end state

2. **Missing Implementation Steps**:

   - Issue: Steps are too high-level without actionable details
   - Solution: Break down steps into smaller, concrete actions with clear completion criteria

3. **Unbounded Scope**:

   - Issue: Scope keeps expanding without clear boundaries
   - Solution: Explicitly define what is in-scope and out-of-scope, and be specific about limitations

4. **Inadequate Success Criteria**:

   - Issue: Success criteria are subjective or unmeasurable
   - Solution: Define specific, observable outcomes that can be verified objectively

5. **Missing Dependencies**:

   - Issue: Dependencies on other tasks or systems are not identified
   - Solution: Review the task in the context of the broader system and explicitly list all dependencies

6. **Incomplete Metadata**:

   - Issue: Required metadata fields are missing or incomplete
   - Solution: Use metadata template and validation tools to ensure all required fields are present

7. **Poor Categorization**:

   - Issue: Task is not properly categorized or tagged
   - Solution: Review existing categories and tags, ensure consistent categorization

8. **Non-English Content**:

   - Issue: Task document contains non-English content
   - Solution: Translate all content to English, including comments and metadata
   - Validation: Use language detection tools to verify content is in English

9. **Duplicated Task Objectives**:
   - Issue: Task duplicates objectives from existing tasks
   - Solution: Use the enhanced search methods to find similar tasks and either merge or clearly differentiate

## Self-Check Points

Before completing this command, verify:

- [ ] **Task Uniqueness**: No duplicate tasks exist with similar objectives
- [ ] **Clear Objectives**: Task has specific, measurable objectives
- [ ] **Complete Metadata**: All required fields are filled (title, priority, complexity, etc.)
- [ ] **Proper Categorization**: Task is correctly categorized and tagged
- [ ] **Dependencies Identified**: All dependencies are listed and validated
- [ ] **Success Criteria**: Clear, measurable success criteria are defined
- [ ] **Implementation Steps**: Steps are actionable and have clear completion criteria
- [ ] **Cross-References**: All related documents are properly linked
- [ ] **English Content**: All content is in English
- [ ] **File Naming**: Task file follows naming convention `task-YYYY-MM-topic.md`

## Integration Guidelines

This command integrates with other Pythia components:

### Related Commands

- **`@create-proposal.md`** - For complex tasks requiring proposals first
- **`@create-idea.md`** - For tasks originating from ideas
- **`@report-workflows.md`** - To generate workflow status reports
- **`@validate-documentation.md`** - To validate task documentation

### Template Integration

- Uses `templates/task-template.md` for consistent structure
- Follows metadata standards for proper categorization
- Integrates with workflow reporting system

### Methodology Integration

- **Implementation Approach**: For complex tasks, consider using the four-phase implementation framework:
  - **Phase 1 (R&D)**: Research alternatives, build proof-of-concepts, evaluate risks
  - **Phase 2 (Preparation)**: Refactor codebase, establish patterns, create supporting tools
  - **Phase 3 (Full Integration)**: Implement changes incrementally with thorough testing
  - **Phase 4 (Optimization)**: Optimize performance and add extended functionality
- **Context Documentation**: For tasks requiring deep domain knowledge, reference relevant context documents
- **Prioritization Methods**: Use prioritization frameworks for task sequencing and resource allocation

### Workspace Integration

- **Standard Structure**: Creates tasks in `docs/workflows/tasks/`
- **Custom Structure**: Adapts to your project's documentation layout
- **Cross-References**: Uses `mdc:` links for workspace navigation
- **Command Usage**: Reference with `@create-task.md` in your workspace

## Related Documents

- [Task Template](mdc:templates/task-template.md)
- [Report Workflows](mdc:commands/report-workflows.md)
- [Workspace Integration Guide](mdc:guides/workspace-integration.md)

---

**Last Updated**: 2025-03-29
