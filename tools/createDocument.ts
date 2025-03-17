/**
 * Document Creation Script
 *
 * This script automates the creation of new documentation files based on templates.
 * It provides intelligent metadata filling, suggestions for document relationships,
 * and automatic integration with the Documentation Map.
 *
 * Usage:
 * ts-node scripts/documentation/createDocument.ts [--type TYPE] [--title "TITLE"] [--path PATH] [--interactive] [--suggest-links]
 *
 * Options:
 *   --type TYPE: Type of document to create (task, analysis, command, rule, etc.)
 *   --title "TITLE": Title for the new document
 *   --path PATH: Custom path for the document (overrides default location)
 *   --interactive: Run in interactive mode, prompting for details
 *   --suggest-links: Suggest potential links to related documents
 *   --dry-run: Show what would be created without writing files
 *
 * @todo Potential Third-Party Library Improvements:
 *
 * 1. Interactive CLI with inquirer
 *    - Install: npm install inquirer @types/inquirer
 *    - Benefits:
 *      - Better interactive user experience with form-style prompts
 *      - Support for multiple prompt types (list, checkbox, confirm, etc.)
 *      - Input validation and conditional questions
 *      - Consistent interface and better user experience
 *    - Example usage for interactive mode:
 *      ```typescript
 *      import inquirer from 'inquirer';
 *
 *      async function promptForDocumentDetails(): Promise<DocumentMetadata> {
 *        return inquirer.prompt([
 *          {
 *            type: 'list',
 *            name: 'type',
 *            message: 'Select document type:',
 *            choices: Object.keys(DEFAULT_TEMPLATES),
 *            default: 'task'
 *          },
 *          {
 *            type: 'input',
 *            name: 'title',
 *            message: 'Document title:',
 *            validate: (input) => input.trim().length > 0 ? true : 'Title is required'
 *          },
 *          {
 *            type: 'input',
 *            name: 'path',
 *            message: 'Custom path (leave empty for default):',
 *            default: ''
 *          },
 *          {
 *            type: 'confirm',
 *            name: 'suggestLinks',
 *            message: 'Would you like to suggest related documents?',
 *            default: true
 *          }
 *        ]);
 *      }
 *      ```
 *
 * 2. Template Processing with Handlebars
 *    - Install: npm install handlebars
 *    - Benefits:
 *      - More powerful template syntax with conditionals and loops
 *      - Support for partial templates and template inheritance
 *      - Helper functions for common template operations
 *      - Consistent template processing across document types
 *    - Example usage for template rendering:
 *      ```typescript
 *      import * as Handlebars from 'handlebars';
 *
 *      // Register helpers
 *      Handlebars.registerHelper('formatDate', (date) => {
 *        return new Date(date).toISOString().split('T')[0]; // YYYY-MM-DD
 *      });
 *
 *      // Register partials
 *      const headerPartial = fs.readFileSync('../templates/partials/header.hbs', 'utf8');
 *      Handlebars.registerPartial('header', headerPartial);
 *
 *      // Compile and render template
 *      const templateSource = fs.readFileSync(templatePath, 'utf8');
 *      const template = Handlebars.compile(templateSource);
 *      const rendered = template({
 *        title: metadata.title,
 *        date: new Date(),
 *        author: metadata.author,
 *        type: metadata.type,
 *        // Additional metadata
 *      });
 *      ```
 */

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as readline from 'readline';
import { semanticSearch } from './updateDocumentationMap';

const execAsync = promisify(exec);

// Configuration
const DOCS_DIR = './';
const TEMPLATES_DIR = 'templates';
const DEFAULT_TEMPLATES: Record<string, string> = {
  task: 'templates/task-template.md',
  analysis: 'templates/analysis-template.md',
  command: 'templates/command-template.md',
  rule: 'templates/rule-template.md',
  guide: 'templates/guide-template.md',
  general: 'templates/general-template.md'
};

// Command line arguments
const args = process.argv.slice(2);
const INTERACTIVE = args.includes('--interactive');
const DRY_RUN = args.includes('--dry-run');
const SUGGEST_LINKS = args.includes('--suggest-links');

