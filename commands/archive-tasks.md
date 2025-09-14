# Command: Archive Tasks

> **IMPORTANT**: This command involves moving completed task documents to the archive. Execute each step carefully to maintain documentation integrity and ensure all references and reports are properly updated.

## Purpose

This command provides a structured process for archiving completed task documents, ensuring they are properly preserved for historical reference while keeping the active tasks directory clean and focused. Archiving completed tasks helps maintain an organized workflow repository and provides valuable historical context for future reference.

## Prerequisites

Before archiving a task, ensure:

1. The task is genuinely complete (all objectives met, all success criteria satisfied)
2. All implementation steps are checked off
3. The task's status is marked as "Completed" in the document
4. Any dependencies on this task have been resolved or updated

## Workspace Usage

This command can be used in any project workspace:

```bash
# Reference the command
@archive-tasks.md

# Execute with project context
Execute this command for my project at [project-path]

# Example usage
@archive-tasks.md
Context: My project has completed tasks that need archiving
Focus: Move completed tasks to archive, update references
Requirements: Maintain documentation integrity and update reports
```

## Command Checklist

- [ ] Verify task is complete and status is marked as "Completed"
- [ ] Create the archive directory if it doesn't exist
- [ ] Move the task file to the archive location
- [ ] Update cross-references in related documents
- [ ] Generate updated workflows report
- [ ] Validate all links and references
- [ ] Verify the task no longer appears in active tasks list

## Step 1: Verify Task Completion

Before archiving, ensure the task is genuinely complete:

```bash
# Open the task document to verify completion
# For standard Pythia structure: .pythia/workflows/tasks/
# For custom structure: adapt to your project's documentation layout
cat .pythia/workflows/tasks/task-YYYY-MM-task-name.md | grep "Status"
```

Confirm the status is "Completed" and all implementation steps are checked.

## Step 2: Create Archive Directory (if needed)

Ensure the archive directory exists:

```bash
# Check if archive directory exists
# For standard Pythia structure: .pythia/workflows/archive/tasks/
# For custom structure: adapt to your project's documentation layout
ls -la .pythia/workflows/archive/tasks/

# If it doesn't exist, create it
mkdir -p .pythia/workflows/archive/tasks/
```

## Step 3: Move Task to Archive

Move the completed task to the archive:

```bash
# Move the task file to the archive
mv .pythia/workflows/tasks/task-YYYY-MM-task-name.md .pythia/workflows/archive/tasks/
```

## Step 4: Update Cross-References

Update all documents that reference the archived task:

1. Search for references to the task using:

   ```bash
   grep -r "task-YYYY-MM-task-name.md" .pythia/
   ```

2. For each reference found, update the link to point to the archived location:
   - From: `.pythia/workflows/tasks/task-YYYY-MM-task-name.md`
   - To: `.pythia/workflows/archive/tasks/task-YYYY-MM-task-name.md`

## Step 5: Generate Workflows Report

Update the workflows report to reflect the task archival:

1. Follow the instructions in [Report Workflows](mdc:commands/report-workflows.md)
2. Ensure the task is properly moved from "Active Tasks" to "Archived Tasks" in the report
3. Verify the work item summary counts are updated correctly

## Step 6: Validate Links

Run documentation validation to ensure all links remain valid:

```bash
# If validation tools are available
npm run docs:validate-links
```

Fix any issues reported by the tool.

## Examples

### Archiving a Single Task

```bash
# Verify task completion status
cat .pythia/workflows/tasks/task-2025-03-refactor-api-endpoints.md | grep "Status"
# Output: **Status**: Completed

# Move the task to the archive
mv .pythia/workflows/tasks/task-2025-03-refactor-api-endpoints.md .pythia/workflows/archive/tasks/

# Update cross-references (after finding them with grep)
# Edit each file that references this task to point to the archive location

# Generate workflows report
npm run docs:report-workflows
```

### Archiving Multiple Tasks in Batch

```bash
# Create a list of completed tasks
grep -r "Status.*Completed" .pythia/workflows/tasks/ --include="*.md" > completed_tasks.txt

# Process each completed task
while read -r task; do
  task_file=$(echo "$task" | cut -d':' -f1)
  echo "Archiving $task_file"

  # Move to archive
  mv "$task_file" .pythia/workflows/archive/tasks/

  # Find and update references (would need manual editing)
  task_name=$(basename "$task_file")
  grep -r "$task_name" ../ --include="*.md"
done < completed_tasks.txt

# Clean up
rm completed_tasks.txt

# Generate workflows report
npm run docs:report-workflows
```

## Common Issues and Solutions

1. **Missing Archive Directory**:

   - Issue: Archive directory doesn't exist, causing move operation to fail
   - Solution: Create the directory structure with `mkdir -p .pythia/workflows/archive/tasks/`

2. **Broken References**:

   - Issue: References to archived tasks not updated, leading to broken links
   - Solution: Use grep to find all references and systematically update them

3. **Task Not Ready for Archive**:

   - Issue: Attempting to archive a task that's not fully completed
   - Solution: Verify all checkboxes are marked and status is explicitly set to "Completed"

4. **Premature Archival**:

   - Issue: Archiving a task that still has dependent tasks in progress
   - Solution: Check all dependencies and related tasks before archiving

5. **Missing from Archived Tasks Report**:
   - Issue: Archived task not appearing in the archived section of the report
   - Solution: Run `report-workflows` to refresh the report with current archive status

## Related Documents

- [Task Template](mdc:templates/task-template.md)
- [Create Task](mdc:commands/create-task.md)
- [Report Workflows](mdc:commands/report-workflows.md)

## Workspace Integration Notes

This command is designed for workspace integration and adapts to your project's structure:

- **Task Archiving**: Works with any project's documentation structure
- **Archive Management**: Maintains organized task history for your project
- **Cross-References**: Uses `mdc:` links for workspace navigation
- **Command Usage**: Reference with `@archive-tasks.md` in your workspace

---

**Last Updated**: 2025-03-19
