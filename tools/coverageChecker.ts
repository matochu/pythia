#!/usr/bin/env node

/**
 * Documentation Coverage Checker
 *
 * This script verifies:
 * 1. All documents mentioned in aggregator documents actually exist
 * 2. All documents are included in the documentation map
 *
 * It helps maintain documentation integrity and ensures the documentation map
 * serves as a reliable navigation hub.
 *
 * Usage: ts-node coverageChecker.ts [--fix] [--report-file=report.json]
 *
 * @todo Potential Third-Party Library Improvements:
 *
 * 1. Command-line Interface with commander
 *    - Install: npm install commander
 *    - Benefits:
 *      - Better command-line argument parsing and validation
 *      - Automatic help text generation
 *      - Sub-commands support for complex script functionality
 *      - Better organization of command options
 *    - Example usage:
 *      ```typescript
 *      import { Command } from 'commander';
 *
 *      const program = new Command();
 *
 *      program
 *        .name('coverageChecker')
 *        .description('Checks documentation coverage and completeness')
 *        .version('1.0.0');
 *
 *      program
 *        .option('-f, --fix', 'Automatically fix issues')
 *        .option('-r, --report-file <path>', 'Path to save the report')
 *        .option('-v, --verbose', 'Show detailed output')
 *        .option('-d, --docs-dir <path>', 'Documentation directory', 'docs');
 *
 *      program.parse();
 *
 *      const options = program.opts();
 *      const FIX = options.fix || false;
 *      const REPORT_FILE = options.reportFile || 'coverage-report.json';
 *      ```
 */

import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import chalk from 'chalk';
import { Command } from 'commander';

// Types
interface LinkData {
  source: string;
  target: string;
  lineNumber: number;
  textContent: string;
}

interface DocumentReference {
  referencedIn: string;
  referencedAs: string;
  lineNumber: number;
}

interface DocumentMap {
  // Document path → array of documents that reference it
  references: { [docPath: string]: DocumentReference[] };
  // All existing documents
  existingDocs: Set<string>;
  // Documents mentioned in the doc map
  docsInMap: Set<string>;
  // Aggregator documents
  aggregators: Set<string>;
}

interface ValidationResult {
  // Documents referenced but don't exist
  missingDocs: { [docPath: string]: DocumentReference[] };
  // Existing documents not in the documentation map
  docsNotInMap: string[];
  // Referenced documents that may have moved (similar name exists)
  possiblyMovedDocs: { [docPath: string]: string[] };
}

// Configuration
const DOCS_DIR = path.resolve(process.cwd(), 'docs');
const DOC_MAP_PATH = path.join(DOCS_DIR, 'navigation', 'documentation-map.md');
const SUMMARY_REGISTRY_PATH = path.join(
  DOCS_DIR,
  'navigation',
  'summary-documents-registry.md'
);
const EXCLUDED_DIRS = ['node_modules', '.git'];
const KNOWN_AGGREGATORS = [
  DOC_MAP_PATH,
  SUMMARY_REGISTRY_PATH,
  path.join(DOCS_DIR, 'architecture', 'tech-debt.md'),
  path.join(DOCS_DIR, 'architecture', 'improvement-roadmap.md')
];

// Parse command line arguments
const program = new Command();
program
  .option('-f, --fix', 'Attempt to fix documentation map (add missing docs)')
  .option(
    '-r, --report-file <file>',
    'Output report file path',
    'reports/doc-coverage-report.json'
  )
  .option('-d, --docs-dir <dir>', 'Documentation directory', DOCS_DIR)
  .parse(process.argv);

const options = program.opts();

/**
 * Extract links from markdown content
 */
async function extractLinksFromMarkdown(
  filePath: string,
  content: string
): Promise<LinkData[]> {
  const links: LinkData[] = [];
  const lines = content.split('\n');

  // Regular expression to match markdown links
  // This matches both [text](url) and [text][reference] formats
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let match;

    while ((match = linkRegex.exec(line)) !== null) {
      const textContent = match[1];
      let targetPath = match[2];

      // Skip external links and anchors
      if (targetPath.startsWith('http') || targetPath.startsWith('#')) {
        continue;
      }

      // Clean up the target path (remove query params, anchors)
      targetPath = targetPath.split('#')[0];
      targetPath = targetPath.split('?')[0];

      // Skip empty paths
      if (!targetPath) continue;

      // Convert relative path to absolute path
      const sourceDir = path.dirname(filePath);
      const absoluteTargetPath = path.resolve(sourceDir, targetPath);
      const normalizedTargetPath = path.relative(
        process.cwd(),
        absoluteTargetPath
      );

      links.push({
        source: path.relative(process.cwd(), filePath),
        target: normalizedTargetPath,
        lineNumber: i + 1,
        textContent
      });
    }
  }

  return links;
}

