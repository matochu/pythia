/**
 * Document Quality Validation Script
 *
 * This script automates the process of checking documentation quality.
 * It validates markdown structure, checks for broken links, analyzes readability,
 * ensures consistency, and provides recommendations for improvements.
 *
 * Installation:
 * npm install markdownlint markdown-link-check reading-time natural textlint chalk glob
 *
 * Usage:
 * ts-node scripts/documentation/validateDocumentQuality.ts [--path PATH] [--all] [--fix] [--report REPORT_PATH]
 *
 * Options:
 *   --path PATH: Specific file or directory to validate
 *   --all: Check all documentation files
 *   --fix: Automatically fix common issues
 *   --report REPORT_PATH: Path to save the validation report
 *   --strict: Apply stricter validation rules
 *   --rules PATH: Path to custom rule configuration
 *   --help, -h: Show this help message
 * 
 * @todo Potential Third-Party Library Improvements:
 * 
 * 1. Advanced Document Processing with unified/remark
 *    - Install: npm install unified remark-parse remark-rehype rehype-stringify remark-lint
 *    - Benefits:
 *      - Robust AST-based markdown parsing and transformation
 *      - Extensive ecosystem of plugins for various checks
 *      - Better support for fixing issues automatically
 *      - Standardized document processing pipeline
 *    - Example usage:
 *      ```typescript
 *      import { unified } from 'unified';
 *      import remarkParse from 'remark-parse';
 *      import remarkLint from 'remark-lint';
 *      import remarkPresetLintRecommended from 'remark-preset-lint-recommended';
 *      import remarkStringify from 'remark-stringify';
 *      
 *      async function validateMarkdown(content: string): Promise<{text: string, messages: any[]}> {
 *        const file = await unified()
 *          .use(remarkParse)
 *          .use(remarkLint)
 *          .use(remarkPresetLintRecommended)
 *          .use(remarkStringify)
 *          .process(content);
 *          
 *        return {
 *          text: String(file),
 *          messages: file.messages
 *        };
 *      }
 *      ```
 * 
 * 2. Grammar and Style Checking with retext
 *    - Install: npm install retext retext-english retext-syntax-urls
 *    - Benefits: Better NLP, grammar/style checking, customizable style rules
 
 */

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import { glob } from 'glob';

// Instead of trying to type the external modules, just use 'any' where needed
// Type definitions for third-party libraries
type MarkdownlintOptions = any;
type ReadingTimeResult = { text: string; words: number; minutes: number };
type ReadingTime = (text: string) => ReadingTimeResult;
type MarkdownLinkCheckResult = {
  link: string;
  status: string;
  statusCode?: number;
};

// Promisify exec
const execAsync = promisify(exec);

// Configuration
const DOCS_DIR = '.';
const DEFAULT_REPORT_PATH = 'reports/quality-report.md';
const DEFAULT_RULES_CONFIG = 'rules/document-quality-rules.json';

// Command line arguments
const args = process.argv.slice(2);
const ALL_DOCS = args.includes('--all');
const FIX_ISSUES = args.includes('--fix');
const STRICT_MODE = args.includes('--strict');
const SHOW_HELP = args.includes('--help') || args.includes('-h');

/**
 * Shows help information
 */
function showHelp(): void {
  console.log(`
Document Quality Validation Script

Usage: 
  ts-node validateDocumentQuality.ts [options]

Options:
  --path PATH           Specific file or directory to validate
  --all                 Check all documentation files
  --fix                 Automatically fix common issues
  --report PATH         Path to save the validation report (default: ${DEFAULT_REPORT_PATH})
  --strict              Apply stricter validation rules
  --rules PATH          Path to custom rule configuration (default: ${DEFAULT_RULES_CONFIG})
  --help, -h            Show this help message

Examples:
  ts-node validateDocumentQuality.ts --path ./README.md
  ts-node validateDocumentQuality.ts --all --fix
  ts-node validateDocumentQuality.ts --all --report ./quality-report.md
  `);
  process.exit(0);
}

const getArgValue = (flag: string): string | null => {
  const index = args.findIndex((arg) => arg === flag);
  if (index !== -1 && index + 1 < args.length) {
    return args[index + 1];
  }
  return null;
};

const TARGET_PATH = getArgValue('--path') || (ALL_DOCS ? DOCS_DIR : null);
const REPORT_PATH = getArgValue('--report');
const RULES_PATH = getArgValue('--rules') || DEFAULT_RULES_CONFIG;

// Interfaces for document validation
/**
 * Represents a document for validation
 */
