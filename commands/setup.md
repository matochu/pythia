# Command: Setup Pythia Workspace Integration

> **IMPORTANT**: This is a command file for LLM execution. This is not an instruction for humans.

## Purpose

This command provides a systematic process for setting up Pythia workspace integration in a project. It analyzes the current project state and creates the necessary documentation structure for effective workspace-based documentation management using declarative markdown files instead of configuration files.

## Prerequisites

Before setting up Pythia workspace integration, ensure you have:

1. [ ] Write permissions for the target project directory
2. [ ] Project path information
3. [ ] Basic project information (name, description, technology stack)
4. [ ] Cursor or VSCode workspace access
5. [ ] Understanding of project's documentation needs

## Command Checklist

- [ ] Determine the current project state
- [ ] Collect necessary project information
- [ ] Create documentation directory structure
- [ ] Create project structure declaration file
- [ ] Create workspace integration guide
- [ ] Set up Cursor rules for documentation
- [ ] Create initial workflow files
- [ ] Verify workspace integration
- [ ] Handle any errors encountered

## Quick Reference

### Setup Process Overview

1. **Project Analysis** - Determine current state and requirements
2. **Information Gathering** - Collect project details and preferences
3. **Structure Creation** - Create documentation directory and files
4. **Workspace Integration** - Set up Cursor rules and guides
5. **Verification** - Test workspace integration functionality

### Key Files Created

- `.pythia/project-structure.md` - Project overview and directory structure
- `.pythia/workspace-integration.md` - Usage guide for the workspace (or see repo guide: `guides/guide-workspace-integration.md`)
- `.pythia/.gitignore` - Prevents accidental commits of generated docs
- `.cursor/rules/documentation.mdc` - AI navigation rules
- `.pythia/workflows/` - Task, proposal, and idea directories

### Common Setup Commands

```bash
# Create documentation structure
mkdir -p .pythia/workflows/{tasks,proposals,ideas,decisions}
mkdir -p .pythia/{architecture,methodology,guides,navigation}

# Create project structure file
touch .pythia/project-structure.md

# Create workspace integration guide
touch .pythia/workspace-integration.md

# Create Cursor rules directory
mkdir -p .cursor/rules
touch .cursor/rules/documentation.mdc
```

### Workspace Integration Features

- **@command syntax** - Reference commands in any workspace
- **mdc: links** - AI-specific navigation for Cursor
- **Project structure declaration** - Human-readable project overview
- **Workspace guides** - Project-specific usage instructions

## Project Analysis and Workspace Integration Setup

When a user asks to execute the setup command, the LLM should determine:

1. The current state of the project - whether documentation structure already exists
2. The desired documentation structure that the user wants
3. The project's technology stack and requirements
4. The workspace environment (Cursor, VSCode, or other)

### Step 1: Determining the Current Project State

The LLM should examine the project structure. Key indicators of existing documentation setup:

- Presence of a `.pythia/` directory with documentation structure
- Presence of `.pythia/project-structure.md` file
- Presence of `.cursor/rules/` directory with documentation rules
- Presence of workspace integration files

Do not use hardcoded paths, as the user may use any names for documentation directories.

### Step 2: Obtaining Information from the User

The LLM should ask the user for:

1. The path to the project
2. The desired name for the documentation directory (default "docs")
3. The name and description of the project
4. The technology stack and key features
5. The workspace environment (Cursor, VSCode, or other)
6. Any specific documentation requirements or preferences

### Step 3: Workspace Integration Setup

#### Method A: Standard Documentation Structure (Recommended)

The main setup method:

1. Create the documentation directory if it doesn't exist
2. Create the project structure declaration file
3. Create workspace integration guide
4. Set up Cursor rules for documentation
5. Create initial workflow files

#### Method B: Custom Documentation Structure

If the user wants a custom documentation structure:

1. Create the documentation directory if it doesn't exist
2. Adapt the structure to user's specific needs
3. Create customized project structure declaration
4. Set up workspace integration for the custom structure
5. Create appropriate Cursor rules

