# Pythia - Shared Documentation Base

Welcome to Pythia, a comprehensive **shared documentation base** designed for workspace integration. Pythia provides standardized documentation templates, commands, and methodologies that can be used across multiple projects via modern editors like Cursor and VSCode.

## What is Pythia?

Pythia is a **shared documentation framework** that provides:

- **Standardized Commands**: Pre-built commands for common documentation tasks
- **Documentation Templates**: Consistent templates for various document types
- **Methodologies**: Proven approaches for documentation management
- **Workspace Integration**: Seamless integration with Cursor, VSCode, and other editors

## Quick Start

Pythia is designed for **workspace integration** - simply reference commands in your chat:

```bash
# Create a new task
@create-task.md

# Analyze project architecture
@analyze-project.md

# Create a new proposal
@create-proposal.md

# With project context
Execute @create-task.md for my project at /path/to/your-project

# With specific requirements
Create a task for improving user navigation in my React application
```

### Key Features

- **@Command Syntax**: Reference commands using `@command-name.md`
- **mdc: Links**: Use `mdc:` prefix for workspace-aware file references
- **Project Adaptation**: Commands automatically adapt to your project structure
- **Cross-Project Compatibility**: Works with any project documentation structure

### Project Context

Commands automatically adapt to your project's structure:

```bash
# Specify your project structure  
My project is a web application
My documentation is in ./.pythia directory
My project uses Redux for state management
```

### Navigation and Links

Use `mdc:` links for workspace-aware file references:

```markdown
# Reference project files

[Project Architecture](mdc:navigation/documentation-map.md)

# Reference Pythia commands

[Create Task](mdc:commands/create-task.md)
```

## Legacy Installation (Deprecated)

> **Note**: These installation methods are deprecated. Use workspace integration instead.

### Method 1: LLM-Assisted Installation

This approach is for legacy installations only:

```
Execute the setup.md command to install Pythia in my project at [path].
```

The LLM will:

1. **Analyze your project's state**

   - Check if Pythia core is already installed
   - If not, add it as a git submodule

2. **Configure the environment**

   - Install required npm dependencies
   - Create or update the configuration file

3. **Set up project structure**
   - Configure necessary documentation directories
   - Generate baseline README files for navigation

### Method 2: Manual Step-by-Step Installation

> **Deprecated**: This method is for legacy installations only. Use workspace integration instead.

#### Step 1: Install Pythia Core

Using Git Submodule:

```bash
# Navigate to your project root
cd /path/to/your-project

# Create docs directory if it doesn't exist
mkdir -p .pythia

# Add Pythia core as a git submodule
git submodule add https://github.com/your-org/pythia-core.git .pythia/core
git submodule update --init --recursive
```

#### Step 2: Install Dependencies and Configure

```bash
# Install dependencies
cd .pythia/core
npm install

# Configure settings
vi config.json
```

#### Step 3: Set Up Project Structure

## Available Commands

### Document Creation

- `@create-task.md` - Create task documentation
- `@create-proposal.md` - Create proposal documents
- `@create-idea.md` - Create idea documentation
- `@create-exploration.md` - Create research documents

### Analysis and Review

- `@analyze-project.md` - Comprehensive project analysis
- `@analyze-architecture.md` - Architecture analysis
- `@improve-typescript-files.md` - TypeScript file improvements
- `@review-pull-request.md` - PR review and analysis

### Documentation Management

- `@update-documentation-map.md` - Update navigation
- `@update-status.md` - Update document status
- `@validate-documentation.md` - Validate documentation integrity
- `@archive-tasks.md` - Archive completed tasks

### System Commands

- `@setup.md` - Project setup and configuration
- `@update-command.md` - Update existing commands
- `@sync-confluence.md` - Sync with Confluence
- `@report-workflows.md` - Generate workflow reports

## Examples

### Real Project Usage

#### Web Application Example

```bash
# Create task for feature improvement
@create-task.md

# Context: Web application
# Objective: Improve user navigation system
# Priority: High
# Timeline: 2 weeks
```

#### API Documentation Example

```bash
# Analyze API integration
@analyze-architecture.md

# Focus: API communication patterns
# Context: REST API with authentication
# Requirements: Offline support, error handling
```

## Getting Started

### 1. Choose Your Approach

**Recommended**: Use workspace integration

- Reference commands directly: `@command-name.md`
- Provide project context
- Use workspace navigation

**Legacy**: Use installation methods

- Follow deprecated installation steps
- Limited to single project usage
- Requires manual setup

### 2. Provide Project Context

```bash
# Essential project information
My project is a web application
My docs are in ./.pythia directory
My project uses Redux for state management

# Optional: Specific requirements
I need to improve user navigation
I want to add offline support
I need to optimize performance
```

### 3. Execute Commands

```bash
# Basic command execution
@create-task.md

# With specific requirements
Create a task for improving user navigation in my application

# With project context
Execute this command for my project at /path/to/your-project
```

