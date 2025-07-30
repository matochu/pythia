# Command: Validate Command

> **IMPORTANT**: This command provides a systematic, production-ready process for validating the quality, completeness, and production-readiness of command documents. It is designed for use by LLMs and human reviewers to ensure all commands meet the highest standards of clarity, safety, testability, and maintainability.

## Quick Reference

- **Purpose**: Validate command documents for structure, quality, safety, and readiness
- **Key Steps**: Preparation → Checklist → Quality Rubric → Safety → Examples → Integration
- **Self-Check**: Use the Self-Check Points section before finalizing
- **Methodology**: Integrate Spark and Slow Thinking principles for quality
- **Safety**: Stop and request clarification if requirements are unclear

## Purpose

This command ensures that all command documents in the documentation system are clear, complete, deterministic, safe, and ready for production use. It applies a comprehensive validation process, including structure checks, quality rubric scoring, safety assessment, and test case verification.

## Prerequisites

Before validating a command document, ensure you have:

1. [ ] Identified the target command document to validate
2. [ ] Access to the latest version of the command
3. [ ] Familiarity with the project's documentation standards
4. [ ] Access to [Improve Instruction](mdc:commands/improve-instruction.md) and [Spark-Improve Instruction](mdc:commands/improve-instruction-spark.md)

## Workspace Usage

This command can be used in any project workspace:

```bash
# Reference the command
@validate-command.md

# Execute with project context
Execute this command for my project at [project-path]

# Example usage
@validate-command.md
Context: Validate the new deploy-production-release.md command for production readiness
```

## Command Checklist

- [ ] Review the target command for all required sections
- [ ] Score the command using the Quality Rubric
- [ ] Check for clear, actionable, and testable steps
- [ ] Verify safety and stop conditions are defined
- [ ] Ensure all links use mdc: format
- [ ] Confirm at least one edge case and acceptance criteria are included
- [ ] Reference methodology integration
- [ ] Document findings and improvement recommendations

## Step-by-Step Execution

### Step 1: Preparation

- Identify the command document to validate
- Gather all related documentation and templates

### Step 2: Structure and Completeness Check

- Ensure all required sections are present (Purpose, Prerequisites, Usage, Checklist, Steps, Examples, Issues, References, etc.)

### Step 3: Quality Rubric Assessment

- Score the command on Clarity, Determinism, Testability, Safety, Completeness, Maintainability (see rubric below)

### Step 4: Safety & Stop Conditions Review

- Check for explicit safety rules, stop conditions, and fallback strategies

### Step 5: Examples and Acceptance Criteria

- Verify the presence of at least one edge case and clear acceptance criteria

### Step 6: Methodology Integration

- Confirm references to [Improve Instruction](mdc:commands/improve-instruction.md), [Spark-Improve Instruction](mdc:commands/improve-instruction-spark.md), and [Documentation Guidelines](mdc:methodology/documentation-guidelines.md)

### Step 7: Document Findings

- Summarize validation results, highlight gaps, and recommend improvements

## Self-Check Points

Before finalizing validation, verify:

- [ ] All required sections are present in the target command
- [ ] Each step is clear, actionable, and testable
- [ ] Safety and stop conditions are defined
- [ ] Quality rubric scores are 4+ in all dimensions
- [ ] All links use mdc: format
- [ ] At least one edge case and acceptance criteria are included
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

### Basic Example: Validating a Standard Command

```bash
# Validate a new command for updating dependencies
@validate-command.md
Context: Validate update-dependencies.md for completeness and safety
```

### Edge Case Example: Command Missing Safety Section

```bash
# Validate a command that lacks explicit safety rules
@validate-command.md
Context: Validate deploy-production-release.md (missing Safety & Stop Conditions)
# Expected: Validation should fail and recommend adding safety section
```

### Acceptance Criteria

- All required sections are present and filled
- Quality rubric scores are 4+ in all dimensions
- Safety and stop conditions are defined
- At least one edge case is documented
- Methodology integration is referenced

## Integration Guidelines

- Use this command as part of the documentation review and quality assurance workflow
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
