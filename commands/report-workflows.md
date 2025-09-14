# Report Workflows Command

> **IMPORTANT**: This command requires active execution of tasks, not just reporting about them. Follow each step in the checklist by actually performing CLI commands, scanning files, updating reports, and making real changes to documentation.

## Purpose

This command provides a standardized process for generating comprehensive reports about the status of all workflows in the system, including tasks, proposals, ideas, explorations, and decisions. It helps maintain visibility into project progress and ensure proper documentation of all work items.

## Prerequisites

- [ ] Access to the documentation repository
- [ ] Required permissions to modify documentation
- [ ] Understanding of work item statuses and categories
- [ ] Knowledge of the Workflows Status Report structure

## Workspace Usage

This command can be used in any project workspace:

```bash
# Reference the command
@report-workflows.md

# Execute with project context
Execute this command for my project at [project-path]

# Example usage
@report-workflows.md
Context: My project needs a comprehensive workflows report
Focus: Generate status report for all work items
Requirements: Update metrics, identify blockers, suggest next actions
```

## Command Checklist

1. **Preparation**:

   - [ ] Get current date using `date +%Y-%m-%d`
   - [ ] Review existing Workflows Report `.pythia/workflows/report.md`
   - [ ] Identify all work items that need to be included
   - [ ] Gather status information from each work item document
   - [ ] Review dependencies between items
   - [ ] Check archives for completed or archived items

2. **Report Updates by Item Type**:

   - [ ] **Tasks**: Update the Active Tasks section with current status
   - [ ] **Archived Tasks**: Update the Archived Tasks section from the `.pythia/workflows/archive/tasks/` directory
   - [ ] **Proposals**: Update the Active Proposals section with current status
   - [ ] **Ideas**: Update the New Ideas section with current status
   - [ ] **Explorations**: Update the Active Explorations section with current status
   - [ ] **Decisions**: Update the Recent Decisions section with current status

3. **Summary Metrics**:

   - [ ] Update Status Distribution metrics (include Completed/Archived statuses)
   - [ ] Update Priority Distribution metrics
   - [ ] Update Team Distribution metrics
   - [ ] Update the Dependencies Graph
   - [ ] Calculate velocity and progress metrics

4. **Next Actions**:

   - [ ] Identify items ready for immediate pickup
   - [ ] Document blocked items requiring attention
   - [ ] List items needing review
   - [ ] Suggest priority adjustments if needed

5. **Documentation Updates**:

   - [ ] Update CHANGELOG.md with report generation
   - [ ] Update any relevant summary documents
   - [ ] Update documentation map if needed
   - [ ] Ensure all counts include both active and archived items

6. **Validation**:
   - [ ] Run documentation validation
   - [ ] Fix any broken links or references
   - [ ] Verify all data is accurate and consistent

## Report Categories

### Work Item Types

- **Tasks**: Concrete work items with specific deliverables
- **Proposals**: Suggested changes or improvements
- **Ideas**: Early-stage concepts being considered
- **Explorations**: Research into potential approaches
- **Decisions**: Documented decisions affecting project direction

### Status Types

- **Not Started**: Initial state for newly created items
- **In Progress**: Work has begun on the item
- **Under Review**: Item is being reviewed
- **Blocked**: Progress is blocked by dependencies or issues
- **Completed**: Work is finished but not yet archived
- **Archived**: Item has been moved to archives

## Report Structure

The Workflows Report should contain the following sections:

1. **Active Tasks**

   - Table with columns: Task ID, Title, Status, Priority, Complexity, Owner, Last Updated

2. **Archived Tasks**

   - Table with columns: Task ID, Title, Status, Priority, Complexity, Owner, Archive Date

3. **Active Proposals**

   - Table with columns: Proposal ID, Title, Status, Priority, Impact, Owner, Dependencies, Last Updated

4. **Active Explorations**

   - Table with columns: Exploration ID, Title, Status, Focus Area, Owner, Related Items, Last Updated

5. **New Ideas**

   - Table with columns: Idea ID, Title, Status, Category, Proposed By, Potential Impact, Last Updated

6. **Recent Decisions**

   - Table with columns: Decision ID, Title, Status, Impact Area, Decision Date, Implemented, Last Updated

7. **Work Item Metrics**

   - Status Distribution (including Completed/Archived statuses)
   - Priority Distribution
   - Team Distribution
   - Progress Over Time

8. **Dependencies Graph**

   - Mermaid diagram showing dependencies between items

9. **Next Actions**
   - Items ready for immediate pickup
   - Blocked items requiring attention
   - Items needing review

## Examples

### Generating a Complete Report

```bash
# Generate complete workflows report
npm run docs:report-workflows

# Generate report with specific focus
npm run docs:report-workflows --focus "documentation"

# Generate report for specific team
npm run docs:report-workflows --team "architecture"
```

### Generating Summary Metrics

```bash
# Generate just the metrics portion of the report
npm run docs:report-workflows --metrics-only

# Generate comparative metrics against previous period
npm run docs:report-workflows --compare-previous
```

### Checking Archives for Completed Items

```bash
# List archived tasks
ls -la .pythia/workflows/archive/tasks/

# Count archived proposals
ls -la .pythia/workflows/archive/proposals/ | wc -l

# Incorporate archived items into total counts
echo "Total tasks: $(( $(ls -la .pythia/workflows/tasks/ | wc -l) + $(ls -la .pythia/workflows/archive/tasks/ | wc -l) - 2 ))"
```

## Common Issues and Solutions

1. **Missing Data**:

   - Check individual work item documents for status information
   - Use document frontmatter as source of truth
   - Consider running status validation tool first
   - **Check archive directories for completed items**

2. **Inconsistent Status Values**:

   - Standardize status values across all items
   - Use enum values from templates
   - Update non-conforming items

3. **Complex Dependencies**:

   - Break down complex dependency graphs
   - Use hierarchical structure for easier visualization
   - Consider multiple diagrams for different aspects

4. **Performance Issues with Large Reports**:

   - Filter report by category or team
   - Generate incremental reports
   - Use pagination for very large collections

5. **Incomplete Archives**:
   - Remember to scan all archive directories
   - Include archived items in total counts
   - Check for items that should be archived but aren't

## References

- [Workflows Report](mdc:.pythia/workflows/report.md)
- [Documentation Map](mdc:navigation/documentation-map.md)
- [Workspace Integration](mdc:guides/guide-workspace-integration.md)

## Workspace Integration Notes

This command is designed for workspace integration and adapts to your project's structure:

- **Workflows Reporting**: Works with any project's documentation structure
- **Status Tracking**: Maintains comprehensive project status visibility
- **Cross-References**: Uses `mdc:` links for workspace navigation
- **Command Usage**: Reference with `@report-workflows.md` in your workspace

---

**Last Updated**: 2025-03-19
