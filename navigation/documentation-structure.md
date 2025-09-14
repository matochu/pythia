# Documentation Structure

This document outlines the structure, organization, and naming conventions for the project documentation.

## Directory Structure

```
├── workflows/                 # Documentation workflows in action
│   ├── tasks/                 # Task records and solutions
│   ├── decisions/             # Architecture Decision Records (ADRs)
│   ├── ideas/                 # Initial ideas and concepts
│   ├── proposals/             # Proposals for changes and improvements
│   ├── archive/               # Archived documents
│   └── ...
├── tools/                     # Tools for documentation management
│   └── ...
├── architecture/              # Architecture documentation
│   └── ...
├── api/                       # API documentation
│   └── ...
├── content/                   # Main documentation content
│   └── ...
├── .pythia/                      # General documentation
│   └── ...
├── knowledge/                 # Knowledge base
│   └── ...
├── methodology/               # Development methodologies and processes
│   └── ...
├── rules/                     # Guidelines and standards for LLMs
│   └── ...
├── guides/                    # Practical guides and instructions
│   └── ...
├── reports/                   # Reports
│   └── ...
├── templates/                 # Templates for different document types
│   └── ...
├── commands/                  # Instructions for creating and managing documentation
│   └── ...
├── navigation/                # Navigation documents
│   ├── documentation-map.md
│   ├── documentation-standards.md
│   ├── summary-documents-registry.md
│   └── documentation-structure.md   # This document
└── CHANGELOG.md               # Documentation changelog
```

## Folder Purposes

1. **workflows/** - Contains documentation workflows in action, including tasks, decisions, ideas, proposals, and archive.

2. **tools/** - Contains tools for documentation management and validation.

3. **architecture/** - Contains analytical documents about the current state of architecture, identifying issues, and solution evaluation.

4. **api/** - Contains project API documentation.

5. **content/** - Contains main documentation content.

6. **.pythia/** - Contains general project documentation.

7. **knowledge/** - Contains project knowledge base.

8. **methodology/** - Contains documents describing development processes and methodologies.

9. **rules/** - Contains guidelines and standards for LLMs.

10. **guides/** - Contains practical guides and instructions for various aspects of the project.

11. **reports/** - Contains reports about project status and components.

12. **templates/** - Contains templates for different document types.

13. **commands/** - Contains instructions for creating and managing documentation.

14. **navigation/** - Contains documents for navigating the documentation, including maps and standards.

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

1. **Ideas**: Initial concepts are documented in the workflows/ideas directory
2. **Explorations**: Research for validating ideas
3. **Proposals**: Formalized suggestions for system changes in the workflows/proposals directory
4. **Decisions**: Architectural decisions based on proposals in the workflows/decisions directory
5. **Tasks**: Implementation tasks derived from decisions in the workflows/tasks directory
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

1. Move to the appropriate archive folder (e.g., `/workflows/archive/`)
2. Update cross-references in other documents
3. Update the Documentation Map

## Related Documents

- [Documentation Map](./documentation-map.md)
- [Documentation Standards](./documentation-standards.md)
- [Ideas to Proposals Workflow](../methodology/ideas-to-proposals-workflow.md)
- [CHANGELOG](../CHANGELOG.md)

---

**Last Updated**: 2025-03-12

## References

- [LLM Task Workflow](../rules/llm-task-workflow.md)
- [README](../README.md)