### Step 4: Create Project Structure Declaration

Create `.pythia/project-structure.md` with project-specific information:

```markdown
# [Project Name] Project Structure

## Project Overview

[Project description and purpose]

## Directory Structure

### Core Documentation
```

.pythia/
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

```

## Key Information Sources

### Architecture & Design
- **System Design**: `.pythia/architecture/` - System design and technical analysis
- **Project Management**: `.pythia/workflows/` - Project processes and management
- **Automation**: `.pythia/commands/` - LLM automation and scripts

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
- **System Architecture**: `.pythia/architecture/`
- **Active Tasks**: `.pythia/workflows/tasks/`
- **Change Proposals**: `.pythia/workflows/proposals/`
- **Decisions**: `.pythia/workflows/decisions/`
- **Automation**: `.pythia/commands/`
- **Tutorials**: `.pythia/tutorials/`

---

**Last Updated**: [Current Date]
```

### Step 5: Creating Directory Structure

Create the basic directory structure for workspace integration:

```
[DOC_DIR]/
├── architecture/          # System design and technical analysis
├── workflows/
│   ├── tasks/            # Task documentation and tracking
│   ├── proposals/        # Change proposals and improvements
│   ├── decisions/        # Architecture Decision Records
│   └── ideas/           # Early concepts and brainstorming
├── commands/             # LLM automation and scripts
├── contexts/             # Project context and background
├── tutorials/            # How-to guides and tutorials
├── requirements/        # Project requirements and specifications
└── reports/             # Analysis reports and findings
```

You can generate this structure with commands like:

`````bash
# Create main directories
mkdir -p [DOC_DIR]/architecture
mkdir -p [DOC_DIR]/workflows/tasks
mkdir -p [DOC_DIR]/workflows/proposals
mkdir -p [DOC_DIR]/workflows/decisions
mkdir -p [DOC_DIR]/workflows/ideas
mkdir -p [DOC_DIR]/commands
mkdir -p [DOC_DIR]/contexts
mkdir -p [DOC_DIR]/tutorials
mkdir -p [DOC_DIR]/requirements
mkdir -p [DOC_DIR]/reports

# Create placeholder READMEs for navigation
touch [DOC_DIR]/architecture/README.md
touch [DOC_DIR]/workflows/README.md
touch [DOC_DIR]/commands/README.md
touch [DOC_DIR]/contexts/README.md
touch [DOC_DIR]/tutorials/README.md
touch [DOC_DIR]/requirements/README.md
touch [DOC_DIR]/reports/README.md

# Create .gitignore in docs directory
echo "*" > [DOC_DIR]/.gitignore

# Create Cursor rules directory and file
mkdir -p .cursor/rules
touch .cursor/rules/documentation.mdc

### Step 6: Create Workspace Integration Files

#### Create Workspace Integration Guide

Create `.pythia/workspace-integration.md`:

````markdown
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
`````

```

### File References

Use `mdc:` links for workspace navigation:

- `[Architecture](mdc:.pythia/architecture/)`
- `[Tasks](mdc:.pythia/workflows/tasks/)`
- `[Proposals](mdc:.pythia/workflows/proposals/)`

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

```

### Step 7: Set Up Cursor Rules

Create `.cursor/rules/documentation.mdc` with AI-friendly navigation:

**IMPORTANT**: After creating this file, you need to manually add it to your Cursor workspace:

1. Create the `.cursor/rules/` directory in your project root
2. Copy the generated content below into `documentation.mdc`
3. Restart Cursor to load the new rules
4. The rules will provide AI with project structure understanding and navigation

````markdown
---
description: Documentation process and project structure
globs: .pythia/**/*.md
alwaysApply: true
---

# [Project Name] Documentation Guidelines

> **Note**: All documentation should be maintained in English only.
> Exception: Workflow documents under `.pythia/workflows/` may be temporarily authored in the collaborating language during active work. Finalized documents (architecture, analyses, proposals, decisions) must remain in English.

## Quick Reference

### Where to Find Information

