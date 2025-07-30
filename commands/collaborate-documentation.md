# Command: Collaborate Documentation

> **IMPORTANT**: This command provides a systematic, production-ready process for enabling and managing team-based collaboration on documentation. It is designed for use by LLMs and human reviewers to ensure collaborative workflows are clear, safe, and effective.

## Quick Reference

- **Purpose**: Enable and manage team-based collaboration on documentation (review, feedback, co-editing, merge, conflict resolution)
- **Key Steps**: Preparation → Checklist → Quality Rubric → Safety → Examples → Integration
- **Self-Check**: Use the Self-Check Points section before finalizing
- **Methodology**: Integrate Spark and Slow Thinking principles for quality
- **Safety**: Stop and request clarification if requirements are unclear

## Purpose

This command ensures that collaborative documentation workflows (review, feedback, co-editing, merge, conflict resolution) are clear, safe, and effective. It provides a structured process for managing contributions from multiple team members and LLMs.

## Prerequisites

Before collaborating on documentation, ensure you have:

1. [ ] Identified the documentation and collaborators involved
2. [ ] Access to the latest project and Pythia base documentation
3. [ ] Familiarity with collaboration tools and version control (e.g., Git, PRs)
4. [ ] Access to [Improve Instruction](mdc:commands/improve-instruction.md) and [Spark-Improve Instruction](mdc:commands/improve-instruction-spark.md)

## Workspace Usage

This command can be used in any project workspace:

```bash
# Reference the command
@collaborate-documentation.md

# Execute with project context
Execute this command for my project at [project-path]

# Example usage
@collaborate-documentation.md
Context: Organize a team review and merge for the new API documentation
```

## Command Checklist

- [ ] Identify documentation and collaborators
- [ ] Set up review and feedback process (assign reviewers, deadlines)
- [ ] Establish co-editing and merge workflow (branching, PRs, conflict resolution)
- [ ] Apply latest templates and best practices from Pythia base
- [ ] Score collaborative process using the Quality Rubric
- [ ] Verify safety and stop conditions are defined
- [ ] Ensure all links use mdc: format
- [ ] Reference methodology integration
- [ ] Document findings and improvement actions

## Step-by-Step Execution

### Step 1: Preparation

- Identify documentation and collaborators
- Set up communication channels (e.g., chat, comments, PRs)

### Step 2: Review and Feedback

- Assign reviewers and set deadlines
- Collect and address feedback using comments or suggestions

### Step 3: Co-Editing and Merge

- Use version control (branches, PRs) for parallel editing
- Resolve merge conflicts and document decisions

### Step 4: Quality Rubric Assessment

- Score the collaborative process and resulting documentation on Clarity, Determinism, Testability, Safety, Completeness, Maintainability

### Step 5: Safety & Stop Conditions Review

- Check for explicit safety rules, stop conditions, and fallback strategies

### Step 6: Document Findings

- Summarize collaboration outcomes, highlight improvements, and recommend further steps

## Self-Check Points

Before finalizing collaboration, verify:

- [ ] All feedback is addressed and documented
- [ ] Merge conflicts are resolved and decisions are recorded
- [ ] Each document scores 4+ in all Quality Rubric dimensions
- [ ] Safety and stop conditions are defined
- [ ] All links use mdc: format
- [ ] Methodology integration is referenced

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

### Basic Example: Team Review and Merge

```bash
# Organize a team review and merge for new API documentation
@collaborate-documentation.md
Context: Assign reviewers, collect feedback, and merge changes
```

### Edge Case Example: Merge Conflict During Co-Editing

```bash
# Resolve a merge conflict between two contributors
@collaborate-documentation.md
Context: Two team members edited the same section of the API docs
# Expected: Collaboration should resolve the conflict and document the decision
```

### Acceptance Criteria

- All feedback is addressed and documented
- Merge conflicts are resolved and decisions are recorded
- Quality rubric scores are 4+ in all dimensions
- Safety and stop conditions are defined
- Methodology integration is referenced

## Integration Guidelines

- Use this command as part of regular documentation review and collaboration cycles
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
