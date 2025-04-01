# Pythia Project Documentation

Welcome to the Pythia project documentation. This README provides an overview of the documentation structure and guidelines for working with it.

## Quick Installation

The installation consists of three key steps, which can be automated by an LLM or performed manually:

1. Installing Pythia Core
2. Installing dependencies and configuring settings
3. Setting up project directories and structure

### Method 1: LLM-Assisted Installation (Recommended)

This is the simplest approach. The LLM will analyze your project's current state and execute all necessary steps:

```
Execute the setup.md command to install Pythia in my project at [path].
```

Or with a direct link to the command file:

```
Execute this command for Pythia installation: https://github.com/your-org/pythia/blob/main/commands/setup.md
My project is located at [path], using [OS].
```

> **Note**: The `setup.md` file is not just documentation but a _special command designed for LLMs_. It's essentially a program that the LLM interprets and executes automatically, analyzing your project context.

The LLM will:

1. **Analyze your project's state**

   - Check if Pythia core is already installed
   - If not, add it as a git submodule (or symbolic link if specified)

2. **Configure the environment**

   - Install required npm dependencies (if missing)
   - Create or update the configuration file

3. **Set up project structure**
   - Configure necessary documentation directories
   - Generate baseline README files for navigation

You can customize the installation by adding to your request:

```
I'd like to use these settings:
- Installation method: [git/symlink]
- Project name: [Your project name]
- Repository: [Your repository URL]
- Workflow directory: [path to workflow directories]
```

### Method 2: Manual Step-by-Step Installation

If you prefer full control over the installation process:

#### Step 1: Install Pythia Core

Using Git Submodule:

```bash
# Navigate to your project root
cd /path/to/your-project

# Create docs directory if it doesn't exist
mkdir -p docs

# Add Pythia core as a git submodule
git submodule add https://github.com/your-org/pythia-core.git docs/core
git submodule update --init --recursive
```

Or using Symbolic Link (for developers):

```bash
# Navigate to your project root
cd /path/to/your-project

# Create docs directory if it doesn't exist
mkdir -p docs

# Create symbolic link to the Pythia core
ln -s /path/to/pythia-core docs/core
```

#### Step 2: Install Dependencies and Configure

```bash
# Install dependencies
cd docs/core
npm install

# Configure settings
vi config.json
```

#### Step 3: Set Up Project Structure

```bash
# Create necessary directories
cd /path/to/your-project/docs
mkdir -p workflows/tasks workflows/proposals workflows/decisions workflows/ideas
mkdir -p contexts/project contexts/technical contexts/meetings
```

### Method 3: Using installCore.js Script

After adding Pythia core (step 1 above), you can use the automated script to complete setup:

```bash
# Navigate to the core directory
cd /path/to/your-project/docs/core

# Run the installation script
node tools/installCore.js .. --method=git

# Or with custom configuration:
node tools/installCore.js .. --method=git --config=./my-config.json
```

For detailed installation instructions, see our [Installation Guide](guides/installing-pythia.md).

## Testing Your Installation

After installation, verify that everything works correctly:

```bash
# Check the core installation
ls -la docs/core

# Verify project structure
ls -la docs/workflows
ls -la docs/contexts

# Validate documentation structure
cd docs/core/tools
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

For detailed instructions on integrating Pythia into your project, see our [Installation Guide](guides/installing-pythia.md), which describes:

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
- [Improvement Roadmap](architecture/improvement-roadmap.md)
- [Documentation Structure](navigation/documentation-structure.md)
- [Documentation Map](navigation/documentation-map.md)
- [Documentation Standards](navigation/documentation-standards.md)
- [Documentation Guidelines](methodology/documentation-guidelines.md)
- [Validate Documentation](commands/validate-documentation.md)
- [Summary Documents Registry](navigation/summary-documents-registry.md)
- [CHANGELOG](CHANGELOG.md)
