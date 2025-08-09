# Command: Memory Bank Management

> **IMPORTANT**: This command provides step-by-step instructions for implementing and managing Memory Bank system in IDE-integrated environments. Memory Bank serves as a context preservation system that maintains key insights, decisions, and patterns across documentation sessions for improved LLM workflow efficiency.

## Purpose

This command establishes a Memory Bank system for preserving context, decisions, and insights across LLM documentation sessions in IDE environments. The Memory Bank enhances existing Pythia commands by providing persistent context that improves decision-making speed and consistency, particularly valuable for complex projects with extensive documentation like Thea.

**Key Benefits:**

- Reduces context reconstruction time from minutes to seconds
- Preserves architectural decisions and their rationale
- Enables pattern recognition across multiple tasks
- Maintains cross-session continuity for complex implementations

## Quick Reference

- **Purpose**: Implement context preservation system for IDE-based LLM workflows
- **Key Steps**: Structure → Integration → Population → Maintenance → Validation
- **Self-Check**: Verify memory bank entries are actionable and well-linked
- **Methodology**: Integrates with existing Pythia commands and documentation structure
- **Safety**: Memory bank complements, never replaces, primary documentation

## Self-Check Points

Before finalizing memory bank implementation, verify:

- [ ] Memory bank structure aligns with project documentation hierarchy
- [ ] All entries include clear session context and decision rationale
- [ ] Cross-references to primary documentation are maintained
- [ ] Memory bank enhances rather than duplicates existing documentation
- [ ] Integration points with existing Pythia commands are identified
- [ ] IDE-specific constraints and capabilities are considered
- [ ] Regular maintenance workflow is established

## Methodology Integration

- **Task Management**: Enhances [Create Task](mdc:commands/create-task.md) with preserved context from previous sessions
- **Project Analysis**: Supplements [Analyze Project](mdc:commands/analyze-project.md) with historical insights
- **Documentation Validation**: Supports [Validate Documentation](mdc:commands/validate-documentation.md) with pattern recognition
- **Context Documentation**: Extends [Context Documentation Methodology](mdc:methodology/context-documentation.md) with session-based insights

## Quality Rubric

| Dimension           | 1 (Low)           | 3 (Medium)        | 5 (High)                    |
| ------------------- | ----------------- | ----------------- | --------------------------- |
| **Relevance**       | Generic entries   | Somewhat relevant | Highly project-specific     |
| **Actionability**   | Abstract concepts | Some actionable   | Immediately actionable      |
| **Cross-Linking**   | No links          | Basic links       | Comprehensive cross-refs    |
| **Context Depth**   | Surface level     | Moderate detail   | Rich contextual information |
| **Integration**     | Isolated system   | Partial integrate | Seamless with existing docs |
| **Maintainability** | Manual only       | Semi-automated    | Automated maintenance       |

## Safety & Stop Conditions

- **No Duplication**: Memory bank supplements, never replaces primary documentation
- **Stop Conditions**:
  - Memory bank entries conflict with primary documentation
  - System becomes too complex for practical use
  - IDE performance is negatively impacted
- **Fallback**: Use primary documentation when memory bank is unavailable
- **Request Help**: Escalate if memory bank conflicts with project documentation standards

## Prerequisites

Before implementing Memory Bank, ensure you have:

1. [ ] Clear understanding of project documentation structure
2. [ ] Access to project workspace and documentation directories
3. [ ] Familiarity with existing Pythia commands and workflows
4. [ ] Understanding of IDE capabilities and constraints
5. [ ] Current date for proper document timestamping
6. [ ] Identification of high-value context areas (complex tasks, architectural decisions)

## Workspace Usage

This command can be used in any project workspace with Pythia integration:

```bash
# Reference the command
@memory-bank-management.md

# Execute with project context
Execute this command for my project at [project-path]
Context: Complex documentation project with multiple concurrent tasks
Objective: Implement context preservation system
Requirements: IDE-compatible, integrates with existing Pythia commands

# Example usage for Thea project
@memory-bank-management.md
Context: Thea TV application with extensive documentation (21 tasks, 8 context categories)
Objective: Preserve architectural decisions and task context across sessions
Requirements: Support for large tasks (600+ lines), architectural analysis, cross-task learning
```

