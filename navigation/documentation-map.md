# Documentation Navigation Map

This document serves as a central navigation hub for all architectural and system documentation in the project.

## Documentation Navigation

### Core Navigation Documents

| Document                                                      | Description                       | Key Sections                                     |
| ------------------------------------------------------------- | --------------------------------- | ------------------------------------------------ |
| [Documentation Map](./documentation-map.md)                   | Central hub for all documentation | Architecture, Planning, Proposals                |
| [Documentation Standards](./documentation-standards.md)       | Documentation format standards    | Document Types, Templates, Formatting Guidelines |
| [Summary Documents Registry](./summary-documents-registry.md) | Registry of all summary documents | Document Types, Registry, Update Guidelines      |
| [Work Items Status Registry](../workflows/report.md)          | Registry of all active work items | Tasks, Proposals, Explorations, Ideas            |
| [Changelog](../CHANGELOG.md)                                  | History of documentation changes  | Recent Changes, Quarterly Summaries              |
| [Project Documentation](../README.md)                         | Project overview and structure    | Project Goals, Documentation Organization        |

## Architecture Analysis

### Core Architecture Documents

| Document                                                                     | Description                         | Key Sections                                                       |
| ---------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------ |
| [Architecture Overview](../architecture/README.md)                           | Architecture documentation overview | System Components, Design Principles, Integration Points           |
| [General Architecture](../architecture/analysis-general-architecture.md)     | Overview of the system architecture | System Structure, DDD Principles, Component Organization           |
| [State Management](../architecture/analysis-state-management.md)             | Analysis of Redux implementation    | Store Architecture, Data Flow, Performance Considerations          |
| [Component Architecture](../architecture/analysis-component-architecture.md) | Component structure and patterns    | Component Hierarchy, Reusability, Composition Patterns             |
| [API Integration](../architecture/analysis-api-integration.md)               | API communication patterns          | Request Handling, Error Management, Data Transformation            |
| [WebGL Component System](../architecture/analysis-webgl-component-system.md) | WebGL-based component architecture  | Context Objects, Integration with PixiJS, Performance Optimization |
| [Confluence Structure](../architecture/confluence-structure.md)              | Confluence documentation structure  | Page Organization, Templates, Integration Points                   |

### Performance & Optimization

| Document                                               | Description               | Key Sections                                               |
| ------------------------------------------------------ | ------------------------- | ---------------------------------------------------------- |
| [Performance](../architecture/analysis-performance.md) | Performance analysis      | Render Performance, Load Times, Optimization Opportunities |
| [Caching](../architecture/analysis-caching.md)         | Caching strategy analysis | Caching Layers, Implementation Patterns, Effectiveness     |

### Technical Infrastructure

| Document                                                                 | Description                        | Key Sections                                          |
| ------------------------------------------------------------------------ | ---------------------------------- | ----------------------------------------------------- |
| [Testing](../architecture/analysis-testing.md)                           | Testing approach and coverage      | Test Types, Coverage Analysis, Testing Challenges     |
| [Developer Experience](../architecture/analysis-developer-experience.md) | Developer workflow analysis        | Development Flow, Tools, Pain Points                  |
| [TV Performance](../architecture/analysis-tv-performance.md)             | Performance analysis on TV devices | Rendering Bottlenecks, Memory Issues, UI Optimization |

### Special Features

| Document                                                          | Description                 | Key Sections                                         |
| ----------------------------------------------------------------- | --------------------------- | ---------------------------------------------------- |
| [Navigation Architecture](../architecture/analysis-navigation.md) | TV navigation system        | Focus Management, Remote Control Navigation          |
| [Offline Mode](../architecture/analysis-offline-mode.md)          | Network resilience features | Offline Detection, Data Persistence, Sync Mechanisms |
| [Analytics System](../architecture/analysis-analytics.md)         | Analytics implementation    | Tracking Coverage, Event Types, Data Flow            |

## Planning Documents

### Current State & Future Planning

| Document                                                      | Description                    | Key Sections                                         |
| ------------------------------------------------------------- | ------------------------------ | ---------------------------------------------------- |
| [Technical Debt](../architecture/tech-debt.md)                | Technical debt analysis        | Debt Categories, Priority Areas, Management Strategy |
| [Improvement Roadmap](../architecture/improvement-roadmap.md) | Architectural improvement plan | Short/Medium/Long-term Improvements, Success Metrics |

### Methodologies

| Document                                                                         | Description                                        | Key Sections                                     |
| -------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------ |
| [Prioritization Methods](../methodology/prioritization-methods.md)               | Decision-making frameworks                         | ICE, RICE, User Pain vs Dev Effort, WSJF         |
| [Implementation Approach](../methodology/implementation-approach.md)             | Standardized approach to implementing improvements | R&D, Preparation, Full Integration, Optimization |
| [Technical Debt Prioritization](../methodology/technical-debt-prioritization.md) | Technical debt prioritization methodology          | Assessment Criteria, Scoring System, Workflow    |

## Architecture Decisions

