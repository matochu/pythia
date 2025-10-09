import { MCPPrompt } from 'mcp-framework';
import { z } from 'zod';

class ManageTaskPrompt extends MCPPrompt {
  name = 'manage_task_prompt';
  description =
    'Generate comprehensive task management instructions with full workflow support';

  schema = {
    action: {
      type: z.enum([
        'create',
        'update',
        'list',
        'archive',
        'status',
        'analyze',
        'track',
        'report'
      ]),
      description: "Task management action to perform",
      required: true,
    },
    taskName: {
      type: z.string(),
      description: "Name of the task",
      required: false,
    },
    taskId: {
      type: z.string(),
      description: "Task ID for specific operations",
      required: false,
    },
    projectPath: {
      type: z.string(),
      description: "Project path for context",
      required: false,
    },
    includeContext: {
      type: z.boolean(),
      description: "Include context document integration",
      required: false,
    },
    generateReport: {
      type: z.boolean(),
      description: "Generate detailed report",
      required: false,
    },
    dryRun: {
      type: z.boolean(),
      description: "Show what would be done without making changes",
      required: false,
    }
  };

  async generateMessages(input: any) {
    const {
      action,
      taskName,
      taskId,
      projectPath,
      includeContext,
      generateReport,
      dryRun
    } = input;

    const currentDate = new Date().toISOString().split('T')[0];

    const prompt = `# Task Management: ${
      action.charAt(0).toUpperCase() + action.slice(1)
    } ${taskName || taskId || 'Tasks'}

## Management Overview
**Action**: ${action}
**Task**: ${taskName || taskId || 'Multiple'}
**Date**: ${currentDate}
${projectPath ? `**Project Path**: ${projectPath}` : ''}
${dryRun ? '**Mode**: Dry Run (Preview only)' : ''}

## Step-by-Step Management Instructions

### Step 1: Task Discovery and Analysis

\`\`\`bash
# Determine tasks directory
TASKS_PATH=".pythia/workflows/tasks"
${projectPath ? `TASKS_PATH="${projectPath}/$TASKS_PATH"` : ''}

# List all tasks for context
echo "=== All Tasks ==="
ls -la "$TASKS_PATH" 2>/dev/null || echo "No tasks directory found"

# Find specific task if ID provided
${
  taskId
    ? `echo "=== Task: $taskId ==="
find "$TASKS_PATH" -name "*${taskId}*" -type f 2>/dev/null`
    : ''
}

# Get task statistics
echo "=== Task Statistics ==="
find "$TASKS_PATH" -name "*.md" -type f | wc -l | xargs echo "Total tasks:"
grep -r "status:" "$TASKS_PATH" 2>/dev/null | grep -c "completed" | xargs echo "Completed:"
grep -r "status:" "$TASKS_PATH" 2>/dev/null | grep -c "in-progress" | xargs echo "In Progress:"
grep -r "status:" "$TASKS_PATH" 2>/dev/null | grep -c "blocked" | xargs echo "Blocked:"
\`\`\`

${
  action === 'create'
    ? `
### Step 2: Task Creation Workflow

\`\`\`bash
# Use create-task-prompt for detailed creation
# This will generate comprehensive task creation instructions
echo "=== Task Creation Process ==="
echo "1. Use @create-task-prompt for detailed instructions"
echo "2. Follow the generated workflow"
echo "3. Validate task structure"
echo "4. Update task tracking"
\`\`\`
`
    : action === 'update'
    ? `
### Step 2: Task Update Workflow

\`\`\`bash
# Locate task file
TASK_FILE=$(find "$TASKS_PATH" -name "*${
        taskId || taskName
      }*" -type f | head -1)
if [ -z "$TASK_FILE" ]; then
  echo "Task not found: ${taskId || taskName}"
  exit 1
fi

echo "=== Updating Task: $TASK_FILE ==="

# Backup current task
cp "$TASK_FILE" "$TASK_FILE.backup.$(date +%Y%m%d_%H%M%S)"

# Update task metadata
if [ -n "$status" ]; then
  sed -i.bak "s/status: .*/status: $status/" "$TASK_FILE"
  echo "Updated status to: $status"
fi

if [ -n "$priority" ]; then
  sed -i.bak "s/priority: .*/priority: $priority/" "$TASK_FILE"
  echo "Updated priority to: $priority"
fi

# Update lastUpdated date
sed -i.bak "s/lastUpdated: .*/lastUpdated: $currentDate/" "$TASK_FILE"
echo "Updated lastUpdated to: $currentDate"
\`\`\`
`
    : action === 'list'
    ? `
### Step 2: Task Listing and Filtering

\`\`\`bash
# List tasks with details
echo "=== Task List ==="
for task in "$TASKS_PATH"/*.md; do
  if [ -f "$task" ]; then
    echo "---"
    echo "File: $(basename "$task")"
    echo "Title: $(grep "^# Task:" "$task" | head -1 | sed 's/# Task: //')"
    echo "Status: $(grep "^status:" "$task" | head -1 | sed 's/status: //')"
    echo "Priority: $(grep "^priority:" "$task" | head -1 | sed 's/priority: //')"
    echo "Created: $(grep "^created:" "$task" | head -1 | sed 's/created: //')"
    echo "Last Updated: $(grep "^lastUpdated:" "$task" | head -1 | sed 's/lastUpdated: //')"
  fi
done

# Filter by status
echo "=== Tasks by Status ==="
for status in not-started in-progress under-review blocked completed; do
  count=$(grep -r "status: $status" "$TASKS_PATH" 2>/dev/null | wc -l)
  echo "$status: $count"
done
\`\`\`
`
    : action === 'archive'
    ? `
### Step 2: Task Archiving Workflow

\`\`\`bash
# Create archive directory
ARCHIVE_DIR="$TASKS_PATH/../archive"
mkdir -p "$ARCHIVE_DIR"

# Archive completed tasks
echo "=== Archiving Completed Tasks ==="
for task in "$TASKS_PATH"/*.md; do
  if [ -f "$task" ]; then
    if grep -q "status: completed" "$task"; then
      echo "Archiving: $(basename "$task")"
      mv "$task" "$ARCHIVE_DIR/"
    fi
  fi
done

# Archive old tasks (older than 6 months)
echo "=== Archiving Old Tasks ==="
find "$TASKS_PATH" -name "*.md" -type f -mtime +180 -exec mv {} "$ARCHIVE_DIR/" \\;
\`\`\`
`
    : action === 'analyze'
    ? `
### Step 2: Task Analysis Workflow

\`\`\`bash
# Use analyze-task-prompt for detailed analysis
echo "=== Task Analysis Process ==="
echo "1. Use @analyze-task-prompt for detailed analysis"
echo "2. Review task quality and completeness"
echo "3. Check dependencies and context integration"
echo "4. Generate improvement recommendations"
\`\`\`
`
    : action === 'track'
    ? `
### Step 2: Task Tracking Workflow

\`\`\`bash
# Generate progress tracking report
echo "=== Task Progress Tracking ==="
echo "Date: $currentDate"
echo ""

# Track by phase
echo "=== Progress by Phase ==="
for phase in "Phase 1" "Phase 2" "Phase 3" "Phase 4"; do
  echo "$phase:"
  grep -r "$phase" "$TASKS_PATH" 2>/dev/null | grep -c "\\[x\\]" | xargs echo "  Completed:"
  grep -r "$phase" "$TASKS_PATH" 2>/dev/null | grep -c "\\[ \\]" | xargs echo "  Pending:"
done

# Track by complexity
echo "=== Progress by Complexity ==="
for complexity in low medium high; do
  count=$(grep -r "complexity: $complexity" "$TASKS_PATH" 2>/dev/null | wc -l)
  completed=$(grep -r "complexity: $complexity" "$TASKS_PATH" 2>/dev/null | xargs grep -l "status: completed" | wc -l)
  echo "$complexity: $completed/$count completed"
done
\`\`\`
`
    : action === 'report'
    ? `
### Step 2: Task Reporting Workflow

\`\`\`bash
# Generate comprehensive task report
REPORT_FILE="$TASKS_PATH/../reports/task-report-$currentDate.md"
mkdir -p "$(dirname "$REPORT_FILE")"

echo "=== Generating Task Report ==="
cat > "$REPORT_FILE" << EOF
# Task Management Report

**Generated**: $currentDate
**Project**: ${projectPath || 'Current'}

## Executive Summary
$(find "$TASKS_PATH" -name "*.md" -type f | wc -l) total tasks
$(grep -r "status: completed" "$TASKS_PATH" 2>/dev/null | wc -l) completed
$(grep -r "status: in-progress" "$TASKS_PATH" 2>/dev/null | wc -l) in progress
$(grep -r "status: blocked" "$TASKS_PATH" 2>/dev/null | wc -l) blocked

## Task Breakdown
$(for task in "$TASKS_PATH"/*.md; do
  if [ -f "$task" ]; then
    echo "- $(basename "$task"): $(grep "^status:" "$task" | head -1 | sed 's/status: //')"
  fi
done)

## Recommendations
- Review blocked tasks for resolution
- Prioritize high-priority tasks
- Update outdated task information
EOF

echo "Report generated: $REPORT_FILE"
\`\`\`
`
    : ''
}

${
  includeContext
    ? `
### Step 3: Context Integration

\`\`\`bash
# Check context document integration
CONTEXTS_PATH=".pythia/contexts"
${projectPath ? `CONTEXTS_PATH="${projectPath}/$CONTEXTS_PATH"` : ''}

echo "=== Context Integration Analysis ==="
for task in "$TASKS_PATH"/*.md; do
  if [ -f "$task" ]; then
    echo "Task: $(basename "$task")"
    context_refs=$(grep -o 'mdc:contexts/[^)]*' "$task" | wc -l)
    echo "  Context references: $context_refs"
    
    # Check if referenced contexts exist
    grep -o 'mdc:contexts/[^)]*' "$task" | while read context; do
      context_file=$(echo "$context" | sed 's/mdc:contexts\///')
      if [ -f "$CONTEXTS_PATH/$context_file" ]; then
        echo "    ✓ $context_file"
      else
        echo "    ✗ $context_file (missing)"
      fi
    done
  fi
done
\`\`\`
`
    : ''
}

${
  generateReport
    ? `
### Step 4: Detailed Report Generation

\`\`\`bash
# Generate detailed analysis report
DETAILED_REPORT="$TASKS_PATH/../reports/detailed-analysis-$currentDate.md"

echo "=== Generating Detailed Report ==="
cat > "$DETAILED_REPORT" << EOF
# Detailed Task Analysis Report

**Generated**: $currentDate
**Project**: ${projectPath || 'Current'}

## Task Quality Analysis
$(for task in "$TASKS_PATH"/*.md; do
  if [ -f "$task" ]; then
    echo "### $(basename "$task")"
    echo "- Status: $(grep "^status:" "$task" | head -1 | sed 's/status: //')"
    echo "- Priority: $(grep "^priority:" "$task" | head -1 | sed 's/priority: //')"
    echo "- Complexity: $(grep "^complexity:" "$task" | head -1 | sed 's/complexity: //')"
    echo "- Context References: $(grep -c 'mdc:contexts/' "$task")"
    echo "- Implementation Phases: $(grep -c 'Phase [0-9]' "$task")"
    echo "- Success Criteria: $(grep -c '\\[ \\].*\\[ \\]' "$task")"
    echo ""
  fi
done)

## Recommendations
- Tasks with missing context documents
- Tasks with incomplete implementation plans
- Tasks with unclear success criteria
- Priority tasks requiring attention
EOF

echo "Detailed report generated: $DETAILED_REPORT"
\`\`\`
`
    : ''
}

### Step 5: Validation and Quality Control

\`\`\`bash
# Validate task management results
echo "=== Validation ==="

# Check task file integrity
for task in "$TASKS_PATH"/*.md; do
  if [ -f "$task" ]; then
    # Check required fields
    if ! grep -q "^status:" "$task"; then
      echo "⚠️  Missing status: $(basename "$task")"
    fi
    if ! grep -q "^priority:" "$task"; then
      echo "⚠️  Missing priority: $(basename "$task")"
    fi
    if ! grep -q "^complexity:" "$task"; then
      echo "⚠️  Missing complexity: $(basename "$task")"
    fi
  fi
done

# Run MCP validation
echo "=== MCP Validation ==="
npm run validate-mcp

# Check documentation links
echo "=== Link Validation ==="
npm run validate-links
\`\`\`

## Management Checklist

### Pre-Action
- [ ] Task directory located and accessible
- [ ] Action type determined
- [ ] Required parameters identified
- [ ] Context documents available (if needed)

### During Action
- [ ] Task files processed correctly
- [ ] Metadata updated appropriately
- [ ] Context integration maintained
- [ ] Progress tracking updated

### Post-Action
- [ ] Results validated
- [ ] Quality control completed
- [ ] Reports generated (if requested)
- [ ] Follow-up actions identified

## Quality Standards

### Excellent Task Management
- All tasks properly categorized and tracked
- Clear status progression
- Strong context integration
- Comprehensive reporting
- Regular validation and updates

### Good Task Management
- Most tasks properly managed
- Basic status tracking
- Some context integration
- Regular reporting
- Occasional validation

### Needs Improvement
- Inconsistent task management
- Poor status tracking
- Weak context integration
- Infrequent reporting
- No validation process

---
*Generated by Pythia Task Management Prompt on ${currentDate}*`;

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

export default ManageTaskPrompt;

