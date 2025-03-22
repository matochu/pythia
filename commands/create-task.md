# Command: Create Task Document

> **IMPORTANT**: This command requires active execution of tasks, not just planning. Follow each step in the checklist by actually performing the actions, creating files, updating references, and validating the documentation.
>
> **NOTE ON FILE PATHS**: This document uses paths defined in the project configuration file. Before using this command, ensure you have the latest version of [Configuration](../config.json). There are two important path concepts:
>
> 1. `project_root` - path to the root of the main code project
> 2. `docs_path` - path within the project where documentation is stored
>
> All folder paths in the configuration are relative to the documentation root.

## Purpose

This command provides step-by-step instructions for creating a comprehensive task document that defines actionable work to be done. Task documents serve as the primary unit of work tracking, ensuring clear objectives, measurable success criteria, and proper documentation of implementation details.

## Prerequisites

Before creating a task document, ensure you have:

1. A clear understanding of the work that needs to be done
2. Identified the objectives and deliverables
3. Determined the scope and boundaries of the task
4. Obtained the current date for proper document timestamping
5. Reviewed any related documentation, ideas, or proposals

## Command Checklist

- [ ] Get current date using `date +%Y-%m-%d`
- [ ] Define scope and objectives clearly
- [ ] Break down work into manageable steps
- [ ] Identify dependencies and related tasks
- [ ] Create task file with correct naming convention
- [ ] Fill in all template sections completely
- [ ] Create task tracking checklist with status indicators
- [ ] Add cross-references to related documentation
- [ ] Run documentation validation
- [ ] Generate workflows report
- [ ] Verify all checklist items are complete

## Step 1: Prepare for Task Creation

Before starting, gather all necessary information:

```bash
# Get the current date for proper timestamping
date +%Y-%m-%d

# Read the project configuration to get the tasks directory
CONFIG_PATH="../config.json"
PROJECT_ROOT=$(jq -r '.project_root' $CONFIG_PATH)
DOCS_PATH=$(jq -r '.docs_path' $CONFIG_PATH)
TASKS_FOLDER=$(jq -r '.folders.tasks' $CONFIG_PATH)
TASKS_PATH="$PROJECT_ROOT$DOCS_PATH/$TASKS_FOLDER"

# List existing tasks to avoid duplication
ls -la $TASKS_PATH
```

## Step 2: Create the Task File

Create a new file in the tasks directory (defined in project configuration) using the naming convention:
`task-YYYY-MM-{descriptive-name}.md`

```bash
# Read configuration
CONFIG_PATH="../config.json"
PROJECT_ROOT=$(jq -r '.project_root' $CONFIG_PATH)
DOCS_PATH=$(jq -r '.docs_path' $CONFIG_PATH)
TASKS_FOLDER=$(jq -r '.folders.tasks' $CONFIG_PATH)

# Get current date for filename
CURRENT_DATE=$(date +%Y-%m-%d)
MONTH=${CURRENT_DATE:0:7}

# Create filename using date pattern
TASK_NAME="task-${MONTH}-implement-caching-layer.md"

# Create the file
TASKS_PATH="$PROJECT_ROOT$DOCS_PATH/$TASKS_FOLDER"
touch "$TASKS_PATH/$TASK_NAME"
```

For example, this might create:

- `task-2025-03-implement-caching-layer.md`
- `task-2025-03-refactor-authentication.md`
- `task-2025-03-improve-error-handling.md`

## Step 3: Use the Task Template

```bash
# Get paths from configuration
CONFIG_PATH="../config.json"
PROJECT_ROOT=$(jq -r '.project_root' $CONFIG_PATH)
DOCS_PATH=$(jq -r '.docs_path' $CONFIG_PATH)
TASKS_FOLDER=$(jq -r '.folders.tasks' $CONFIG_PATH)
TEMPLATES_FOLDER=$(jq -r '.folders.templates' $CONFIG_PATH)

# Build full paths
TASKS_PATH="$PROJECT_ROOT$DOCS_PATH/$TASKS_FOLDER"
TEMPLATES_PATH="$PROJECT_ROOT$DOCS_PATH/$TEMPLATES_FOLDER"

# Copy template content
cat "$TEMPLATES_PATH/task-template.md" > "$TASKS_PATH/$TASK_NAME"
```

