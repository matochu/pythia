# Workspace Integration: Pythia Documentation System

This guide explains how to integrate the Pythia documentation system into your workspace (Cursor, VSCode). The process consists of **two steps**:

1. Setting up workspace integration
2. Creating project documentation structure

## Prerequisites

Before integration, ensure you have:

- Cursor or VSCode with workspace integration support
- Write permissions in the project directory
- Basic understanding of your project structure
- Access to Pythia documentation system (via workspace integration)

## Method 1: Workspace Integration via LLM (Recommended)

LLM can automatically configure workspace integration in one session, analyzing your project's current state:

```
Execute command @setup.md for Pythia workspace integration in my project at [path].
```

Or with command file reference:

```
Execute this command for workspace integration: @setup.md
My project is located at [path], using [Cursor/VSCode].
```

> **Note**: The `setup.md` file is not just documentation, but a _special command designed for LLM_. It's a program that LLM interprets and executes automatically, analyzing your project's context.

LLM automatically:

1. **Analyzes your project's state**

   - Checks if documentation structure already exists
   - If not - creates necessary directory structure

2. **Configures workspace integration**

   - Creates `docs/project-structure.md` with project structure description
   - Creates `docs/workspace-integration.md` with usage instructions
   - Sets up Cursor rules for AI-assisted navigation

3. **Creates documentation structure**
   - Sets up necessary documentation directories
   - Generates basic navigation files

You can customize the integration by adding to your request:

```
I want to use these settings:
- Project name: [Your project name]
- Technology stack: [React/Node.js/Python/etc]
- Key features: [TV navigation/API/UI/etc]
- Workspace: [Cursor/VSCode]
```

## Method 2: Manual Workspace Integration Setup

If you want full control over the integration process, you can perform all steps manually:

### Step 1: Create Documentation Structure

```bash
# Navigate to your project root
cd /path/to/your-project

# Create docs directory if it doesn't exist
mkdir -p docs

# Create documentation structure
mkdir -p docs/architecture
mkdir -p docs/workflows/tasks
mkdir -p docs/workflows/proposals
mkdir -p docs/workflows/decisions
mkdir -p docs/workflows/ideas
mkdir -p docs/commands
mkdir -p docs/contexts
mkdir -p docs/tutorials
mkdir -p docs/requirements
mkdir -p docs/reports
```

### Step 2: Create Workspace Integration Files

```bash
# Create project-structure.md
cat > docs/project-structure.md << 'EOF'
# [Project Name] Project Structure

## Project Overview

[Project description and purpose]

## Directory Structure

### Core Documentation
```

docs/
├── architecture/ # System design and technical analysis
├── workflows/ # Project processes and management
│ ├── tasks/ # Task documentation and tracking
│ ├── proposals/ # Change proposals and improvements
│ ├── decisions/ # Architecture Decision Records
│ └── ideas/ # Early concepts and brainstorming
├── commands/ # LLM automation and scripts
├── contexts/ # Project context and background
├── tutorials/ # How-to guides and tutorials
├── requirements/ # Project requirements and specifications
└── reports/ # Analysis reports and findings

````

## Key Information Sources

### Architecture & Design
- **System Design**: `docs/architecture/` - System design and technical analysis
- **Project Management**: `docs/workflows/` - Project processes and management
- **Automation**: `docs/commands/` - LLM automation and scripts

## Project Context

### Technology Stack
- **Framework**: [Framework information]
- **Build Tools**: [Build tools information]
- **Styling**: [Styling approach]
- **Testing**: [Testing framework]

### Key Features
- **[Feature 1]**: [Description]
- **[Feature 2]**: [Description]
- **[Feature 3]**: [Description]

## Quick Reference

### Where to Find Information
- **System Architecture**: `docs/architecture/`
- **Active Tasks**: `docs/workflows/tasks/`
- **Change Proposals**: `docs/workflows/proposals/`
- **Decisions**: `docs/workflows/decisions/`
- **Automation**: `docs/commands/`
- **Tutorials**: `docs/tutorials/`