## Documentation Structure

Pythia works with any documentation structure:

### Standard Structure

```
your-project/
├── .pythia/
│   ├── architecture/
│   ├── workflows/
│   ├── commands/
│   ├── guides/
│   └── navigation/
└── README.md
```

### Flexible Structure

```
your-project/
├── documentation/
│   ├── design/
│   ├── processes/
│   └── decisions/
├── .pythia/
│   └── api/
└── README.md
```

## Support and Resources

### Documentation

- [Workspace Integration (via Setup)](guides/guide-workspace-integration.md) - Run `@setup.md`, verify, and start working
- [Command Reference](commands/) - All available commands
- [Methodology](methodology/) - Documentation methodologies
- [Templates](templates/) - Document templates

### Getting Help

1. **Check Command List**: Review available commands above
2. **Provide Context**: Give clear project information
3. **Use Examples**: Reference similar successful usage
4. **Adapt Commands**: Modify for your specific needs

### Migration from Legacy Usage

If you previously used Pythia as a git submodule:

1. **Remove Old Installation**:

   ```bash
   git submodule deinit .pythia/pythia
   git rm .pythia/pythia
   ```

2. **Use Workspace Integration**:

   - Reference commands directly: `@command-name.md`
   - Use workspace navigation: `mdc:` links
   - Adapt to your project structure

3. **Update References**:
   - Change `../pythia/commands/` to `@command-name.md`
   - Update file paths to use `mdc:` syntax
   - Adapt to your project's documentation structure

```bash
# Create necessary directories
cd /path/to/your-project/.pythia
mkdir -p workflows/tasks workflows/proposals workflows/decisions workflows/ideas
mkdir -p contexts/project contexts/technical contexts/meetings
```

### Method 3: Using installCore.js Script

After adding Pythia core (step 1 above), you can use the automated script to complete setup:

```bash
# Navigate to the core directory
cd /path/to/your-project/.pythia/core

# Run the installation script
node tools/installCore.js .. --method=git

# Or with custom configuration:
node tools/installCore.js .. --method=git --config=./my-config.json
```

For integration, use the command [Setup](commands/setup.md) and see [Workspace Integration (via Setup)](guides/guide-workspace-integration.md).

## Testing Your Installation

After installation, verify that everything works correctly:

```bash
# Check the core installation
ls -la .pythia/core

# Verify project structure
ls -la .pythia/workflows
ls -la .pythia/contexts

# Validate documentation structure
cd .pythia/core/tools
node validateDocumentation.js ../..
```

If the validation passes without errors, your installation is working correctly.

## Documentation Overview

Our documentation is organized into several categories to make information easy to find and maintain:

- **Commands**: Automated commands for documentation management
- **Concept**: Core concept and architecture of the Pythia system
- **Guides**: Practical how-to instructions
- **Methodology**: Development processes and approaches
- **Navigation**: Tools to help navigate the documentation
- **Rules**: Guidelines and standards for LLMs and development
- **Contexts**: Context documents for specific projects
- **Workflows**: Workflows for specific projects
- **Templates**: Templates for creating new documentation

## Key Documents

- [CONCEPT](CONCEPT.md): Detailed description of the Pythia system concept and architecture, principles of document classification and their interaction
- [Documentation Map](navigation/documentation-map.md): Central navigation hub for all documentation, providing quick access to the necessary information
- [Documentation Guidelines](methodology/documentation-guidelines.md): Main rules and standards for working with documentation, including formatting and structure requirements

## Working with Commands

Commands are a central component of the Pythia system, providing structured instructions for LLMs to execute specific tasks. Unlike traditional documentation, commands follow a precise format that both humans and LLMs can understand and reference.

### Key Command Categories

- **Document Creation**: Commands like [create-task](commands/create-task.md), [create-proposal](commands/create-proposal.md), and [create-idea](commands/create-idea.md) for generating new workflow documents
- **Documentation Management**: Commands like [update-changelog](commands/update-changelog.md) and [update-documentation-map](commands/update-documentation-map.md) for maintaining metadata
- **Integration**: Commands like [sync-confluence](commands/sync-confluence.md) and [gen-pr-description](commands/gen-pr-description.md) for connecting with external systems
- **Workflow Management**: Commands like [update-status](commands/update-status.md) and [complete-exploration](commands/complete-exploration.md) for tracking progress

### Using Commands with LLMs

To effectively use commands with LLMs:

1. **Reference the command file**: Direct the LLM to the appropriate command file in the `/commands` directory
2. **Provide necessary context**: Ensure the LLM has access to relevant information needed for the command
3. **Request execution**: Ask the LLM to execute the command according to its documentation
4. **Review and iterate**: Check the output and refine as needed

Example interaction:

```
User: Please create a new task for implementing feature X
LLM: I'll help you create a new task. I'll use the create-task command.
     [References create-task.md and follows its structure]
     [Creates the task document in the proper location with proper format]
```