## Command Checklist

- [ ] Get current date using `date +%Y-%m-%d`
- [ ] Analyze project documentation structure and identify high-value areas
- [ ] Design memory bank structure compatible with IDE environment
- [ ] Create initial memory bank directories and templates
- [ ] Integrate memory bank with existing Pythia commands
- [ ] Populate memory bank with current session insights
- [ ] Establish maintenance and validation workflows
- [ ] Test memory bank effectiveness with real scenarios
- [ ] Document usage patterns and best practices
- [ ] Update project documentation to reference memory bank system

## Step 1: Analyze Project Context and Requirements

Before implementing memory bank, understand the project's documentation ecosystem:

```bash
# Get the current date for proper timestamping
date +%Y-%m-%d

# Analyze documentation structure
find docs -type f -name "*.md" | head -20

# Identify large, complex documents that would benefit from memory bank
find docs -type f -name "*.md" -exec wc -l {} + | sort -n | tail -10

# Review existing task and context documents
ls -la docs/workflows/tasks/ | head -10
ls -la docs/contexts/ | head -10
```

**LLM Reasoning and Analysis:**

1. **Project Scale Assessment**:

   - Document count and complexity levels
   - Task interdependencies and architectural decisions
   - Frequency of context reconstruction needs

2. **IDE Constraint Analysis**:

   - File system access patterns
   - Session persistence capabilities
   - Integration points with existing tools

3. **Value Identification**:

   - High-complexity tasks requiring context preservation
   - Architectural decisions with cross-task impact
   - Patterns that emerge across multiple sessions

4. **Integration Points**:
   - Existing Pythia commands that could benefit from memory bank
   - Documentation workflows that involve context reconstruction
   - Cross-references that could be enhanced with memory insights

## Step 2: Design Memory Bank Structure

Create a memory bank structure that complements existing documentation:

```bash
# Create memory bank directory structure (IDE-compatible)
mkdir -p .pythia/memory-bank/{sessions,patterns,decisions,insights}

# Create templates for different memory bank entry types
mkdir -p .pythia/memory-bank/templates
touch .pythia/memory-bank/templates/{session-template.md,pattern-template.md,decision-template.md}
```

**Memory Bank Structure Design:**

```
.pythia/memory-bank/
├── sessions/              # Session-specific context and insights
│   ├── YYYY-MM-DD-task-name.md
│   └── YYYY-MM-DD-architecture-analysis.md
├── patterns/              # Reusable patterns and solutions
│   ├── tv-performance-constraints.md
│   ├── service-worker-communication.md
│   └── react-hooks-patterns.md
├── decisions/             # Architectural and technical decisions
│   ├── architecture-choice-rationale.md
│   ├── rejected-approaches.md
│   └── technology-selection.md
├── insights/              # Cross-session learnings and connections
│   ├── component-coupling-analysis.md
│   ├── performance-optimization-strategies.md
│   └── cross-task-learnings.md
└── templates/             # Templates for consistent entry creation
    ├── session-template.md
    ├── pattern-template.md
    └── decision-template.md
```

## Step 3: Create Memory Bank Templates

Develop templates that ensure consistent and valuable memory bank entries:

```markdown
# Session Template (.pythia/memory-bank/templates/session-template.md)

# Session: [Task/Topic Name] - [Date]

**Session Context:**

- Date: YYYY-MM-DD
- Duration: [session length]
- Primary focus: [main objective]
- Related documents: [list of modified/referenced docs]

**Key Decisions Made:**

- Decision 1: [what was decided] → [rationale]
- Decision 2: [what was decided] → [rationale]

**Insights Discovered:**

- [Insight 1 with context]
- [Insight 2 with context]

**Patterns Applied/Identified:**

- [Pattern name]: [how it was used/discovered]

**Next Session Context:**

- [What future sessions should know about this work]
- [Open questions or continued work]

**Cross-References:**

- Primary docs: [links to main documentation]
- Related patterns: [links to pattern entries]
- Previous sessions: [links to related session entries]
```