const getArgValue = (flag: string): string | null => {
  const index = args.findIndex((arg) => arg === flag);
  if (index !== -1 && index + 1 < args.length) {
    return args[index + 1];
  }
  return null;
};

const DOC_TYPE = getArgValue('--type') || '';
const DOC_TITLE = getArgValue('--title') || '';
const CUSTOM_PATH = getArgValue('--path') || '';

// Interface for document metadata
interface DocumentMetadata {
  title: string;
  type: string;
  path: string;
  filename: string;
  createdDate: string;
  id: string;
  owner: string;
  status: string;
  priority: string;
  tags: string[];
}

// Interface for template variables
interface TemplateVariables {
  title: string;
  id: string;
  date: string;
  owner: string;
  status: string;
  priority: string;
  filename: string;
  tags: string;
  year: string;
  month: string;
  [key: string]: string;
}

// Interface for related document
interface RelatedDocument {
  path: string;
  title: string;
  relevance: number;
}

/**
 * Create a readline interface for interactive input
 */
function createReadlineInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * Get user input through readline
 */
async function getUserInput(
  prompt: string,
  defaultValue: string = ''
): Promise<string> {
  const rl = createReadlineInterface();

  return new Promise<string>((resolve) => {
    rl.question(
      `${prompt}${defaultValue ? ` (${defaultValue})` : ''}: `,
      (answer) => {
        rl.close();
        resolve(answer || defaultValue);
      }
    );
  });
}

/**
 * Get user selection from a list of options
 */
async function getUserSelection<T>(
  prompt: string,
  options: T[],
  formatter: (item: T) => string
): Promise<T | null> {
  const rl = createReadlineInterface();

  console.log(prompt);
  options.forEach((option, index) => {
    console.log(`${index + 1}. ${formatter(option)}`);
  });
  console.log(`0. Cancel`);

  return new Promise<T | null>((resolve) => {
    rl.question('Enter selection number: ', (answer) => {
      rl.close();
      const selection = parseInt(answer, 10);
      if (isNaN(selection) || selection < 0 || selection > options.length) {
        resolve(null);
      } else if (selection === 0) {
        resolve(null);
      } else {
        resolve(options[selection - 1]);
      }
    });
  });
}

/**
 * List available templates
 */
async function listAvailableTemplates(): Promise<string[]> {
  try {
    if (!fs.existsSync(TEMPLATES_DIR)) {
      console.log(
        `Templates directory not found at ${TEMPLATES_DIR}, using default templates`
      );
      return Object.values(DEFAULT_TEMPLATES).filter((templatePath) =>
        fs.existsSync(templatePath)
      );
    }

    const files = await fs.promises.readdir(TEMPLATES_DIR);
    return files
      .filter((file) => file.endsWith('-template.md'))
      .map((file) => path.join(TEMPLATES_DIR, file));
  } catch (error) {
    console.error('Error listing templates:', error);
    return Object.values(DEFAULT_TEMPLATES).filter((templatePath) =>
      fs.existsSync(templatePath)
    );
  }
}

/**
 * Get document type from template path
 */
function getDocumentTypeFromTemplate(templatePath: string): string {
  const basename = path.basename(templatePath, '.md');
  return basename.replace('-template', '');
}

/**
 * Run in interactive mode to gather document details
 */
