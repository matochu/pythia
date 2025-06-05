# Command: Create Task Document

> **IMPORTANT**: This command requires active execution of tasks, not just planning. Follow each step in the checklist by actually performing the actions, creating files, updating references, and validating the documentation.
>
> **NOTE ON FILE PATHS**: This document uses paths defined in the project configuration file. Before using this command, ensure you have the latest version of [Configuration](../config.json).

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

# Read configuration to access paths
CONFIG_PATH="../config.json"
TASKS_PATH=$(jq -r '.paths.tasks' $CONFIG_PATH)

# List existing tasks to avoid duplication
ls -la "$TASKS_PATH"

# Search for similar tasks - basic keyword search
grep -r "keyword" "$TASKS_PATH"
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

Create a new file in the tasks directory (path from config.json) using the naming convention:
`task-YYYY-MM-{descriptive-name}.md`

```bash
# Read configuration
CONFIG_PATH="../config.json"
TASKS_PATH=$(jq -r '.paths.tasks' $CONFIG_PATH)

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

## Step 3: Use the Task Template

Copy the content from the [Task Template](../templates/task-template.md) and fill in all sections:

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
6. **Scope**: What is in-scope and out-of-scope for this task
7. **Approach**: How the task will be implemented
8. **Steps**: Detailed breakdown of implementation steps with checkboxes
9. **Success Criteria**: Clear measures for determining when the task is complete
10. **Dependencies**: Other tasks or components this task depends on
11. **References**: Links to related documents

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

- [Related Analysis](../architecture/analysis-topic.md)
- [Similar Task](../tasks/task-YYYY-MM-related.md)
- [Relevant Documentation](../documentation/topic.md)

## Status History

| Date       | Status    | Notes                   |
| ---------- | --------- | ----------------------- |
| YYYY-MM-DD | New       | Initial creation        |
| YYYY-MM-DD | In Review | Team discussion planned |
```

Ensure that references are bidirectional - update any related documents to reference this new task.

## Step 6: Generate Workflows Report

Use the `report-workflows` command to update the workflows status report:

```bash
# Assuming the report command is defined in your project
npm run docs:report-workflows
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

# Read configuration
CONFIG_PATH="../config.json"
TASKS_PATH=$(jq -r '.paths.tasks' $CONFIG_PATH)

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
# Read configuration
CONFIG_PATH="../config.json"
TASKS_PATH=$(jq -r '.paths.tasks' $CONFIG_PATH)

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

## Related Documents

- [Task Template](../templates/task-template.md)
- [Task Management Workflow](task-management-workflow.md)
- [Report Workflows](report-workflows.md)
- [Configuration](../config.json)

---

**Last Updated**: 2025-03-29
