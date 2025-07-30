# Command: Create Command

> **IMPORTANT**: This command provides step-by-step instructions for creating new command documents that follow the project's standardized format. Command documents serve as detailed guides for executing specific tasks with consistency. This command is designed to be executed by an LLM and verified by a human who maintains the documentation system.

## Purpose

This command provides a structured approach to creating new command documents in the project's documentation system. Standardized commands improve consistency, reduce errors, and make processes repeatable across the team. The LLM should use this command to generate new command documents, which will then be reviewed by a human documentation maintainer.

## Quick Reference

- **Purpose**: Create new command documents in a standardized, production-ready format
- **Key Steps**: Preparation → Template → Reasoning → Structure → Examples → Validation → Integration
- **Self-Check**: Use the Self-Check Points section before finalizing
- **Methodology**: Integrate Spark and Slow Thinking principles for quality
- **Safety**: Stop and request clarification if requirements are unclear

## Self-Check Points

Before finalizing a new command, verify:

- [ ] All required sections are present (Purpose, Prerequisites, Usage, Checklist, Steps, Examples, Issues, References)
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

## Prerequisites

Before creating a new command document, ensure you have:

1. [ ] Clearly defined the purpose and steps of the command
2. [ ] Identified the target audience (developers, LLMs, technical writers)
3. [ ] Determined the command's scope and limitations
4. [ ] Obtained the current date for proper document timestamping
5. [ ] Identified related documentation and dependencies
6. [ ] Verified access to the project's documentation structure

## Workspace Usage

This command can be used in any project workspace:

```bash
# Reference the command
@create-command.md

# Execute with project context
Execute this command for my project at [project-path]

# Example usage
@create-command.md
Context: My project needs a new command for API documentation
Objective: Create a command that generates API documentation
Target Audience: Developers and technical writers
Scope: REST API documentation generation
```

## Command Checklist

- [ ] Get current date using `date +%Y-%m-%d`
- [ ] Define clear command title and purpose
- [ ] List all prerequisites needed before execution
- [ ] Create a comprehensive checklist of steps
- [ ] Perform thorough thinking about the task and after document results
- [ ] Detail each step with instructions and examples
- [ ] Provide practical usage examples
- [ ] Document common issues and solutions
- [ ] Add references to related documentation
- [ ] Validate the command for completeness
- [ ] Update the documentation map

## Step 1: Prepare for Command Creation

Before starting, gather necessary information:

```bash
# Get the current date for proper timestamping
date +%Y-%m-%d

# Determine commands directory based on project structure
# For standard Pythia structure: docs/commands/
# For custom structure: adapt to your project's documentation layout
COMMANDS_PATH="docs/commands"

# Create directory if it doesn't exist
mkdir -p "$COMMANDS_PATH"

# Review existing commands for reference
ls -la "$COMMANDS_PATH"
```

Determine the following:

1. Command name (should be descriptive and action-oriented)
2. Primary purpose (what task does it accomplish)
3. Target audience (who will use this command)
4. Required skill level (beginner, intermediate, advanced)

> **NOTE**: Always verify with the human documentation maintainer if there are any doubts about the target audience or command purpose. When in doubt, explicitly ask for clarification.

## Step 2: Create the Command File

Create a new file in the commands directory using kebab-case:

```bash
# Create the command file
touch "$COMMANDS_PATH/command-name.md"
```

## Step 3: Use the Command Template

Copy content from the command template and adapt it to your specific command:

````bash
# Determine templates directory
TEMPLATES_PATH="docs/templates"

# Copy template if available
if [ -f "$TEMPLATES_PATH/command-template.md" ]; then
    cat "$TEMPLATES_PATH/command-template.md" > "$COMMANDS_PATH/command-name.md"
else
    # Create basic structure if template doesn't exist
    cat > "$COMMANDS_PATH/command-name.md" << 'EOF'
# Command: [Command Name]

> **IMPORTANT**: [Brief description of what this command does]

## Purpose

