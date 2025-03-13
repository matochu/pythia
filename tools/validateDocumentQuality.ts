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
const DOCS_DIR = 'docs';
const DEFAULT_REPORT_PATH = 'docs/reports/quality-report.md';
const DEFAULT_RULES_CONFIG = 'docs/rules/document-quality-rules.json';

// Command line arguments
const args = process.argv.slice(2);
const ALL_DOCS = args.includes('--all');
const FIX_ISSUES = args.includes('--fix');
const STRICT_MODE = args.includes('--strict');

const getArgValue = (flag: string): string | null => {
  const index = args.findIndex((arg) => arg === flag);
  if (index !== -1 && index + 1 < args.length) {
    return args[index + 1];
  }
  return null;
};

const TARGET_PATH = getArgValue('--path') || (ALL_DOCS ? DOCS_DIR : null);
const REPORT_PATH = getArgValue('--report') || DEFAULT_REPORT_PATH;
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
}

/**
 * Finds all documents for validation
 */
async function findDocuments(targetPath: string): Promise<string[]> {
  console.log(chalk.blue(`Searching for documents in ${targetPath}...`));

  try {
    // Check if path is a file
    if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
      if (targetPath.endsWith('.md')) {
        return [targetPath];
      }
      return [];
    }

    // Path is a directory, find all markdown files
    const files = await glob(`${targetPath}/**/*.md`);
    console.log(chalk.green(`Found ${files.length} markdown documents`));
    return files;
  } catch (error) {
    console.error(chalk.red(`Error finding documents: ${error}`));
    return [];
  }
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
    let config: MarkdownlintOptions = {};

    if (fs.existsSync(RULES_PATH)) {
      try {
        config = JSON.parse(fs.readFileSync(RULES_PATH, 'utf8'));
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
        MD013: true, // Line length
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

    return new Promise<ValidationIssue[]>((resolve) => {
      markdownLinkCheck(
        document.content,
        {
          baseUrl: `file://${path.dirname(path.resolve(document.path))}/`,
          ignorePatterns: [
            { pattern: '^http://localhost' },
            { pattern: '^#' } // Ignore anchor links (checked separately)
          ]
        },
        (err: any, results: MarkdownLinkCheckResult[]) => {
          if (err) {
            console.error(
              chalk.red(`Error checking links in ${document.path}: ${err}`)
            );
            resolve([]);
            return;
          }

          const issues: ValidationIssue[] = [];

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
      (sentence: string) => wordTokenizer.tokenize(sentence).length
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
        message: `Document has low readability score (${flesch.toFixed(1)}). Consider simplifying the language.`,
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
 * Validates a document against all checks
 */
async function validateDocument(
  document: Document,
  options: ValidationOptions
): Promise<DocumentValidationResult> {
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
      message: `Document is missing required sections: ${requiredSections.join(', ')}`,
      ruleId: 'structure:missing-sections',
      severity: IssueSeverity.Error,
      category: QualityCategory.Compliance,
      fixable: false
    });
  }

  // Calculate overall quality score (0-100)
  // Weight of each issue depends on its severity
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
  let score = Math.max(0, 100 - totalWeight);

  // Determine status based on score
  let status: 'pass' | 'warn' | 'fail' = 'pass';
  if (score < 50) {
    status = 'fail';
  } else if (score < 80) {
    status = 'warn';
  }

  // Create document metrics
  const metrics = {
    wordCount: document.metadata.wordCount,
    readingTime: document.metadata.readingTime,
    ...readabilityMetrics,
    deadLinks: linkIssues.length
  };

  // Apply automatic fixes if needed
  if (options.fixIssues) {
    await fixDocumentIssues(
      document,
      allIssues.filter((issue) => issue.fixable)
    );
  }

  return {
    documentPath: document.path,
    documentName: document.name,
    documentType: document.type,
    issues: allIssues,
    metrics,
    score,
    status
  };
}

/**
 * Automatically fixes fixable issues
 */
async function fixDocumentIssues(
  document: Document,
  fixableIssues: ValidationIssue[]
): Promise<void> {
  if (fixableIssues.length === 0) {
    return;
  }

  console.log(
    chalk.blue(
      `Applying ${fixableIssues.length} automatic fixes to ${document.path}`
    )
  );

  let content = document.content;

  // Apply markdownlint auto-fixes
  const markdownlintIssues = fixableIssues.filter((issue) =>
    issue.ruleId.startsWith('markdownlint:')
  );

  if (markdownlintIssues.length > 0) {
    try {
      const markdownlintModule = await import('markdownlint');
      // Create a proper instance that has sync method
      const markdownlint = (markdownlintModule.default ||
        markdownlintModule) as any;

      // Use markdownlint to fix issues
      const options = {
        files: [document.path],
        resultVersion: 3,
        fixInputSource: content
      };

      const results = markdownlint.sync(options);

      if (results[document.path] && results[document.path].fixedSource) {
        content = results[document.path].fixedSource;
      }
    } catch (error) {
      console.error(
        chalk.red(
          `Error fixing markdownlint issues in ${document.path}: ${error}`
        )
      );
    }
  }

  // Apply other fixes (can be extended)

  // Write fixed content
  fs.writeFileSync(document.path, content);
  console.log(chalk.green(`Fixed issues in ${document.path}`));
}

/**
 * Generates documentation quality report
 */
async function generateReport(
  report: ValidationReport,
  outputPath: string
): Promise<void> {
  try {
    // Create report directory if it doesn't exist
    const reportDir = path.dirname(outputPath);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    // Generate Markdown report
    let content = `# Documentation Quality Report

Generated on: ${report.timestamp}

## Overview

- Total Documents: ${report.totalDocuments}
- Passed: ${report.passedDocuments} (${Math.round((report.passedDocuments / report.totalDocuments) * 100)}%)
- Warnings: ${report.warnDocuments} (${Math.round((report.warnDocuments / report.totalDocuments) * 100)}%)
- Failed: ${report.failedDocuments} (${Math.round((report.failedDocuments / report.totalDocuments) * 100)}%)
- Average Score: ${report.averageScore.toFixed(1)}/100
- Total Issues: ${report.totalIssues}

## Issues by Category

`;

    // Add issues by category section
    for (const [category, count] of Object.entries(report.issuesByCategory)) {
      content += `- ${category}: ${count}\n`;
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

      content += `### ${statusEmoji} ${result.documentName} (${result.score.toFixed(1)}/100)\n\n`;
      content += `- Path: ${result.documentPath}\n`;
      content += `- Type: ${result.documentType}\n`;
      content += `- Word Count: ${result.metrics.wordCount}\n`;
      content += `- Reading Time: ${result.metrics.readingTime} min\n`;
      content += `- Flesch Reading Ease: ${result.metrics.flesch.toFixed(1)}\n`;
      content += `- Issues: ${result.issues.length}\n\n`;

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

        for (const [category, issues] of Object.entries(issuesByCategory)) {
          content += `##### ${category} (${issues.length})\n\n`;

          for (const issue of issues) {
            const severityEmoji =
              issue.severity === IssueSeverity.Error
                ? '🔴'
                : issue.severity === IssueSeverity.Warning
                  ? '🟠'
                  : issue.severity === IssueSeverity.Suggestion
                    ? '🟡'
                    : '🔵';

            content += `${severityEmoji} ${issue.message} ${
              issue.fixable ? '(Fixable)' : ''
            }\n`;
          }

          content += '\n';
        }
      }

      content += '\n';
    }

    // Write report to file
    fs.writeFileSync(outputPath, content);
    console.log(chalk.green(`Report generated successfully at ${outputPath}`));
  } catch (error) {
    console.error(chalk.red(`Error generating report: ${error}`));
  }
}
