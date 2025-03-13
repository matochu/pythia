# Documentation Automation Scripts

This directory contains scripts for validating, maintaining, and enhancing the documentation structure.

## Available Scripts

### Documentation Map Updater

`updateDocumentationMap.ts` - Maintains the comprehensive documentation map.

Features:

- Identifies all documentation files and updates the central map
- Provides semantic search capabilities across documentation
- Analyzes document relationships and generates visualizations
- Supports interactive mode for selective updates
- Generates Mermaid diagrams of document relationships
- Calculates document metadata (word count, reading time)
- Identifies central documents and orphaned documents
- Tracks document relationships and backlinks

Usage:

```bash
# Update documentation map
npm run docs:update-map

# Add all missing documents automatically
npm run docs:update-map-add-all

# Interactive mode
npm run docs:update-map-interactive

# Search documentation
npm run docs:update-map -- --search "your search query"

# Analyze document relationships
npm run docs:update-map -- --analyze-links

# Generate visualization
npm run docs:update-map -- --analyze-links --visualize
```

### Link Validator

`linkValidator.ts` - Validates bidirectional links between markdown documentation files.

Features:

- Identifies broken links (links to non-existent files)
- Detects missing reciprocal links
- Generates detailed reports of link issues
- Can automatically fix missing reciprocal links

Usage:

```bash
# From project root
npm run docs:validate-links

# To automatically fix missing reciprocal links
npm run docs:fix-links

# With custom options
ts-node scripts/documentation/linkValidator.ts --report-file=my-report.json
```

### Coverage Checker

`coverageChecker.ts` - Verifies the completeness of documentation coverage.

Features:

- Verifies that all documents mentioned in aggregator documents exist
- Ensures all documents are included in the documentation map
- Identifies potentially moved documents
- Can automatically update the documentation map with missing entries

Usage:

```bash
# From project root
npm run docs:check-coverage

# To automatically update the documentation map
npm run docs:fix-coverage

# With custom options
ts-node scripts/documentation/coverageChecker.ts --report-file=coverage-report.json
```

### Task Archiver

`archiveTasks.ts` - Automates the archiving of completed tasks.

Features:

- Identifies completed tasks based on status and criteria
- Verifies completion timeframe and criteria fulfillment
- Moves tasks to archive while preserving references
- Updates documentation map accordingly

Usage:

```bash
# Archive completed tasks
npm run docs:archive-tasks

# Dry run (shows what would be archived)
npm run docs:archive-tasks --dry-run

# Force archive regardless of criteria
npm run docs:archive-tasks --force
```

### Document Creator

`createDocument.ts` - Streamlines creation of new documentation.

Features:

- Creates new documents based on templates
- Provides intelligent metadata filling
- Suggests relationships with existing documents
- Automatically updates documentation map with new entries

Usage:

```bash
# Create a new document interactively
npm run docs:create-doc --interactive

# Create a specific type of document
npm run docs:create-doc --type task --title "Implement Feature X"

# Suggest related documents
npm run docs:create-doc --suggest-links
```

### Document Quality Validator

`validateDocumentQuality.ts` - Checks documentation quality and consistency.

Features:

- Validates markdown structure and formatting
- Checks for broken links and references
- Analyzes readability metrics and content quality
- Provides suggestions for improvements

Usage:

```bash
# Validate all documentation
npm run docs:validate-quality --all

# Validate specific document
npm run docs:validate-quality --path docs/example.md

# Generate quality report
npm run docs:validate-quality --report docs/reports/quality-report.md
```

### Document Helper

`documentHelper.ts` - Core utilities for document processing.

Features:

- Semantic search and content analysis
- Document metadata extraction
- Template processing and rendering
- Utility functions used by other scripts

## Recommended Libraries

To enhance the functionality of these scripts, consider using the following libraries:

### Core Utilities

- **fs-extra**: Extended file system operations with Promise support

  ```bash
  npm install fs-extra @types/fs-extra
  ```

- **commander**: Comprehensive command-line argument handling
  ```bash
  npm install commander
  ```

### Date and Time

- **date-fns**: Modern date manipulation library
  ```bash
  npm install date-fns
  ```

### Search and Content Analysis

- **Fuse.js**: Lightweight fuzzy-search library

  ```bash
  npm install fuse.js
  ```

- **compromise**: Natural language processing for JavaScript
  ```bash
  npm install compromise
  ```

### User Interaction

- **inquirer**: Interactive command-line user interfaces

  ```bash
  npm install inquirer @types/inquirer
  ```

- **chalk**: Terminal string styling (already in use)
  ```bash
  npm install chalk
  ```

### Template Processing

- **handlebars**: Semantic templates
  ```bash
  npm install handlebars
  ```

### Markdown Processing

- **unified/remark**: Markdown processing ecosystem
  ```bash
  npm install unified remark-parse remark-rehype rehype-stringify
  ```

## Integration

For detailed information on integrating these scripts with LLMs and handling common documentation issues, see the [Documentation Automation - LLM Guide](/docs/commands/documentation-automation.md).

## Requirements

- Node.js
- TypeScript
- ts-node
- Dependencies installed via `npm install`

## Development

To extend these scripts or add new documentation automation tools, follow these guidelines:

1. Use TypeScript for type safety
2. Document new scripts in this README
3. Add NPM script entries in package.json for easy access
4. Update the LLM guide with relevant information for new tools
5. Consider implementing the recommended libraries for improved functionality
6. Add tests for new functionality in `scripts/tests`

## Testing

The scripts include comprehensive test coverage using Vitest:

```bash
# Run all documentation script tests
npm run test:docs-scripts

# Run specific test file
npm run test:docs-scripts scripts/tests/updateDocumentationMap.test.ts
```

## CI/CD Integration

To integrate these scripts into CI/CD pipeline:

1. Add to GitHub Actions:

```yaml
jobs:
  validate-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '16'
      - run: npm ci
      - run: npm install -g typescript ts-node
      - run: cd scripts/documentation && ts-node linkValidator.ts
      - run: cd scripts/documentation && ts-node coverageChecker.ts
      - run: cd scripts/documentation && ts-node updateDocumentationMap.ts --analyze-links
```

2. Add as a pre-commit hook for local validation:

```bash
#!/bin/sh
# File: .git/hooks/pre-commit

cd scripts/documentation
ts-node linkValidator.ts
ts-node coverageChecker.ts
```

## Troubleshooting

Common issues and solutions:

1. **Script runs but finds no documents**: Ensure `DOCS_DIR` is correctly set and that the script is running from the project root.

2. **Performance issues with large document sets**: Consider implementing caching mechanisms and incremental updates.

3. **Template rendering errors**: Verify that templates follow the expected format for the chosen template engine.

4. **CI pipeline failures**: Ensure all dependencies are correctly installed in the CI environment.

5. **ES Module issues**: Make sure to use the `--esm` flag with ts-node and have proper TypeScript configuration for ES modules.
