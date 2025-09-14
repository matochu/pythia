# Command: Update Command

> **IMPORTANT**: This command provides a structured approach for updating existing command documents based on usage experience and feedback. It is designed to be executed by an LLM and verified by a human who maintains the documentation system.

## Purpose

This command provides a systematic process for reviewing and updating existing command documents to improve their effectiveness based on practical usage experience. Regular updates to commands ensure they remain relevant, accurate, and usable, incorporating lessons learned and addressing gaps identified during real-world application.

## Prerequisites

Before updating a command document, ensure you have:

1. [ ] Identified the specific command document to update
2. [ ] Collected feedback or usage experience related to the command
3. [ ] Determined the scope of necessary changes (minor corrections vs. major restructuring)
4. [ ] Obtained the current date for proper document timestamping
5. [ ] Verified access to the project's documentation structure
6. [ ] Backed up the original command document

## Workspace Usage

This command can be used in any project workspace:

```bash
# Reference the command
@update-command.md

# Execute with project context
Execute this command for my project at [project-path]

# Example usage
@update-command.md
Context: My project's create-task command needs improvement
Objective: Update command based on user feedback
Scope: Add workspace integration and improve clarity
```

## Command Checklist

- [ ] Get current date using `date +%Y-%m-%d`
- [ ] Analyze the existing command structure and content
- [ ] Review feedback and usage experience
- [ ] Perform thorough thinking about the required changes and document results
- [ ] Develop an update plan with specific improvements
- [ ] Implement changes while maintaining consistent formatting
- [ ] Test updated instructions for clarity and completeness
- [ ] Update related documentation if needed
- [ ] Validate the updated command for completeness
- [ ] Update the last modified date

## Step 1: Analyze Existing Command

Thoroughly review the existing command document to understand its structure, purpose, and current implementation:

```bash
# Get the current date for proper timestamping
date +%Y-%m-%d

# Determine commands directory based on project structure
# For standard Pythia structure: .pythia/commands/
# For custom structure: adapt to your project's documentation layout
COMMANDS_PATH=".pythia/commands"

# Create a backup of the original command
COMMAND_NAME="command-to-update.md"
BACKUP_NAME="$COMMAND_NAME.backup-$(date +%Y%m%d)"
cp "$COMMANDS_PATH/$COMMAND_NAME" "$COMMANDS_PATH/$BACKUP_NAME"

# View the content of the command
cat "$COMMANDS_PATH/$COMMAND_NAME"
```

During analysis, identify:

1. **Command Purpose** - Is it still clear and relevant?
2. **Structure** - Does it follow the standard template?
3. **Completeness** - Are there missing sections or details?
4. **Accuracy** - Is all information still correct?
5. **Readability** - Is the command easy to understand and follow?

## Step 2: Review Feedback and Experience

Gather and organize feedback about the command's effectiveness:

```bash
# Create a temporary file for feedback notes
FEEDBACK_FILE="command_feedback_notes.md"
touch "$FEEDBACK_FILE"

# List feedback sources and experience points here
```

Consider the following feedback sources:

- Direct user feedback
- Issues encountered during execution
- Efficiency of the process
- Common questions asked
- Parts that frequently need clarification
- Changes in the underlying systems or processes

Organize feedback into categories:

- Critical issues (preventing successful execution)
- Usability issues (making execution difficult)
- Enhancement requests (making execution more efficient)
- Clarification needs (making instructions clearer)

## Step 3: LLM Reasoning and Analysis

As an LLM updating a command document, dedicate specific attention to reasoning about the required changes:

1. **Gap Analysis** - Identify differences between the current command and ideal state
2. **Prioritization** - Determine which changes will have the highest impact
3. **Audience Impact** - Consider how changes will affect different user types
4. **Consistency** - Ensure changes maintain consistency with other commands
5. **Backward Compatibility** - Consider if changes might break existing workflows

Document your reasoning in a clear, structured format that explains:

- Why each change is necessary
- How it improves the command
- Any potential impacts or trade-offs

This analysis will help the human reviewer understand your thought process and the rationale behind proposed changes.

## Step 4: Develop Update Plan

Create a structured plan for the command updates:

```markdown
## Update Plan for [Command Name]

### Critical Changes

- [Change 1] - [Reason]
- [Change 2] - [Reason]

### Enhancement Changes

- [Enhancement 1] - [Benefit]
- [Enhancement 2] - [Benefit]

### Structural Improvements

- [Improvement 1] - [Reason]
- [Improvement 2] - [Reason]

### Content Additions

- [Addition 1] - [Purpose]
- [Addition 2] - [Purpose]
```

Ensure the plan:

- Addresses all identified issues
- Maintains the command's original purpose
- Follows the standard command structure
- Improves clarity and usability

## Step 5: Implement Changes

Update the command document with the planned changes:

```bash
# Read configuration
CONFIG_PATH="../config.json"
PROJECT_ROOT=$(jq -r '.project_root' $CONFIG_PATH)
DOCS_PATH=$(jq -r '.docs_path' $CONFIG_PATH)

# Update the command file
# This will be done by editing the file directly
```

When implementing changes:

1. **Preserve Structure** - Maintain the standard command structure
2. **Use Consistent Formatting** - Follow existing formatting conventions
3. **Preserve Working Elements** - Don't change parts that work well
4. **Update Bash Scripts** - Ensure all scripts use paths from config.json
5. **Update Examples** - Ensure examples reflect current best practices
6. **Update Last Modified Date** - Change the date at the bottom of the document

## Step 6: Validate the Updated Command

Verify that the updated command is complete and functional:

```bash
# Read configuration
CONFIG_PATH="../config.json"
PROJECT_ROOT=$(jq -r '.project_root' $CONFIG_PATH)
DOCS_PATH=$(jq -r '.docs_path' $CONFIG_PATH)

# Validate documentation links
npm run docs:validate-links

# Compare with original to verify all needed content is preserved
diff "$PROJECT_ROOT$DOCS_PATH/commands/$BACKUP_NAME" "$PROJECT_ROOT$DOCS_PATH/commands/$COMMAND_NAME"
```

Check that:

1. All links are functional
2. The command follows the standard format
3. All sections are properly filled
4. Examples are practical and correct
5. Steps are clear and complete
6. All planned changes have been implemented
7. The last modified date has been updated

## Examples

### Basic Command Update

```bash
# Get current date
date +%Y-%m-%d
# Output: 2025-03-22

# Read configuration
CONFIG_PATH="../config.json"
PROJECT_ROOT=$(jq -r '.project_root' $CONFIG_PATH)
DOCS_PATH=$(jq -r '.docs_path' $CONFIG_PATH)

# Backup existing command
cp "$PROJECT_ROOT$DOCS_PATH/commands/create-task.md" "$PROJECT_ROOT$DOCS_PATH/commands/create-task.md.backup-20250322"

# Update command with minor improvements
# - Clarify prerequisites
# - Add missing example for edge case
# - Update bash scripts to use config.json
# - Fix broken links
```

### Major Command Restructuring

```bash
# Read configuration
CONFIG_PATH="../config.json"
PROJECT_ROOT=$(jq -r '.project_root' $CONFIG_PATH)
DOCS_PATH=$(jq -r '.docs_path' $CONFIG_PATH)

# Create a comprehensive update plan for a command requiring major changes
# - Complete restructuring of steps
# - Addition of new validation section
# - Update of all examples
# - Creation of troubleshooting guide
# - Integration with new system components
```

## Common Issues and Solutions

| Issue                                | Solution                                                                                        |
| ------------------------------------ | ----------------------------------------------------------------------------------------------- |
| Updates break backward compatibility | Maintain original functionality while extending capabilities; document breaking changes clearly |
| Inconsistent structure after updates | Refer to command-template.md to ensure consistent structure is maintained                       |
| Loss of important information        | Compare with backup to ensure all valuable content is preserved                                 |
| Unclear when updates are needed      | Look for recurring questions, confusion, or inefficiencies as indicators                        |
| Scope creep during updates           | Define clear boundaries for the update and focus on addressing specific issues                  |
| Command becomes too complex          | Consider splitting into multiple commands if different concerns can be separated                |

## Related Documents

- [Command Template](../templates/command-template.md)
- [Create Command](./create-command.md)
- [Documentation Guidelines](../methodology/documentation-guidelines.md)
- [Validate Documentation](./validate-documentation.md)

---

**Last Updated**: 2025-03-22