interface Document {
  path: string;
  content: string;
  type: string;
  name: string;
  metadata: DocumentMetadata;
}

/**
 * Document metadata
 */
interface DocumentMetadata {
  title: string;
  created: string;
  lastUpdated: string;
  status?: string;
  owner?: string;
  wordCount: number;
  readingTime: number;
  hasAllRequiredSections: boolean;
  [key: string]: any;
}

/**
 * Issue severity levels
 */
enum IssueSeverity {
  Error = 'error',
  Warning = 'warning',
  Suggestion = 'suggestion',
  Info = 'info'
}

/**
 * Quality check categories
 */
enum QualityCategory {
  Structure = 'structure',
  Links = 'links',
  Content = 'content',
  Style = 'style',
  Compliance = 'compliance',
  Spelling = 'spelling',
  Grammar = 'grammar',
  Consistency = 'consistency'
}

/**
 * Validation issue
 */
interface ValidationIssue {
  documentPath: string;
  line?: number;
  column?: number;
  message: string;
  ruleId: string;
  severity: IssueSeverity;
  category: QualityCategory;
  fixable: boolean;
  fixSuggestion?: string;
}

/**
 * Document validation result
 */
interface DocumentValidationResult {
  documentPath: string;
  documentName: string;
  documentType: string;
  issues: ValidationIssue[];
  metrics: {
    wordCount: number;
    readingTime: number;
    averageSentenceLength: number;
    flesch: number; // Flesch Reading Ease score
    complexityScore: number;
    deadLinks: number;
    [key: string]: number;
  };
  score: number; // Overall quality score
  status: 'pass' | 'warn' | 'fail';
}

/**
 * Overall validation report
 */
interface ValidationReport {
  timestamp: string;
  totalDocuments: number;
  passedDocuments: number;
  warnDocuments: number;
  failedDocuments: number;
  totalIssues: number;
  issuesByCategory: Record<string, number>;
  documentResults: DocumentValidationResult[];
  averageScore: number;
}

/**
 * Validation options
 */
interface ValidationOptions {
  strictMode: boolean;
  fixIssues: boolean;
  generateReport: boolean;
  reportPath: string;
  rulesConfig: any;
  all?: boolean;
  path?: string;
  report?: string;
}

/**
 * Result of validation for reporting
 */
interface ValidationResult {
  filePath: string;
  issues: ValidationIssue[];
  qualityScore: number;
}

/**
 * Loads and processes a document
 * @param filePath Path to the document
 * @returns Document object
 * @throws Error if document cannot be loaded or processed
 */