/**
 * Scan the docs directory and build a document map
 */
async function buildDocumentMap(): Promise<DocumentMap> {
  const docMap: DocumentMap = {
    references: {},
    existingDocs: new Set<string>(),
    docsInMap: new Set<string>(),
    aggregators: new Set<string>(
      KNOWN_AGGREGATORS.map((p) => path.relative(process.cwd(), p))
    )
  };

  // Find all markdown files
  const files = glob.sync(`${options.docsDir || DOCS_DIR}/**/*.{md,markdown}`, {
    ignore: EXCLUDED_DIRS.map((dir) => `**/${dir}/**`)
  });

  console.log(chalk.blue(`Found ${files.length} markdown files to analyze`));

  // Record all existing docs
  files.forEach((file) => {
    const relativePath = path.relative(process.cwd(), file);
    docMap.existingDocs.add(relativePath);
  });

  // Check if documentation map exists
  const docMapRelative = path.relative(process.cwd(), DOC_MAP_PATH);
  if (!docMap.existingDocs.has(docMapRelative)) {
    console.warn(
      chalk.yellow(`Warning: Documentation map not found at ${docMapRelative}`)
    );
  } else {
    // Extract links from documentation map
    const docMapContent = fs.readFileSync(DOC_MAP_PATH, 'utf-8');
    const docMapLinks = await extractLinksFromMarkdown(
      DOC_MAP_PATH,
      docMapContent
    );

    docMapLinks.forEach((link) => {
      docMap.docsInMap.add(link.target);
    });

    console.log(
      chalk.blue(
        `Found ${docMap.docsInMap.size} documents in documentation map`
      )
    );
  }

  // Extract links from each file to identify references
  for (const file of files) {
    const relativePath = path.relative(process.cwd(), file);
    const content = fs.readFileSync(file, 'utf-8');
    const links = await extractLinksFromMarkdown(file, content);

    // Only process links from aggregator documents
    if (docMap.aggregators.has(relativePath)) {
      links.forEach((link) => {
        if (!docMap.references[link.target]) {
          docMap.references[link.target] = [];
        }

        docMap.references[link.target].push({
          referencedIn: link.source,
          referencedAs: link.textContent,
          lineNumber: link.lineNumber
        });
      });
    }
  }

  return docMap;
}

/**
 * Find similar file paths for a missing document
 */
function findSimilarFiles(
  missingPath: string,
  existingDocs: Set<string>
): string[] {
  const filename = path.basename(missingPath);
  const directory = path.dirname(missingPath);

  const similarFiles: string[] = [];

  // Strategy 1: Check if a file with the same name exists in a different directory
  for (const doc of existingDocs) {
    if (path.basename(doc) === filename && path.dirname(doc) !== directory) {
      similarFiles.push(doc);
    }
  }

  // Strategy 2: Check if a file with a similar name exists in the same directory
  const filenameWithoutExt = path.basename(filename, path.extname(filename));
  for (const doc of existingDocs) {
    const docDir = path.dirname(doc);
    const docFilenameWithoutExt = path.basename(doc, path.extname(doc));

    if (
      docDir === directory &&
      docFilenameWithoutExt.includes(filenameWithoutExt) &&
      docFilenameWithoutExt !== filenameWithoutExt
    ) {
      similarFiles.push(doc);
    }
  }

  return similarFiles;
}

/**
 * Validate document coverage
 */
function validateCoverage(docMap: DocumentMap): ValidationResult {
  const { references, existingDocs, docsInMap, aggregators } = docMap;

  const result: ValidationResult = {
    missingDocs: {},
    docsNotInMap: [],
    possiblyMovedDocs: {}
  };

  // Check for missing referenced documents
  Object.entries(references).forEach(([docPath, refs]) => {
    if (!existingDocs.has(docPath)) {
      result.missingDocs[docPath] = refs;

      // Find similar files that might be the moved version
      const similarFiles = findSimilarFiles(docPath, existingDocs);
      if (similarFiles.length > 0) {
        result.possiblyMovedDocs[docPath] = similarFiles;
      }
    }
  });

  // Check for documents not in map
  existingDocs.forEach((doc) => {
    // Skip the documentation map itself and certain doc types if needed
    if (
      doc === path.relative(process.cwd(), DOC_MAP_PATH) ||
      aggregators.has(doc)
    ) {
      return;
    }

    if (!docsInMap.has(doc)) {
      result.docsNotInMap.push(doc);
    }
  });

  return result;
}

/**
 * Fix documentation map by adding missing documents
 */