---

**Last Updated**: [Current Date]
EOF

# Create workspace-integration.md
cat > docs/workspace-integration.md << 'EOF'
# Workspace Integration Guide

## Pythia Commands Usage

### Available Commands
- `@create-task.md` - Create task documentation
- `@analyze-project.md` - Comprehensive project analysis
- `@create-proposal.md` - Create change proposals
- `@improve-typescript-files.md` - TypeScript improvements
- `@validate-documentation.md` - Validate documentation integrity
- `@update-documentation-map.md` - Update navigation

### Project-Specific Usage

#### Example Usage
```bash
# Create task for feature improvement
@create-task.md

# Context: [Project description]
# Objective: [Specific objective]
# Priority: [High/Medium/Low]
# Timeline: [Time estimate]
````

## Project Context for LLM

### Technology Stack

- **Framework**: [Framework information]
- **Build Tools**: [Build tools information]
- **Styling**: [Styling approach]
- **Testing**: [Testing framework]

### Key Features

- **[Feature 1]**: [Description]
- **[Feature 2]**: [Description]
- **[Feature 3]**: [Description]

## LLM Guidelines

### When Working with [Project Name]

1. **Always consider project context** - key considerations for the specific project type
2. **Reference existing architecture** before proposing changes
3. **Use established patterns** for the project's technology stack
4. **Consider project requirements** of all changes
5. **Follow project guidelines** for the development environment

---

**Last Updated**: [Current Date]
EOF

# Create Cursor rules

mkdir -p .cursor/rules
cat > .cursor/rules/documentation.mdc << 'EOF'

---

description: Documentation process and project structure
globs: docs/\*_/_.md
alwaysApply: true

---

# [Project Name] Documentation Guidelines

> **Note**: All documentation should be maintained in English only.

## Quick Reference

### Where to Find Information

- **System Architecture**: `docs/architecture/` - System design and technical analysis
- **Active Tasks**: `docs/workflows/tasks/` - Current and completed task documentation
- **Change Proposals**: `docs/workflows/proposals/` - Proposed changes and improvements
- **Decisions**: `docs/workflows/decisions/` - Architecture Decision Records (ADRs)
- **Automation**: `docs/commands/` - LLM automation scripts
- **Tutorials**: `docs/tutorials/` - How-to guides and implementation tutorials

### Key Files by Category

- **System Design**: `docs/architecture/system-design.md`
- **API Design**: `docs/architecture/api-design.md`
- **Data Architecture**: `docs/architecture/data-architecture.md`
- **PR Analysis**: `docs/commands/analyze-pull-request-impact.md`
- **PR Review**: `docs/commands/review-pull-request.md`

### Project Context

- **Type**: [Project type]
- **Framework**: [Framework information]
- **Target**: [Target environment]
- **Key Features**: [Key features]
- **Special Requirements**: [Special requirements]

## General Principles

1. **Document Interconnections**:

   - Each document should be connected to other relevant documents through cross-references
   - When creating a new document, always add a reference to it in the documentation map
   - Related documents should contain mutual references

2. **Document Structure**:

   - Each document should begin with a "Summary" section describing the main content
   - The Summary should be followed by a "Current State" section to provide context
   - Table of contents is mandatory for documents longer than 3 sections

3. **Change Context**:
   - When updating an existing document, maintain its general structure and format
   - New proposals should be based on existing analytical documents
   - When creating a new proposal, first identify all related analytical documents

## Folders and Their Purpose

- `docs/architecture/` - System design and technical analysis
- `docs/workflows/` - Project processes and management
  - `docs/workflows/tasks/` - Task documentation and tracking
  - `docs/workflows/proposals/` - Change proposals and improvements
  - `docs/workflows/decisions/` - Architecture Decision Records
  - `docs/workflows/ideas/` - Early concepts and brainstorming
- `docs/commands/` - LLM automation and scripts
- `docs/contexts/` - Project context and background
- `docs/tutorials/` - How-to guides and tutorials
- `docs/requirements/` - Project requirements and specifications
- `docs/reports/` - Analysis reports and findings

## LLM Usage Guidelines

### When Working with [Project Name]

1. **Always consider project context** - key considerations for the specific project type
2. **Reference existing architecture** before proposing changes
3. **Use established patterns** for the project's technology stack
4. **Consider project requirements** of all changes
5. **Follow project guidelines** for the development environment

### Command Usage Examples

```bash
# Create task for feature improvement
@create-task.md

