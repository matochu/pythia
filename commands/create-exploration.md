# Command: Create Exploration Document

> **IMPORTANT**: This command requires active execution of tasks, not just planning. Follow each step in the checklist by actually performing the actions, creating files, updating references, and validating the documentation.

## Purpose

This command provides step-by-step instructions for creating an exploration document that investigates the feasibility, approaches, and implications of a specific idea. Exploration documents serve as a bridge between initial ideas and formal proposals, allowing for a deeper technical and conceptual analysis before committing to an implementation approach.

## Prerequisites

Before creating an exploration document, ensure you have:

1. An existing idea document that requires in-depth exploration
2. Completed initial research on the technical aspects of the idea
3. Identified key questions that need to be answered
4. Obtained the current date for proper document timestamping

## Workspace Usage

This command can be used in any project workspace:

```bash
# Reference the command
@create-exploration.md

# Execute with project context
Execute this command for my project at [project-path]

# Example usage
@create-exploration.md
Context: My idea needs technical feasibility analysis
Objective: Create exploration for caching strategy implementation
Focus: Technical investigation, performance analysis, implementation approaches
```

## Command Checklist

- [ ] Get current date using `date +%Y-%m-%d`
- [ ] Review and understand the original idea document
- [ ] Define the scope and objectives of the exploration
- [ ] Identify key questions to be answered
- [ ] Create exploration file with correct naming convention
- [ ] Fill in all template sections
- [ ] Update the original idea's status
- [ ] Add cross-references between idea and exploration
- [ ] Run documentation validation
- [ ] Generate workflows report
- [ ] Verify all checklist items are complete

## Step 1: Prepare for Exploration Creation

Before starting, gather all necessary information:

```bash
# Get the current date for proper timestamping
date +%Y-%m-%d

# Review the original idea document
# For standard Pythia structure: docs/workflows/ideas/
# For custom structure: adapt to your project's documentation layout
ls -la docs/workflows/ideas/
```

## Step 2: Create the Exploration File

Create a new file in the `docs/workflows/ideas/explorations/` directory using the naming convention:
`exploration-{topic}.md`

For example:

- `exploration-performance-optimization.md`
- `exploration-offline-support.md`
- `exploration-state-management.md`

## Step 3: Use the Exploration Template

Copy the content from the [Exploration Template](mdc:templates/exploration-template.md) and fill in all sections:

1. **Title**: Concise, descriptive title of the exploration
2. **Summary**: Brief overview of what is being explored
3. **Related Idea**: Link to the original idea document
4. **Status Information**: Current status, dates, author
5. **Objectives**: Clear list of what this exploration aims to determine
6. **Key Questions**: Specific questions the exploration should answer
7. **Research Methods**: How information will be gathered and analyzed
8. **Technical Investigation**: Technical details, implementations, and code samples
9. **Findings**: Results of the exploration
10. **Recommendations**: Suggested next steps based on findings
11. **References**: Links to related documents and external sources

Ensure that every section is filled in with detailed information.

## Step 4: Update Original Idea Status

Update the status of the original idea document to reflect that it's now under exploration:

1. Open the original idea document
2. Change the "Status" field to "In Exploration"
3. Add a reference to the exploration document
4. Update the "Last Updated" date

For example:

```markdown
## Status

- **Status**: In Exploration
- **Last Updated**: 2025-03-19
- **Exploration**: [Performance Optimization Exploration](./explorations/exploration-performance-optimization.md)
```

## Step 5: Add Cross-References

Ensure that both the exploration document and the original idea document reference each other:

In the exploration document:

```markdown
## Related Idea

This exploration is based on the [Performance Optimization idea](../idea-2025-03-performance-optimization.md).
```

In the idea document:

```markdown
## Explorations

This idea is being explored in the [Performance Optimization Exploration](./explorations/exploration-performance-optimization.md) document.
```

## Step 6: Generate Workflows Report

Use the `report-workflows` command to update the workflows status report:

1. Follow the instructions in [Report Workflows](report-workflows.md)
2. Ensure the new exploration is properly included in the report
3. Update any metrics or summaries in the report

This step ensures that the new exploration is properly tracked in the overall project workflow.

## Step 7: Validation and Verification

Run the documentation validation tools to ensure the new document is properly integrated:

```bash
# If validation tools are available
npm run docs:validate-links
npm run docs:check-coverage
```

Fix any issues reported by these tools.

## Examples

### Creating a Basic Exploration

```bash
# Get the current date
date +%Y-%m-%d
# Output: 2025-03-19

# Create the exploration file
touch docs/workflows/ideas/explorations/exploration-caching-strategy.md

# Copy the template contents and fill in all sections
# ...

# Update the original idea's status to "In Exploration"
# Add cross-references between the idea and exploration documents

# Generate workflows report
npm run docs:report-workflows
```

### Creating a Technical Exploration with Code Examples

```bash
# Create a comprehensive exploration with code samples
touch docs/workflows/ideas/explorations/exploration-state-management.md

# Include additional technical content:
# - Proof of concept implementation
# - Performance benchmarks
# - Technical diagrams
# - API design considerations
# - Migration path analysis

# Update idea status
# Generate workflows report
npm run docs:report-workflows
```

## Common Issues and Solutions

1. **Unclear Exploration Objectives**:

   - Issue: The exploration doesn't have clear, measurable objectives
   - Solution: Define specific questions that should be answered by the end of the exploration

2. **Scope Creep**:

   - Issue: The exploration keeps growing without boundaries
   - Solution: Clearly define what is in-scope and out-of-scope at the beginning

3. **Missing Technical Validation**:

   - Issue: Claims are made without technical validation
   - Solution: Include code samples, benchmarks, or other empirical evidence

4. **Premature Implementation Details**:

   - Issue: The exploration jumps to implementation before exploring alternatives
   - Solution: Consider multiple approaches and evaluate them against each other

5. **Inconclusive Findings**:
   - Issue: The exploration ends without clear recommendations
   - Solution: Include a decisive conclusion with specific next steps, even if the recommendation is to not proceed

## Self-Check Points

Before completing this command, verify:

- [ ] **Clear Objectives**: Specific, measurable exploration objectives defined
- [ ] **Scope Boundaries**: Clear in-scope and out-of-scope items defined
- [ ] **Technical Validation**: Claims supported by code samples or benchmarks
- [ ] **Alternative Analysis**: Multiple approaches considered and evaluated
- [ ] **Conclusive Findings**: Clear recommendations with specific next steps
- [ ] **Complete Metadata**: All required fields are filled (title, status, etc.)
- [ ] **Cross-References**: All related documents are properly linked
- [ ] **English Content**: All content is in English
- [ ] **File Naming**: Exploration file follows naming convention `exploration-topic.md`
- [ ] **Idea Integration**: Original idea document is properly updated

## Integration Guidelines

This command integrates with other Pythia components:

### Related Commands

- **`@create-idea.md`** - For explorations originating from ideas
- **`@create-proposal.md`** - For explorations leading to proposals
- **`@complete-exploration.md`** - To finalize exploration and determine next steps
- **`@report-workflows.md`** - To generate workflow status reports

### Template Integration

- Uses `templates/exploration-template.md` for consistent structure
- Follows metadata standards for proper categorization
- Integrates with ideas workflow system

### Workspace Integration

- **Standard Structure**: Creates explorations in `docs/workflows/ideas/explorations/`
- **Custom Structure**: Adapts to your project's documentation layout
- **Cross-References**: Uses `mdc:` links for workspace navigation
- **Command Usage**: Reference with `@create-exploration.md` in your workspace

### Methodology Integration

- **Ideas to Proposals Workflow**: This command represents the exploration stage in the structured workflow for transforming ideas into implemented features. The typical flow is:
  1. **Idea** → 2. **Exploration** → 3. **Proposal** → 4. **Decision** → 5. **Task** → 6. **Implementation**
- Explorations should thoroughly analyze feasibility, alternatives, and risks before moving to proposals or tasks. See [Ideas to Proposals Workflow](mdc:methodology/ideas-to-proposals-workflow.md).
- **Context Documentation**: For background, rationale, and domain knowledge, reference or create context documents as described in [Context Documentation](mdc:commands/create-context.md).

## Related Documents

- [Exploration Template](mdc:templates/exploration-template.md)
- [Report Workflows](mdc:commands/report-workflows.md)
- [Workspace Integration](mdc:guides/guide-workspace-integration.md)

---

**Last Updated**: 2025-03-19