### Command Structure

Most commands follow a consistent structure:

- **Purpose**: What the command accomplishes
- **Usage**: How to invoke the command
- **Parameters**: Required and optional inputs
- **Output**: Expected results and file changes
- **Examples**: Sample usage patterns
- **Related Commands**: Other relevant commands

## Directory Structure

```
/
├── architecture/              # Analytical documents about architecture
├── methodology/               # Development methodologies and processes
├── rules/                     # Guidelines and standards for LLMs
├── guides/                    # Practical guides and instructions
├── workflows/                 # Work items and documentation workflows
│   ├── tasks/                 # Context from LLM-assisted work
│   ├── proposals/             # Proposals for changes and improvements
│   ├── decisions/             # Architecture Decision Records (ADRs)
│   └── ideas/                 # Ideas and explorations
│       └── explorations/      # Explorations of ideas
├── navigation/                # Navigation documents
├── templates/                 # Templates for creating new documents
├── commands/                  # Instructions for automation tools
├── tools/                     # Automation scripts and utilities
├── VALIDATION_IMPROVEMENTS.md # Guide for enhancing validation
├── CHANGELOG.md               # Record of documentation changes
├── CONCEPT.md                 # Core concept and architecture of the Pythia system
└── README.md                  # This file
```

## Documentation Tools and Enhancements

Pythia uses a collection of documentation commands to facilitate effective interaction between humans and LLMs. For information about automation scripts and utilities that support these commands, see [Documentation Automation Scripts](tools/README.md).

## Working with Documentation

### Finding Information

Start with the [Documentation Map](navigation/documentation-map.md) to find relevant documents. It provides links to all key documents and explains their relationships.

### Contributing to Documentation

When contributing to documentation:

1. Follow the [Documentation Guidelines](methodology/documentation-guidelines.md)
2. Use the established document structure for the specific document type
3. Add cross-references to related documents
4. Update the Documentation Map when adding new documents
5. Record significant changes in the [Changelog](CHANGELOG.md)

### Validating Documentation

We have automated tools for validating documentation integrity:

```bash
# Validate documentation links
npm run docs:validate-links

# Check documentation coverage
npm run docs:check-coverage
```

Reports from these tools are saved in the `/reports` directory.

### Integrating Pythia Core in Other Projects

The Pythia system is designed to be integrated into multiple projects while maintaining a single source of truth for core documentation structures and methodologies. As described in [CONCEPT](CONCEPT.md), the core system components are maintained in a separate repository and integrated into projects.

For detailed instructions on integrating Pythia into your project, see [Workspace Integration (via Setup)](guides/guide-workspace-integration.md), which describes:

1. Three ways to install Pythia core:

   - LLM-assisted installation
   - Manual Git Submodule installation
   - Symbolic link installation (for core developers)

2. Three ways to set up your project after installing the core:
   - LLM-assisted setup
   - Using the installCore.js script
   - Manual configuration

The guide provides step-by-step instructions for each approach, along with troubleshooting tips and next steps after installation.

### Documentation Principles

Our documentation follows these key principles:

1. **Connected**: Documents reference each other to create a complete picture
2. **Current**: Documentation is kept up-to-date with system changes
3. **Contextual**: Documents provide sufficient context for understanding
4. **Consistent**: Similar documents follow consistent patterns and structure
5. **Clear**: Information is presented clearly with appropriate detail

## Documentation Validation

We have two scripts for validating and maintaining documentation quality:

1. **Link Validator**: Checks for broken links and missing reciprocal links

   - `npm run docs:validate-links` - Check links only
   - `npm run docs:fix-links` - Check and fix missing reciprocal links

2. **Coverage Checker**: Ensures all documents are included in the documentation map
   - `npm run docs:check-coverage` - Check document coverage
   - `npm run docs:fix-coverage` - Check and update documentation map

More information: [Validate Documentation](commands/validate-documentation.md)

### Testing Documentation Scripts

We have tests for our documentation validation scripts:

```bash
# Run tests for documentation scripts
npm run test:docs-scripts
```

These tests ensure that our documentation validation tools work correctly, particularly focusing on:

- Proper handling of ignored files
- Correct formatting of reciprocal links
- Avoiding duplicate references
- Accurate documentation coverage reporting
- Extraction of document titles from headings for better link text

## References

- [CONCEPT](CONCEPT.md)
- [Improvement Roadmap](CONCEPT.md)
- [Documentation Structure](navigation/documentation-map.md)
- [Documentation Map](navigation/documentation-map.md)
- [Documentation Standards](navigation/documentation-standards.md)
- [Documentation Guidelines](methodology/documentation-guidelines.md)
- [Validate Documentation](commands/validate-documentation.md)
- [Summary Documents Registry](navigation/summary-documents-registry.md)
- [CHANGELOG](CHANGELOG.md)

