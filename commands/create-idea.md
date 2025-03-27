# Command: Create Idea Document

> **IMPORTANT**: This command requires active execution of tasks, not just planning. Follow each step in the checklist by actually performing the actions, creating files, updating references, and validating the documentation.

## Purpose

This command provides step-by-step instructions for creating a new idea document that captures innovative concepts, potential solutions, or areas for improvement. A well-structured idea document serves as the foundation for project evolution, future explorations, and proposals.

## Prerequisites

Before creating an idea document, ensure you have:

1. [ ] Completed initial research on the idea topic
2. [ ] Considered the potential value and impact of the idea
3. [ ] Identified the problem or opportunity the idea addresses
4. [ ] Validated the uniqueness of the idea against existing documentation
5. [ ] Prepared metadata for proper categorization
6. [ ] Gathered any relevant metrics or data points
7. [ ] Obtained the current date for proper document timestamping

## Command Checklist

- [ ] Get current date using `date +%Y-%m-%d`
- [ ] Validate idea uniqueness against existing documentation
- [ ] Brainstorm the core concept and key points
- [ ] Identify the problem or opportunity the idea addresses
- [ ] Consider potential impacts and benefits
- [ ] Prepare idea metadata and categorization
- [ ] Create idea file with correct naming convention
- [ ] Fill in all template sections
- [ ] Add cross-references to related documentation
- [ ] Add the idea to the ideas backlog
- [ ] Run documentation validation
- [ ] Generate workflows report
- [ ] Update idea status tracking
- [ ] Verify all checklist items are complete

## Step 1: Prepare for Idea Creation

Before starting, ensure you have all necessary information:

```bash
# Get the current date for proper timestamping
date +%Y-%m-%d

# Read configuration to access paths
CONFIG_PATH="../config.json"
IDEAS_PATH=$(jq -r '.paths.ideas' $CONFIG_PATH)

# List existing ideas to avoid duplication
ls -la "$IDEAS_PATH"

# Search for similar ideas
grep -r "keyword" "$IDEAS_PATH"
```

## Step 2: Create the Idea File

Create a new file in the ideas directory (path from config.json) using the naming convention:
`idea-YYYY-MM-{descriptive-name}.md`

```bash
# Read configuration
CONFIG_PATH="../config.json"
IDEAS_PATH=$(jq -r '.paths.ideas' $CONFIG_PATH)

# Create new idea file
IDEA_NAME="performance-optimization"
CURRENT_DATE=$(date +%Y-%m)
IDEA_FILE="$IDEAS_PATH/idea-$CURRENT_DATE-$IDEA_NAME.md"
touch "$IDEA_FILE"
```

For example:

- `idea-2025-03-performance-optimization.md`
- `idea-2025-03-component-library.md`
- `idea-2025-03-offline-support.md`

## Step 3: Use the Idea Template

Copy the content from the [Idea Template](../templates/idea-template.md) and fill in all sections:

1. **Metadata**:
   - Creation Date
   - Author
   - Category
   - Tags
   - Impact Level (High/Medium/Low)
   - Dependencies
2. **Title**: Concise, descriptive title of the idea
3. **Summary**: Brief overview of what the idea is about
4. **Problem Statement**: Description of the problem the idea aims to solve
5. **Proposed Solution**: High-level description of the proposed solution
6. **Potential Benefits**: List of benefits this idea could bring
   - Business Impact
   - User Impact
   - Technical Impact
7. **Potential Drawbacks**: List of drawbacks or challenges this idea could introduce
8. **Implementation Considerations**: High-level thoughts on implementation
9. **Related Ideas**: Links to related ideas or concepts
10. **Status Tracking**:
    - Current Status
    - Status History
    - Next Steps
    - Blockers

Ensure that every section is filled in with detailed information.

## Step 4: Update Ideas Backlog

Update the ideas backlog:

```bash
# Read configuration
CONFIG_PATH="../config.json"
IDEAS_PATH=$(jq -r '.paths.ideas' $CONFIG_PATH)

# Update ideas backlog
BACKLOG_FILE="$IDEAS_PATH/ideas-backlog.md"
```