```markdown
# Pattern Template (.pythia/memory-bank/templates/pattern-template.md)

# Pattern: [Pattern Name]

**Pattern Summary:**
[Brief description of the pattern and when to use it]

**Context Where Applied:**

- Project: [project name]
- Sessions: [list of sessions where this pattern was used]
- Components: [affected components or areas]

**Implementation Details:**

- [Step 1 of implementing the pattern]
- [Step 2 of implementing the pattern]

**Variations and Adaptations:**

- [How pattern was adapted for different contexts]

**Related Patterns:**

- [Links to similar or complementary patterns]

**Effectiveness Notes:**

- [What worked well]
- [What needed adjustment]
- [Performance implications]
```

## Step 4: Integrate with Existing Pythia Commands

Enhance existing Pythia commands to leverage memory bank context:

**Integration with @create-task.md:**

```markdown
# Enhanced task creation with memory bank context

1. Check memory bank for related patterns: grep -r "keyword" .pythia/memory-bank/patterns/
2. Review previous session insights: ls .pythia/memory-bank/sessions/ | grep -i "topic"
3. Include memory bank references in task context section
4. Create session entry upon task completion
```

**Integration with @analyze-project.md:**

```markdown
# Enhanced project analysis with historical context

1. Load previous analysis insights from .pythia/memory-bank/insights/
2. Apply identified patterns from .pythia/memory-bank/patterns/
3. Reference architectural decisions from .pythia/memory-bank/decisions/
4. Update memory bank with new analysis findings
```

**Integration with @validate-documentation.md:**

```markdown
# Enhanced validation with pattern recognition

1. Check documentation against established patterns
2. Validate consistency with previous decisions
3. Ensure cross-references to memory bank are maintained
4. Update validation patterns based on new findings
```

## Step 5: Populate Initial Memory Bank

Begin with high-value entries from current project state:

```bash
# Extract insights from large, complex documents
# Example: Create session entry for recent major task
cat > .pythia/memory-bank/sessions/2025-08-06-IN-13-launcher-update.md << 'EOF'
# Session: IN-13 Launcher Force Update - 2025-08-06

**Session Context:**
- Date: 2025-08-06
- Duration: Multi-session (July 29 - Aug 1)
- Primary focus: Service Worker force update implementation
- Related documents: task-2025-07-IN-13-launcher-force-update-implementation.md

**Key Decisions Made:**
- Service Worker no force reload → seamless navigation updates only
- Daily version checks → prevents battery drain on TV devices
- Hooks pattern for React integration → cleaner than direct SW communication
- Manager Registry pattern → scalable architecture for multiple SW features

**Insights Discovered:**
- TV environment constraints require different update strategies than web
- Navigation timing is critical for seamless user experience
- Background caching enables zero-downtime updates
- Hooks provide clean separation between SW and React layers

**Patterns Applied/Identified:**
- SW-React Communication: Manager Registry + Event Bus + Hooks
- TV Performance Optimization: Daily polling vs constant monitoring
- Seamless Updates: Navigation-triggered reload vs force reload

**Next Session Context:**
- IN-15 heartbeat implementation can reuse SW Manager Registry pattern
- Update mechanism established, can be template for future SW features
- Performance patterns applicable to other TV-specific implementations

**Cross-References:**
- Primary docs: [task-2025-07-IN-13-launcher-force-update-implementation.md](mdc:thea/docs/workflows/tasks/task-2025-07-IN-13-launcher-force-update-implementation.md)
- Related patterns: [sw-communication-pattern.md](mdc:.pythia/memory-bank/patterns/sw-communication-pattern.md)
- Architecture: [service-worker-subscription-system.md](mdc:thea/docs/architecture/service-worker-subscription-system.md)
EOF
```

## Step 6: Establish Maintenance Workflow

Create sustainable maintenance practices:

```bash
# Daily memory bank maintenance script (can be automated)
#!/bin/bash
# memory-bank-daily.sh

DATE=$(date +%Y-%m-%d)
MEMORY_BANK_DIR=".pythia/memory-bank"

# Archive old sessions (older than 30 days)
find $MEMORY_BANK_DIR/sessions -name "*.md" -mtime +30 -exec mv {} $MEMORY_BANK_DIR/archive/ \;

# Generate cross-reference report
echo "# Memory Bank Cross-References - $DATE" > $MEMORY_BANK_DIR/daily-reports/$DATE-cross-refs.md
grep -r "mdc:" $MEMORY_BANK_DIR --include="*.md" >> $MEMORY_BANK_DIR/daily-reports/$DATE-cross-refs.md

# Update pattern usage statistics
echo "# Pattern Usage - $DATE" > $MEMORY_BANK_DIR/daily-reports/$DATE-patterns.md
for pattern in $MEMORY_BANK_DIR/patterns/*.md; do
    count=$(grep -r "$(basename $pattern .md)" $MEMORY_BANK_DIR/sessions --include="*.md" | wc -l)
    echo "- $(basename $pattern .md): $count references" >> $MEMORY_BANK_DIR/daily-reports/$DATE-patterns.md
done
```

**Memory Bank Maintenance Checklist:**

- [ ] Weekly review of session entries for pattern extraction
- [ ] Monthly consolidation of similar insights
- [ ] Quarterly validation of cross-references
- [ ] Annual archive of outdated entries

## Step 7: Validate Memory Bank Effectiveness

Test memory bank with real scenarios:

```bash
# Test scenario: Recreate context for complex task
# Simulate starting work on related task with memory bank assistance

# 1. Query memory bank for relevant context
grep -r "service worker" .pythia/memory-bank/ --include="*.md"

# 2. Check for applicable patterns
grep -r "TV performance" .pythia/memory-bank/patterns/ --include="*.md"

# 3. Review related decisions
grep -r "Manager Registry" .pythia/memory-bank/decisions/ --include="*.md"

# 4. Measure context reconstruction time
time_start=$(date +%s)
# [simulate context gathering with memory bank]
time_end=$(date +%s)
echo "Context reconstruction with memory bank: $((time_end - time_start)) seconds"
```

**Effectiveness Metrics:**

- Context reconstruction time: Target <30 seconds vs 5+ minutes without memory bank
- Decision consistency: Reduced contradictory architectural choices
- Pattern reuse: Increased application of proven solutions
- Cross-task learning: Better connection between related implementations

## Examples

### Basic Example: Creating Session Entry

```bash
# After completing work on architectural analysis
date +%Y-%m-%d  # 2025-08-06

# Create session entry
cat > .pythia/memory-bank/sessions/2025-08-06-dependency-analysis.md << 'EOF'
# Session: Dependency Analysis - 2025-08-06

**Key Decisions Made:**
- DDD layers rejected → TV platform coupling makes traditional layers impossible
- Incremental refactoring chosen → full rewrite timeline unrealistic (12-24 months)

**Insights Discovered:**
- 343 TV platform dependencies across UI components
- BannersV2 component coupling (37 imports) requires priority attention
- Circular dependencies (2451) indicate architectural debt

**Patterns Identified:**
- TV-First Architecture: Platform coupling inevitable, design around it
- Component Splitting Strategy: Start with highest-coupled components
- Incremental Refactoring: Small, testable changes over big rewrites
EOF
```

### Advanced Example: Pattern Extraction and Application