[Clear description of the command's purpose and benefits]

## Prerequisites

[List of requirements before executing this command]

## Workspace Usage

This command can be used in any project workspace:

```bash
# Reference the command
@command-name.md

# Execute with project context
Execute this command for my project at [project-path]

# Example usage
@command-name.md
Context: [Project context]
Objective: [Specific objective]
Requirements: [Key requirements]
````

EOF
fi

````

> **IMPORTANT**: Always use relative paths and adapt to your project's documentation structure. This ensures the command works in any workspace.

When filling in the template:

1. **Be concise but complete** - Include all necessary information without redundancy
2. **Use active voice** - Write instructions as direct actions
3. **Include practical examples** - Show real-world applications
4. **Add error handling** - Document common issues and solutions
5. **Link related resources** - Connect to other relevant documentation

## Step 4: LLM Reasoning and Analysis

As an LLM creating a command document, dedicate specific attention to reasoning about the command. This mandatory step should include:

1. **Task Analysis** - Break down the main task into logical components
2. **Edge Case Identification** - Consider unusual scenarios or potential issues
3. **Audience Adaptation** - Analyze how to adapt content for the target audience
4. **Execution Flow** - Document the logical flow of execution
5. **Dependencies and Constraints** - Identify system dependencies and constraints

Document your reasoning in a clear, structured format to demonstrate understanding of the task. This will improve the quality of the resulting command and help the human reviewer provide more targeted feedback.

## Step 5: Structure the Command Steps

Organize the command steps logically, following these principles:

1. **Sequential ordering** - Steps should follow a logical sequence
2. **Independent when possible** - Each step should be self-contained
3. **Verification points** - Include checks to confirm successful completion
4. **Error recovery** - Provide guidance for handling failures
5. **Clear progress indicators** - Use checkboxes for tracking completion

Example structure:

```markdown
## Step 1: Preparation

Actions to prepare for the main task.

## Step 2: Main Operation

Core actions that accomplish the primary purpose.

## Step 3: Verification

Steps to verify successful completion.

## Step 4: Integration

How to integrate this work with the broader system.
````

## Step 6: Add Examples and Edge Cases

Include at least two examples:

1. A basic example showing the simplest use case
2. An advanced example demonstrating more complex scenarios

Also add a section for common issues and solutions:

```markdown
## Common Issues and Solutions

| Issue                               | Solution                                                            |
| ----------------------------------- | ------------------------------------------------------------------- |
| Command fails with permission error | Ensure you have the necessary permissions with `chmod +x script.sh` |
| Resources not found                 | Verify paths in config.json and check if files exist                |
```

## Step 7: Validate and Integrate

Validate the new command:

```bash
# Read configuration
CONFIG_PATH="../config.json"
PROJECT_ROOT=$(jq -r '.project_root' $CONFIG_PATH)
DOCS_PATH=$(jq -r '.docs_path' $CONFIG_PATH)

# Validate documentation links
npm run docs:validate-links

# Update documentation map
npm run docs:update-map
```

Check that:

1. All links are functional
2. The command follows the standard format
3. All sections are properly filled
4. Examples are practical and correct
5. Steps are clear and complete

## Examples

### Basic Example: Creating a Simple Command

```bash
# Get current date
date +%Y-%m-%d
# Create command file
touch docs/commands/update-dependencies.md
# Copy template and fill in sections
```

### Edge Case Example: Command for a Non-Standard Directory

```bash
# Custom structure
touch custom_docs/commands/special-case.md
# Adapt all paths and references accordingly
```

### Acceptance Criteria

- Command file is created in the correct location
- All required sections are present and filled
- Self-check points are completed
- Quality rubric scores are 4+ in all dimensions
- Safety and stop conditions are defined
- At least one edge case is documented

## Common Issues and Solutions

| Issue                          | Solution                                                                         |
| ------------------------------ | -------------------------------------------------------------------------------- |
| Command steps are too granular | Consolidate related steps; aim for 3-7 main steps with sub-steps as needed       |
| Missing prerequisites          | Review the command with someone unfamiliar with it to identify assumed knowledge |
| Unclear success criteria       | Add specific verification steps that confirm successful completion               |
| Too technical for audience     | Adjust language and detail level to match the target audience's expertise        |
| Command becomes outdated       | Include maintenance notes and schedule regular reviews                           |
| LLM lacks context              | Request specific information from the human reviewer when needed                 |

## Related Documents

- [Command Template](mdc:templates/command-template.md)
- [Documentation Guidelines](mdc:methodology/documentation-guidelines.md)
- [Validate Documentation](mdc:commands/validate-documentation.md)
- [Documentation Map](mdc:navigation/documentation-map.md)

---

**Last Updated**: 2025-03-22

## Versioning & Iteration

- **Iterative Improvement**: Commands should be reviewed and improved regularly using [Improve Instruction](mdc:commands/improve-instruction.md) and [Spark-Improve Instruction](mdc:commands/improve-instruction-spark.md)
- **Version Tracking**: Update the "Last Updated" line with each major change
- **Feedback**: Incorporate reviewer and user feedback in each iteration
