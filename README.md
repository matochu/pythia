# Mnemosyne Project Documentation

Welcome to the Mnemosyne project documentation. This README provides an overview of the documentation structure and guidelines for working with it.

## Documentation Overview

Our documentation is organized into several categories to make information easy to find and maintain:

- **Architecture Analysis**: Detailed analysis of current architecture components
- **Proposals**: Suggestions for improvements based on analysis findings
- **Architecture Decisions**: Records of important architectural decisions
- **Methodology**: Development processes and approaches
- **Rules**: Guidelines and standards for LLMs and development
- **Guides**: Practical how-to instructions
- **Tasks**: Context and records from LLM-assisted task completion
- **Navigation**: Tools to help navigate the documentation
- **Templates**: Templates for creating new documentation

## Key Documents

- [Documentation Map](navigation/documentation-map.md): Central navigation hub for all documentation
- [Changelog](CHANGELOG.md): Records of all significant documentation changes
- [Documentation Guidelines](methodology/documentation-guidelines.md): Guidelines for working with documentation
- [Technical Debt](architecture/tech-debt.md): Analysis of technical debt
- [Validate Documentation](commands/validate-documentation.md): Guide for using documentation automation tools
- [Commands](commands/): Automated commands for documentation management

## Documentation Tools and Enhancements

We've enhanced our documentation system with modern tools and libraries to improve productivity and document quality:

### Enhanced Features

1. **Interactive Document Creation**

   - Create new documents through guided prompts with [Inquirer.js](https://github.com/SBoudrias/Inquirer.js/)
   - Use `npm run docs:create-doc --interactive` for step-by-step guidance

2. **Powerful Document Templates**

   - Template rendering with [Handlebars](https://handlebarsjs.com/)
   - Dynamic content generation with conditional sections and helpers

3. **Advanced Search**

   - Fuzzy-search across all documentation with [Fuse.js](https://fusejs.io/)
   - Search by content, title, or tags: `npm run docs:search "your search terms"`

4. **Quality Validation**

   - Automated validation of document structure and links
   - Document quality metrics and improvement recommendations

5. **Date and Time Utilities**

   - Date manipulation and archiving with [date-fns](https://date-fns.org/)
   - Accurate age calculations for document lifecycle management

6. **Documentation Core Management**
   - Easy reuse of documentation structure across projects
   - Create symlinks, directory structures, and configuration with comprehensive options
   - Use `npm run docs:setup` within the docs directory to set up in other projects
   - Supports various options for flexibility in deployment

### Documentation Scripts

Key scripts for working with documentation:

| Script               | Purpose                   | Enhanced With           |
| -------------------- | ------------------------- | ----------------------- |
| `docs:create-doc`    | Create new documents      | Inquirer.js, Handlebars |
| `docs:search`        | Search documentation      | Fuse.js                 |
| `docs:validate`      | Validate document quality | unified/remark          |
| `docs:archive-tasks` | Archive completed tasks   | date-fns, fs-extra      |
| `docs:update-map`    | Update documentation map  | Fuse.js, Commander      |
| `docs:setup`         | Set up documentation core | fs, path, TypeScript    |

For detailed instructions on using these tools, see the [commands directory](commands/).

## Directory Structure

```
/docs/
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
├── VALIDATION_IMPROVEMENTS.md # Guide for enhancing validation
├── CHANGELOG.md               # Record of documentation changes
└── README.md                  # This file
```

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

### Reusing Documentation Core in Other Projects

Our documentation core can be easily reused in other projects through the `docs:setup` command located in the `docs` directory. This command is designed to streamline the process of transferring our documentation structure, templates, and tools to other projects.

#### Installation

The `docs:setup` command is located in the docs package to ensure portability:

```bash
# Navigate to the docs directory first
cd docs

# Then run the setup command with appropriate options
npm run docs:setup -- [target-path] [options]
```

#### Available Options

The command supports several options for flexible deployment:

- `--check-only`: Checks if the command is running in the main repository without making changes
- `--force`: Overwrites existing files without confirmation
- `--install-deps`: Automatically runs npm install after setup
- `--ignore-check`: Skips checking if running in the main repository
- `--create-structure`: Creates only the directory structure without symbolic links
- `--no-setup`: Skips creating the directory structure
- `--help`: Displays all available options and usage examples

#### Usage Examples

```bash
# Basic usage to create structure in another project
cd docs
npm run docs:setup -- ../other-project/docs

# Check if running in main repository
npm run docs:setup -- --check-only

# Create structure and run npm install
npm run docs:setup -- ../other-project/docs --install-deps

# Create structure without symlinks
npm run docs:setup -- --create-structure

# Force overwrite existing files and install dependencies
npm run docs:setup -- ../other-project/docs --force --install-deps

# Show all available options
npm run docs:setup -- --help
```

This allows for consistent documentation structure across multiple projects, ensuring that best practices are maintained across your organization's repositories.

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

- [Improvement Roadmap](architecture/improvement-roadmap.md)
- [Documentation Structure](navigation/documentation-structure.md)
- [Documentation Map](navigation/documentation-map.md)
- [Documentation Standards](navigation/documentation-standards.md)
- [Documentation Guidelines](methodology/documentation-guidelines.md)
- [Validate Documentation](commands/validate-documentation.md)
- [Summary Documents Registry](navigation/summary-documents-registry.md)
- [CHANGELOG](CHANGELOG.md)