async function loadDocument(filePath: string): Promise<Document> {
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('File path must be a non-empty string');
  }

  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    if (!content) {
      throw new Error(`Empty file: ${filePath}`);
    }

    const name = path.basename(filePath);
    const type = path.dirname(filePath).split('/').pop() || 'unknown';
    const metadata = extractMetadata(content, filePath);

    return {
      path: filePath,
      content,
      type,
      name,
      metadata
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Failed to load document ${filePath}: ${error.message}`);
    }
    throw new Error(`Failed to load document ${filePath}: Unknown error`);
  }
}

/**
 * Extracts metadata from the document
 */
function extractMetadata(content: string, filePath: string): DocumentMetadata {
  let title = '';
  let created = '';
  let lastUpdated = '';
  let status = '';
  let owner = '';

  // Extract title (first # Title line)
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch && titleMatch[1]) {
    title = titleMatch[1].trim();
  }

  // Extract creation date
  const createdMatch =
    content.match(/Date Created[^\n]*:\s*(.+)$/m) ||
    content.match(/Created[^\n]*:\s*(.+)$/m);
  if (createdMatch && createdMatch[1]) {
    created = createdMatch[1].trim();
  }

  // Extract last updated date
  const updatedMatch =
    content.match(/Last Updated[^\n]*:\s*(.+)$/m) ||
    content.match(/Updated[^\n]*:\s*(.+)$/m);
  if (updatedMatch && updatedMatch[1]) {
    lastUpdated = updatedMatch[1].trim();
  } else {
    // If no update data, use file modification date
    const stats = fs.statSync(filePath);
    lastUpdated = stats.mtime.toISOString().split('T')[0];
  }

  // Extract status
  const statusMatch = content.match(/Status[^\n]*:\s*(.+)$/m);
  if (statusMatch && statusMatch[1]) {
    status = statusMatch[1].trim();
  }

  // Extract owner
  const ownerMatch =
    content.match(/Owner[^\n]*:\s*(.+)$/m) ||
    content.match(/Author[^\n]*:\s*(.+)$/m) ||
    content.match(/Analyst[^\n]*:\s*(.+)$/m);
  if (ownerMatch && ownerMatch[1]) {
    owner = ownerMatch[1].trim();
  }

  // Check required sections
  const requiredSections = getRequiredSectionsForDocType(
    path.dirname(filePath).split('/').pop() || 'unknown'
  );
  const hasAllRequiredSections = checkRequiredSections(
    content,
    requiredSections
  );

  return {
    title,
    created,
    lastUpdated,
    status,
    owner,
    wordCount: 0, // Will be filled later
    readingTime: 0, // Will be filled later
    hasAllRequiredSections
  };
}

/**
 * Returns required sections for the document type
 */
function getRequiredSectionsForDocType(docType: string): string[] {
  switch (docType) {
    case 'tasks':
      return ['Overview', 'Context', 'Objectives', 'Scope', 'Success Criteria'];
    case 'analysis':
      return ['Overview', 'Background', 'Findings', 'Recommendations'];
    case 'commands':
      return ['Overview', 'Prerequisites', 'Steps', 'Example'];
    case 'rules':
      return ['Overview', 'Rules', 'Rationale'];
    case 'guides':
      return ['Introduction', 'Getting Started', 'Sections'];
    default:
      return ['Overview'];
  }
}

/**
 * Check if document has all required sections
 * @param content Document content
 * @param requiredSections List of required section names
 * @returns true if all required sections are present
 * @throws Error if inputs are invalid
 */
function checkRequiredSections(
  content: string,
  requiredSections: string[]
): boolean {
  if (!content || typeof content !== 'string') {
    throw new Error('Content must be a non-empty string');
  }
  if (!Array.isArray(requiredSections)) {
    throw new Error('Required sections must be an array');
  }
  if (requiredSections.some((section) => typeof section !== 'string')) {
    throw new Error('All required sections must be strings');
  }

  // Convert content to lowercase for case-insensitive matching
  const lowerContent = content.toLowerCase();

  // Check each required section
  return requiredSections.every((section) => {
    const sectionPattern = new RegExp(
      `^##?\\s+${section.toLowerCase()}\\s*$`,
      'm'
    );
    return sectionPattern.test(lowerContent);
  });
}

/**
 * Validates document using markdownlint
 */
async function validateMarkdownLint(
  document: Document
): Promise<ValidationIssue[]> {
  try {
    // Dynamically load markdownlint - handle the correct way
    const markdownlintModule = await import('markdownlint');
    // Create a proper instance that has sync method
    const markdownlint = (markdownlintModule.default ||
      markdownlintModule) as any;

    // Load rules configuration or use default
    let config: MarkdownlintOptions = {
      MD013: false
    };

    if (fs.existsSync(RULES_PATH)) {
      try {
        config = {
          ...JSON.parse(fs.readFileSync(RULES_PATH, 'utf8')),
          MD013: false
        };
      } catch (error) {
        console.warn(
          chalk.yellow(
            `Error loading rules config from ${RULES_PATH}, using default rules`
          )
        );
      }
    }

    // Add additional strict rules if strict mode is enabled
    if (STRICT_MODE) {
      config = {
        ...config,
        MD033: true, // No inline HTML
        MD041: true, // First line must be a top-level heading
        MD046: true, // Code block style
        MD048: true // Code fence style
      };
    }

    const options = {
      files: [document.path],
      config,
      resultVersion: 3
    };

    const results = markdownlint.sync(options);
    const issues: ValidationIssue[] = [];

    // Convert markdownlint results to our ValidationIssue format
    if (results[document.path]) {
      for (const issue of results[document.path]) {
        issues.push({
          documentPath: document.path,
          line: issue.lineNumber,
          column: undefined,
          message:
            issue.ruleDescription +
            (issue.errorDetail ? `: ${issue.errorDetail}` : ''),
          ruleId: `markdownlint:${issue.ruleNames.join(',')}`,
          severity: issue.errorContext
            ? IssueSeverity.Error
            : IssueSeverity.Warning,
          category: QualityCategory.Structure,
          fixable: issue.fixInfo !== undefined,
          fixSuggestion: issue.fixInfo?.replacement
        });
      }
    }

    return issues;
  } catch (error) {
    console.error(
      chalk.red(`Error running markdownlint on ${document.path}: ${error}`)
    );
    return [];
  }
}

