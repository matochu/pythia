#!/usr/bin/env node

/**
 * Bi-directional Link Validator for Documentation
 *
 * This script validates links between markdown documentation files:
 * 1. Checks for broken links to non-existent files
 * 2. Identifies missing reciprocal links (A links to B, but B doesn't link back to A)
 * 3. Generates a report of link issues
 *
 * Usage: ts-node linkValidator.ts [--fix] [--report-file=report.json]
 *
 * @todo Potential Third-Party Library Improvements:
 *
 * 1. File Operations with fs-extra
 *    - Install: npm install fs-extra @types/fs-extra
 *    - Benefits:
 *      - Promise-based API for cleaner async code
 *      - Enhanced file operations with better error handling
 *      - Simplified common patterns like ensuring directories exist
 *    - Example usage:
 *      ```typescript
 *      import * as fse from 'fs-extra';
 *
 *      // Read files with promises
 *      const content = await fse.readFile(filePath, 'utf8');
 *
 *      // Write report, ensuring directory exists
 *      await fse.ensureDir(path.dirname(reportPath));
 *      await fse.writeJson(reportPath, reportData, { spaces: 2 });
 *      ```
 *
 * 2. Markdown Processing with remark
 *    - Install: npm install remark remark-parse unist-util-visit
 *    - Benefits:
 *      - More robust markdown parsing
 *      - AST-based link extraction
 *      - Handles complex markdown structures better
 *    - Example usage for link extraction:
 *      ```typescript
 *      import { remark } from 'remark';
 *      import { visit } from 'unist-util-visit';
 *
 *      async function extractLinks(content: string, filePath: string): Promise<LinkData[]> {
 *        const links: LinkData[] = [];
 *        const ast = remark().parse(content);
 *
 *        visit(ast, 'link', (node, index, parent) => {
 *          const url = node.url as string;
 *          if (isInternalLink(url)) {
 *            links.push({
 *              source: filePath,
 *              target: resolveInternalLink(url, filePath),
 *              lineNumber: getLineNumber(content, node.position?.start?.offset || 0),
 *              textContent: getNodeText(node)
 *            });
 *          }
 *        });
 *
 *        return links;
 *      }
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

interface DocumentLinks {
  outgoing: LinkData[];
  incoming: LinkData[];
}

interface LinkMap {
  [docPath: string]: DocumentLinks;
}

interface ValidationResult {
  brokenLinks: LinkData[];
  missingReciprocal: Array<{
    from: LinkData;
    to: string;
  }>;
  documents: LinkMap;
}

// Configuration
const DOCS_DIR = path.resolve(process.cwd());
const EXCLUDED_DIRS = ['node_modules', '.git'];
// Files to ignore for reciprocal link checking - typically files with example sections that could be confused for actual content
const IGNORED_FILES_FOR_RECIPROCAL = [
  path.join(DOCS_DIR, 'CHANGELOG.md'),
  path.join(DOCS_DIR, 'navigation/documentation-standards.md')
];

// Parse command line arguments
const program = new Command();
program
  .option('--fix', 'Automatically fix missing reciprocal links')
  .option(
    '--report-file <path>',
    'Path to save the JSON report',
    'reports/link-report.json'
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
 * Scan the docs directory and build a link map
 */
async function buildLinkMap(): Promise<LinkMap> {
  const linkMap: LinkMap = {};

  // Find all markdown files
  const files = glob.sync(`${options.docsDir || DOCS_DIR}/**/*.{md,markdown}`, {
    ignore: EXCLUDED_DIRS.map((dir) => `**/${dir}/**`)
  });

  console.log(chalk.blue(`Found ${files.length} markdown files to analyze`));

  // Initialize link map with empty arrays
  files.forEach((file) => {
    const relativePath = path.relative(process.cwd(), file);
    linkMap[relativePath] = {
      outgoing: [],
      incoming: []
    };
  });

  // Extract links from each file
  for (const file of files) {
    const relativePath = path.relative(process.cwd(), file);
    const content = fs.readFileSync(file, 'utf-8');
    const links = await extractLinksFromMarkdown(file, content);

    linkMap[relativePath].outgoing = links;

    // Register incoming links
    links.forEach((link) => {
      if (linkMap[link.target]) {
        linkMap[link.target].incoming.push(link);
      }
    });
  }

  return linkMap;
}

