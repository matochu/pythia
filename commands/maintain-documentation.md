# Command: Maintain Documentation

> **IMPORTANT**: This command provides a systematic, production-ready process for ongoing maintenance, review, and improvement of project documentation. It is designed for use by LLMs and human reviewers to ensure documentation remains current, accurate, and aligned with best practices.

## Quick Reference

- **Purpose**: Maintain, review, and improve project documentation for accuracy and currency
- **Key Steps**: Preparation → Checklist → Quality Rubric → Safety → Examples → Integration
- **Self-Check**: Use the Self-Check Points section before finalizing
- **Methodology**: Integrate Spark and Slow Thinking principles for quality
- **Safety**: Stop and request clarification if requirements are unclear

## Purpose

This command ensures that all project documentation is regularly reviewed, updated, and improved. It covers routine maintenance tasks, periodic reviews, changelog updates, and the application of new best practices or templates from the Pythia base.

## Prerequisites

Before maintaining documentation, ensure you have:

1. [ ] Identified the documentation set to maintain
2. [ ] Access to the latest project and Pythia base documentation
3. [ ] Familiarity with documentation standards and recent changes
4. [ ] Access to [Improve Instruction](mdc:commands/improve-instruction.md) and [Spark-Improve Instruction](mdc:commands/improve-instruction-spark.md)

## Workspace Usage

This command can be used in any project workspace:

```bash
# Reference the command
@maintain-documentation.md

# Execute with project context
Execute this command for my project at [project-path]

# Example usage
@maintain-documentation.md
Context: Review and update all task documents for new template compliance
```

## Command Checklist

- [ ] Identify documentation requiring review or update
- [ ] Check for outdated, incomplete, or inconsistent content
- [ ] Apply latest templates and best practices from Pythia base
- [ ] Update changelog and documentation map as needed
- [ ] Score documents using the Quality Rubric
- [ ] Verify safety and stop conditions are defined
- [ ] Ensure all links use mdc: format
- [ ] Reference methodology integration
- [ ] Document findings and improvement actions

## Step-by-Step Execution

### Step 1: Preparation

- Identify the documentation set to maintain
- Gather all related templates, standards, and changelogs

### Step 2: Review and Audit

- Check each document for outdated information, missing sections, or inconsistencies
- Compare with latest Pythia templates and commands

### Step 3: Update and Improve

- Apply new templates, update sections, and fix inconsistencies
- Add missing cross-references and update mdc: links

### Step 4: Quality Rubric Assessment

- Score each document on Clarity, Determinism, Testability, Safety, Completeness, Maintainability

### Step 5: Safety & Stop Conditions Review

- Check for explicit safety rules, stop conditions, and fallback strategies

### Step 6: Changelog and Documentation Map

- Update changelog and documentation map to reflect changes

### Step 7: Document Findings

- Summarize maintenance actions, highlight improvements, and recommend further steps

## Self-Check Points

Before finalizing maintenance, verify:

- [ ] All documents are up-to-date and complete
- [ ] Each document scores 4+ in all Quality Rubric dimensions
- [ ] Safety and stop conditions are defined
- [ ] All links use mdc: format
- [ ] Methodology integration is referenced
- [ ] Changelog and documentation map are updated

## Methodology Integration

- **Instruction Improvement**: Use [Improve Instruction](mdc:commands/improve-instruction.md) and [Spark-Improve Instruction](mdc:commands/improve-instruction-spark.md) for systematic quality enhancement
- **Documentation Guidelines**: Follow [Documentation Guidelines](mdc:methodology/documentation-guidelines.md) for structure and cross-referencing
- **Quality Rubric**: Apply the rubric below for self-assessment

## Quality Rubric

| Dimension           | 1 (Low)         | 3 (Medium)      | 5 (High)               |
| ------------------- | --------------- | --------------- | ---------------------- |
| **Clarity**         | Unclear         | Mostly clear    | Crystal clear          |
| **Determinism**     | Ambiguous       | Some ambiguity  | Fully deterministic    |
| **Testability**     | No tests        | Basic tests     | Comprehensive tests    |
| **Safety**          | No safety rules | Basic safety    | Robust safety/fallback |
| **Completeness**    | Major gaps      | Minor gaps      | Complete coverage      |
| **Maintainability** | Hard to update  | Moderate effort | Easy to maintain       |

## Safety & Stop Conditions

- **No Hallucination**: If requirements are unclear, STOP and request clarification
- **Stop Conditions**:
  - Missing required information
  - Conflicting requirements
  - Insufficient permissions
- **Fallback**: Use default values only if explicitly allowed
- **Request Help**: If stuck, escalate to a human reviewer

## Examples

### Basic Example: Routine Documentation Review

```bash
# Review all task documents for completeness and update as needed
@maintain-documentation.md
Context: Audit all tasks for new template compliance
```

### Edge Case Example: Legacy Document with Missing Metadata

```bash
# Review a legacy document missing required metadata
@maintain-documentation.md
Context: Update old decision-2021-01-legacy.md to include summary and changelog
# Expected: Maintenance should add missing sections and update changelog
```

### Acceptance Criteria

- All documents are up-to-date and complete
- Quality rubric scores are 4+ in all dimensions
- Safety and stop conditions are defined
- Changelog and documentation map are updated
- Methodology integration is referenced

## Integration Guidelines

- Use this command as part of regular documentation review cycles
- Integrate with [Validate Documentation](mdc:commands/validate-documentation.md) for broader documentation checks
- Reference [Documentation Guidelines](mdc:methodology/documentation-guidelines.md) for best practices

## Related Documents

- [Improve Instruction](mdc:commands/improve-instruction.md)
- [Spark-Improve Instruction](mdc:commands/improve-instruction-spark.md)
- [Documentation Guidelines](mdc:methodology/documentation-guidelines.md)
- [Validate Documentation](mdc:commands/validate-documentation.md)
- [Documentation Map](mdc:navigation/documentation-map.md)

---

## Versioning & Iteration

- **Iterative Improvement**: This command should be reviewed and improved regularly using [Improve Instruction](mdc:commands/improve-instruction.md) and [Spark-Improve Instruction](mdc:commands/improve-instruction-spark.md)
- **Version Tracking**: Update the "Last Updated" line with each major change
- **Feedback**: Incorporate reviewer and user feedback in each iteration

**Last Updated**: 2025-07-25
