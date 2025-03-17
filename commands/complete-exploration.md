# Command: Complete Exploration Document

This guide provides step-by-step instructions for completing an exploration document and determining the next steps in the workflow.

## Prerequisites

Before completing an exploration document, ensure:

1. All research questions have been answered with clear conclusions
2. All required sections of the exploration template are filled
3. The document has been reviewed for completeness and accuracy

## Command Checklist

Before proceeding with exploration completion, complete this checklist:

- [ ] Review all research questions and findings
- [ ] Update status indicators for all questions
- [ ] Ensure all conclusions are documented
- [ ] Add final recommendations
- [ ] Update document status to completed
- [ ] Update Last Update date
- [ ] Update related idea document
- [ ] Update ideas backlog
- [ ] Add Path Forward section
- [ ] Create next document (proposal or task)
- [ ] Update Changelog
- [ ] Run documentation validation
- [ ] Fix any validation issues
- [ ] Verify all sections are complete

## Step 1: Review and Finalize the Exploration

1. Review the document for completeness
2. Update the status indicators (✅) for all answered questions
3. Ensure all conclusions are clearly stated
4. Add final recommendations based on research findings

## Step 2: Update Document Status

1. Change the status in the Executive Summary and General Information from "in progress" to "completed"
2. Update the "Last Update" date to the current date
3. Add any final notes or clarifications

## Step 3: Update Related Documents

1. Update the related idea document:

   - Mark completed items in the "Required Research" section
   - Update the "Last Update" date
   - Ensure the link to the exploration document exists

2. Update ideas-backlog.md:

   - Change the status of the idea if needed
   - Ensure the idea appears in the "Recently Updated Ideas" section

3. Update CHANGELOG.md:
   - Add an entry about the completed exploration

## Step 4: Determine Next Steps

Based on the exploration results, determine the appropriate next step:

### Option A: Create a Formal Proposal (for complex tasks)

If the task:

- Has significant architectural implications
- Requires substantial development effort (>3 days)
- Impacts multiple components
- Has high risk or uncertainty

→ Proceed to creating a formal proposal using the proposal template

### Option B: Create a Task Directly (for simpler tasks)

If the task:

- Has clear, unambiguous implementation requirements
- Requires minimal development effort (1-2 days)
- Has low risk and minimal impact on existing architecture
- Already has detailed implementation examples in the exploration

→ Skip the proposal stage and create a task document directly

## Step 5: Document the Decision

Add a new section to the exploration document (after General Conclusions) titled "Path Forward":

```markdown
## Path Forward

Based on the assessment of complexity, scope, and risk, we have determined that this task:

- [Choose one]
  - Requires a formal proposal due to [list reasons]
  - Can proceed directly to task creation due to [list reasons]

### Next Steps

- [For formal proposal path]
  - [ ] Create proposal document
  - [ ] Review with stakeholders
  - [ ] Proceed with architectural decision
- [For direct to task path]
  - [ ] Create task document(s)
  - [ ] Assign implementation resources
  - [ ] Begin implementation
```

## Decision Criteria Checklist

Use this checklist to objectively evaluate whether to proceed with a formal proposal or go directly to a task. The more "Yes" answers in the "Direct to Task" column, the stronger the case for skipping the proposal stage.

| Criteria                                                   | Direct to Task? | Needs Proposal? |
| ---------------------------------------------------------- | --------------- | --------------- |
| **Scope and Complexity**                                   |                 |                 |
| Implementation can be completed in 1-3 days                | Yes □           | No □            |
| Solution approach is clearly defined with few alternatives | Yes □           | No □            |
| No significant technical unknowns remain                   | Yes □           | No □            |
| **Architectural Impact**                                   |                 |                 |
| Changes are localized to a single component/module         | Yes □           | No □            |
| No changes to public APIs or interfaces                    | Yes □           | No □            |
| No database schema changes                                 | Yes □           | No □            |
| **Risk Assessment**                                        |                 |                 |
| Low risk of regression or side effects                     | Yes □           | No □            |
| Straightforward rollback plan exists                       | Yes □           | No □            |
| Changes don't affect critical system paths                 | Yes □           | No □            |
| **Implementation Clarity**                                 |                 |                 |
| Exploration includes concrete code examples                | Yes □           | No □            |
| Implementation steps are clearly defined                   | Yes □           | No □            |
| No design decisions remain open                            | Yes □           | No □            |
| **Stakeholder Alignment**                                  |                 |                 |
| No cross-team coordination required                        | Yes □           | No □            |
| No additional stakeholder approvals needed                 | Yes □           | No □            |
| Team has consensus on implementation approach              | Yes □           | No □            |

**Scoring Guide**:

- 12-15 "Yes" answers: Strong candidate for direct task creation
- 8-11 "Yes" answers: Consider task creation with additional documentation
- 0-7 "Yes" answers: Formal proposal recommended

Include this assessment in the "Path Forward" section to provide objective justification for your decision.

## Step 6: Create the Next Document

Based on the decision in Step 4, create either:

- A proposal document: `../workflows/proposals/proposal-{topic}.md` using the [Create Proposal](./create-proposal.md) instructions
- A task document: `../workflows/tasks/task-YYYY-MM-{topic}.md` using the [Create Task](./create-task.md) instructions

The decision on which path to take is ultimately made by the user or team lead, with the exploration document providing a recommendation based on the research findings.

## Example Implementation

Here's an example of a Path Forward section for a simple task:

```markdown
## Path Forward

Based on the assessment of complexity, scope, and risk, we have determined that this task:

- Can proceed directly to task creation due to:
  - Clear implementation requirements fully described in this exploration
  - Low implementation complexity (estimated 1-2 days of work)
  - Minimal impact on existing architecture
  - Low risk with clear rollback options
  - Availability of detailed implementation examples in this document

### Next Steps

- [ ] Create task document `task-2025-03-vite-config-version-injection.md`
- [ ] Implement version injection in Vite configuration
- [ ] Update index.html to use injected version
- [ ] Configure CI/CD pipeline to support dynamic versions
- [ ] Test in development and production environments
```

## Verification Checklist

- [ ] Exploration document is complete with all sections filled
- [ ] Status indicators updated for all questions and findings
- [ ] Related idea document updated
- [ ] Ideas backlog updated
- [ ] Changelog updated
- [ ] Path Forward section added with clear decision
- [ ] Next document (proposal or task) created from template

## Related Documents

- [Exploration Template](../templates/exploration-template.md)
- [Ideas to Proposals Workflow](../methodology/ideas-to-proposals-workflow.md)
- [Create Proposal](./create-proposal.md) - Detailed instructions for creating a proposal document
- [Create Task](./create-task.md) - Step-by-step guide for creating a task document
- [Documentation Map](../navigation/documentation-map.md)

---

**Last Updated**: 2025-03-12

## References

- [Guide Llm Documentation Workflow](../guides/guide-llm-documentation-workflow.md)