- **System Architecture**: [.pythia/architecture/](mdc:.pythia/architecture/) - System design and technical analysis
- **Active Tasks**: [.pythia/workflows/tasks/](mdc:.pythia/workflows/tasks/) - Current and completed task documentation
- **Change Proposals**: [.pythia/workflows/proposals/](mdc:.pythia/workflows/proposals/) - Proposed changes and improvements
- **Decisions**: [.pythia/workflows/decisions/](mdc:.pythia/workflows/decisions/) - Architecture Decision Records (ADRs)
- **Automation**: [.pythia/commands/](mdc:.pythia/commands/) - LLM automation scripts
- **Tutorials**: [.pythia/tutorials/](mdc:.pythia/tutorials/) - How-to guides and implementation tutorials

### Project Context

- **Type**: [Project type]
- **Framework**: [Framework information]
- **Target**: [Target environment]
- **Key Features**: [Key features]
- **Special Requirements**: [Special requirements]

## Document Navigation

### Architecture Documents

- [System Design](mdc:.pythia/architecture/system-design.md) - System architecture and design patterns
- [API Design](mdc:.pythia/architecture/api-design.md) - API design and integration patterns
- [Data Architecture](mdc:.pythia/architecture/data-architecture.md) - Data modeling and storage patterns

### Workflow Documents

- [Tasks](mdc:.pythia/workflows/tasks/) - Task documentation and tracking
- [Proposals](mdc:.pythia/workflows/proposals/) - Change proposals and improvements
- [Decisions](mdc:.pythia/workflows/decisions/) - Architecture Decision Records (ADRs)
- [Ideas](mdc:.pythia/workflows/ideas/) - Early concepts and brainstorming

### Automation Commands

- [Analyze PR Impact](mdc:.pythia/commands/analyze-pull-request-impact.md) - Automated PR impact analysis
- [Review PR](mdc:.pythia/commands/review-pull-request.md) - Automated PR review process

### Context Documents

- [Project Context](mdc:.pythia/contexts/) - Background information and project context
- [Tutorials](mdc:.pythia/tutorials/) - How-to guides and implementation tutorials
- [Requirements](mdc:.pythia/requirements/) - Project requirements and specifications
- [Reports](mdc:.pythia/reports/) - Analysis reports and findings

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

- [.pythia/architecture/](mdc:.pythia/architecture/) - System design and technical analysis
- [.pythia/workflows/](mdc:.pythia/workflows/) - Project processes and management
  - [.pythia/workflows/tasks/](mdc:.pythia/workflows/tasks/) - Task documentation and tracking
  - [.pythia/workflows/proposals/](mdc:.pythia/workflows/proposals/) - Change proposals and improvements
  - [.pythia/workflows/decisions/](mdc:.pythia/workflows/decisions/) - Architecture Decision Records
  - [.pythia/workflows/ideas/](mdc:.pythia/workflows/ideas/) - Early concepts and brainstorming
- [.pythia/commands/](mdc:.pythia/commands/) - LLM automation and scripts
- [.pythia/contexts/](mdc:.pythia/contexts/) - Project context and background
- [.pythia/tutorials/](mdc:.pythia/tutorials/) - How-to guides and tutorials
- [.pythia/requirements/](mdc:.pythia/requirements/) - Project requirements and specifications
- [.pythia/reports/](mdc:.pythia/reports/) - Analysis reports and findings

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
````

### File References

Use `mdc:` links for workspace navigation:

- [System Design](mdc:.pythia/architecture/system-design.md)
- [API Design](mdc:.pythia/architecture/api-design.md)
- [Data Architecture](mdc:.pythia/architecture/data-architecture.md)
- [Tasks](mdc:.pythia/workflows/tasks/)
- [Proposals](mdc:.pythia/workflows/proposals/)

`````

### Step 8: Creating Initial Workflow Files

Create essential workflow files to enable immediate use of the workflow system:

#### Ideas Backlog

Create a workflow ideas backlog file at `[DOC_DIR]/workflows/ideas/ideas-backlog.md`:

```bash
cat > [DOC_DIR]/workflows/ideas/ideas-backlog.md << 'EOL'
# Ideas Backlog