/**
 * Validate links
 */
function validateLinks(linkMap: LinkMap): ValidationResult {
  const brokenLinks: LinkData[] = [];
  const missingReciprocal: Array<{ from: LinkData; to: string }> = [];

  // Check for broken links
  Object.entries(linkMap).forEach(([docPath, links]) => {
    links.outgoing.forEach((link) => {
      if (!fs.existsSync(link.target)) {
        brokenLinks.push(link);
      } else if (!linkMap[link.target]) {
        // Target file exists but isn't in our link map (might be non-markdown)
        // We don't consider these broken
      } else {
        // Check for reciprocal links
        const targetHasReciprocalLink = linkMap[link.target].outgoing.some(
          (targetLink) => targetLink.target === docPath
        );

        if (!targetHasReciprocalLink) {
          missingReciprocal.push({
            from: link,
            to: link.target
          });
        }
      }
    });
  });

  return {
    brokenLinks,
    missingReciprocal,
    documents: linkMap
  };
}

/**
 * Convert text to Title Case format
 * Transforms kebab-case to Title Case (first letter of each word capitalized)
 */
function toTitleCase(text: string): string {
  return text
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Convert filename to Title Case format
 * Transforms document filename to Title Case
 */
function extractDocumentTitle(filePath: string, content: string): string {
  // Get filename without extension
  const baseFilename = path.basename(filePath, path.extname(filePath));

  // Convert to Title Case
  return toTitleCase(baseFilename);
}

/**
 * Add reciprocal links to files
 */
async function fixMissingReciprocalLinks(
  validationResult: ValidationResult
): Promise<void> {
  for (const { from, to } of validationResult.missingReciprocal) {
    // Skip ignored files for reciprocal links
    if (IGNORED_FILES_FOR_RECIPROCAL.includes(to)) {
      console.log(
        chalk.yellow(`Skipping reciprocal link to ignored file: ${to}`)
      );
      continue;
    }

    try {
      const content = fs.readFileSync(to, 'utf-8');
      const fromContent = fs.readFileSync(from.source, 'utf-8');

      // Extract title from the source document
      const documentTitle = extractDocumentTitle(from.source, fromContent);

      // Create a reciprocal link
      const relativePath = path.relative(path.dirname(to), from.source);
      const newLink = `[${documentTitle}](${relativePath})`;

      // Check if this link already exists in the content
      if (content.includes(newLink)) {
        console.log(
          chalk.yellow(`Link to ${from.source} already exists in ${to}`)
        );
        continue;
      }

      // For simplicity, we'll add the link at the end of the References section
      // or at the end of the file if no References section exists
      const refSectionRegex = /## References/i;
      let updatedContent: string;

      if (refSectionRegex.test(content)) {
        // Check if the References section already has similar links
        const referencesSection = content.split(refSectionRegex)[1] || '';
        const linkText = `- ${newLink}`;

        // If the reference already exists (even with different formatting), skip adding it
        if (
          referencesSection.includes(from.source) ||
          referencesSection.includes(
            path.basename(from.source, path.extname(from.source))
          ) ||
          referencesSection.includes(documentTitle)
        ) {
          console.log(
            chalk.yellow(`Reference to ${from.source} already exists in ${to}`)
          );
          continue;
        }

        // Check for existing entries to avoid duplicates - more thorough check
        const referenceLines = referencesSection
          .split('\n')
          .filter((line) => line.trim().startsWith('-'));
        const fileBaseName = path.basename(
          from.source,
          path.extname(from.source)
        );
        const hasExistingReference = referenceLines.some((line) => {
          // Check if the line contains a link to the same file, regardless of text format
          return (
            (line.includes(fileBaseName) || line.includes(documentTitle)) &&
            (line.includes(relativePath) || line.includes(from.source))
          );
        });

        if (hasExistingReference) {
          console.log(
            chalk.yellow(
              `Reference to ${from.source} already exists in ${to} with different formatting`
            )
          );
          continue;
        }

        // Add to existing References section without extra newlines if they already exist
        const referencesLines = content.split(/## References/i);
        const beforeRef = referencesLines[0];
        const afterRef = referencesLines[1];

        // Check if the afterRef starts with newlines
        if (afterRef.startsWith('\n\n')) {
          updatedContent = `${beforeRef}## References${afterRef.replace(
            /^\n\n/,
            `\n- ${newLink}\n`
          )}`;
        } else if (afterRef.startsWith('\n')) {
          updatedContent = `${beforeRef}## References\n- ${newLink}${afterRef}`;
        } else {
          updatedContent = `${beforeRef}## References\n\n- ${newLink}\n${afterRef}`;
        }
      } else {
        // Add a new References section at the end
        updatedContent = `${content.trim()}\n\n## References\n\n- ${newLink}`;
      }

      fs.writeFileSync(to, updatedContent);
      console.log(chalk.green(`Added reciprocal link to ${to}`));
    } catch (error) {
      console.error(
        chalk.red(`Failed to add reciprocal link to ${to}: ${error}`)
      );
    }
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
      totalDocuments: Object.keys(validationResult.documents).length,
      totalLinks: Object.values(validationResult.documents).reduce(
        (sum, doc) => sum + doc.outgoing.length,
        0
      ),
      brokenLinks: validationResult.brokenLinks.length,
      missingReciprocal: validationResult.missingReciprocal.length
    },
    brokenLinks: validationResult.brokenLinks,
    missingReciprocal: validationResult.missingReciprocal
  };

  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  console.log(chalk.blue(`Report written to ${reportFile}`));
}

/**
 * Print validation results to console
 */
function printResults(validationResult: ValidationResult): void {
  const { brokenLinks, missingReciprocal, documents } = validationResult;

  console.log(chalk.blue('\n=== Link Validation Results ===\n'));

  console.log(chalk.white(`Total documents: ${Object.keys(documents).length}`));
  console.log(
    chalk.white(
      `Total links: ${Object.values(documents).reduce(
        (sum, doc) => sum + doc.outgoing.length,
        0
      )}`
    )
  );

  if (brokenLinks.length === 0) {
    console.log(chalk.green('✓ No broken links found'));
  } else {
    console.log(chalk.red(`✗ Found ${brokenLinks.length} broken links:`));
    brokenLinks.forEach((link) => {
      console.log(
        chalk.yellow(
          `  - In ${link.source} (line ${link.lineNumber}): [${link.textContent}](${link.target})`
        )
      );
    });
  }

  if (missingReciprocal.length === 0) {
    console.log(chalk.green('✓ All documents have reciprocal links'));
  } else {
    console.log(
      chalk.yellow(
        `ℹ Found ${missingReciprocal.length} missing reciprocal links:`
      )
    );
    missingReciprocal.forEach(({ from, to }) => {
      console.log(
        chalk.yellow(
          `  - ${from.source} links to ${to}, but ${to} does not link back`
        )
      );
    });
  }
}

/**
 * Main function
 */
async function main(): Promise<void> {
  try {
    console.log(chalk.blue('Building link map...'));
    const linkMap = await buildLinkMap();

    console.log(chalk.blue('Validating links...'));
    const validationResult = validateLinks(linkMap);

    printResults(validationResult);

    if (options.fix && validationResult.missingReciprocal.length > 0) {
      console.log(chalk.blue('\nFixing missing reciprocal links...'));
      await fixMissingReciprocalLinks(validationResult);
    }

    if (options.reportFile) {
      generateReport(validationResult, options.reportFile);
    }

    // Exit with error code if there are broken links
    if (validationResult.brokenLinks.length > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red(`Error: ${error}`));
    process.exit(1);
  }
}

main();
