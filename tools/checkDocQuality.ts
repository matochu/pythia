import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

interface DocumentIssue {
  type: string;
  message: string;
  location?: string;
  severity: 'error' | 'warning' | 'info';
}

interface DocumentReport {
  filePath: string;
  wordCount: number;
  readingTime: number; // in minutes
  issues: DocumentIssue[];
  score: number; // 0-100
}

// Simple function to count words in text
function countWords(text: string): number {
  return text.split(/\s+/).filter((word) => word.length > 0).length;
}

// Calculate reading time (rough estimate - 200 words per minute)
function calculateReadingTime(wordCount: number): number {
  return wordCount / 200;
}

// Very simple quality check
function checkQuality(content: string): DocumentIssue[] {
  const issues: DocumentIssue[] = [];

  // Check for minimum length
  if (content.length < 100) {
    issues.push({
      type: 'content',
      message: 'Document is too short (less than 100 characters)',
      severity: 'warning'
    });
  }

  // Check for headings
  if (!content.match(/^#\s.+/m)) {
    issues.push({
      type: 'structure',
      message: 'Document should have at least one heading',
      severity: 'error'
    });
  }

  // Check for broken internal links
  const linkMatches = content.match(/\[.+?\]\(([^)]+)\)/g) || [];

  console.log(`Found ${linkMatches.length} links`);
  for (const match of linkMatches) {
    const linkPath = match.match(/\[.+?\]\(([^)]+)\)/)?.[1];
    console.log(`Link path: ${linkPath}`);
    if (linkPath && linkPath.includes('./')) {
      issues.push({
        type: 'link',
        message: `Outdated link path contains './': ${linkPath}`,
        severity: 'error'
      });
    }
  }

  return issues;
}

// Calculate document quality score (0-100)
function calculateScore(issues: DocumentIssue[], wordCount: number): number {
  let score = 100;

  // Deduct points for issues
  for (const issue of issues) {
    if (issue.severity === 'error') score -= 10;
    if (issue.severity === 'warning') score -= 5;
    if (issue.severity === 'info') score -= 1;
  }

  // Bonus for longer documents (up to a point)
  if (wordCount > 300) score += 5;
  if (wordCount > 1000) score += 5;

  // Cap score between 0-100
  return Math.max(0, Math.min(100, score));
}

// Process a single document
function processDocument(filePath: string): DocumentReport {
  const content = fs.readFileSync(filePath, 'utf-8');
  const wordCount = countWords(content);
  const readingTime = calculateReadingTime(wordCount);
  const issues = checkQuality(content);
  const score = calculateScore(issues, wordCount);

  return {
    filePath,
    wordCount,
    readingTime,
    issues,
    score
  };
}

// Find all markdown files
function findMarkdownFiles(
  directory: string = '.',
  ignorePatterns: string[] = ['node_modules']
): string[] {
  const pattern = path.join(directory, '**/*.md');
  return glob.sync(pattern, {
    ignore: ignorePatterns.map((p) => path.join(directory, p, '**')),
    nodir: true
  });
}

// Main function
function main() {
  const pathArg = process.argv[2] || '.';

  console.log(`\n📝 Checking document quality in: ${pathArg}\n`);

  let filesToCheck: string[];

  if (fs.existsSync(pathArg) && fs.statSync(pathArg).isFile()) {
    filesToCheck = [pathArg];
  } else {
    filesToCheck = findMarkdownFiles(pathArg);
  }

  if (filesToCheck.length === 0) {
    console.log('No markdown files found!');
    return;
  }

  console.log(`Found ${filesToCheck.length} markdown files to check.\n`);

  const reports: DocumentReport[] = [];
  let totalIssues = 0;

  // Process each file
  for (const file of filesToCheck) {
    const report = processDocument(file);
    reports.push(report);
    totalIssues += report.issues.length;
  }

  // Sort by score (lowest first)
  reports.sort((a, b) => a.score - b.score);

  // Print report
  console.log(`==== Document Quality Report ====\n`);
  console.log(`Total files: ${reports.length}`);
  console.log(`Total issues: ${totalIssues}\n`);

  console.log('=== Files with issues ===');

  for (const report of reports) {
    if (report.issues.length === 0) continue;

    console.log(`\nFile: ${report.filePath}`);
    console.log(`Score: ${report.score}/100`);
    console.log(
      `Word count: ${
        report.wordCount
      } (Reading time: ${report.readingTime.toFixed(1)} min)`
    );

    if (report.issues.length > 0) {
      console.log('\nIssues:');
      for (const issue of report.issues) {
        const icon =
          issue.severity === 'error'
            ? '❌'
            : issue.severity === 'warning'
            ? '⚠️'
            : 'ℹ️';
        console.log(`  ${icon} ${issue.message}`);
      }
    }
  }

  console.log('\n=== Summary ===');
  console.log(
    `Average score: ${(
      reports.reduce((sum, r) => sum + r.score, 0) / reports.length
    ).toFixed(1)}/100`
  );

  // Files with no issues
  const perfectFiles = reports.filter((r) => r.issues.length === 0);
  console.log(`Perfect files: ${perfectFiles.length}/${reports.length}`);
}

// Run the script
main();
