# Documentation Structure

This document outlines the structure, organization, and naming conventions for the project documentation.

## Directory Structure

```
/docs/
├── architecture/              # Analytical documents about architecture
│   ├── analysis-state-management.md
│   ├── analysis-api-integration.md
│   └── ...
├── proposals/                 # Proposals for changes and improvements
│   ├── proposal-redux-to-zustand.md
│   ├── proposal-api-libraries.md
│   └── ...
├── decisions/                 # Architecture Decision Records (ADRs)
│   ├── adr-001-state-management.md
│   ├── adr-002-api-integration.md
│   └── ...
├── ideas/                     # Initial ideas before transformation into proposals
│   ├── ideas-backlog.md
│   ├── idea-YYYY-MM-topic.md
│   ├── explorations/          # Research documents for ideas
│   │   ├── exploration-topic1.md
│   │   ├── exploration-topic2.md
│   │   └── ...
│   └── ...
├── methodology/               # Development methodologies and processes
│   ├── implementation-approach.md
│   ├── ideas-to-proposals-workflow.md
│   ├── prioritization-methods.md
│   └── ...
├── rules/                     # Guidelines and standards for LLMs
│   ├── llm-development-guidelines.md
│   ├── llm-task-workflow.md
│   └── ...
├── guides/                    # Practical guides and instructions
│   ├── onboarding-guide.md
│   ├── code-style-guide.md
│   └── ...
├── tasks/                     # Context for LLM-assisted task completion
│   ├── task-YYYY-MM-api-integration.md
│   ├── task-YYYY-MM-state-management.md
│   └── ...
├── commands/                  # Instructions for creating and managing documentation
│   ├── create-task.md
│   ├── create-idea.md
│   ├── create-exploration.md
│   ├── create-proposal.md
│   └── ...
├── templates/                 # Templates for different document types
│   ├── task-template.md
│   ├── idea-template.md
│   ├── exploration-template.md
│   ├── proposal-template.md
│   └── ...
├── navigation/                # Navigation documents
│   ├── documentation-map.md
│   ├── documentation-standards.md
│   └── documentation-structure.md   # This document
└── CHANGELOG.md               # Documentation changelog
```

## Folder Purposes

1. **architecture/** - Contains analytical documents about the current state of architecture, identifying issues, patterns, and evaluation of existing solutions.

2. **proposals/** - Contains proposal documents that suggest specific changes or improvements to the system based on analytical findings.

3. **decisions/** - Contains Architecture Decision Records (ADRs) that document important architectural decisions, their context, and consequences.

4. **ideas/** - Contains initial ideas and concepts before they are developed into formal proposals. Also includes research documents (explorations) that analyze the viability of ideas.

5. **methodology/** - Contains documents describing development processes, methodologies, and approaches used in the project.

6. **rules/** - Contains guidelines and standards for LLMs.

7. **guides/** - Contains practical guides, instructions, and how-to documents for various aspects of the project.

8. **tasks/** - Contains context and notes from LLM-assisted task completion, serving as a record of problem-solving sessions.

9. **commands/** - Contains instructions for creating and managing different types of documentation.

10. **templates/** - Contains templates for different document types.

11. **navigation/** - Contains documents that help navigate through the documentation, including maps and standards.

## File Naming Conventions

### For Architecture Documents

- Pattern: `analysis-[topic].md`
- Example: `analysis-state-management.md`

### For Proposals

- Pattern: `proposal-[topic].md`
- Example: `proposal-redux-to-zustand.md`

### For Architecture Decision Records

- Pattern: `adr-[number]-[topic].md`
- Example: `adr-001-state-management.md`

### For Ideas

- Pattern: `idea-YYYY-MM-[topic].md`
- Example: `idea-2025-03-caching-system.md`

### For Explorations

- Pattern: `exploration-[topic].md`
- Example: `exploration-indexeddb-performance.md`

### For Methodology Documents

- Pattern: `[topic].md` (kebab-case)
- Example: `implementation-approach.md`

### For Guides

- Pattern: `[topic]-guide.md` (kebab-case)
- Example: `onboarding-guide.md`

### For Tasks

- Pattern: `task-YYYY-MM-[brief-description].md`
- Example: `task-2025-03-api-integration.md`

### For Commands

- Pattern: `[command-name].md` (kebab-case)
- Example: `create-task.md`

## Document Structure Standards

### Analysis Documents

1. Summary
2. Current State
3. Analysis (multiple sections)
4. Issues Identified
5. Recommendations
6. Related Documents

### Proposal Documents

1. Summary
2. Related Idea
3. Current State Analysis
4. Proposed Solution
5. Implementation Approach
6. Alternatives Considered
7. Risks and Mitigation
8. Success Criteria
9. References

### Architecture Decision Records

1. Context
2. Decision
3. Consequences
4. Status
5. Related Documents

### Idea Documents

1. Status
2. Brief Description
3. Problem
4. Proposed Solution
5. Potential Benefits
6. Potential Drawbacks and Risks
7. Alternatives
8. Required Research
9. Related Documents
10. Stakeholders
11. Classification
12. Criteria for Proposal Readiness

### Exploration Documents

1. General Information
2. Brief Description
3. Related Idea
4. Research Objective
5. Methodology
6. Key Questions
7. Research Results
8. General Conclusions
9. Recommendations
10. Next Steps
11. Additional Materials
12. Related Documents

### Guides

1. Purpose
2. Prerequisites
3. Step-by-step Instructions
4. Examples
5. Troubleshooting
6. Related Documents

### Task Context Documents

1. Overview
2. Context
3. Objectives
4. Scope
5. Current State Analysis
6. Technical Approach
7. Implementation Plan
8. Progress Tracking
9. Risks and Mitigation
10. Dependencies
11. Success Criteria
12. References

### Command Documents

1. Command Title
2. Prerequisites
3. Step-by-step Instructions
4. Verification Checklist
5. Example Implementation
6. Related Documents

## Workflow

The project follows a structured workflow from idea to implementation:

1. **Ideas**: Initial concepts are documented in the ideas directory
2. **Explorations**: Research for validating ideas
3. **Proposals**: Formalized suggestions for system changes
4. **Decisions**: Architectural decisions based on proposals
5. **Tasks**: Implementation tasks derived from decisions
6. **Implementation**: The actual code implementation

This workflow is detailed in the [Ideas to Proposals Workflow](../methodology/ideas-to-proposals-workflow.md) document.

## Documentation Management

### Adding New Documents

1. Choose the appropriate directory based on document type
2. Follow the naming convention for that document type
3. Use the corresponding template from the templates directory
4. Add cross-references to related documents
5. Update the Documentation Map

### Updating Existing Documents

1. Maintain the established document structure
2. Update the "Last Updated" date
3. Update cross-references if necessary
4. Add entries to the CHANGELOG.md file

### Archiving Documents

For documents that are no longer relevant but should be preserved:

1. Move to the appropriate archive folder (e.g., `/docs/tasks/archived/`)
2. Update cross-references in other documents
3. Update the Documentation Map

## Related Documents

- [Documentation Map](documentation-map.md)
- [Documentation Standards](documentation-standards.md)
- [Ideas to Proposals Workflow](../methodology/ideas-to-proposals-workflow.md)
- [CHANGELOG](../CHANGELOG.md)

---

**Last Updated**: 2025-03-12

## References

- [Llm Task Workflow](../rules/llm-task-workflow.md)
- [README](../README.md)