## Overview

This document serves as a central registry of all ideas in the project before their transformation into formal proposals. Ideas in this registry can be at different stages of development: from initial concepts to ideas ready for formalization as proposals.

## Idea Statuses

- **New** - initial idea that requires research
- **In analysis** - idea for which research and analysis are being conducted
- **Ready for proposal** - idea that has passed analysis and is ready to be formulated as a proposal
- **Rejected** - idea that was rejected for certain reasons
- **Transformed** - idea that has been transformed into a formal proposal

## Impact/Effort Matrix

For prioritizing ideas, the Impact/Effort matrix is used:

| Effort \ Impact | Low Impact | High Impact |
| --------------- | ---------- | ----------- |
| **Low Effort**  | Quick Wins | Optimal     |
| **High Effort** | Avoid      | Strategic   |

## Architecture Ideas

| ID  | Name | Status | Priority | Complexity | Quadrant | Details |
| --- | ---- | ------ | -------- | ---------- | -------- | ------- |

## Development Workflow Ideas

| ID  | Name | Status | Priority | Complexity | Quadrant | Details |
| --- | ---- | ------ | -------- | ---------- | -------- | ------- |

## Testing & QA Ideas

| ID  | Name | Status | Priority | Complexity | Quadrant | Details |
| --- | ---- | ------ | -------- | ---------- | -------- | ------- |

## Recently Updated Ideas

| ID  | Name | Status | Priority | Complexity | Quadrant | Added Date |
| --- | ---- | ------ | -------- | ---------- | -------- | ---------- |

## Ideas Transformed into Proposals

_No ideas have been transformed into proposals yet._

## Usage Instructions

### Adding a New Idea

1. Create a new file in the format `idea-YYYY-MM-{topic}.md` in the `workflows/ideas/` directory based on the idea template
2. Fill in all necessary sections of the document
3. Add the idea to the appropriate category in this registry with a unique ID
4. Add the idea to the "Recently Updated Ideas" section

### Updating Idea Status

1. Update the idea document with new information and change the status
2. Update the idea status in this registry
3. Update the entry in the "Recently Updated Ideas" section

### Transforming an Idea into a Proposal

1. Change the idea status to "Transformed"
2. Create a new proposal based on the idea in the format `proposal-{topic}.md` in the `workflows/proposals/` directory
3. Add an entry to the "Ideas Transformed into Proposals" section
4. Add a link to the idea in the proposal document

## Related Documents

- [Idea Template](../../templates/idea-template.md)
- [Documentation Map](../../navigation/documentation-map.md)
- [Proposals](../proposals/)
- [Tasks](../tasks/)

---

**Last Update**: $(date +%Y-%m-%d)

## References

- [Create Exploration](../../commands/create-exploration.md)
- [Create Idea](../../commands/create-idea.md)
- [Create Proposal](../../commands/create-proposal.md)
- [Ideas To Proposals Workflow](../../methodology/ideas-to-proposals-workflow.md)
EOL
```

#### Workflows Status Report

Create a workflows status report file at `[DOC_DIR]/workflows/report.md`:

````bash
cat > [DOC_DIR]/workflows/report.md << 'EOL'
# Workflows Status Report

## Purpose

This report provides a centralized view of all active work items in the project documentation, including tasks, proposals, explorations, ideas, and decisions. It helps team members understand the current state of work and make informed decisions about what to work on next.

## Report Maintenance Guidelines

1. **Update Frequency**: This report should be updated:

   - When new work items are created
   - When work items change status
   - When work items are completed or archived
   - During regular weekly documentation reviews

2. **Responsibility**: The Documentation Team is responsible for keeping this report up-to-date.

3. **Status Tracking**: Each item should include:
   - Current status
   - Last updated date
   - Owner/responsible team
   - Priority level
   - Complexity rating
   - Dependencies (if any)

## Active Tasks

| Task ID | Title | Status | Priority | Complexity | Owner | Dependencies | Last Updated |
| ------- | ----- | ------ | -------- | ---------- | ----- | ------------ | ------------ |

## Active Proposals

| Proposal ID | Title | Status | Priority | Impact | Owner | Dependencies | Last Updated |
| ----------- | ----- | ------ | -------- | ------ | ----- | ------------ | ------------ |

## Active Explorations

| Exploration ID | Title | Status | Focus Area | Owner | Related Items | Last Updated |
| -------------- | ----- | ------ | ---------- | ----- | ------------- | ------------ |

## New Ideas

| Idea ID | Title | Status | Category | Proposed By | Potential Impact | Last Updated |
| ------- | ----- | ------ | -------- | ----------- | ---------------- | ------------ |

## Recent Decisions

| Decision ID | Title | Status | Impact Area | Decision Date | Implemented | Last Updated |
| ----------- | ----- | ------ | ----------- | ------------- | ----------- | ------------ |

## Work Item Metrics

### Status Distribution

- In Progress: 0 items
- Not Started: 0 items
- In Analysis: 0 items

### Priority Distribution

- High: 0 items
- Medium: 0 items
- Low: 0 items

### Team Distribution

- Documentation Team: 0 items
- Individual: 0 items
- Unassigned: 0 items

## Dependencies Graph

```mermaid
graph TD
    %% Add tasks and dependencies here when they are created
