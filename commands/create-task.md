# Command: Create Task Document

This guide provides step-by-step instructions for Large Language Models (LLMs) to create a new task document in the project.

## Prerequisites

Before creating a task document, ensure you have:

1. Obtained the current date for proper document timestamping (use `date +%Y-%m-%d` if needed)
2. Understood the core objectives and requirements of the task
3. Reviewed any related existing documentation
4. Identified dependencies and potential risks

## Command Checklist

Before proceeding with the task creation, complete this checklist:

- [ ] Get current date using `date +%Y-%m-%d`
- [ ] Review task objectives and requirements
- [ ] Check existing documentation for similar tasks
- [ ] Identify all stakeholders and dependencies
- [ ] Create task file with correct naming convention
- [ ] Fill in all template sections
- [ ] Add cross-references to related documents
- [ ] Update Documentation Map
- [ ] Update Changelog
- [ ] Run documentation validation
- [ ] Fix any validation issues
- [ ] Verify all checklist items in Step 7

## Step 1: Create the Task File

Create a new file in the `../workflows/tasks/` directory using the naming convention:
`task-YYYY-MM-{topic}.md`

For example:

- `task-2025-04-component-refactoring.md`
- `task-2025-04-performance-optimization.md`

## Step 2: Use the Task Template

Copy the content from the [Task Template](../templates/task-template.md) and fill in all sections:

1. **Title**: Concise, descriptive title of the task
2. **Overview**:

   - Task ID (matching the filename without 'task-' prefix)
   - Date Created (current date)
   - Status (typically "Not Started" for new tasks)
   - Priority (Low, Medium, High)
   - Complexity (Low, Medium, High)
   - Owner (if known)

3. **Context**: Explain why this task is important and what problem it solves
4. **Objectives**: List specific goals using checkboxes `- [ ]` for tracking
5. **Scope**: Define what is in scope and out of scope
6. **Current State Analysis**: Describe the current state of affected components
7. **Technical Approach**: Outline the solution approach
8. **Implementation Plan**: Break down the work into phases with tasks for each phase
9. **Progress Tracking**: Create a table for tracking completion percentages
10. **Risks and Mitigation**: Identify potential risks and strategies to mitigate them
11. **Dependencies**: List any dependencies on other tasks, components or people
12. **Success Criteria**: Define what it means for this task to be complete
13. **References**: Add links to related documents

## Step 3: Add Cross-References

Add references to related documents at the bottom of the task file using the following format:

```markdown
## References

- [Complete Exploration](complete-exploration.md)
- [Guide Llm Documentation Workflow](../guides/guide-llm-documentation-workflow.md)
- [Documentation Map](../navigation/documentation-map.md)
- [Related Document](../path/to/document.md)
```

Ensure that references are bidirectional by checking if related documents should reference this new task.

## Step 4: Update Documentation Map

Update `../navigation/documentation-map.md` to include the new task:

1. Find the appropriate section in the documentation map (Tasks section)
2. Add a new entry with a link to the task document and brief description
3. Follow the existing format and sorting order (typically chronological)

## Step 5: Update Changelog

Add an entry to `../CHANGELOG.md` about the new task document:

1. Under the current date section (or create a new one if needed)
2. Add to the "Added" subsection:
   ```markdown
   - Created task document for [topic] (`../workflows/tasks/task-YYYY-MM-{topic}.md`)
   ```

## Step 6: Check Dependencies

If the task relates to existing:

- Architectural analyses
- Proposals
- Decisions

Consider adding backward references from those documents to this new task document.

## Step 7: Verification Checklist

Before finalizing the task document, verify:

- [ ] All sections of the template are properly filled in
- [ ] The naming convention is followed
- [ ] Cross-references are added
- [ ] The documentation map is updated
- [ ] The changelog is updated
- [ ] No placeholder text remains in the document
- [ ] Dates and status are correctly set

## Step 8: Run Documentation Validation

Run the documentation validation tools to ensure the new document is properly integrated:

```bash
npm run docs:validate-links
npm run docs:check-coverage
```

Fix any issues reported by these tools.

## Example Implementation

Here's a simplified example of filling in a task:

```markdown
# Task: Implement Offline Media Playback

## Overview

**Task ID**: 2025-04-offline-media-playback
**Date Created**: 2025-04-15
**Status**: Not Started
**Priority**: High
**Complexity**: Medium
**Owner**: Media Team

## Context

The platform currently requires an internet connection to play media content.
This task aims to implement offline playback capabilities to improve user experience
in areas with limited connectivity.

## Objectives

- [ ] Design and implement content download manager
- [ ] Create offline media storage strategy
- [ ] Implement download progress indicators
- [ ] Add storage management tools for users
      ...
```

## Related Documents

- [Task Template](../templates/task-template.md)
- [Documentation Guidelines](../methodology/documentation-guidelines.md)
- [Documentation Map](../navigation/documentation-map.md)
- [Changelog](../CHANGELOG.md)

---

**Last Updated**: 2025-03-11