| Document | Description | Status |
| -------- | ----------- | ------ |

## Proposals

| Proposal | Description | Status |
| -------- | ----------- | ------ |

## Guides

| Document                                                                    | Description                                             |
| --------------------------------------------------------------------------- | ------------------------------------------------------- |
| [LLM Documentation Workflow](../guides/guide-llm-documentation-workflow.md) | Guide on using LLM for effective documentation workflow |

## Tasks

| Document | Description |
| -------- | ----------- |

## LLM Rules and Guidelines

| Document                                                         | Description                                    | Key Sections                                              |
| ---------------------------------------------------------------- | ---------------------------------------------- | --------------------------------------------------------- |
| [Development Guidelines](../rules/llm-development-guidelines.md) | Development standards and best practices       | TypeScript Usage, Coding Patterns, TV-Specific Guidelines |
| [Task Workflow](../rules/llm-task-workflow.md)                   | Guide for LLM task execution and documentation | Task Planning, Documentation, Context Preservation        |
| [Task Archiving Rules](../rules/task-archiving-rules.md)         | Rules for archiving completed tasks            | Archiving Criteria, Process, Automation                   |
| [Confluence Guidelines](../rules/llm-confluence-guidelines.md)   | Guidelines for LLM Confluence documentation    | Page Structure, Templates, Best Practices                 |

## Meta-Documentation

| Document                                                               | Description                                          |
| ---------------------------------------------------------------------- | ---------------------------------------------------- |
| [Documentation Standards](documentation-standards.md)                  | Guidelines for writing and maintaining documentation |
| [Documentation Guidelines](../methodology/documentation-guidelines.md) | Guidelines for LLMs working with documentation       |
| [Documentation Structure](documentation-structure.md)                  | Documentation organization and naming conventions    |

## Development Resources

### Tools and Automation

- [LLM Documentation Guide](../commands/validate-documentation.md) - Guide for LLM usage of documentation automation tools

### Documentation Automation

| Document                                                            | Description                                   | Key Sections                                                |
| ------------------------------------------------------------------- | --------------------------------------------- | ----------------------------------------------------------- |
| [Validate Documentation](../commands/validate-documentation.md)     | Guide for documentation validation tools      | Link Validation, Coverage Checking, Manual Fixing           |
| [Create Task](../commands/create-task.md)                           | Guide for creating task documents             | File Creation, Template Usage, Cross-References, Validation |
| [Create Proposal](../commands/create-proposal.md)                   | Guide for creating proposal documents         | Proposal Structure, Implementation Guidance, Validation     |
| [Create Idea](../commands/create-idea.md)                           | Guide for creating idea documents             | Idea Structure, Classification, References                  |
| [Create Exploration](../commands/create-exploration.md)             | Guide for creating exploration documents      | Research Structure, Methodology, Findings                   |
| [Update Summary Registry](../commands/update-summary-registry.md)   | Guide for updating summary documents registry | Registry Maintenance, Document Categorization, Verification |
| [Update Changelog](../commands/update-changelog.md)                 | Guide for updating the project changelog      | Change Categorization, Entry Formatting, Verification       |
| [Archive Tasks](../commands/archive-tasks.md)                       | Guide for archiving completed tasks           | Identification, Verification, Archiving Process, References |
| [Update Documentation Map](../commands/update-documentation-map.md) | Guide for updating the documentation map      | Missing Documents, Categorization, Recent Document Tracking |
| [Report Workflows](../commands/report-workflows.md)                 | Command for reporting on work item statuses   | Status Reports, Work Items                                  |

## Ideas and Early Concepts

### Ideas Management

| Document                                             | Description                                    | Key Sections                                                  |
| ---------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------- |
| [Ideas Backlog](../workflows/ideas/ideas-backlog.md) | Central registry of all ideas before proposals | Ideas by Category, Recently Updated, Transformed to Proposals |

### Example Ideas and Explorations

| Document                                                                      | Description                           | Key Sections                                        |
| ----------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------- |
| [Ideas and Proposals Workflow](../methodology/ideas-to-proposals-workflow.md) | Workflow from ideas to implementation | Ideation, Research, Proposal, Tasks, Implementation |

## Templates

| Document                                                                        | Description                            | Key Sections                                       |
| ------------------------------------------------------------------------------- | -------------------------------------- | -------------------------------------------------- |
| [Task Template](../templates/task-template.md)                                  | Template for task documentation        | Task Description, Goals, Implementation Plan       |
| [Proposal Template](../templates/proposal-template.md)                          | Template for proposal documentation    | Problem Statement, Solution Design, Implementation |
| [Idea Template](../templates/idea-template.md)                                  | Template for idea documentation        | Idea Description, Benefits, Risks                  |
| [Exploration Template](../templates/exploration-template.md)                    | Template for exploration documentation | Research Goals, Methodology, Findings              |
| [Technical Debt Assessment](../templates/technical-debt-assessment-template.md) | Template for technical debt assessment | Impact Analysis, Effort Estimation, Priority Score |

---

**Last Updated**: 2025-03-13