`````

## Progress Metrics

### Current Sprint Velocity

- Tasks Completed: 0
- Proposals Approved: 0
- Ideas Matured to Proposals: 0

### Monthly Trend

- New Items: 0
- Completed Items: 0
- Blocked Items: 0

## Next Actions

1. Items ready for immediate pickup:

   - None currently

2. Blocked items requiring attention:

   - None currently

3. Items needing review:
   - None currently

## References

- [Report Workflows](../commands/report-workflows.md)
- [Documentation Map](../navigation/documentation-map.md)
- [Summary Documents Registry](../navigation/summary-documents-registry.md)
- [Documentation Guidelines](../methodology/documentation-guidelines.md)
- [Task Template](../templates/task-template.md)

---

**Last Updated**: $(date +%Y-%m-%d)
EOL

````

### Step 9: Workspace Integration Verification

After setup, verify:

1. Presence of the documentation directory:
   ```bash
   [ -d "PATH_TO_DOC_DIR" ] && echo "Documentation directory exists" || echo "Documentation directory missing"
````

2. Presence of the project structure declaration:

   ```bash
   [ -f "PATH_TO_DOC_DIR/project-structure.md" ] && echo "Project structure file exists" || echo "Project structure file missing"
   ```

3. Presence of workspace integration guide:

   ```bash
   [ -f "PATH_TO_DOC_DIR/workspace-integration.md" ] && echo "Workspace integration guide exists" || echo "Workspace integration guide missing"
   ```

4. Presence of Cursor rules:

   ```bash
   [ -f ".cursor/rules/documentation.mdc" ] && echo "Cursor rules exist" || echo "Cursor rules missing"
   ```

5. Correctness of the directory structure:

   ```bash
   ls -la PATH_TO_DOC_DIR
   ```

6. Presence of essential workflow files:

   ```bash
   [ -f "PATH_TO_DOC_DIR/workflows/ideas/ideas-backlog.md" ] && echo "Ideas backlog exists" || echo "Ideas backlog missing"
   [ -f "PATH_TO_DOC_DIR/workflows/report.md" ] && echo "Workflows report exists" || echo "Workflows report missing"
   ```

7. Presence of .gitignore:
   ```bash
   [ -f "PATH_TO_DOC_DIR/.gitignore" ] && echo ".gitignore exists" || echo ".gitignore missing"
   ```

### Step 10: User Instructions

After successful setup, provide the user with these instructions:

#### For Human Users:

1. **Read `.pythia/project-structure.md`** - Contains human-readable project structure with regular markdown links
2. **Use `.pythia/workspace-integration.md`** - Guide for using Pythia commands in your project
3. **Navigate using relative links** - All links in project-structure.md work in any markdown viewer

#### For AI Assistant (Cursor):

