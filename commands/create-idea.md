# Command: Create Idea Document

> **IMPORTANT**: This command requires active execution of tasks, not just planning. Follow each step in the checklist by actually performing the actions, creating files, updating references, and validating the documentation.

## Purpose

This command provides step-by-step instructions for creating a new idea document that captures innovative concepts, potential solutions, or areas for improvement. A well-structured idea document serves as the foundation for project evolution, future explorations, and proposals.

## Prerequisites

Before creating an idea document, ensure you have:

1. Completed initial research on the idea topic
2. Considered the potential value and impact of the idea
3. Identified the problem or opportunity the idea addresses
4. Obtained the current date for proper document timestamping

## Command Checklist

- [ ] Get current date using `date +%Y-%m-%d`
- [ ] Brainstorm the core concept and key points
- [ ] Identify the problem or opportunity the idea addresses
- [ ] Consider potential impacts and benefits
- [ ] Validate the idea against existing documentation
- [ ] Create idea file with correct naming convention
- [ ] Fill in all template sections
- [ ] Add cross-references to related documentation
- [ ] Add the idea to the ideas backlog
- [ ] Run documentation validation
- [ ] Generate workflows report
- [ ] Verify all checklist items are complete

## Step 1: Prepare for Idea Creation

Before starting, ensure you have all necessary information:

```bash
# Get the current date for proper timestamping
date +%Y-%m-%d

# List existing ideas to avoid duplication
ls -la ../workflows/ideas/
```

## Step 2: Create the Idea File

Create a new file in the `../workflows/ideas/` directory using the naming convention:
`idea-YYYY-MM-{descriptive-name}.md`

For example:

- `idea-2025-03-performance-optimization.md`
- `idea-2025-03-component-library.md`
- `idea-2025-03-offline-support.md`

## Step 3: Use the Idea Template

Copy the content from the [Idea Template](../templates/idea-template.md) and fill in all sections:

1. **Title**: Concise, descriptive title of the idea
2. **Summary**: Brief overview of what the idea is about
3. **Problem Statement**: Description of the problem the idea aims to solve
4. **Proposed Solution**: High-level description of the proposed solution
5. **Potential Benefits**: List of benefits this idea could bring
6. **Potential Drawbacks**: List of drawbacks or challenges this idea could introduce
7. **Implementation Considerations**: High-level thoughts on implementation
8. **Related Ideas**: Links to related ideas or concepts
9. **Status**: Current status of the idea (New, In Exploration, Transformed, etc.)

Ensure that every section is filled in with detailed information.

## Step 4: Update Ideas Backlog

Update the ideas backlog in `../workflows/ideas/ideas-backlog.md`:

1. Add the new idea to the "New Ideas" section with a link to the idea document
2. Update the "Recently Added Ideas" section with a link to the idea and the current date

Example:

```markdown
## New Ideas

- [Performance Optimization Strategy](idea-2025-03-performance-optimization.md) - Strategies for improving application performance across platforms
```

## Step 5: Add Cross-References

Add references to related documents at the bottom of the idea file:

```markdown
## References

- [Related Analysis](../architecture/analysis-topic.md)
- [Similar Idea](../ideas/idea-YYYY-MM-related.md)
- [Relevant Documentation](../documentation/topic.md)
```

Ensure that references are bidirectional - update any related documents to reference this new idea.

## Step 6: Generate Workflows Report

Use the `report-workflows` command to update the workflows status report:

1. Follow the instructions in [Report Workflows](report-workflows.md)
2. Ensure the new idea is properly included in the report
3. Update any metrics or summaries in the report

This step ensures that the new idea is properly tracked in the overall project workflow.

## Step 7: Validation and Verification

Run the documentation validation tools to ensure the new document is properly integrated:

```bash
# If validation tools are available
npm run docs:validate-links
npm run docs:check-coverage
```

Fix any issues reported by these tools.

## Examples

### Creating a Basic Idea

```bash
# Get the current date
date +%Y-%m-%d
# Output: 2025-03-19

# Create the idea file
touch ../workflows/ideas/idea-2025-03-api-caching-strategy.md

# Copy the template contents and fill in all sections
# ...

# Add the idea to the ideas backlog
# Update ideas-backlog.md

# Generate workflows report
npm run docs:report-workflows
```

### Creating a Complex Idea with Deep Analysis

```bash
# Create comprehensive idea with supporting research
touch ../workflows/ideas/idea-2025-03-cross-platform-architecture.md

# Include additional sections:
# - Technical feasibility analysis
# - Market research findings
# - Competitive analysis
# - Potential architectural diagrams

# Update ideas backlog
# Generate workflows report
npm run docs:report-workflows
```

## Common Issues and Solutions

1. **Vague Problem Statement**:

   - Issue: The problem statement is too general or lacks specific pain points
   - Solution: Focus on specific, observable issues that users or developers experience

2. **Overlapping Ideas**:

   - Issue: The new idea substantially overlaps with existing ideas
   - Solution: Consider merging the ideas or clearly differentiate the unique aspects

3. **Missing Context**:

   - Issue: The idea lacks sufficient context for others to understand its value
   - Solution: Add background information and explain the current state that prompted the idea

4. **Unclear Value Proposition**:

   - Issue: Benefits are not clearly articulated or are based on assumptions
   - Solution: Quantify benefits where possible and tie them to specific user or business outcomes

5. **Implementation Too Detailed**:
   - Issue: Implementation section contains too much detail for an idea stage
   - Solution: Keep implementation at a high level, saving details for explorations or proposals

## Related Documents

- [Idea Template](../templates/idea-template.md)
- [Ideas Backlog](../workflows/ideas/ideas-backlog.md)
- [Idea to Proposal Workflow](../methodology/idea-to-proposal-workflow.md)
- [Report Workflows](report-workflows.md)

---

**Last Updated**: 2025-03-19