# Context: [Project description]
# Objective: [Specific objective]
# Priority: [High/Medium/Low]
# Timeline: [Time estimate]

# Analyze project architecture
@analyze-project.md

# Focus: [specific focus area]
# Context: [project context]
# Requirements: [project requirements]
```

EOF

````

### Step 3: Verification and Setup

```bash
# Check that all files are created
ls -la docs/
ls -la .cursor/rules/

# Restart Cursor to load new rules
# (close and reopen Cursor)

# Test workspace integration
# In Cursor, try using the command:
# @create-task.md
````

## Method 3: Advanced Workspace Integration

For more complex projects, you can configure additional capabilities:

### Setting up Additional Cursor Rules

```bash
# Create additional rules for specific file types
cat > .cursor/rules/typescript.mdc << 'EOF'
---
description: TypeScript development guidelines
globs: src/**/*.ts,src/**/*.tsx
alwaysApply: true
---

# TypeScript Development Guidelines

## Code Standards
- Use strict TypeScript configuration
- Prefer interfaces over types for object shapes
- Use proper error handling with try-catch blocks
- Follow naming conventions consistently

## Project-Specific Patterns
- [Add your project-specific patterns here]
EOF

# Create testing rules
cat > .cursor/rules/testing.mdc << 'EOF'
---
description: Testing guidelines and patterns
globs: **/*.test.ts,**/*.test.tsx,**/*.spec.ts,**/*.spec.tsx
alwaysApply: true
---

# Testing Guidelines

## Test Structure
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Mock external dependencies appropriately
- Test both success and error scenarios

## Project-Specific Testing
- [Add your project-specific testing patterns here]
EOF
```

### Setting up Automation

```bash
# Create script for automatic documentation updates
cat > scripts/update-docs.sh << 'EOF'
#!/bin/bash
# Automatic documentation updates

echo "Updating documentation..."

# Update documentation map
@update-documentation-map.md

# Validate documentation
@validate-documentation.md

# Generate report
@report-workflows.md

echo "Documentation updated successfully!"
EOF

chmod +x scripts/update-docs.sh
```

## Testing the Integration

After setup, verify everything works correctly:

```bash
# Check that all files are created
ls -la docs/
ls -la .cursor/rules/

# Test workspace integration
# In Cursor, try using commands:
# @create-task.md
# @analyze-project.md
```

If the test passes without errors, your integration is working correctly.

## Troubleshooting Common Issues

| Issue                           | Solution                                       |
| ------------------------------- | ---------------------------------------------- |
| Cursor rules not loading        | Restart Cursor completely                      |
| Commands not recognized         | Check that `.cursor/rules/` directory exists   |
| Documentation structure missing | Run the manual setup steps                     |
| Permission errors               | Check write permissions in project directory   |
| Path issues                     | Ensure you're in the correct project directory |

## Next Steps

After integration, here are some recommended actions:

1. Review the [Workspace Integration Guide](mdc:guides/workspace-integration.md) for usage details
2. Explore the [documentation map](mdc:navigation/documentation-map.md) for navigation
3. Try creating your first workflow document using commands in the [commands](mdc:commands) directory
4. Review available [guides](mdc:guides) for additional information

## Related Documents

- [Setup Command](mdc:commands/setup.md) - Details of the automated setup script
- [Workspace Integration Guide](mdc:guides/workspace-integration.md) - Comprehensive usage guide
- [CONCEPT](mdc:CONCEPT.md) - Overview of core concepts and architecture
- [README](mdc:README.md) - Main documentation overview

---

**Last Updated**: 2025-01-27
