# Command: Setup Pythia

> **IMPORTANT**: This is a command file for LLM execution. This is not an instruction for humans.

## Purpose

This command provides a systematic process for installing and configuring Pythia in a project. It analyzes the current project state, installs Pythia using the appropriate method, and sets up the necessary configuration and directory structure for effective documentation management.

## Prerequisites

Before setting up Pythia, ensure you have:

1. [ ] Git (version 2.20+) for the Git submodule installation method
2. [ ] Node.js (version 14+) and npm (version 6+)
3. [ ] Write permissions for the target project directory
4. [ ] Project path information
5. [ ] Basic project information (name, description, repository URL)

## Command Checklist

- [ ] Determine the current project state
- [ ] Collect necessary project information
- [ ] Select the appropriate installation method
- [ ] Install Pythia core files
- [ ] Create configuration file
- [ ] Set up directory structure
- [ ] Create initial workflow files
- [ ] Install dependencies
- [ ] Verify installation
- [ ] Handle any errors encountered

## Project Analysis and Pythia Installation

When a user asks to execute the setup command, the LLM should determine:

1. The current state of the project - whether Pythia is already installed
2. The desired documentation structure that the user wants
3. The installation method (git submodule or direct copying)

### Step 1: Determining the Current Project State

The LLM should examine the project structure. Key indicators of an installed Pythia:

- Presence of a configuration file (usually config.json)
- Presence of a typical directory structure for documentation
- Presence of a core directory with Pythia code

Do not use hardcoded paths like "$PROJECT_PATH/docs/core", as the user may use any names for documentation directories and system core.

### Step 2: Obtaining Information from the User

The LLM should ask the user for:

1. The path to the project
2. The desired name for the documentation directory (default "docs")
3. The desired name for the core directory (default "core")
4. The name and description of the project for configuration
5. The URL of the Pythia repository (default https://github.com/matochu/pythia)

### Step 3: Installation Methods

#### Method A: Git Submodule (Recommended)

The main installation method:

1. Check if the project is a Git repository (presence of .git directory)
2. Create the documentation directory if it doesn't exist
3. Add Pythia as a submodule:
   ```bash
   git submodule add REPOSITORY_URL PATH_TO_CORE_DIRECTORY
   git submodule update --init --recursive
   ```
4. Install dependencies:
   ```bash
   cd PATH_TO_CORE_DIRECTORY
   npm install
   ```

#### Method B: Direct Copying

If the user wants to copy the repository without using git submodules:

1. Create the documentation directory if it doesn't exist
2. Clone the repository temporarily:
   ```bash
   git clone REPOSITORY_URL temp_pythia
   ```
3. Copy the files to the target directory:
   ```bash
   cp -r temp_pythia/* PATH_TO_CORE_DIRECTORY/
   ```
4. Delete the temporary directory:
   ```bash
   rm -rf temp_pythia
   ```
5. Install dependencies:
   ```bash
   cd PATH_TO_CORE_DIRECTORY
   npm install
   ```

### Step 4: Project Configuration

Create config.json in the documentation directory:

```json
{
  "project": {
    "name": "PROJECT_NAME",
    "description": "PROJECT_DESCRIPTION",
    "repository": "PROJECT_REPOSITORY_URL",
    "docRoot": "DOCUMENTATION_DIRECTORY_NAME"
  },
  "workflows": {
    "enabled": ["tasks", "proposals", "decisions", "ideas"]
  },
  "contexts": {
    "enabled": ["project", "technical", "meetings"]
  },
  "folders": {
    "workflows": "workflows",
    "tasks": "workflows/tasks",
    "ideas": "workflows/ideas",
    "explorations": "workflows/ideas/explorations",
    "proposals": "workflows/proposals",
    "decisions": "workflows/decisions",
    "commands": "commands",
    "templates": "templates",
    "methodology": "methodology",
    "reports": "reports",
    "navigation": "navigation",
    "rules": "rules",
    "contexts": "contexts"
  },
  "project_root": ".",
  "docs_path": "/"
}
```

### Step 5: Creating Directory Structure

Create the basic directory structure according to the configuration:

```
[DOC_DIR]/
├── workflows/
│   ├── tasks/
│   ├── proposals/
│   ├── decisions/
│   └── ideas/
│       └── explorations/
├── contexts/
│   ├── project/
│   ├── technical/
│   └── meetings/
├── navigation/
├── templates/
├── methodology/
├── commands/
├── reports/
└── rules/
```

You can generate this structure with commands like:

```bash
# Create main directories
mkdir -p [DOC_DIR]/workflows/tasks
mkdir -p [DOC_DIR]/workflows/proposals
mkdir -p [DOC_DIR]/workflows/decisions
mkdir -p [DOC_DIR]/workflows/ideas/explorations
mkdir -p [DOC_DIR]/contexts/project
mkdir -p [DOC_DIR]/contexts/technical
mkdir -p [DOC_DIR]/contexts/meetings
mkdir -p [DOC_DIR]/navigation
mkdir -p [DOC_DIR]/templates
mkdir -p [DOC_DIR]/methodology
mkdir -p [DOC_DIR]/commands
mkdir -p [DOC_DIR]/reports
mkdir -p [DOC_DIR]/rules

# Create placeholder READMEs for navigation
touch [DOC_DIR]/workflows/README.md
touch [DOC_DIR]/contexts/README.md
touch [DOC_DIR]/navigation/README.md
# ... and so on for other directories
```

### Step 6: Creating Initial Workflow Files

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
````

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

### Step 7: Installation Verification

After installation, verify:

1. Presence of the core directory:
   ```bash
   [ -d "PATH_TO_CORE_DIRECTORY" ] && echo "Core directory exists" || echo "Core directory missing"
````

2. Presence of the configuration file:

   ```bash
   [ -f "PATH_TO_DOC_DIR/config.json" ] && echo "Config file exists" || echo "Config file missing"
   ```

3. Correctness of the directory structure:

   ```bash
   ls -la PATH_TO_DOC_DIR
   ```

4. Installation of npm dependencies:

   ```bash
   cd PATH_TO_CORE_DIRECTORY && npm list --depth=0
   ```

5. Presence of essential workflow files:
   ```bash
   [ -f "PATH_TO_DOC_DIR/workflows/ideas/ideas-backlog.md" ] && echo "Ideas backlog exists" || echo "Ideas backlog missing"
   [ -f "PATH_TO_DOC_DIR/workflows/report.md" ] && echo "Workflows report exists" || echo "Workflows report missing"
   ```

### Success Criteria

The installation is successful when:

1. The Pythia core files are properly installed (via git submodule or direct copy)
2. The config.json file contains correct project information
3. The directory structure is created according to configuration
4. Dependencies are installed and available
5. Essential workflow files (ideas-backlog.md and report.md) are created
6. Basic verification steps pass without errors

## Error Handling

The LLM should detect and resolve common errors:

1. Missing Git (for git submodule method)

   - Error message: "git: command not found"
   - Solution: Suggest installing Git or using the direct copying method

2. Project is not a Git repository (for git submodule method)

   - Error message: "fatal: not a git repository"
   - Solution: Initialize git repository with `git init` or use direct copying

3. Missing Node.js/npm

   - Error message: "npm: command not found"
   - Solution: Suggest installing Node.js and npm

4. Insufficient write permissions for directories

   - Error message: "Permission denied"
   - Solution: Suggest running with elevated permissions or changing directory ownership

5. Problems accessing the Pythia repository

   - Error message: "Could not resolve host" or "Repository not found"
   - Solution: Verify internet connection and repository URL

6. Git conflicts

   - Error message: "Automatic merge failed; fix conflicts and then commit the result"
   - Solution: Suggest resolving conflicts manually or choosing a different path

7. npm errors during dependency installation
   - Error message: Various npm error messages
   - Solution: Check npm log for details, ensure Node.js version compatibility

## Troubleshooting

| Problem                        | Symptoms                                 | Solution                                           |
| ------------------------------ | ---------------------------------------- | -------------------------------------------------- |
| Installation stuck             | No progress for several minutes          | Interrupt with Ctrl+C and retry with verbose flags |
| Core installation fails        | Error messages about git or permissions  | Try direct copying method instead of git submodule |
| Config file creation fails     | Error creating or writing to config.json | Check file permissions, verify JSON format         |
| Directory structure incomplete | Missing directories after setup          | Run directory creation commands manually           |
| npm install fails              | Error messages from npm                  | Check Node.js version, clear npm cache, retry      |
| Workflow files not created     | Missing ideas-backlog.md or report.md    | Manually create the files using templates          |

## Interaction Examples

### Example 1: Basic Installation with Git

User: "Install Pythia in my project /home/user/myproject"

LLM: "To install Pythia, I need additional information:

1. What name do you want for the documentation directory? (default 'docs')
2. What name do you want for the core directory? (default 'core')
3. What is the name and description of your project?"

User: "Use the default names and the project name 'My Project'"

LLM performs:

1. Git repository verification
2. Creation of the docs directory
3. Addition of git submodule docs/core from https://github.com/matochu/pythia
4. Installation of dependencies
5. Creation of configuration and directory structure
6. Creation of initial workflow files (ideas-backlog.md and report.md)

### Example 2: Installation with Custom Directory Names

User: "Install Pythia, but place the documentation in the 'documentation' directory, and name the core 'pythia'"

LLM asks for additional information and after receiving it performs the installation with the specified directory names.

### Example 3: Direct Copying without Git Submodule

User: "Install Pythia in my project /home/user/myproject, but don't use git submodule, just copy the files"

LLM performs:

1. Cloning a temporary copy of the repository
2. Copying files to the specified directory
3. Deleting the temporary directory
4. Installing dependencies and configuring the structure
5. Creating initial workflow files

## Related Documents

- [Installing Pythia Guide](../guides/installing-pythia.md)
- [Pythia Documentation Structure](../navigation/documentation-structure.md)
- [Configuration Reference](../guides/configuration.md)
- [Update Documentation Map](../commands/update-documentation-map.md)

---

**Last Updated**: 2025-03-23
