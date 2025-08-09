# Command: Update Status

> **IMPORTANT**: This command requires modifying workflow documents to reflect current progress. Follow each step precisely to maintain accurate tracking of project activities and ensure all stakeholders have access to up-to-date information.

## Purpose

This command provides a structured process for updating the status of workflow documents (tasks, proposals, ideas, explorations) as they progress through their lifecycle. Consistent status updates ensure accurate progress tracking, enable effective resource allocation, and provide transparency across the project.

## Prerequisites

Before updating the status of a workflow document, ensure:

1. You have reviewed the current state and are aware of actual progress
2. You understand the available status values for the document type
3. You have permissions to modify the relevant files
4. You have any supporting information needed to justify the status change

## Command Checklist

- [ ] Identify the document requiring status update
- [ ] Review the available status values for the document type
- [ ] Make backup of document (optional but recommended)
- [ ] Update the status field in the document
- [ ] Update any related status fields (progress, completion %)
- [ ] Update Last Modified date
- [ ] Add progress notes if applicable
- [ ] Update references to reflect new status
- [ ] Generate workflows report
- [ ] Validate documentation changes

## Step 1: Review Current Status

First, examine the document to understand its current status:

```bash
# View current status of a document
grep -n "**Status**:" ../workflows/tasks/task-YYYY-MM-name.md
```

## Step 2: Determine New Status

Select the appropriate new status based on document type:

**Task Status Values** (canonical):

- Not Started
- In Progress (with optional % complete)
- Under Review
- Blocked (with reason)
- Completed
- Archived (system/automation only)
- Cancelled (with reason)

**Proposal Status Values**:

- Draft
- Under Review
- Approved
- Rejected
- Implemented
- Superseded

**Idea Status Values**:

- New
- Under Consideration
- Accepted
- Rejected
- Implemented

**Exploration Status Values**:

- Planned
- In Progress
- Completed
- Abandoned

## Step 3: Update Status and Related Fields

Open the document and:

1. Update the Status field to the new value
2. Update any related fields (Progress, Completion %)
3. Update the Last Modified date to the current date
4. Add progress notes in the Implementation/Progress section
5. If missing, fill task Overview auxiliary fields to help automation:
   - Repository (repo URL or short name)
   - Branch (e.g., `feature/<slug>`)
   - PR link (when available)
   - LLM Model (current model working on the task)

### Lightweight Gating Guidance

- Moving to "Under Review": ensure Context section is filled and references are valid; checklist in Success Criteria is drafted.
- Moving to "Completed": ensure "AI Solution Analysis Results" section exists and indicates pass; tests are present for new/changed code; coverage meets project target; all Success Criteria are checked.
- Setting "Blocked" or "Cancelled" requires a brief reason.

### Human-Only Checkboxes Convention

- `[LLM]` is the default and can be omitted. Use `[H]` at the end of the line for actions requiring human confirmation (e.g., branch creation, manual prod validation).
- LLM prepares a short note under such items (commands suggested, links to PR/CI, what to verify) but does not tick the box.

```bash
# Get current date for Last Modified update
date +%Y-%m-%d
```

## Step 4: Add Status Change Notes

For significant status changes, add a note in the document's Progress Tracking or Implementation Notes section:

```markdown
## Progress Tracking

**Update YYYY-MM-DD**: Status changed from [old status] to [new status].

- [Brief explanation of progress made]
- [Current challenges or blockers if any]
- [Next steps or required actions]
```

## Step 5: Update References

If necessary, update references in related documents to reflect the new status:

1. For tasks moving to "Completed", consider updating dependent tasks
2. For proposals moving to "Approved", update related tasks or ideas
3. For explorations moving to "Completed", update the original idea or proposal

## Step 6: Generate Workflows Report

Use the `report-workflows` command to update the workflows status report:

1. Follow the instructions in [Report Workflows](report-workflows.md)
2. Ensure the updated document appears with its new status in the report
3. Verify that all metrics and counts reflect the status change

## Step 7: Validate Documentation

Run documentation validation to ensure all references remain valid:

```bash
# If validation tools are available
npm run docs:validate-links
```

Fix any issues reported by the tools.

## Examples

### Updating a Task to In Progress

```bash
# View current task status
grep -n "**Status**:" ../workflows/tasks/task-2025-03-refactor-component.md
# Output: 7:**Status**: Not Started

# Edit the file to update status
# Change "Not Started" to "In Progress" and update Last Modified date
# Add progress notes in the Implementation section

# Generate workflows report
npm run docs:report-workflows
```

### Updating a Proposal to Approved

```bash
# Get current date
date +%Y-%m-%d
# Output: 2025-03-19

# Edit proposal file
# - Change status from "Under Review" to "Approved"
# - Update Last Modified date to 2025-03-19
# - Add approval notes with any conditions or modifications

# Update related documents
# - Update any tasks that were waiting on this approval
# - Update any ideas that led to this proposal

# Generate workflows report
npm run docs:report-workflows
```

### Marking a Task as Blocked

```bash
# Edit task file
# - Change status from "In Progress" to "Blocked"
# - Add blocking reason: "Blocked: Waiting for API documentation from external team"
# - Update Last Modified date
# - Add note in Progress Tracking section

# Generate workflows report to highlight the blocked item
npm run docs:report-workflows
```

## Common Issues and Solutions

1. **Inconsistent Status Values**:

   - Issue: Using status values that don't match the established taxonomy
   - Solution: Refer to the status values list in Step 2 for the correct terminology

2. **Missing Status Update Context**:

   - Issue: Changing status without explanatory notes
   - Solution: Always add progress notes explaining why the status changed

3. **Orphaned References**:

   - Issue: Related documents not updated to reflect status changes
   - Solution: Use grep to find all references and update them systematically

4. **Outdated Last Modified Date**:

   - Issue: Forgetting to update the Last Modified date when changing status
   - Solution: Always update the Last Modified date to the current date

5. **Incorrect Status Progression**:
   - Issue: Skipping logical status steps (e.g., from "Not Started" directly to "Completed")
   - Solution: Follow the natural progression of statuses unless there's a valid reason to skip

## Related Documents

- [Task Template](../templates/task-template.md)
- [Proposal Template](../templates/proposal-template.md)
- [Idea Template](../templates/idea-template.md)
- [Report Workflows](report-workflows.md)

---

**Last Updated**: 2025-03-19
