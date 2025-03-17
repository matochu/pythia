# Command: Create Idea Document

This guide provides step-by-step instructions for Large Language Models (LLMs) to create a new idea document in the project.

## Prerequisites

Before creating an idea document, ensure you have:

1. Obtained the current date for proper document timestamping (use `date +%Y-%m-%d` if needed)
2. Understood the core concept and problem the idea aims to solve
3. Reviewed any related existing documentation
4. Identified stakeholders and potential benefits/risks

## Command Checklist

Before proceeding with the idea creation, complete this checklist:

- [ ] Get current date using `date +%Y-%m-%d`
- [ ] Define the core problem and solution concept
- [ ] Review existing documentation for similar ideas
- [ ] Identify stakeholders and impact assessment
- [ ] Create idea file with correct naming convention
- [ ] Fill in all template sections
- [ ] Add to ideas backlog
- [ ] Add cross-references to related documents
- [ ] Update Documentation Map (if significant)
- [ ] Update Changelog
- [ ] Run documentation validation
- [ ] Fix any validation issues
- [ ] Verify all sections are properly completed

## Step 1: Create the Idea File

Create a new file in the `../workflows/ideas/` directory using the naming convention:
`idea-YYYY-MM-{topic}.md`

For example:

- `idea-2025-04-performance-optimization.md`
- `idea-2025-04-offline-sync.md`

## Step 2: Use the Idea Template

Copy the content from the [Idea Template](../templates/idea-template.md) and fill in all sections:

1. **Title**: Concise, descriptive title of the idea
2. **Status Information**:

   - Current Status (typically "new" for new ideas)
   - Creation Date (current date)
   - Last Update (current date)
   - Author

3. **Brief Description**: Concise 2-3 sentence description of the idea
4. **Problem**: Clear description of the problem the idea aims to solve
5. **Proposed Solution**: Conceptual description of the proposed solution
6. **Potential Benefits**: List of potential benefits
7. **Potential Drawbacks and Risks**: List of risks and potential issues
8. **Alternatives**: Description of alternative approaches
9. **Required Research**: List of research areas needed using checkboxes `- [ ]`
10. **Related Documents**: Links to related documentation
11. **Stakeholders**: List of parties interested in or affected by this idea
12. **Classification**:
    - Category (UI/UX, Performance, Architecture, etc.)
    - Complexity (low, medium, high)
    - Priority (low, medium, high)
    - Impact/Effort quadrant

## Step 3: Update the Ideas Backlog

Update the ideas backlog in `../workflows/ideas/ideas-backlog.md`:

1. Add a new entry to the appropriate category section with a unique ID
2. Fill in the status, priority, impact/effort, and link to the detailed document
3. Add the idea to the "Recently Updated Ideas" section

Example format:

```markdown
| UI001 | Modal Dialog Improvements | New | Medium | Optimal | [Details](./idea-2025-04-modal-dialog.md) |
```

## Step 4: Add Cross-References

Ensure that your idea document references related documents:

```markdown
## Related Documents

- [Existing Analysis](../architecture/analysis-ui-components.md)
- [Related Document](../path/to/document.md)
```

Also consider updating related documents to reference this new idea if appropriate.

## Step 5: Update Documentation Map

If this is a significant idea that should be highlighted in the documentation map:

1. Update `../navigation/documentation-map.md` in the "Ideas and Early Concepts" section
2. Add a new entry with a link to the idea document and brief description

## Step 6: Update Changelog

Add an entry to `../CHANGELOG.md` about the new idea document:

1. Under the current date section (or create a new one if needed)
2. Add to the "Added" subsection:
   ```markdown
   - Created idea document for [topic] (`../workflows/ideas/idea-YYYY-MM-{topic}.md`)
   ```

## Step 7: Verification Checklist

Before finalizing the idea document, verify:

- [ ] All sections of the template are properly filled in
- [ ] The naming convention is followed
- [ ] The idea is registered in the ideas backlog
- [ ] Cross-references are added
- [ ] No placeholder text remains in the document
- [ ] Dates and status are correctly set

## Example Implementation

Here's a simplified example of filling in an idea document:

```markdown
# Idea: Offline Data Synchronization

## Status

**Current Status**: new
**Creation Date**: 2025-04-15
**Last Update**: 2025-04-15
**Author**: Team

## Brief Description

Implementation of a robust offline data synchronization system that automatically manages
conflict resolution and ensures data integrity when reconnecting to the network.

## Problem

The current system doesn't handle temporary network disconnections well, leading to:

1. Data loss when users perform actions offline
2. Inconsistent state after reconnecting
3. Poor user experience in areas with unstable connections
   ...
```

## Alternative: Quick Idea Creation

For simple ideas that don't require detailed documentation yet, you can add them directly to the ideas backlog without creating a separate document.

### Step 1: Update Ideas Backlog Only

Add the idea directly to `../workflows/ideas/ideas-backlog.md`:

1. Add a new entry to the appropriate category section with a unique ID
2. Provide a concise description (2-3 sentences maximum)
3. Set status as "New"
4. Include required evaluation metrics:
   - Priority (Low/Medium/High)
   - Complexity (Low/Medium/High)
   - Impact/Effort quadrant (Low Hanging Fruit/Strategic/Not Worth It/Thankless)
5. Leave the "Details" field empty or add "TBD" (To Be Determined)

Example format:

```markdown
| UI005 | Quick animation transitions for better UX | New | Medium | Low | Strategic | TBD |
```

### Step 2: Add to Recently Updated Section

Add the quick idea to the "Recently Updated Ideas" section:

```markdown
## Recently Updated Ideas

| ID    | Name                               | Status | Priority | Complexity | Quadrant  | Added Date |
| ----- | ---------------------------------- | ------ | -------- | ---------- | --------- | ---------- |
| UI005 | Quick animation transitions for UX | New    | Medium   | Low        | Strategic | 2025-04-22 |
```

### Step 3: Update Changelog

Add a simple entry to `../CHANGELOG.md`:

```markdown
- Added quick idea for [brief description] to ideas backlog
```

### When to Use Quick Ideas

Use this approach when:

- The idea is preliminary and needs refinement
- You want to capture a concept before it's lost
- The full documentation process would be excessive for the current state of the idea
- You need to quickly establish a backlog of potential improvements

Quick ideas can later be expanded into full idea documents when they gain traction or require more detailed analysis.

## Related Documents

- [Idea Template](../templates/idea-template.md)
- [Ideas Backlog](../ideas/ideas-backlog.md)
- [Ideas to Proposals Workflow](../methodology/ideas-to-proposals-workflow.md)
- [Documentation Map](../navigation/documentation-map.md)
- [Changelog](../CHANGELOG.md)

## References

- [Guide Llm Documentation Workflow](../guides/guide-llm-documentation-workflow.md)
- [Create Exploration](create-exploration.md)

---

**Last Updated**: 2025-03-12
