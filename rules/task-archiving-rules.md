# Task Archiving Rules

## Overview

This document outlines the rules and procedures for archiving completed tasks in the project. Proper task archiving helps maintain a clean and efficient documentation structure while preserving the history of completed work.

## Archiving Criteria

Tasks should be archived when they meet the following criteria:

1. The task's Status is explicitly marked as "Completed"
2. All success criteria are met and marked with checkmarks (✅)

Additional optional criteria:

- The task has been in "Completed" status for at least 7 days (when using age-based archiving)

## Archiving Process

### Location

Archived tasks are stored in the `workflows/archive/tasks/` directory, maintaining their original filename.

### File Modifications

When archiving a task:

1. Add an "ARCHIVED" prefix to the title
2. Add an "Archive Date" field under the Date Created field
3. Add an "Archive Note" section at the end of the document, before References
4. Preserve all original content, including completion dates and notes

### References

- [Report Workflows](../commands/report-workflows.md)
- [Documentation Guidelines](../methodology/documentation-guidelines.md)
- [Task Template](../templates/task-template.md)
- [Update Documentation Map](../commands/update-documentation-map.md)
  Update

When a task is archived:

1. Update all references to the task in other documents to point to the new location
2. Add an "(Archived)" suffix to the link text in other documents
3. Update the Documentation Map to move the task from the Tasks section to the Archived Tasks section

## Automated Archiving

The `archive-tasks` command is used to:

1. Identify tasks eligible for archiving
2. Move them to the archive directory
3. Make necessary modifications to the task files
4. Update references in other documents

### Archiving Options

The automated archiving script supports several options:

- Default: Archive all completed tasks with verified success criteria

  ```bash
  ts-node scripts/documentation/archiveTasks.ts
  ```

- Age-based: Only archive tasks completed for at least 7 days

  ```bash
  ts-node scripts/documentation/archiveTasks.ts --check-age
  ```

- Force: Archive tasks even if they don't meet all criteria

  ```bash
  ts-node scripts/documentation/archiveTasks.ts --force
  ```

- Dry Run: Show what would be archived without making changes
  ```bash
  ts-node scripts/documentation/archiveTasks.ts --dry-run
  ```

## Manual Archiving

For manual archiving, follow these steps:

1. Verify the task meets all archiving criteria
2. Create a copy of the task in the `workflows/archive/tasks/` directory
3. Make the required modifications to the archived file
4. Remove the original file from `workflows/tasks/`
5. Update all references to the task

## Exclusions

Some tasks may be excluded from archiving if they:

1. Represent ongoing processes that cycle between active and completed states
2. Serve as templates or examples
3. Are specifically tagged with a `no-archive` tag in their content

## Archive Maintenance

The task archive should be periodically reviewed to:

1. Ensure all archived tasks conform to the archiving standards
2. Remove or consolidate outdated tasks (older than 1 year)
3. Validate that all references to archived tasks are correct