Then edit the template and fill in all sections:

1. **Title**: Concise, descriptive title of the task
2. **Status Information**: Current status, dates, assignee
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

- [ ] **Step 1: Research and Analysis**

  - [ ] Review existing codebase
  - [ ] Identify areas requiring changes
  - [ ] Document current architecture

- [ ] **Step 2: Design**

  - [ ] Create architecture diagram
  - [ ] Design component interfaces
  - [ ] Get design approved

- [ ] **Step 3: Implementation**

  - [ ] Implement core functionality
  - [ ] Add unit tests
  - [ ] Review code against standards

- [ ] **Step 4: Validation**
  - [ ] Run integration tests
  - [ ] Fix any discovered issues
  - [ ] Document test results
```

## Step 5: Add Cross-References

Add references to related documents at the bottom of the task file. Use the project configuration to ensure correct paths:

```bash
# Get directories from configuration
CONFIG_PATH="../config.json"
PROJECT_ROOT=$(jq -r '.project_root' $CONFIG_PATH)
DOCS_PATH=$(jq -r '.docs_path' $CONFIG_PATH)
PROPOSALS_FOLDER=$(jq -r '.folders.proposals' $CONFIG_PATH)
ARCHITECTURE_FOLDER=$(jq -r '.folders.architecture' $CONFIG_PATH)

# Build full paths
PROPOSALS_PATH="$PROJECT_ROOT$DOCS_PATH/$PROPOSALS_FOLDER"
ARCHITECTURE_PATH="$PROJECT_ROOT$DOCS_PATH/$ARCHITECTURE_FOLDER"
```

Then add references like:

```markdown
## References

- [Related Proposal](${PROPOSALS_PATH}/proposal-topic.md)
- [Technical Analysis](${ARCHITECTURE_PATH}/analysis-topic.md)
```

Ensure that references are bidirectional - update any related documents to reference this new task. Remember to use the configuration-based paths for consistency.

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
# Assuming validation commands are defined in your project
npm run docs:validate-links
npm run docs:check-coverage
```

Fix any issues reported by these tools.

## Examples

### Creating a Basic Task

```bash
# Get the current date
date +%Y-%m-%d
# Output: 2025-03-19

# Get paths from configuration
CONFIG_PATH="../config.json"
PROJECT_ROOT=$(jq -r '.project_root' $CONFIG_PATH)
DOCS_PATH=$(jq -r '.docs_path' $CONFIG_PATH)
TASKS_FOLDER=$(jq -r '.folders.tasks' $CONFIG_PATH)
TASKS_PATH="$PROJECT_ROOT$DOCS_PATH/$TASKS_FOLDER"

# Create the task file
touch "$TASKS_PATH/task-2025-03-implement-form-validation.md"

# Copy the template contents and fill in all sections
# ...

# Break down implementation steps with checkboxes
# Create cross-references to related documents

# Generate workflows report
npm run docs:report-workflows
```

### Creating a Complex Development Task

```bash
# Get paths from configuration
CONFIG_PATH="../config.json"
PROJECT_ROOT=$(jq -r '.project_root' $CONFIG_PATH)
DOCS_PATH=$(jq -r '.docs_path' $CONFIG_PATH)
TASKS_FOLDER=$(jq -r '.folders.tasks' $CONFIG_PATH)
TASKS_PATH="$PROJECT_ROOT$DOCS_PATH/$TASKS_FOLDER"

# Create a comprehensive task document for a major feature
touch "$TASKS_PATH/task-2025-03-implement-offline-mode.md"

# Include additional planning elements:
# - Phased implementation approach with milestones
# - Risk assessment with mitigation strategies
# - Resource and time estimations
# - Technical architecture diagrams
# - Integration points with existing systems

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

## Related Documents

All paths are defined in the project configuration file:

- [Configuration](../config.json)
- [Task Template](task-template.md)
- [Task Management Workflow](task-management-workflow.md)
- [Report Workflows](report-workflows.md)

---

**Last Updated**: 2025-03-19