async function gatherDocumentDetails(): Promise<DocumentMetadata | null> {
  console.log('Creating a new document interactively...');

  // List available templates
  const templates = await listAvailableTemplates();

  if (templates.length === 0) {
    console.error('No templates found. Cannot create document.');
    return null;
  }

  // Get document type based on template
  const templatePath = await getUserSelection(
    'Select a template:',
    templates,
    (template) => `${getDocumentTypeFromTemplate(template)} (${template})`
  );

  if (!templatePath) {
    console.log('Document creation cancelled.');
    return null;
  }

  const docType = getDocumentTypeFromTemplate(templatePath);

  // Get document title
  const title = await getUserInput('Enter document title');
  if (!title) {
    console.log('Document creation cancelled. Title is required.');
    return null;
  }

  // Generate ID based on type and current date
  const today = new Date();
  const year = today.getFullYear().toString();
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const id = `${docType}-${year}-${month}-${slugify(title)}`;

  // Generate filename
  let filename: string;
  if (docType === 'task') {
    filename = `task-${year}-${month}-${slugify(title)}.md`;
  } else {
    filename = `${docType}-${slugify(title)}.md`;
  }

  // Get document path
  const docDir = `${DOCS_DIR}/${docType}s`;

  // Additional metadata
  const owner = await getUserInput(
    'Enter document owner',
    'Documentation Team'
  );
  const status = await getUserInput('Enter document status', 'Draft');
  const priority = await getUserInput('Enter document priority', 'Medium');
  const tags = await getUserInput('Enter tags (comma separated)', '');

  return {
    title,
    type: docType,
    path: docDir,
    filename,
    createdDate: today.toISOString().split('T')[0],
    id,
    owner,
    status,
    priority,
    tags: tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
  };
}

/**
 * Slugify text for use in filenames and IDs
 * @param text Text to slugify
 * @returns Slugified text
 * @throws Error if text is empty or contains invalid characters
 */
function slugify(text: string): string {
  if (!text || typeof text !== 'string') {
    throw new Error('Text must be a non-empty string');
  }

  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Find template file for document type
 * @param docType Document type
 * @returns Template path or null if not found
 */
async function findTemplate(docType: string): Promise<string | null> {
  if (!docType || typeof docType !== 'string') {
    throw new Error('Document type must be a non-empty string');
  }

  // Check default templates first
  const defaultTemplate = DEFAULT_TEMPLATES[docType];
  if (defaultTemplate && fs.existsSync(defaultTemplate)) {
    return defaultTemplate;
  }

  // Search in templates directory
  const templatePath = path.join(TEMPLATES_DIR, `${docType}-template.md`);
  if (fs.existsSync(templatePath)) {
    return templatePath;
  }

  return null;
}

/**
 * Generate unique document ID
 * @param docType Document type
 * @param title Document title
 * @returns Generated ID
 * @throws Error if inputs are invalid
 */
function generateDocumentId(docType: string, title: string): string {
  if (!docType || typeof docType !== 'string') {
    throw new Error('Document type must be a non-empty string');
  }
  if (!title || typeof title !== 'string') {
    throw new Error('Title must be a non-empty string');
  }

  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const slug = slugify(title);

  return `${docType}-${year}-${month}-${slug}`;
}

/**
 * Process template with variables
 * @param templateContent Template content
 * @param variables Template variables
 * @returns Processed content
 * @throws Error if template processing fails
 */
function processTemplate(
  templateContent: string,
  variables: TemplateVariables
): string {
  if (!templateContent || typeof templateContent !== 'string') {
    throw new Error('Template content must be a non-empty string');
  }
  if (!variables || typeof variables !== 'object') {
    throw new Error('Variables must be a non-empty object');
  }

  try {
    let processed = templateContent;

    // Replace each variable in the template
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(regex, value);
    });

    // Check for any remaining template variables
    const remainingVars = processed.match(/{{[^}]+}}/g);
    if (remainingVars) {
      throw new Error(
        `Missing template variables: ${remainingVars.join(', ')}`
      );
    }

    return processed;
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Template processing failed: ${error.message}`);
    }
    throw new Error('Template processing failed: Unknown error');
  }
}

/**
 * Find related documents based on title and suggest links
 */
async function findRelatedDocuments(
  title: string,
  docType: string
): Promise<RelatedDocument[]> {
  try {
    // Use semantic search from updateDocumentationMap.ts
    const searchResults = await semanticSearch(title);

    // Filter out documents of the same type to prioritize cross-references
    return searchResults
      .filter((result) => !result.path.includes(`/${docType}s/`))
      .map((result) => ({
        path: result.path,
        title: result.title,
        relevance: result.relevance
      }));
  } catch (error) {
    console.error('Error finding related documents:', error);
    return [];
  }
}

/**
 * Create relationships section with suggested links
 */
function createRelationshipsSection(relatedDocs: RelatedDocument[]): string {
  if (relatedDocs.length === 0) {
    return '';
  }

  let section = `\n## Related Documents\n\n`;

  for (const doc of relatedDocs) {
    const relativePath = `../${path.relative(DOCS_DIR, doc.path)}`;
    section += `- [${doc.title}](${relativePath})\n`;
  }

  return section;
}