/**
 * Checks links in the document
 */
async function validateLinks(document: Document): Promise<ValidationIssue[]> {
  try {
    // Use ts-ignore to suppress the TypeScript error
    // @ts-ignore
    const markdownLinkCheck = (await import('markdown-link-check')).default;

    // Extract links manually to better handle root-relative links
    const links: string[] = [];
    const urlMatches =
      document.content.match(/\[.+?\]\(((?!https?:\/\/).+?)\)/g) || [];

    // Find all links in the document
    for (const match of urlMatches) {
      const linkMatch = match.match(/\[.+?\]\((.+?)\)/);
      if (linkMatch && linkMatch[1]) {
        links.push(linkMatch[1]);
      }
    }

    const issues: ValidationIssue[] = [];

    // Check for root-relative links that might be problematic
    for (const link of links) {
      // Check if the link starts with a slash (root-relative)
      if (link.startsWith('/')) {
        // Find the line number where this link appears
        const lines = document.content.split('\n');
        let linkLine = 1;

        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(link)) {
            linkLine = i + 1;
            break;
          }
        }

        // Add issue for root-relative link
        issues.push({
          documentPath: document.path,
          line: linkLine,
          message: `Root-relative link found: ${link}. Consider using relative links instead.`,
          ruleId: 'link-check:root-relative-link',
          severity: IssueSeverity.Warning,
          category: QualityCategory.Links,
          fixable: true,
          fixSuggestion: `Consider changing this to a relative link`
        });
      }
    }

    // Now check all links using markdown-link-check
    return new Promise<ValidationIssue[]>((resolve) => {
      markdownLinkCheck(
        document.content,
        {
          baseUrl: `file://${path.dirname(path.resolve(document.path))}/`,
          ignorePatterns: [
            { pattern: '^http://localhost' },
            { pattern: '^#' } // Ignore anchor links (checked separately)
          ],
          // Add a custom handler for file URLs to better handle root-relative paths
          httpHeaders: [
            {
              urls: ['http://', 'https://'],
              headers: {
                'User-Agent': 'Mozilla/5.0'
              }
            }
          ]
        },
        (err: any, results: MarkdownLinkCheckResult[]) => {
          if (err) {
            console.error(
              chalk.red(`Error checking links in ${document.path}: ${err}`)
            );
            resolve(issues); // Return already found issues
            return;
          }

          for (const result of results) {
            if (result.status !== 'alive') {
              // Find the line where the link appears
              const lines = document.content.split('\n');
              let linkLine = 1;

              for (let i = 0; i < lines.length; i++) {
                if (lines[i].includes(result.link)) {
                  linkLine = i + 1;
                  break;
                }
              }

              issues.push({
                documentPath: document.path,
                line: linkLine,
                message: `Broken link: ${result.link} (${result.status})`,
                ruleId: 'link-check:dead-link',
                severity: IssueSeverity.Error,
                category: QualityCategory.Links,
                fixable: false
              });
            }
          }

          resolve(issues);
        }
      );
    });
  } catch (error) {
    console.error(
      chalk.red(`Error checking links in ${document.path}: ${error}`)
    );
    return [];
  }
}

/**
 * Analyzes readability of text
 */
