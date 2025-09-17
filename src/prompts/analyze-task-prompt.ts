import { MCPPrompt } from 'mcp-framework';
import { z } from 'zod';

class AnalyzeTaskPrompt extends MCPPrompt {
  name = 'analyze_task_prompt';
  description =
    'Generate comprehensive task analysis instructions for quality control and improvement';

  schema = {
    taskId: {
      type: z.string(),
      description: "Task ID to analyze",
      required: false,
    },
    taskPath: {
      type: z.string(),
      description: "Path to task file",
      required: false,
    },
    analysisType: {
      type: z.enum(['quality', 'completeness', 'dependencies', 'risks', 'performance']),
      description: "Type of analysis to perform",
      required: false,
    },
    includeRecommendations: {
      type: z.boolean(),
      description: "Include improvement recommendations",
      required: false,
    },
    projectPath: {
      type: z.string(),
      description: "Project path for context",
      required: false,
    }
  };

  async generateMessages(input: any) {
    const {
      taskId,
      taskPath,
      analysisType,
      includeRecommendations,
      projectPath
    } = input;

    const currentDate = new Date().toISOString().split('T')[0];

    const prompt = `# Task Analysis: ${taskId || 'Task Review'}

## Analysis Overview
**Task ID**: ${taskId || 'N/A'}
**Analysis Type**: ${analysisType}
**Date**: ${currentDate}
${projectPath ? `**Project Path**: ${projectPath}` : ''}

## Step-by-Step Analysis Instructions

### Step 1: Task Document Review

\`\`\`bash
# Locate task file
${
  taskPath
    ? `TASK_FILE="${taskPath}"`
    : `TASK_FILE=".pythia/workflows/tasks/${taskId || 'task-*.md'}"`
}
${projectPath ? `TASK_FILE="${projectPath}/$TASK_FILE"` : ''}

# Verify task file exists
if [ -f "$TASK_FILE" ]; then
  echo "Task file found: $TASK_FILE"
else
  echo "Task file not found: $TASK_FILE"
  exit 1
fi

# Display task content for analysis
cat "$TASK_FILE"
\`\`\`

### Step 2: ${
      analysisType.charAt(0).toUpperCase() + analysisType.slice(1)
    } Analysis

${
  analysisType === 'quality'
    ? `
#### Quality Analysis Checklist

**Document Structure:**
- [ ] All required sections present
- [ ] Metadata complete and accurate
- [ ] Consistent formatting throughout
- [ ] Proper markdown syntax

**Content Quality:**
- [ ] Objectives are specific and measurable
- [ ] Implementation plan is detailed and actionable
- [ ] Success criteria are objective and testable
- [ ] Dependencies are clearly identified
- [ ] Context documents are properly referenced

**Language and Clarity:**
- [ ] Document written in English
- [ ] Clear, professional language
- [ ] No grammatical errors
- [ ] Technical terms properly defined

**Completeness:**
- [ ] All sections filled with meaningful content
- [ ] No placeholder text remaining
- [ ] Cross-references are valid
- [ ] Status tracking is up to date
`
    : analysisType === 'completeness'
    ? `
#### Completeness Analysis Checklist

**Required Sections:**
- [ ] Overview with metadata
- [ ] Summary and context
- [ ] Clear objectives
- [ ] Defined scope (in/out)
- [ ] Implementation plan with phases
- [ ] Success criteria
- [ ] Dependencies
- [ ] Quality control steps
- [ ] Progress tracking

**Content Depth:**
- [ ] Each section has sufficient detail
- [ ] Implementation steps are specific
- [ ] Dependencies are properly linked
- [ ] Context integration is adequate
- [ ] Risk assessment is present (if complex)

**Cross-References:**
- [ ] Related context documents linked
- [ ] Other tasks referenced appropriately
- [ ] Templates and guides referenced
- [ ] External resources linked
`
    : analysisType === 'dependencies'
    ? `
#### Dependencies Analysis Checklist

**Internal Dependencies:**
- [ ] Other tasks clearly identified
- [ ] Context documents referenced
- [ ] Required resources listed
- [ ] Team members and roles defined

**External Dependencies:**
- [ ] Third-party libraries identified
- [ ] External services documented
- [ ] Infrastructure requirements listed
- [ ] Compliance requirements noted

**Dependency Validation:**
- [ ] All referenced documents exist
- [ ] Links are valid and accessible
- [ ] Dependencies are realistic and achievable
- [ ] Critical path identified
`
    : analysisType === 'risks'
    ? `
#### Risk Analysis Checklist

**Technical Risks:**
- [ ] Complexity risks identified
- [ ] Technology risks assessed
- [ ] Integration risks documented
- [ ] Performance risks considered

**Project Risks:**
- [ ] Timeline risks identified
- [ ] Resource risks assessed
- [ ] Scope creep risks documented
- [ ] Quality risks considered

**Mitigation Strategies:**
- [ ] Each risk has mitigation plan
- [ ] Contingency plans documented
- [ ] Escalation procedures defined
- [ ] Monitoring mechanisms in place
`
    : analysisType === 'performance'
    ? `
#### Performance Analysis Checklist

**Implementation Efficiency:**
- [ ] Phases are appropriately sized
- [ ] Dependencies are minimized
- [ ] Parallel work opportunities identified
- [ ] Critical path optimized

**Resource Utilization:**
- [ ] Team capacity considered
- [ ] Skill requirements realistic
- [ ] Tool and infrastructure needs identified
- [ ] Budget implications assessed

**Quality vs Speed:**
- [ ] Quality gates appropriately placed
- [ ] Testing strategy is efficient
- [ ] Review processes streamlined
- [ ] Documentation requirements balanced
`
    : ''
}

### Step 3: Context Integration Analysis

\`\`\`bash
# Check context document references
CONTEXTS_PATH=".pythia/contexts"
${projectPath ? `CONTEXTS_PATH="${projectPath}/$CONTEXTS_PATH"` : ''}

# Find referenced context documents
grep -o 'mdc:contexts/[^)]*' "$TASK_FILE" | sed 's/mdc:contexts\///' | while read context; do
  if [ -f "$CONTEXTS_PATH/$context" ]; then
    echo "✓ Context document found: $context"
  else
    echo "✗ Context document missing: $context"
  fi
done

# Check for context document quality
find "$CONTEXTS_PATH" -name "*.md" -exec grep -l "$(basename "$TASK_FILE" .md)" {} \\;
\`\`\`

### Step 4: Implementation Plan Analysis

\`\`\`bash
# Extract implementation phases
grep -A 10 "## Implementation Plan" "$TASK_FILE"

# Check for phase completeness
grep -c "Phase [0-9]" "$TASK_FILE"
grep -c "\\[ \\]" "$TASK_FILE"  # Count unchecked items
grep -c "\\[x\\]" "$TASK_FILE"  # Count checked items

# Analyze phase complexity distribution
grep -A 5 "Complexity:" "$TASK_FILE"
\`\`\`

### Step 5: Success Criteria Validation

\`\`\`bash
# Extract success criteria
grep -A 20 "## Success Criteria" "$TASK_FILE"

# Validate criteria quality
echo "Checking success criteria quality:"
grep -c "\\[ \\].*specific" "$TASK_FILE" || echo "No specific criteria found"
grep -c "\\[ \\].*measurable" "$TASK_FILE" || echo "No measurable criteria found"
grep -c "\\[ \\].*testable" "$TASK_FILE" || echo "No testable criteria found"
\`\`\`

### Step 6: Cross-Reference Validation

\`\`\`bash
# Check internal links
grep -o 'mdc:[^)]*' "$TASK_FILE" | while read link; do
  target=$(echo "$link" | sed 's/mdc://')
  if [ -f "$target" ]; then
    echo "✓ Link valid: $link"
  else
    echo "✗ Link broken: $link"
  fi
done

# Check for bidirectional references
TASK_BASENAME=$(basename "$TASK_FILE" .md)
find . -name "*.md" -exec grep -l "$TASK_BASENAME" {} \\;
\`\`\`

${
  includeRecommendations
    ? `
### Step 7: Improvement Recommendations

Based on the analysis, provide recommendations for:

**Immediate Improvements:**
- [ ] Fix any broken links or missing references
- [ ] Complete any incomplete sections
- [ ] Clarify vague objectives or success criteria
- [ ] Update outdated information

**Quality Enhancements:**
- [ ] Add missing context document references
- [ ] Improve implementation plan detail
- [ ] Enhance risk assessment
- [ ] Strengthen success criteria

**Process Improvements:**
- [ ] Optimize phase distribution
- [ ] Improve dependency management
- [ ] Enhance progress tracking
- [ ] Strengthen quality control

**Long-term Considerations:**
- [ ] Consider task complexity reduction
- [ ] Evaluate dependency optimization
- [ ] Assess resource allocation
- [ ] Review timeline feasibility
`
    : ''
}

### Step 8: Analysis Report Generation

\`\`\`bash
# Generate analysis report
ANALYSIS_REPORT="task-analysis-${taskId || 'unknown'}-${currentDate}.md"
cat > "$ANALYSIS_REPORT" << EOF
# Task Analysis Report

**Task**: ${taskId || 'Unknown'}
**Analysis Type**: ${analysisType}
**Date**: ${currentDate}
**Analyst**: [Your Name]

## Executive Summary
[Brief overview of findings and recommendations]

## Detailed Findings
[Specific issues and observations]

## Recommendations
[Actionable improvement suggestions]

## Next Steps
[Immediate actions required]
EOF

echo "Analysis report created: $ANALYSIS_REPORT"
\`\`\`

## Analysis Checklist

### Pre-Analysis
- [ ] Task file located and accessible
- [ ] Analysis type determined
- [ ] Context documents available
- [ ] Analysis tools prepared

### During Analysis
- [ ] Document structure reviewed
- [ ] Content quality assessed
- [ ] Dependencies validated
- [ ] Cross-references checked
- [ ] Implementation plan analyzed

### Post-Analysis
- [ ] Findings documented
- [ ] Recommendations generated
- [ ] Report created
- [ ] Follow-up actions identified

## Quality Standards

### Excellent Task Quality
- All sections complete and detailed
- Clear, measurable objectives
- Comprehensive implementation plan
- Strong context integration
- Robust success criteria
- Minimal risks with mitigation plans

### Good Task Quality
- Most sections complete
- Generally clear objectives
- Adequate implementation plan
- Some context integration
- Basic success criteria
- Some risk consideration

### Needs Improvement
- Missing or incomplete sections
- Vague or unclear objectives
- Insufficient implementation detail
- Poor context integration
- Weak success criteria
- Unidentified risks

---
*Generated by Pythia Task Analysis Prompt on ${currentDate}*`;

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

export default AnalyzeTaskPrompt;