```bash
# Extract communication pattern from multiple sessions
cat > .pythia/memory-bank/patterns/sw-react-communication.md << 'EOF'
# Pattern: Service Worker - React Communication

**Pattern Summary:**
Manager Registry + Event Bus + Hooks pattern for clean SW-React integration in TV environments.

**Implementation Details:**
1. Manager Registry coordinates SW message distribution
2. Event Bus handles internal manager communication
3. React Hooks provide clean component integration
4. SharedState manages cross-manager data

**Effectiveness Notes:**
- Scales well: Successfully handles 4+ managers (Heartbeat, Client, Version, RequestMonitor)
- Performance: Efficient for TV constraints (daily polling vs constant monitoring)
- Maintainability: Clear separation of concerns between SW and React layers
EOF

# Apply pattern to new task
echo "Applying SW-React communication pattern to new heartbeat feature..."
grep -r "Manager Registry" .pythia/memory-bank/patterns/sw-react-communication.md
```

### Edge Case Example: Cross-Task Learning

```bash
# Connect insights across different task types
cat > .pythia/memory-bank/insights/tv-performance-patterns.md << 'EOF'
# Insight: TV Performance Optimization Patterns

**Cross-Task Connections:**
- WebGL Optimization: Offscreen rendering reduces main thread blocking
- Service Worker Updates: Daily checks prevent battery drain
- Component Architecture: 37+ imports indicate refactoring priority

**Unified TV Performance Strategy:**
1. Batch operations to reduce overhead (WebGL + SW patterns)
2. Use polling instead of constant monitoring (SW + heartbeat patterns)
3. Prioritize component splitting by coupling metrics (Architecture analysis)

**Applied Across Tasks:**
- IN-13 (Launcher Updates): Daily version checks
- IN-15 (Heartbeat): Efficient polling strategy
- WebGL Migration: Offscreen rendering + batched operations
EOF
```

### Acceptance Criteria

- [ ] Memory bank structure is created and integrated with project workspace
- [ ] Templates provide consistent entry format across different types
- [ ] Integration with existing Pythia commands is functional and documented
- [ ] Initial population includes high-value entries from current project state
- [ ] Maintenance workflow is established and tested
- [ ] Effectiveness validation shows measurable improvement in context reconstruction
- [ ] Cross-references between memory bank and primary documentation are maintained
- [ ] IDE compatibility is verified (file access, performance impact)

## Common Issues and Solutions

| Issue                                  | Solution                                                                |
| -------------------------------------- | ----------------------------------------------------------------------- |
| Memory bank entries become stale       | Implement regular review cycle and archive old entries                  |
| Duplication with primary documentation | Focus on insights and context, not facts; reference primary docs        |
| IDE performance impact                 | Keep entries concise; use efficient file organization                   |
| Inconsistent entry quality             | Use templates and establish review process                              |
| Poor cross-referencing                 | Implement automated link validation and regular cross-reference audits  |
| Memory bank becomes too complex        | Regular consolidation; merge similar insights; maintain clear hierarchy |
| Context reconstruction still slow      | Improve tagging and search capabilities; optimize entry structure       |
| Integration with Pythia commands weak  | Add explicit memory bank steps to existing command workflows            |

## Related Documents

- [Create Task](mdc:commands/create-task.md) - Enhanced with memory bank context integration
- [Analyze Project](mdc:commands/analyze-project.md) - Supplemented with historical insights
- [Validate Documentation](mdc:commands/validate-documentation.md) - Extended with pattern recognition
- [Context Documentation Methodology](mdc:methodology/context-documentation.md) - Complemented with session-based insights
- [Documentation Guidelines](mdc:methodology/documentation-guidelines.md) - Cross-referencing standards

---

**Last Updated**: 2025-08-06

## Integration Strategy with Pythia

### Phase 1: Core Integration

- [ ] Integrate memory bank references into @create-task.md workflow
- [ ] Enhance @analyze-project.md with memory bank context queries
- [ ] Update @validate-documentation.md to include memory bank validation

### Phase 2: Command Enhancement

- [ ] Modify existing commands to check memory bank for relevant context
- [ ] Add memory bank population steps to completion workflows
- [ ] Create memory bank-specific validation commands

### Phase 3: Automation

- [ ] Implement automated memory bank maintenance
- [ ] Create cross-reference validation scripts
- [ ] Establish pattern extraction automation

This memory bank implementation provides immediate value while maintaining compatibility with existing Pythia workflows and IDE constraints.