async function analyzeReadability(document: Document): Promise<{
  issues: ValidationIssue[];
  metrics: {
    averageSentenceLength: number;
    flesch: number;
    complexityScore: number;
  };
}> {
  try {
    // Dynamically load natural for text analysis
    const natural = await import('natural');

    // Remove Markdown formatting for proper text analysis
    const cleanText = document.content
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/\[.*?\]\(.*?\)/g, '$1') // Replace links with their text
      .replace(/[*_~`]/g, ''); // Remove formatting symbols

    // Tokenize text into sentences - use any type to avoid constructor errors
    const SentenceTokenizer = natural.SentenceTokenizer as any;
    const tokenizer = new SentenceTokenizer();
    const sentences = tokenizer.tokenize(cleanText);

    // Tokenize into words for sentence length analysis
    const wordTokenizer = new natural.WordTokenizer();
    const sentenceLengths = sentences.map(
      (sentence: string) => wordTokenizer?.tokenize(sentence)?.length || 0
    );

    // Calculate average sentence length
    const averageSentenceLength =
      sentenceLengths.reduce((sum: number, length: number) => sum + length, 0) /
        sentences.length || 0;

    // Calculate Flesch Reading Ease
    // Formula: 206.835 - 1.015 * (words / sentences) - 84.6 * (syllables / words)
    // Simplified since syllable counting is complex
    const words = document.metadata.wordCount;
    const sentenceCount = sentences.length;

    // Approximate syllable count (could be improved with a syllable library)
    const syllableEstimate = words * 1.5; // Assume average 1.5 syllables per word

    const flesch =
      206.835 -
      1.015 * (words / sentenceCount) -
      84.6 * (syllableEstimate / words);

    // Calculate complexity score (lower is better)
    // This is a rough estimate based on sentence length and Flesch score
    const complexityScore = averageSentenceLength * 0.5 - flesch * 0.1;

    // Generate issues based on metrics
    const issues: ValidationIssue[] = [];

    // Check for long sentences
    const longSentences = sentences.filter(
      (sentence: string, index: number) => sentenceLengths[index] > 25
    );
    if (longSentences.length > 0) {
      issues.push({
        documentPath: document.path,
        message: `Document contains ${longSentences.length} long sentences (>25 words). Consider breaking them up.`,
        ruleId: 'readability:long-sentences',
        severity: IssueSeverity.Suggestion,
        category: QualityCategory.Style,
        fixable: false
      });
    }

    // Check Flesch score
    if (flesch < 30) {
      issues.push({
        documentPath: document.path,
        message: `Document has low readability score (${flesch.toFixed(
          1
        )}). Consider simplifying the language.`,
        ruleId: 'readability:low-flesch-score',
        severity: IssueSeverity.Warning,
        category: QualityCategory.Style,
        fixable: false
      });
    }

    return {
      issues,
      metrics: {
        averageSentenceLength,
        flesch,
        complexityScore
      }
    };
  } catch (error) {
    console.error(
      chalk.red(`Error analyzing readability of ${document.path}: ${error}`)
    );
    return {
      issues: [],
      metrics: {
        averageSentenceLength: 0,
        flesch: 0,
        complexityScore: 0
      }
    };
  }
}

/**
 * Finds all Markdown files in a directory
 */
function getAllMarkdownFiles(targetPath?: string): string[] {
  const basePath = targetPath || DOCS_DIR;
  console.log(chalk.blue(`Searching for markdown documents in ${basePath}`));

  try {
    return glob.sync(`${basePath}/**/*.md`, {
      ignore: [
        '**/node_modules/**', // Ignore documentation in node_modules
        '**/reports/**' // Ignore documentation in reports directory
      ]
    });
  } catch (error) {
    console.error(chalk.red(`Error finding markdown files: ${error}`));
    return [];
  }
}

/**
 * Parses command line options
 */
function parseOptions(): ValidationOptions {
  let rulesConfig = {};

  // Safely read rules file if it exists
  if (RULES_PATH && fs.existsSync(RULES_PATH)) {
    try {
      rulesConfig = JSON.parse(fs.readFileSync(RULES_PATH, 'utf8'));
    } catch (e) {
      console.warn(
        chalk.yellow(`Warning: Failed to parse rules from ${RULES_PATH}`)
      );
    }
  }

  // Define report path
  const reportPath = REPORT_PATH || DEFAULT_REPORT_PATH;

  return {
    strictMode: STRICT_MODE,
    fixIssues: FIX_ISSUES,
    generateReport: !!reportPath,
    reportPath: reportPath,
    rulesConfig,
    all: ALL_DOCS,
    path: TARGET_PATH || undefined,
    report: reportPath
  };
}

/**
 * Validates a document with specified options, accepting a file path
 */
async function validateDocument(
  fileOrDoc: string | Document,
  options: ValidationOptions
): Promise<ValidationResult> {
  // Handle string filepath input
  if (typeof fileOrDoc === 'string') {
    const document = await loadDocument(fileOrDoc);
    return validateDocumentContent(document, options);
  }

  // Otherwise it's already a Document
  return validateDocumentContent(fileOrDoc, options);
}

/**
 * Internal implementation for document validation
 */
async function validateDocumentContent(
  document: Document,
  options: ValidationOptions
): Promise<ValidationResult> {
  console.log(chalk.blue(`Validating document: ${document.path}`));

  // Collect issues from different validators
  const markdownLintIssues = await validateMarkdownLint(document);
  const linkIssues = await validateLinks(document);
  const { issues: readabilityIssues, metrics: readabilityMetrics } =
    await analyzeReadability(document);

  // Combine all issues
  const allIssues = [
    ...markdownLintIssues,
    ...linkIssues,
    ...readabilityIssues
  ];

  // Add issues for missing sections
  if (!document.metadata.hasAllRequiredSections) {
    const requiredSections = getRequiredSectionsForDocType(document.type);
    allIssues.push({
      documentPath: document.path,
      message: `Document is missing required sections: ${requiredSections.join(
        ', '
      )}`,
      ruleId: 'structure:missing-sections',
      severity: IssueSeverity.Error,
      category: QualityCategory.Compliance,
      fixable: false
    });
  }

  // Calculate overall quality score (0-100)
  const issueWeights = {
    [IssueSeverity.Error]: 10,
    [IssueSeverity.Warning]: 3,
    [IssueSeverity.Suggestion]: 1,
    [IssueSeverity.Info]: 0
  };

  // Calculate total weight of issues
  const totalWeight = allIssues.reduce(
    (sum, issue) => sum + issueWeights[issue.severity],
    0
  );

  // Base score is 100, subtract issue weights
  const score = Math.max(0, 100 - totalWeight);

  return {
    filePath: document.path,
    issues: allIssues,
    qualityScore: score / 100
  };
}

/**
 * Outputs a report to the console
 */
function consoleReport(results: ValidationResult[]): void {
  console.log(
    chalk.blue.bold('\n=== Document Quality Validation Report ===\n')
  );

  // Count issues by severity
  let errorCount = 0;
  let warningCount = 0;
  let suggestionCount = 0;

  results.forEach((result) => {
    result.issues.forEach((issue) => {
      if (issue.severity === IssueSeverity.Error) errorCount++;
      else if (issue.severity === IssueSeverity.Warning) warningCount++;
      else if (issue.severity === IssueSeverity.Suggestion) suggestionCount++;
    });
  });

  // Overall summary
  console.log(chalk.bold(`Files Analyzed: ${results.length}`));
  console.log(
    `${chalk.red(`Errors: ${errorCount}`)} | ${chalk.yellow(
      `Warnings: ${warningCount}`
    )} | ${chalk.blue(`Suggestions: ${suggestionCount}`)}\n`
  );

  // Report for each file
  results.forEach((result) => {
    const hasIssues = result.issues.length > 0;
    const icon = hasIssues ? '❌' : '✅';
    const qualityScore = Math.round(result.qualityScore * 100) / 100;
    const qualityColor =
      qualityScore > 0.8
        ? chalk.green
        : qualityScore > 0.6
          ? chalk.yellow
          : chalk.red;

    console.log(
      `${icon} ${chalk.bold(result.filePath)} - Quality Score: ${qualityColor(
        qualityScore
      )}`
    );

    if (hasIssues) {
      const errors = result.issues.filter(
        (i) => i.severity === IssueSeverity.Error
      );
      const warnings = result.issues.filter(
        (i) => i.severity === IssueSeverity.Warning
      );

      if (errors.length > 0) {
        console.log(chalk.red(`  Errors (${errors.length}):`));
        errors.slice(0, 3).forEach((issue) => {
          // Add line number if available
          const lineInfo = issue.line
            ? chalk.gray(` [line ${issue.line}]`)
            : '';
          console.log(`  - ${issue.message}${lineInfo}`);
        });
        if (errors.length > 3) {
          console.log(`  - ... and ${errors.length - 3} more errors`);
        }
      }

      if (warnings.length > 0) {
        console.log(chalk.yellow(`  Warnings (${warnings.length}):`));
        warnings.slice(0, 2).forEach((issue) => {
          // Add line number if available
          const lineInfo = issue.line
            ? chalk.gray(` [line ${issue.line}]`)
            : '';
          console.log(`  - ${issue.message}${lineInfo}`);
        });
        if (warnings.length > 2) {
          console.log(`  - ... and ${warnings.length - 2} more warnings`);
        }
      }
    }

    console.log(''); // Empty line between files
  });

  console.log(chalk.blue.bold('========================================\n'));
}

/**
 * Generates a formatted report from validation results
 */
async function generateReport(
  results: ValidationResult[],
  outputPath: string
): Promise<void> {
  // Convert report path to absolute
  const absoluteOutputPath = path.isAbsolute(outputPath)
    ? outputPath
    : path.resolve(process.cwd(), outputPath);

  // Get the directory of the report file to calculate relative paths
  const reportDir = path.dirname(absoluteOutputPath);

  // Prepare report structure
  const report: ValidationReport = {
    timestamp: new Date().toISOString(),
    totalDocuments: results.length,
    passedDocuments: results.filter((r) => r.issues.length === 0).length,
    warnDocuments: results.filter((r) =>
      r.issues.some((i) => i.severity === IssueSeverity.Warning)
    ).length,
    failedDocuments: results.filter((r) =>
      r.issues.some((i) => i.severity === IssueSeverity.Error)
    ).length,
    totalIssues: results.reduce((sum, r) => sum + r.issues.length, 0),
    issuesByCategory: {},
    documentResults: results.map((r) => ({
      documentPath: r.filePath,
      documentName: path.basename(r.filePath),
      documentType: path.dirname(r.filePath).split('/').pop() || 'unknown',
      issues: r.issues,
      metrics: {
        wordCount: 0,
        readingTime: 0,
        averageSentenceLength: 0,
        flesch: 0,
        complexityScore: 0,
        deadLinks: 0
      },
      score: r.qualityScore * 100,
      status:
        r.qualityScore > 0.8 ? 'pass' : r.qualityScore > 0.5 ? 'warn' : 'fail'
    })),
    averageScore:
      (results.reduce((sum, r) => sum + r.qualityScore, 0) / results.length) *
      100
  };

  // Group issues by category for the report
  const allIssues = results.flatMap((r) => r.issues);
  const categoryCount: Record<string, number> = {};

  allIssues.forEach((issue) => {
    const category = issue.category;
    categoryCount[category] = (categoryCount[category] || 0) + 1;
  });

  report.issuesByCategory = categoryCount;

  try {
    // Create report directory if it doesn't exist
    const reportDir = path.dirname(absoluteOutputPath);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    // Generate Markdown report
    let content = `# Documentation Quality Report

Generated on: ${report.timestamp}

This report analyzes the quality of documentation files in the repository, checking for common issues such as:
- Markdown structure and formatting
- Required sections and content
- Readability metrics
- Links and references

## Overview

- Total Documents: ${report.totalDocuments}
- Passed: ${report.passedDocuments} (${Math.round(
      (report.passedDocuments / report.totalDocuments) * 100
    )}%)
- Warnings: ${report.warnDocuments} (${Math.round(
      (report.warnDocuments / report.totalDocuments) * 100
    )}%)
- Failed: ${report.failedDocuments} (${Math.round(
      (report.failedDocuments / report.totalDocuments) * 100
    )}%)
- Average Score: ${report.averageScore.toFixed(1)}/100
- Total Issues: ${report.totalIssues}

## Issues by Category

`;

    // Add issues by category section with bars to visualize distribution
    const totalIssues = report.totalIssues;
    const categories = Object.entries(report.issuesByCategory).sort(
      (a, b) => b[1] - a[1]
    ); // Sort by count, high to low

    if (categories.length > 0) {
      content += '| Category | Count | Percentage |\n';
      content += '|----------|-------|------------|\n';

      for (const [category, count] of categories) {
        const percentage = Math.round((count / totalIssues) * 100);
        content += `| ${category} | ${count} | ${percentage}% |\n`;
      }
      content += '\n';
    } else {
      content += '*No issues found.*\n\n';
    }

    content += `\n## Document Results\n\n`;

    // Sort results by score (lowest to highest)
    const sortedResults = [...report.documentResults].sort(
      (a, b) => a.score - b.score
    );

    // Add each document to the report
    for (const result of sortedResults) {
      const statusEmoji =
        result.status === 'pass'
          ? '✅'
          : result.status === 'warn'
            ? '⚠️'
            : '❌';

      // Create relative path from report directory to document
      const targetFilePath = path.resolve(process.cwd(), result.documentPath);
      const relativePath = path.relative(reportDir, targetFilePath);

      content += `### ${statusEmoji} [${
        result.documentName
      }](${relativePath}) (${result.score.toFixed(1)}/100)\n\n`;
      content += `- **Path**: ${result.documentPath}\n`;
      content += `- **Type**: ${result.documentType}\n`;
      content += `- **Issues**: ${result.issues.length}\n\n`;

      if (result.issues.length > 0) {
        content += `#### Issues\n\n`;

        // Group issues by category
        const issuesByCategory: Record<string, ValidationIssue[]> = {};

        for (const issue of result.issues) {
          if (!issuesByCategory[issue.category]) {
            issuesByCategory[issue.category] = [];
          }
          issuesByCategory[issue.category].push(issue);
        }

        // Order categories by number of issues
        const sortedCategories = Object.entries(issuesByCategory)
          .sort((a, b) => b[1].length - a[1].length)
          .map(([category, issues]) => ({ category, issues }));

        for (const { category, issues } of sortedCategories) {
          // Use a more distinctive heading for each category
          content += `<details>
<summary>📂 <strong>${category} (${issues.length})</strong></summary>

`;

          for (const issue of issues) {
            const severityEmoji =
              issue.severity === IssueSeverity.Error
                ? '🔴'
                : issue.severity === IssueSeverity.Warning
                  ? '🟠'
                  : issue.severity === IssueSeverity.Suggestion
                    ? '🟡'
                    : '🔵';

            // Add link to specific line if available
            let issueLocation = '';
            if (issue.line) {
              // Create link to specific line in document
              issueLocation = ` ([line ${issue.line}](${relativePath}#L${issue.line}))`;
            }

            // Format the message with proper indentation for better readability
            content += `- ${severityEmoji} ${issue.message}${issueLocation} ${
              issue.fixable ? '(Fixable)' : ''
            }\n`;
          }

          content += `\n</details>\n\n`;
        }
      }

      content += '\n---\n\n'; // Add a separator line between documents
    }

    // Add recommendations section based on most common issues
    if (report.totalIssues > 0) {
      content += `## Recommendations

Based on the analysis, here are the top recommendations to improve documentation quality:

`;
      // Get top 3 most common issues
      const issueTypes = new Map<string, number>();

      for (const result of results) {
        for (const issue of result.issues) {
          const key = `${issue.category}:${issue.ruleId}`;
          issueTypes.set(key, (issueTypes.get(key) || 0) + 1);
        }
      }

      const topIssues = Array.from(issueTypes.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

      for (const [issueKey, count] of topIssues) {
        const [category, ruleId] = issueKey.split(':');
        const percentage = Math.round((count / report.totalIssues) * 100);

        content += `1. **Fix ${category} issues (${percentage}% of all issues)**  \n`;

        // Suggestion based on category
        switch (category) {
          case 'structure':
            content +=
              '   Ensure proper markdown formatting with correct headings and document structure.\n\n';
            break;
          case 'compliance':
            content +=
              '   Add all required sections to documents based on their type.\n\n';
            break;
          case 'links':
            content +=
              '   Fix broken links and ensure all references are valid.\n\n';
            break;
          case 'style':
            content +=
              '   Improve content readability and formatting consistency.\n\n';
            break;
          default:
            content += `   Address the issues in the ${category} category.\n\n`;
        }
      }
    }

    // Add footer
    content += `\n## Summary

This report was generated automatically by the document quality validation script. For more information, run:

\`\`\`
npm run docs:validate-quality -- --help
\`\`\`

Last updated: ${new Date().toISOString().split('T')[0]}
`;

    // Write report to file
    fs.writeFileSync(absoluteOutputPath, content);
    console.log(
      chalk.green(`Report generated successfully at ${absoluteOutputPath}`)
    );
  } catch (error) {
    console.error(chalk.red(`Error generating report: ${error}`));
  }
}

async function main() {
  try {
    // Show help if requested
    if (SHOW_HELP) {
      showHelp();
      return;
    }

    const options = parseOptions();

    let filesToValidate: string[] = [];

    if (options.all) {
      console.log(chalk.blue('Validating all markdown files...'));
      // Fix for --all option not working
      filesToValidate = getAllMarkdownFiles(DOCS_DIR);
    } else if (options.path) {
      if (fs.existsSync(options.path)) {
        if (fs.statSync(options.path).isDirectory()) {
          filesToValidate = getAllMarkdownFiles(options.path);
        } else {
          filesToValidate = [options.path];
        }
      } else {
        console.error(chalk.red(`Path does not exist: ${options.path}`));
        process.exit(1);
      }
    } else {
      // Default behavior if no path or --all is specified
      console.log(
        chalk.yellow(
          'No files to validate. Use --all or specify a path with --path.'
        )
      );
      process.exit(0);
    }

    if (filesToValidate.length === 0) {
      console.log(
        chalk.yellow(
          'No markdown files found. Check the path or use a different directory.'
        )
      );
      process.exit(0);
    }

    console.log(
      chalk.blue(`Found ${filesToValidate.length} markdown files to validate.`)
    );

    const results: ValidationResult[] = [];

    for (const file of filesToValidate) {
      const result = await validateDocument(file, options);
      results.push(result);
    }

    // Always generate report if report path is specified
    if (options.reportPath) {
      generateReport(results, options.reportPath);
    }

    // Always display results in console
    consoleReport(results);
  } catch (error) {
    console.error(chalk.red(`Error: ${error}`));
    process.exit(1);
  }
}

// Call the main function
main();