async function fixDocumentationMap(
  validationResult: ValidationResult,
  docMap: DocumentMap
): Promise<void> {
  const docMapPath = DOC_MAP_PATH;
  const docsNotInMap = validationResult.docsNotInMap;

  if (docsNotInMap.length === 0) {
    console.log(
      chalk.green('No missing documents to add to documentation map')
    );
    return;
  }

  try {
    // Read the documentation map
    let content = fs.readFileSync(docMapPath, 'utf-8');
    let additions = '\n\n### Recently Added Documents\n\n';

    // Organize by directory
    const docsByDir: { [dir: string]: string[] } = {};
    docsNotInMap.forEach((doc) => {
      const dir = path.dirname(doc);
      if (!docsByDir[dir]) {
        docsByDir[dir] = [];
      }
      docsByDir[dir].push(doc);
    });

    // Add missing documents grouped by directory
    Object.entries(docsByDir).forEach(([dir, docs]) => {
      additions += `#### ${dir}\n\n`;
      docs.forEach((doc) => {
        const filename = path.basename(doc);
        const title = path
          .basename(filename, path.extname(filename))
          .replace(/-/g, ' ')
          .replace(/^(\w)|\s(\w)/g, (match) => match.toUpperCase());

        additions += `- [${title}](/${doc})\n`;
      });
      additions += '\n';
    });

    // Check if the "Recently Added Documents" section already exists
    if (content.includes('### Recently Added Documents')) {
      // Replace existing section
      content = content.replace(
        /### Recently Added Documents[\s\S]*?(?=##|$)/,
        additions
      );
    } else {
      // Add at the end of the file
      content += additions;
    }

    fs.writeFileSync(docMapPath, content);
    console.log(
      chalk.green(
        `Updated documentation map with ${docsNotInMap.length} missing documents`
      )
    );
  } catch (error) {
    console.error(chalk.red(`Failed to update documentation map: ${error}`));
  }
}

/**
 * Generate report
 */
function generateReport(
  validationResult: ValidationResult,
  reportFile: string
): void {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      missingDocuments: Object.keys(validationResult.missingDocs).length,
      documentsNotInMap: validationResult.docsNotInMap.length,
      possiblyMovedDocuments: Object.keys(validationResult.possiblyMovedDocs)
        .length
    },
    missingDocs: validationResult.missingDocs,
    docsNotInMap: validationResult.docsNotInMap,
    possiblyMovedDocs: validationResult.possiblyMovedDocs
  };

  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  console.log(chalk.blue(`Report written to ${reportFile}`));
}

/**
 * Print validation results to console
 */
function printResults(validationResult: ValidationResult): void {
  const { missingDocs, docsNotInMap, possiblyMovedDocs } = validationResult;

  console.log(chalk.blue('\n=== Documentation Coverage Results ===\n'));

  if (Object.keys(missingDocs).length === 0) {
    console.log(chalk.green('✓ All referenced documents exist'));
  } else {
    console.log(
      chalk.red(
        `✗ Found ${Object.keys(missingDocs).length} referenced documents that don't exist:`
      )
    );
    Object.entries(missingDocs).forEach(([docPath, refs]) => {
      console.log(chalk.yellow(`  - Missing: ${docPath}`));
      console.log(chalk.gray(`    Referenced in:`));
      refs.forEach((ref) => {
        console.log(
          chalk.gray(`    - ${ref.referencedIn} (line ${ref.lineNumber})`)
        );
      });

      if (possiblyMovedDocs[docPath]) {
        console.log(chalk.blue(`    Possible alternatives:`));
        possiblyMovedDocs[docPath].forEach((alt) => {
          console.log(chalk.blue(`    - ${alt}`));
        });
      }
    });
  }

  if (docsNotInMap.length === 0) {
    console.log(
      chalk.green('✓ All documents are included in the documentation map')
    );
  } else {
    console.log(
      chalk.yellow(
        `ℹ Found ${docsNotInMap.length} documents not included in the documentation map:`
      )
    );
    docsNotInMap.forEach((doc) => {
      console.log(chalk.yellow(`  - ${doc}`));
    });
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  try {
    console.log(chalk.blue('Building document map...'));
    const docMap = await buildDocumentMap();

    console.log(chalk.blue('Validating document coverage...'));
    const validationResult = validateCoverage(docMap);

    printResults(validationResult);

    if (options.fix && validationResult.docsNotInMap.length > 0) {
      console.log(
        chalk.blue('\nUpdating documentation map with missing documents...')
      );
      await fixDocumentationMap(validationResult, docMap);
    }

    if (options.reportFile) {
      generateReport(validationResult, options.reportFile);
    }

    // Exit with error code if there are missing documents
    if (Object.keys(validationResult.missingDocs).length > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error}`));
    process.exit(1);
  }
}

main();
