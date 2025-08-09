# Command: Create Proposal Document

> **IMPORTANT**: This command requires active execution of tasks, not just planning. Follow each step in the checklist by actually performing the actions, creating files, updating references, and validating the documentation.

## Purpose

This command provides step-by-step instructions for creating a comprehensive proposal document that transforms an idea or exploration into a formal proposal for implementation. A well-structured proposal document is essential for proper decision-making, implementation planning, and project documentation.

## Prerequisites

Before creating a proposal document, ensure you have:

1. Completed thorough analysis of the area you're proposing to change
2. Completed all necessary research and explorations from the idea stage
3. Obtained the current date for proper document timestamping
4. Reviewed existing related architectural analyses and ideas
5. Identified dependencies and potential impacts
6. Considered alternatives to your proposed approach

## Workspace Usage

This command can be used in any project workspace:

```bash
# Reference the command
@create-proposal.md

# Execute with project context
Execute this command for my project at [project-path]

# Example usage
@create-proposal.md
Context: My application needs better state management
Objective: Propose Redux implementation strategy
Priority: High
Timeline: 3 weeks
```

## Command Checklist

- [ ] Get current date using `date +%Y-%m-%d`
- [ ] Review and understand the original idea document
- [ ] Check all research and exploration documents are complete
- [ ] Analyze impact on existing architecture
- [ ] List all dependencies and affected components
- [ ] Document alternative approaches considered
- [ ] Create proposal file with correct naming convention
- [ ] Fill in all template sections completely
- [ ] Update related idea document status
- [ ] Update ideas backlog
- [ ] Update related cross-references
- [ ] Run documentation validation
- [ ] Fix any validation issues
- [ ] Generate workflows report
- [ ] Verify all checklist items are complete

## Step 1: Prepare for Proposal Creation

Before starting, gather all necessary information:

```bash
# Get the current date for proper timestamping
date +%Y-%m-%d

# List relevant ideas and explorations for reference
# For standard Pythia structure: docs/workflows/ideas/
# For custom structure: adapt to your project's documentation layout
ls -la docs/workflows/ideas/
ls -la docs/workflows/ideas/explorations/
```

Review all related documents to ensure you have a comprehensive understanding of the problem space and potential solutions.

## Step 2: Create the Proposal File

Create a new file in the `docs/workflows/proposals/` directory using the naming convention:
`proposal-{topic}.md`

For example:

- `proposal-state-management-refactoring.md`
- `proposal-api-integration-strategy.md`
- `proposal-performance-optimization-strategy.md`

## Step 3: Use the Proposal Template

Copy the content from the [Proposal Template](mdc:templates/proposal-template.md) and fill in all sections:

1. **Title**: Concise, descriptive title of the proposal
2. **Summary**: Brief overview of what is being proposed and why
3. **Related Idea**: Link to the original idea that initiated this proposal
4. **Current State**: Description of the current implementation with focus on problems
5. **Proposed Solution**: Detailed description of the proposed changes
6. **Implementation Approach**: Outline of implementation strategy and timeline
7. **Alternatives Considered**: Description of other approaches that were considered
8. **Risks and Mitigation**: Identification of potential risks and mitigation strategies
9. **Success Criteria**: Defined measurable criteria for successful implementation
10. **References**: Links to related documents

Ensure that every section is completely filled in with detailed information. No template placeholders should remain in the final document.

## Step 4: Update Related Documentation

After creating the proposal, update all related documentation:

### Update Related Idea Document

If the proposal is based on an idea document:

1. Open the original idea document
2. Update the idea status to "Transformed" in the idea document
3. Update the "Last Update" date in the idea document
4. Add a comment in the idea document linking to the new proposal

Example:

```markdown
## Status

- **Status**: Transformed to Proposal
- **Last Updated**: 2025-03-18
- **Transformed To**: [Performance Optimization Strategy Proposal](../proposals/proposal-performance-optimization-strategy.md)
```

### Update Ideas Backlog

Update the ideas backlog in `docs/workflows/ideas/ideas-backlog.md`:

1. Change the status of the idea to "Transformed"
2. Add the idea to the "Ideas Transformed into Proposals" section with a link to the new proposal
3. Update the "Recently Updated Ideas" section with the current date

## Step 5: Provide Detailed Implementation Guidance

For complex proposals, include:

1. **Implementation Phases**: Break down implementation into logical phases with clear deliverables for each
2. **Prioritization Analysis**: Include analysis of priorities using established methods (ICE, WSJF, etc.)
3. **Decision Points**: Identify key decision points during implementation where approach may need adjustment
4. **Business Impact Analysis**: Show how the proposal affects key business metrics
5. **Technical Debt Resolution**: Explain how the proposal addresses existing technical debt
6. **Future Opportunities**: Outline potential future work enabled by this proposal

## Step 6: Add Cross-References

Add references to related documents at the bottom of the proposal file:

```markdown
## References

- [Original Idea](../ideas/idea-YYYY-MM-topic.md)
- [Exploration](../ideas/explorations/exploration-topic.md)
- [Related Analysis](../architecture/analysis-topic.md)
- [Related Proposal](../proposals/proposal-related-topic.md)
```

Ensure that references are bidirectional - update any related documents to reference this new proposal.

## Step 7: Generate Workflows Report

Use the `report-workflows` command to update the workflows status report:

1. Follow the instructions in [Report Workflows](report-workflows.md)
2. Ensure the new proposal is properly included in the report
3. Update any metrics or summaries in the report

This step ensures that the new proposal is properly tracked in the overall project workflow.

## Step 8: Validation and Verification

Run the documentation validation tools to ensure the new document is properly integrated:

```bash
npm run docs:validate-links
npm run docs:check-coverage
```

Fix any issues reported by these tools.

## Examples

### Creating a Basic Proposal

```bash
# Get the current date
date +%Y-%m-%d
# Output: 2025-03-18

# Create the proposal file
touch docs/workflows/proposals/proposal-api-caching-strategy.md

# Copy the template contents and fill in all sections
# ...

# Update the related idea document status to "Transformed"
# Update ideas-backlog.md

# Run validation
npm run docs:validate-links
```

### Creating a Complex Technical Proposal

For more complex proposals like architecture changes or performance optimization:

```bash
# Create a comprehensive proposal with business impact analysis
touch docs/workflows/proposals/proposal-microservices-migration.md

# Include additional sections:
# - Phased implementation approach
# - Business impact matrix
# - Detailed technical architecture diagrams
# - Risk assessment matrix
# - Timeline with key decision points

# Update related documentation
# Generate workflows report
npm run docs:report-workflows
```

## Common Issues and Solutions

1. **Incomplete Template Sections**:

   - Issue: Some sections of the proposal template are left with placeholder text
   - Solution: Review each section systematically, ensuring all placeholders are replaced with actual content

2. **Missing Cross-References**:

   - Issue: Related documents don't have bidirectional links to the new proposal
   - Solution: Create a list of all related documents and methodically update each one

3. **Unclear Implementation Approach**:

   - Issue: The implementation approach is too vague or lacks specific phases
   - Solution: Break down implementation into clear phases with specific deliverables for each

4. **Insufficient Alternative Analysis**:

   - Issue: Few or poorly analyzed alternatives
   - Solution: Document at least three alternatives with pros/cons for each and clear reasoning for rejection

5. **Missing Success Criteria**:
   - Issue: Success criteria are subjective or unmeasurable
   - Solution: Define specific, measurable criteria that can objectively determine success

## Self-Check Points

Before completing this command, verify:

- [ ] **Proposal Completeness**: All template sections are filled with actual content
- [ ] **Cross-References**: All related documents are properly linked
- [ ] **Implementation Approach**: Clear phases with specific deliverables
- [ ] **Alternative Analysis**: At least three alternatives with pros/cons
- [ ] **Success Criteria**: Specific, measurable success criteria defined
- [ ] **Business Impact**: Clear business justification and impact analysis
- [ ] **Risk Assessment**: Comprehensive risk analysis with mitigation strategies
- [ ] **Timeline**: Realistic timeline with key decision points
- [ ] **Stakeholder Alignment**: All stakeholders are identified and consulted
- [ ] **File Naming**: Proposal file follows naming convention `proposal-topic.md`

## Integration Guidelines

This command integrates with other Pythia components:

### Related Commands

- **`@create-idea.md`** - For proposals originating from ideas
- **`@create-exploration.md`** - For proposals requiring research first
- **`@report-workflows.md`** - To generate workflow status reports
- **`@validate-documentation.md`** - To validate proposal documentation

### Template Integration

- Uses `templates/proposal-template.md` for consistent structure
- Follows metadata standards for proper categorization
- Integrates with workflow reporting system

### Workspace Integration

- **Standard Structure**: Creates proposals in `docs/workflows/proposals/`
- **Custom Structure**: Adapts to your project's documentation layout
- **Cross-References**: Uses `mdc:` links for workspace navigation
- **Command Usage**: Reference with `@create-proposal.md` in your workspace

### Methodology Integration

- **Ideas to Proposals Workflow**: This command is part of the structured workflow for transforming ideas into implemented features. The typical flow is:
  1. **Idea** → 2. **Exploration** → 3. **Proposal** → 4. **Decision** → 5. **Task** → 6. **Implementation**
- Proposals should be based on prior explorations and ideas, ensuring that all technical, business, and risk factors are considered before formalization.
- For details, see [Ideas to Proposals Workflow](mdc:methodology/ideas-to-proposals-workflow.md).

## Related Documents

- [Proposal Template](mdc:templates/proposal-template.md)
- [Report Workflows](mdc:commands/report-workflows.md)
- [Workspace Integration](mdc:guides/guide-workspace-integration.md)

---

**Last Updated**: 2025-03-18