1. **Add Cursor rules** - Copy the generated `.cursor/rules/documentation.mdc` content to your Cursor workspace
2. **Restart Cursor** - To load the new rules and enable AI navigation
3. **Use `@command` syntax** - Reference Pythia commands directly in chat
4. **Navigate with `mdc:` links** - AI can use the mdc: links in Cursor rules for navigation

#### File Usage:

- **`.pythia/project-structure.md`** - For human navigation (regular markdown links)
- **`.cursor/rules/documentation.mdc`** - For AI navigation (mdc: links)
- **`.pythia/workspace-integration.md`** - For both humans and AI (command usage guide)

### Success Criteria

The workspace integration setup is successful when:

1. The documentation directory structure is properly created
2. The project-structure.md file contains correct project information
3. The workspace-integration.md file is created with project-specific content
4. The Cursor rules are set up for documentation
5. Essential workflow files (ideas-backlog.md and report.md) are created
6. The .gitignore file is created to prevent accidental commits
7. Basic verification steps pass without errors

## Error Handling

The LLM should detect and resolve common errors:

1. Insufficient write permissions for directories

   - Error message: "Permission denied"
   - Solution: Suggest running with elevated permissions or changing directory ownership

2. Missing Cursor or VSCode workspace

   - Error message: "Cannot find workspace"
   - Solution: Ensure the project is opened in Cursor or VSCode workspace

3. Directory already exists

   - Error message: "Directory already exists"
   - Solution: Check if setup was already completed, suggest backup if needed

4. File creation fails

   - Error message: "Cannot create file"
   - Solution: Check file permissions, verify disk space

5. Invalid project information

   - Error message: "Invalid project details"
   - Solution: Request correct project information from user

## Troubleshooting

| Problem                      | Symptoms                                | Solution                                              |
| ---------------------------- | --------------------------------------- | ----------------------------------------------------- |
| Setup stuck                  | No progress for several minutes         | Interrupt with Ctrl+C and retry with verbose flags    |
| Directory creation fails     | Error messages about permissions        | Check directory permissions, try with elevated access |
| Project structure file fails | Error creating project-structure.md     | Check file permissions, verify markdown format        |
| Workspace integration fails  | Error creating workspace-integration.md | Check file permissions, verify content format         |
| Cursor rules setup fails     | Error creating .cursor/rules/           | Check directory permissions, create manually          |
| Workflow files not created   | Missing ideas-backlog.md or report.md   | Manually create the files using templates             |

## Interaction Examples

### Example 1: Basic Workspace Integration Setup

User: "Set up Pythia workspace integration in my project /home/user/myproject"

LLM: "To set up Pythia workspace integration, I need additional information:

1. What name do you want for the documentation directory? (default 'docs')
2. What is the name and description of your project?
3. What is your technology stack and key features?
4. What workspace environment are you using? (Cursor, VSCode, or other)"

User: "Use the default name 'docs' and the project name 'My Web App', it's a React TypeScript application with Redux"

LLM performs:

1. Creation of the docs directory structure
2. Creation of project-structure.md with React TypeScript context
3. Creation of workspace-integration.md with project-specific examples
4. Setup of Cursor rules for documentation
5. Creation of initial workflow files (ideas-backlog.md and report.md)

### Example 2: Custom Documentation Structure

User: "Set up Pythia workspace integration, but place the documentation in the 'documentation' directory"

LLM asks for additional information and after receiving it performs the setup with the specified directory name.

### Example 3: Project-Specific Setup

User: "Set up Pythia workspace integration for my Node.js API project"

LLM performs:

1. Creation of documentation directory structure
2. Creation of project-structure.md with Node.js API context
3. Creation of workspace-integration.md with API-specific examples
4. Setup of Cursor rules for API documentation
5. Creation of initial workflow files

## Related Documents

- [Workspace Integration Guide](../guides/workspace-integration.md)
- [Documentation Guidelines](../methodology/documentation-guidelines.md)
- [Update Documentation Map](../commands/update-documentation-map.md)

---

**Last Updated**: 2025-03-23
