import { MCPPrompt } from 'mcp-framework';
import { z } from 'zod';

class CreateTaskPrompt extends MCPPrompt {
  name = 'create_task_prompt';
  description =
    'Generate comprehensive task creation instructions based on Pythia methodology';

  schema = {
    taskName: {
      type: z.string(),
      description: "Name of the task to create",
      required: true,
    },
    description: {
      type: z.string(),
      description: "Brief description of what needs to be done",
      required: true,
    },
    priority: {
      type: z.enum(['low', 'medium', 'high', 'critical']),
      description: "Task priority level",
      required: false,
    },
    complexity: {
      type: z.enum(['low', 'medium', 'high']),
      description: "Task complexity level",
      required: false,
    },
    category: {
      type: z.string(),
      description: "Category or domain of the task",
      required: false,
    },
    relatedDocs: {
      type: z.array(z.string()),
      description: "List of related documents or contexts",
      required: false,
    },
    projectPath: {
      type: z.string(),
      description: "Path to the project where task will be created",
      required: false,
    }
  };

  async generateMessages(input: any) {
    const {
      taskName,
      description,
      priority,
      complexity,
      category,
      relatedDocs,
      projectPath
    } = input;

    const currentDate = new Date().toISOString().split('T')[0];
    const taskSlug = taskName.toLowerCase().replace(/\s+/g, '-');

    const prompt = `# Create Task Document: ${taskName}

## Task Overview
**Description**: ${description}
**Priority**: ${priority}
**Complexity**: ${complexity}
**Category**: ${category || 'General'}
**Date**: ${currentDate}
${projectPath ? `**Project Path**: ${projectPath}` : ''}

## Step-by-Step Instructions

### Step 1: Prepare for Task Creation

\`\`\`bash
# Get the current date for proper timestamping
date +%Y-%m-%d

# Determine tasks directory based on project structure
TASKS_PATH=".pythia/workflows/tasks"
${projectPath ? `# For custom project: ${projectPath}/docs/tasks` : ''}

# Create directory if it doesn't exist
mkdir -p "$TASKS_PATH"

# List existing tasks to avoid duplication
ls -la "$TASKS_PATH"

# Search for similar tasks
grep -r "${taskName.toLowerCase()}" "$TASKS_PATH" || echo "No similar tasks found"
\`\`\`

### Step 2: Context Document Integration

${
  relatedDocs.length > 0
    ? `
**Related Documents:**
${relatedDocs.map((doc) => `- ${doc}`).join('\n')}

\`\`\`bash
# Search for relevant context documents
CONTEXTS_PATH=".pythia/contexts"
find "$CONTEXTS_PATH" -type f -name "*.md" -exec grep -l "${taskName.toLowerCase()}" {} \\;

# Review context documents for insights
${relatedDocs.map((doc) => `cat "$CONTEXTS_PATH/${doc}"`).join('\n')}
\`\`\`
`
    : `
\`\`\`bash
# Search for relevant context documents
CONTEXTS_PATH=".pythia/contexts"
find "$CONTEXTS_PATH" -type f -name "*.md" -exec grep -l "${taskName.toLowerCase()}" {} \\;

# If no relevant contexts exist, create minimal context
# Use @create-context.md command for context creation
\`\`\`
`
}

### Step 3: Create Task File

\`\`\`bash
# Create new task file with proper naming
TASK_NAME="${taskSlug}"
CURRENT_DATE=$(date +%Y-%m)
TASK_FILE="$TASKS_PATH/task-$CURRENT_DATE-$TASK_NAME.md"
touch "$TASK_FILE"
echo "Created: $TASK_FILE"
\`\`\`

### Step 4: Task Document Structure

Create the task document with this structure:

\`\`\`markdown
---
title: "${taskName}"
type: task
category: ${category || 'general'}
priority: ${priority}
complexity: ${complexity}
created: ${currentDate}
lastUpdated: ${currentDate}
status: draft
tags: [task, ${category?.toLowerCase() || 'general'}, ${taskSlug}]
relatedContexts: [${relatedDocs.map((doc) => `"${doc}"`).join(', ')}]
---

# Task: ${taskName}

## Summary
${description}

## Context
[Describe the background and why this task is needed]

## Objectives
[Define specific, measurable goals]

## Scope
**In Scope:**
- [Define what is included]

**Out of Scope:**
- [Define what is excluded]

## Implementation Plan

### Phase 1: Planning (Complexity: Low)
- [ ] Define detailed requirements
- [ ] Identify dependencies
- [ ] Create technical approach

### Phase 2: Implementation (Complexity: ${complexity})
- [ ] [Specific implementation step 1]
- [ ] [Specific implementation step 2]
- [ ] [Specific implementation step 3]

### Phase 3: Testing & Validation (Complexity: Medium)
- [ ] Unit testing
- [ ] Integration testing
- [ ] User acceptance testing

### Phase 4: Documentation & Deployment (Complexity: Low)
- [ ] Update documentation
- [ ] Deploy to production
- [ ] Monitor and validate

## Success Criteria
- [ ] [Specific, measurable success criterion 1]
- [ ] [Specific, measurable success criterion 2]
- [ ] [Specific, measurable success criterion 3]

## Dependencies
${
  relatedDocs.length > 0
    ? relatedDocs.map((doc) => `- [${doc}](mdc:contexts/${doc})`).join('\n')
    : '- [List any dependencies]'
}

## Risks and Mitigation
- **Risk 1**: [Description] → **Mitigation**: [Solution]
- **Risk 2**: [Description] → **Mitigation**: [Solution]

## Quality Control
- [ ] Run AI Solution Analysis (use @analyze-ai-solutions.md)
- [ ] Self-review process
- [ ] Code review
- [ ] Documentation review

## Progress Tracking
- [ ] Planning completed
- [ ] Implementation started
- [ ] Testing completed
- [ ] Documentation updated
- [ ] Task completed

## Implementation Summary
[To be filled after completion]

## References

### Core Management
- [Manage Task](mdc:commands/manage-task.md) - Task management workflow
- [Task Template](mdc:templates/task-template.md) - Template reference

### Context Integration
- [Create Context Document](mdc:commands/create-context.md) - Context creation
${
  relatedDocs.length > 0
    ? relatedDocs
        .map((doc) => `- [${doc}](mdc:contexts/${doc}) - Related context`)
        .join('\n')
    : ''
}

## Status History
| Date       | Status    | Notes                   |
| ---------- | --------- | ----------------------- |
| ${currentDate} | New       | Initial creation        |
\`\`\`

### Step 5: Validation and Verification

\`\`\`bash
# Validate task uniqueness
grep -r "${taskName}" "$TASKS_PATH" | grep -v "$TASK_FILE"

# Validate documentation links
npm run docs:validate-links

# Check documentation coverage
npm run docs:check-coverage
\`\`\`

### Step 6: Generate Workflows Report

\`\`\`bash
# Update workflows status report
@report-workflows.md
\`\`\`

## Command Checklist
- [ ] Current date obtained
- [ ] Task uniqueness validated
- [ ] Context documents reviewed
- [ ] Task file created with proper naming: task-YYYY-MM-${taskSlug}.md
- [ ] All template sections filled
- [ ] Implementation plan created with phases
- [ ] Success criteria defined
- [ ] Dependencies identified
- [ ] Cross-references added
- [ ] Documentation validated
- [ ] Workflows report generated

## Self-Validation Checklist
- [ ] **Language Check**: Document is in English
- [ ] **Completeness**: All required sections filled
- [ ] **Scope Clarity**: Clear in-scope/out-of-scope boundaries
- [ ] **Actionable Steps**: Implementation steps are specific
- [ ] **Success Criteria**: Measurable and objective
- [ ] **Dependencies**: All dependencies identified
- [ ] **Risk Assessment**: Risks and mitigations documented
- [ ] **Consistency**: Aligns with project standards
- [ ] **Formatting**: Consistent Markdown formatting
- [ ] **Context Integration**: Proper context document references

---
*Generated by Pythia Create Task Prompt on ${currentDate}*`;

    return [
      {
        role: 'user',
        content: {
          type: 'text',
          text: prompt
        }
      }
    ];
  }

}

export default CreateTaskPrompt;