/**
 * Update the Documentation Map with the new document
 */
async function updateDocumentationMap(
  docData: DocumentMetadata
): Promise<void> {
  try {
    if (DRY_RUN) {
      console.log('[DRY RUN] Would update Documentation Map with new document');
      return;
    }

    // Execute updateDocumentationMap script with --add-all flag
    await execAsync(
      `ts-node scripts/documentation/updateDocumentationMap.ts --add-all`
    );
    console.log('Documentation Map updated successfully');
  } catch (error) {
    console.error('Error updating Documentation Map:', error);
  }
}

/**
 * Create a new document based on command line args or interactive input
 */
async function createDocument(): Promise<void> {
  let docData: DocumentMetadata | null = null;

  // Get document details
  if (INTERACTIVE || !DOC_TYPE || !DOC_TITLE) {
    docData = await gatherDocumentDetails();
    if (!docData) return;
  } else {
    // Use command line args
    const today = new Date();
    const year = today.getFullYear().toString();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');

    // Generate filename
    let filename: string;
    if (DOC_TYPE === 'task') {
      filename = `task-${year}-${month}-${slugify(DOC_TITLE)}.md`;
    } else {
      filename = `${DOC_TYPE}-${slugify(DOC_TITLE)}.md`;
    }

    // Set default path
    const docDir = CUSTOM_PATH || `${DOCS_DIR}/${DOC_TYPE}s`;

    docData = {
      title: DOC_TITLE,
      type: DOC_TYPE,
      path: docDir,
      filename,
      createdDate: today.toISOString().split('T')[0],
      id: generateDocumentId(DOC_TYPE, DOC_TITLE),
      owner: 'Documentation Team',
      status: 'Draft',
      priority: 'Medium',
      tags: []
    };
  }

  // Find template
  const templatePath = await findTemplate(docData.type);
  if (!templatePath) return;

  // Read template
  const templateContent = fs.readFileSync(templatePath, 'utf8');

  // Prepare template variables
  const variables: TemplateVariables = {
    title: docData.title,
    id: docData.id,
    date: docData.createdDate,
    owner: docData.owner,
    status: docData.status,
    priority: docData.priority,
    filename: docData.filename,
    tags: docData.tags.join(', '),
    year: docData.createdDate.split('-')[0],
    month: docData.createdDate.split('-')[1]
  };

  // Process the template
  let content = processTemplate(templateContent, variables);

  // Find related documents if suggested
  if (SUGGEST_LINKS) {
    console.log('Finding related documents...');
    const relatedDocs = await findRelatedDocuments(docData.title, docData.type);

    if (relatedDocs.length > 0) {
      console.log(`Found ${relatedDocs.length} potentially related documents`);
      const relationshipsSection = createRelationshipsSection(relatedDocs);
      content += relationshipsSection;
    } else {
      console.log('No related documents found');
    }
  }

  // Create the output directory if it doesn't exist
  const outputDir = docData.path;
  if (!fs.existsSync(outputDir)) {
    if (DRY_RUN) {
      console.log(`[DRY RUN] Would create directory: ${outputDir}`);
    } else {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`Created directory: ${outputDir}`);
    }
  }

  // Write the document
  const outputPath = path.join(outputDir, docData.filename);

  if (DRY_RUN) {
    console.log(`[DRY RUN] Would create document at: ${outputPath}`);
    console.log('Document content preview:');
    console.log('---');
    console.log(content.split('\n').slice(0, 10).join('\n') + '\n...');
    console.log('---');
  } else {
    fs.writeFileSync(outputPath, content);
    console.log(`Document created at: ${outputPath}`);

    // Update Documentation Map
    await updateDocumentationMap(docData);
  }
}

/**
 * Create templates directory and default templates if they don't exist
 */
