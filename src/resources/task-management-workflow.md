# Task Management Workflow

## Overview

This document outlines the comprehensive task management workflow for Pythia projects, providing structured approaches for creating, updating, tracking, and analyzing tasks.

## Core Principles

### 1. Task Lifecycle Management

- **Creation**: Structured task creation with proper metadata
- **Tracking**: Continuous progress monitoring and status updates
- **Analysis**: Regular quality assessment and improvement
- **Archival**: Systematic completion and historical preservation

### 2. Context Integration

- **Required**: High-complexity tasks must reference context documents
- **Recommended**: Medium-complexity tasks should include context
- **Optional**: Low-complexity tasks may include context as needed

### 3. Quality Control

- **Validation**: Regular MCP validation of task structure
- **Review**: Periodic quality assessment and improvement
- **Reporting**: Comprehensive status and progress reporting

## Task Management Actions

### Create

**Purpose**: Create new tasks with proper structure and metadata
**Use Cases**: New features, bug fixes, improvements, research tasks
**Requirements**:

- Task name and description
- Priority and complexity assessment
- Category classification
- Context document integration (if applicable)

**Process**:

1. Use `@create-task-prompt` for detailed instructions
2. Follow generated workflow
3. Validate task structure
4. Update task tracking

### Update

**Purpose**: Modify existing task properties and status
**Use Cases**: Status changes, priority updates, scope modifications
**Requirements**:

- Task identification (ID or name)
- Specific updates to apply
- Reason for changes

**Process**:

1. Locate task file
2. Backup current version
3. Apply updates
4. Update metadata timestamps
5. Validate changes

### List

**Purpose**: Display and filter tasks based on various criteria
**Use Cases**: Status overview, progress tracking, task discovery
**Requirements**:

- Filter criteria (status, priority, complexity, date)
- Output format preferences

**Process**:

1. Scan task directory
2. Extract metadata
3. Apply filters
4. Format output
5. Display results

### Archive

**Purpose**: Move completed or old tasks to archive
**Use Cases**: Task completion, historical preservation, cleanup
**Requirements**:

- Archive criteria (completed status, age)
- Archive directory structure

**Process**:

1. Identify tasks to archive
2. Create archive directory
3. Move tasks to archive
4. Update tracking records

### Analyze

**Purpose**: Assess task quality and completeness
**Use Cases**: Quality control, improvement identification, compliance checking
**Requirements**:

- Analysis type (quality, completeness, dependencies, risks)
- Include recommendations flag

**Process**:

1. Use `@analyze-task-prompt` for detailed analysis
2. Review task structure and content
3. Check context integration
4. Generate improvement recommendations

### Track

**Purpose**: Monitor progress and generate tracking reports
**Use Cases**: Progress monitoring, milestone tracking, performance assessment
**Requirements**:

- Tracking criteria (phases, complexity, status)
- Report format preferences

**Process**:

1. Scan all tasks
2. Extract progress data
3. Calculate metrics
4. Generate reports
5. Identify bottlenecks

### Report

**Purpose**: Generate comprehensive task management reports
**Use Cases**: Executive summaries, project status, team updates
**Requirements**:

- Report scope and detail level
- Output format preferences
- Include recommendations

**Process**:

1. Collect task data
2. Analyze patterns and trends
3. Generate executive summary
4. Create detailed breakdown
5. Provide recommendations

## Task Status Management

### Status Values

- **not-started**: Task created but not begun
- **in-progress**: Active development
- **under-review**: Awaiting review or approval
- **blocked**: Cannot proceed due to dependencies
- **completed**: All work finished and validated

### Status Transitions

```
not-started → in-progress → under-review → completed
     ↓              ↓
   blocked ←────────┘
```

### Status Update Rules

- Only move forward in normal progression
- Blocked status can be set from any active status
- Completed status requires validation
- Status changes must include reason

## Priority Management

### Priority Levels

- **Critical**: System-breaking issues, security vulnerabilities
- **High**: Important features, major improvements
- **Medium**: Standard features, optimizations
- **Low**: Nice-to-have features, minor improvements

### Priority Assignment Rules

- Critical: Immediate attention required
- High: Important for project success
- Medium: Standard development work
- Low: Optional or future work

## Complexity Management

### Complexity Levels

- **Low**: Simple changes, single component, < 1 day
- **Medium**: Multiple components, some dependencies, 1-3 days
- **High**: Complex changes, multiple dependencies, > 3 days

### Complexity Assessment

- Consider technical difficulty
- Evaluate dependencies
- Assess time requirements
- Review risk factors

## Context Integration

### Context Document Types

- **Domain Context**: Business logic, user workflows
- **Technical Context**: Architecture, implementation details
- **Process Context**: Development workflows, methodologies
- **Reference Context**: Standards, guidelines, external dependencies

### Integration Requirements

- **High Complexity**: Must reference ≥1 context document
- **Medium Complexity**: Should reference context documents
- **Low Complexity**: Context documents optional

## Quality Control

### Validation Process

1. **Structure Validation**: Check required sections and metadata
2. **Content Validation**: Verify completeness and clarity
3. **Link Validation**: Ensure all references are valid
4. **MCP Validation**: Run framework validation

### Quality Metrics

- **Completeness**: All required sections filled
- **Clarity**: Clear objectives and success criteria
- **Integration**: Proper context document references
- **Consistency**: Follows established patterns

## Reporting

### Report Types

- **Status Reports**: Current task status overview
- **Progress Reports**: Development progress tracking
- **Quality Reports**: Task quality assessment
- **Executive Reports**: High-level project status

### Report Frequency

- **Daily**: Progress updates for active tasks
- **Weekly**: Status summaries and planning
- **Monthly**: Quality assessment and improvement
- **Quarterly**: Strategic planning and review

## Best Practices

### Task Creation

- Use descriptive, specific names
- Include clear objectives
- Define measurable success criteria
- Identify dependencies early
- Plan for context integration

### Task Updates

- Update status regularly
- Document changes and reasons
- Maintain metadata accuracy
- Preserve historical information

### Task Analysis

- Regular quality assessment
- Identify improvement opportunities
- Check context integration
- Validate dependencies

### Task Tracking

- Monitor progress continuously
- Identify bottlenecks early
- Track quality metrics
- Generate actionable insights

## Common Issues and Solutions

### Incomplete Tasks

- **Problem**: Missing required sections
- **Solution**: Use task analysis to identify gaps

### Poor Context Integration

- **Problem**: Missing or weak context references
- **Solution**: Create or identify relevant context documents

### Inconsistent Status Updates

- **Problem**: Outdated or incorrect status information
- **Solution**: Implement regular status review process

### Weak Quality Control

- **Problem**: Insufficient validation and review
- **Solution**: Establish regular quality assessment process

---

_Last Updated: 2025-09-15_

