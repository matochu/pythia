# Command: Archive Completed Tasks

This guide provides instructions for Large Language Models (LLMs) to identify and archive completed tasks in the project.

## Prerequisites

Before running this command, ensure you have:

1. Read and understood the [Task Archiving Rules](../rules/task-archiving-rules.md)
2. Access to the repository with read and write permissions
3. Identified tasks that may be eligible for archiving

## Command Checklist

Before proceeding with task archiving, complete this checklist:

- [ ] Review Task Archiving Rules
- [ ] Identify completed tasks
- [ ] Verify completion criteria for each task
- [ ] Check task age requirements
- [ ] Create archive copies of tasks
- [ ] Update task status and metadata
- [ ] Add archive notes
- [ ] Update all document references
- [ ] Move tasks in Documentation Map
- [ ] Remove original task files
- [ ] Run documentation validation
- [ ] Fix any validation issues
- [ ] Verify all archives are properly documented

## Command Purpose

The task archiving process helps:

- Keep the active tasks directory focused on ongoing work
- Maintain a historical record of completed tasks
- Ensure documentation references remain valid
- Provide visibility into completed work

## Step 1: Identify Eligible Tasks

```bash
# Find all tasks with "Status: Completed" in the docs/tasks directory
find docs/tasks -type f -name "*.md" -exec grep -l "**Status**: Completed" {} \;
```

This command will list all task files that have their status explicitly set to "Completed".

## Step 2: Verify Archiving Criteria

For each completed task, verify all archiving criteria are met:

1. All success criteria are checked (✅)
2. No exclusion tags are present (no-archive, NO_ARCHIVE)

Optionally, you may also check if:

- The task has been completed for at least 7 days (if using age-based archiving)

Use this command to check the last modified date:

```bash
# Get the last modification date of the task file
stat -f "%Sm" -t "%Y-%m-%d" [task_file_path]
```

## Step 3: Archive the Task

For each eligible task:

1. Create a copy in the archive directory:

```bash
# Create a copy of the task in the archive directory
cp [task_file_path] docs/archive/tasks/
```

2. Modify the archived task file:

```bash
# Add ARCHIVED prefix to the title
sed -i '' '1s/^# /# ARCHIVED: /' docs/archive/tasks/[task_filename]

# Add Archive Date after Date Created
sed -i '' '/\*\*Date Created\*\*:/a\\
**Archive Date**: YYYY-MM-DD  ' docs/archive/tasks/[task_filename]
```

3. Add Archive Note section before References:

```bash
# Add Archive Note section
sed -i '' '/^## References
- [Guide Llm Documentation Workflow](../guides/guide-llm-documentation-workflow.md)
- [Validate Documentation](validate-documentation.md)
- [Documentation Guidelines](../methodology/documentation-guidelines.md)
- [CHANGELOG](../CHANGELOG.md)
/i\\
## Archive Note\
\
This task was archived on YYYY-MM-DD after successful completion of all objectives.\
All references to this task have been updated to point to this archived version.\
\
' docs/archive/tasks/[task_filename]
```

## Step 4: Update References

Use the Link Validator to identify all references to the original task:

```bash
# Find all references to the task
grep -r "\[.*\](.*tasks/[task_filename])" docs/ --include="*.md"
```

For each reference:

1. Update the path to point to the archive location
2. Add "(Archived)" suffix to the link text

Example change:

```diff
- [Task Name](../tasks/task-name.md)
+ [Task Name (Archived)](../archive/tasks/task-name.md)
```

## Step 5: Update Documentation Map

Modify the Documentation Map by:

1. Moving the task from the Tasks section to a new Archived Tasks section (create if needed)
2. Update the link to point to the archived location
3. Add "(Archived)" suffix to the description

## Step 6: Remove Original Task

Once all references are updated:

```bash
# Remove the original task file
rm [task_file_path]
```

## Step 7: Verify Changes

Run documentation validation to ensure all references are correct:

```bash
npm run docs:validate-links
```

Fix any issues with links before completing the process.

## Example Implementation

Here's an example of archiving a completed task:

```bash
# Step 1: Identify completed task
grep -l "**Status**: Completed" docs/workflows/tasks/task-2025-03-documentation-structure.md

# Step 2: Verify last modification date
stat -f "%Sm" -t "%Y-%m-%d" docs/workflows/tasks/task-2025-03-documentation-structure.md
# Output: 2025-03-11 (more than 7 days ago)

# Step 3: Archive the task
cp docs/workflows/tasks/task-2025-03-documentation-structure.md docs/archive/tasks/
sed -i '' '1s/^# /# ARCHIVED: /' docs/workflows/archive/tasks/task-2025-03-documentation-structure.md
sed -i '' '/\*\*Date Created\*\*:/a\\
**Archive Date**: 2025-03-18  ' docs/workflows/archive/tasks/task-2025-03-documentation-structure.md
sed -i '' '/^
```