async function ensureTemplatesExist(): Promise<void> {
  if (!fs.existsSync(TEMPLATES_DIR)) {
    if (DRY_RUN) {
      console.log(
        `[DRY RUN] Would create templates directory: ${TEMPLATES_DIR}`
      );
    } else {
      fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
      console.log(`Created templates directory: ${TEMPLATES_DIR}`);
    }
  }

  // Define default templates
  const defaultTemplates: Record<string, string> = {
    'task-template.md': `# {{title}}

## Overview

**Task ID**: {{id}}  
**Date Created**: {{date}}  
**Status**: {{status}}  
**Priority**: {{priority}}  
**Owner**: {{owner}}

## Context

Provide context and background information for this task.

## Objectives

- [ ] Objective 1
- [ ] Objective 2
- [ ] Objective 3

## Scope

**In Scope**:

- Item 1
- Item 2

**Out of Scope**:

- Item 1
- Item 2

## Success Criteria

- [ ] Criteria 1
- [ ] Criteria 2

## Implementation Plan

1. Step 1
2. Step 2
3. Step 3

## References

- [Documentation Map](../navigation/documentation-map.md)

## Archive Note

This document is eligible for archiving when all success criteria are met and it has been in "Completed" status for 7 days.

---

**Last Updated**: {{date}}
`,
    'analysis-template.md': `# {{title}}

## Overview

**Analysis ID**: {{id}}  
**Date Created**: {{date}}  
**Status**: {{status}}  
**Analyst**: {{owner}}

## Background

Provide background information and context for this analysis.

## Objectives

Define the objectives of this analysis.

## Methodology

Describe the methodology used in this analysis.

## Findings

Detail the findings of this analysis.

## Recommendations

Provide recommendations based on the findings.

## References

- [Documentation Map](../navigation/documentation-map.md)

---

**Last Updated**: {{date}}
`,
    'command-template.md': `# {{title}}

## Overview

This document provides instructions for running the {{title}} command.

## Prerequisites

List any prerequisites for running this command.

## Steps

1. Step 1
2. Step 2
3. Step 3

## Example

\`\`\`bash
# Example command
\`\`\`

## Expected Outcome

Describe the expected outcome after running this command.

## Troubleshooting

Provide troubleshooting tips for common issues.

## References

- [Documentation Map](../navigation/documentation-map.md)

---

**Last Updated**: {{date}}
`,
    'rule-template.md': `# {{title}}

## Overview

This document outlines the rules for {{title}}.

## Rules

1. Rule 1
2. Rule 2
3. Rule 3

## Rationale

Explain the rationale behind these rules.

## Examples

### Example 1

Provide an example of following the rules.

### Example 2

Provide another example.

## References

- [Documentation Map](../navigation/documentation-map.md)

---

**Last Updated**: {{date}}
`,
    'guide-template.md': `# {{title}}

## Introduction

Introduce the guide topic.

## Getting Started

Provide initial setup or context for getting started.

## Sections

### Section 1

Content for section 1.

### Section 2

Content for section 2.

## Best Practices

Share best practices related to this guide.

## References

- [Documentation Map](../navigation/documentation-map.md)

---

**Last Updated**: {{date}}
`,
    'general-template.md': `# {{title}}

## Overview

Provide an overview of this document.

## Content

Main content of the document.

## Conclusions

Document conclusions.

## References

- [Documentation Map](../navigation/documentation-map.md)

---

**Last Updated**: {{date}}
`
  };

  // Create each default template if it doesn't exist
  for (const [filename, content] of Object.entries(defaultTemplates)) {
    const templatePath = path.join(TEMPLATES_DIR, filename);

    if (!fs.existsSync(templatePath)) {
      if (DRY_RUN) {
        console.log(`[DRY RUN] Would create template: ${templatePath}`);
      } else {
        fs.writeFileSync(templatePath, content);
        console.log(`Created template: ${templatePath}`);
      }
    }
  }
}

/**
 * Main function
 */
async function main() {
  try {
    // Ensure templates exist
    await ensureTemplatesExist();

    // Create document
    await createDocument();
  } catch (error) {
    console.error('Error creating document:', error);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

// Export functions for testing
export {
  createDocument,
  findTemplate,
  processTemplate,
  findRelatedDocuments,
  slugify
};