Add the new idea to the appropriate category section (Architecture Ideas, Development Workflow Ideas, Testing & QA Ideas) and update the "Recently Updated Ideas" section. Each idea should have a unique ID based on its category.

Example:

```markdown
## Development Workflow Ideas

| ID     | Name                        | Status | Priority | Complexity | Quadrant  | Details                                          |
| ------ | --------------------------- | ------ | -------- | ---------- | --------- | ------------------------------------------------ |
| DEV002 | Memory-Based Logging System | New    | High     | Medium     | Strategic | [Details](idea-2025-03-memory-logging-system.md) |

## Recently Updated Ideas

| ID     | Name                        | Status | Priority | Complexity | Quadrant  | Added Date |
| ------ | --------------------------- | ------ | -------- | ---------- | --------- | ---------- |
| DEV002 | Memory-Based Logging System | New    | High     | Medium     | Strategic | 2025-03-24 |
```

Note: Follow these rules for ID generation:

- ARCH### for Architecture Ideas
- DEV### for Development Workflow Ideas
- QA### for Testing & QA Ideas
- Use the next available number in the sequence for the chosen category

## Step 5: Add Cross-References

Add references to related documents at the bottom of the idea file:

```markdown
## References

- [Related Analysis](../architecture/analysis-topic.md)
- [Similar Idea](../ideas/idea-YYYY-MM-related.md)
- [Relevant Documentation](../documentation/topic.md)

## Status History

| Date       | Status    | Notes                   |
| ---------- | --------- | ----------------------- |
| YYYY-MM-DD | New       | Initial creation        |
| YYYY-MM-DD | In Review | Team discussion planned |
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
# Validate idea uniqueness
npm run docs:validate-uniqueness

# Validate documentation links
npm run docs:validate-links

# Check documentation coverage
npm run docs:check-coverage

# Validate metadata format
npm run docs:validate-metadata
```

Fix any issues reported by these tools.

## Examples

### Creating a Basic Idea

```bash
# Get the current date
date +%Y-%m-%d
# Output: 2025-03-24

# Read configuration
CONFIG_PATH="../config.json"
IDEAS_PATH=$(jq -r '.paths.ideas' $CONFIG_PATH)

# Create the idea file
IDEA_FILE="$IDEAS_PATH/idea-2025-03-api-caching-strategy.md"
touch "$IDEA_FILE"

# Prepare metadata
cat << EOF > idea-metadata.yaml
---
title: API Caching Strategy
created: 2025-03-24
author: John Doe
category: Performance
tags:
  - caching
  - api
  - performance
impact: High
dependencies:
  - Current API Architecture
---
EOF

# Copy metadata and template contents
cat idea-metadata.yaml > "$IDEA_FILE"
rm idea-metadata.yaml

# Fill in all sections
# Update ideas backlog
# Generate workflows report
npm run docs:report-workflows
```

### Creating a Complex Idea with Deep Analysis

```bash
# Read configuration
CONFIG_PATH="../config.json"
IDEAS_PATH=$(jq -r '.paths.ideas' $CONFIG_PATH)

# Create comprehensive idea with supporting research
IDEA_FILE="$IDEAS_PATH/idea-2025-03-cross-platform-architecture.md"
touch "$IDEA_FILE"

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

6. **Incomplete Metadata**:

   - Issue: Required metadata fields are missing or incomplete
   - Solution: Use metadata template and validation tools to ensure all required fields are present

7. **Poor Categorization**:
   - Issue: Idea is not properly categorized or tagged
   - Solution: Review existing categories and tags, ensure consistent categorization

## Related Documents

- [Idea Template](../templates/idea-template.md)
- [Ideas Backlog](../workflows/ideas/ideas-backlog.md)
- [Idea to Proposal Workflow](../methodology/idea-to-proposal-workflow.md)
- [Report Workflows](report-workflows.md)

---

**Last Updated**: 2025-03-24
