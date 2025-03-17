/**
 * Documentation Map Update Script
 *
 * This script automates the process of updating the Documentation Map in the project.
 * It identifies all documentation files, finds missing entries, and updates the map accordingly.
 *
 * Enhanced with semantic search, relationship analysis, and visualization capabilities.
 *
 * Usage:
 * ts-node scripts/documentation/updateDocumentationMap.ts [--add-all] [--dry-run] [--interactive] [--search "query"] [--analyze-links] [--visualize]
 *
 * Options:
 *   --add-all: Add all missing documents to the map automatically
 *   --dry-run: Show what would be updated without making changes
 *   --interactive: Run in interactive mode, prompting for each missing document
 *   --search "query": Perform a semantic search across documentation
 *   --analyze-links: Analyze and report document relationships
 *   --visualize: Generate Mermaid diagrams of document relationships
 *
 * @todo Potential Third-Party Library Improvements:
 *
 * 1. Enhanced Search with Fuse.js
 *    - Install: npm install fuse.js
 *    - Benefits:
 *      - Better fuzzy search algorithm with configurable threshold
 *      - Weighted searching across multiple fields
 *      - Support for searching nested JSON structures
 *      - Performance optimizations for large document sets
 *    - Example usage for semantic search:
 *      ```typescript
 *      import Fuse from 'fuse.js';
 *
 *      export async function semanticSearch(query: string): Promise<SearchResult[]> {
 *        const documents = await getAllDocumentsWithMetadata();
 *
 *        const options = {
 *          keys: [
 *            { name: 'title', weight: 0.7 },
 *            { name: 'content', weight: 0.5 },
 *            { name: 'tags', weight: 0.3 }
 *          ],
 *          includeScore: true,
 *          threshold: 0.4
 *        };
 *
 *        const fuse = new Fuse(documents, options);
 *        const results = fuse.search(query);
 *
 *        return results.map(result => ({
 *          path: result.item.path,
 *          title: result.item.title,
 *          relevance: 1 - (result.score || 0),
 *          snippet: extractSnippet(result.item.content, query)
 *        }));
 *      }
 *      ```
 */

import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as readline from 'readline';
import { createHash } from 'crypto';

// Get current file path and directory for both ESM and CommonJS
const __filename = process.argv[1] || '';
const __dirname = path.dirname(__filename);

const execAsync = promisify(exec);
// Use project root instead of docs subfolder
const PROJECT_ROOT = path.resolve(__dirname, '..');
const MAP_PATH = path.join(PROJECT_ROOT, 'navigation', 'documentation-map.md');

// Configuration
const VISUALIZATION_DIR = path.join(PROJECT_ROOT, 'visualizations');
const CACHE_DIR = path.join(PROJECT_ROOT, '.cache/docs');

// Command line arguments
const ADD_ALL = process.argv.includes('--add-all');
const DRY_RUN = process.argv.includes('--dry-run');
const INTERACTIVE = process.argv.includes('--interactive');
const ANALYZE_LINKS = process.argv.includes('--analyze-links');
const VISUALIZE = process.argv.includes('--visualize');

// For semantic search
const SEARCH_FLAG = '--search';
const searchIndex = process.argv.findIndex((arg) => arg === SEARCH_FLAG);
const SEARCH_QUERY =
  searchIndex !== -1 && process.argv.length > searchIndex + 1
    ? process.argv[searchIndex + 1]
    : '';

// Interface for document metadata
interface DocumentMetadata {
  path: string;
  title: string;
  content: string;
  links: string[];
  backlinks: string[];
  category: string;
  lastModified: Date;
  wordCount: number;
  readingTime: number; // in minutes
}

// Map to store document metadata
const documentMetadataMap = new Map<string, DocumentMetadata>();

// Interface for link data used in visualization
interface LinkData {
  source: string;
  target: string;
  value: number; // link strength
}

// Interface for document search result
interface SearchResult {
  path: string;
  title: string;
  relevance: number;
  snippet: string;
}

// Normalize path for comparison
function normalizePath(filePath: string): string {
  // Convert absolute path to relative from docs directory
  if (filePath.startsWith(PROJECT_ROOT)) {
    filePath = path.relative(PROJECT_ROOT, filePath);
  }

  // Handle relative paths
  if (filePath.startsWith('../')) {
    filePath = path.normalize(filePath);
  }

  // Ensure forward slashes for consistency
  return filePath.replace(/\\/g, '/');
}

// Find all documentation files
async function findAllDocuments(): Promise<string[]> {
  const { stdout } = await execAsync(
    `find ${PROJECT_ROOT} -name "*.md" -type f`
  );
  return stdout
    .split('\n')
    .filter(Boolean)
    .map((file) => normalizePath(file));
}

// Categorize documents based on their path and content
async function categorizeDocument(filePath: string): Promise<string> {
  const normalizedPath = normalizePath(filePath);
  if (normalizedPath.includes('/tasks/')) return 'Tasks';
  if (normalizedPath.includes('/archive/tasks/')) return 'Archived Tasks';
  if (normalizedPath.includes('/architecture/analysis-'))
    return 'Architecture Analysis';
  if (normalizedPath.includes('/ideas/')) return 'Ideas and Early Concepts';
  if (normalizedPath.includes('/proposals/')) return 'Proposals';
  if (normalizedPath.includes('/rules/')) return 'LLM Rules and Guidelines';
  if (normalizedPath.includes('/commands/')) return 'Documentation Automation';
  return 'Other';
}

// Identify documents already in the map
async function getDocumentsInMap(): Promise<Set<string>> {
  const content = fs.readFileSync(MAP_PATH, 'utf8');
  const links = content.match(/\[.*?\]\((.*?\.md)\)/g) || [];
  const processedLinks = links
    .map((link) => {
      const match = link.match(/\((.*?\.md)\)/);
      return match ? normalizePath(match[1]) : '';
    })
    .filter(Boolean);
  return new Set(processedLinks);
}

interface DocumentEntry {
  path: string;
  category: string;
  title: string;
  description: string;
}

// Build document entries
async function buildDocumentEntries(): Promise<DocumentEntry[]> {
  const files = await findAllDocuments();
  const entries: DocumentEntry[] = [];

  for (const file of files) {
    const fullPath = path.join(PROJECT_ROOT, file);
    const content = fs.readFileSync(fullPath, 'utf8');
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const descriptionMatch = content.match(
      /^##\s+Brief Description\s+(.+?)$/ms
    );

    entries.push({
      path: file,
      category: await categorizeDocument(file),
      title: titleMatch ? titleMatch[1] : path.basename(file, '.md'),
      description: descriptionMatch ? descriptionMatch[1].trim() : ''
    });
  }

  return entries;
}

// Main function to check for missing documents
async function checkDocumentationMap(): Promise<void> {
  try {
    const entries = await buildDocumentEntries();
    const documentsInMap = await getDocumentsInMap();

    // Find documents not in the map
    const missingDocuments = entries.filter(
      (entry) => !documentsInMap.has(entry.path)
    );

    if (missingDocuments.length === 0) {
      console.log('No missing documents found in the Documentation Map.');
      return;
    }

    console.log('Missing documents found:');
    const groupedByCategory = missingDocuments.reduce((acc, doc) => {
      acc[doc.category] = acc[doc.category] || [];
      acc[doc.category].push(doc);
      return acc;
    }, {} as Record<string, DocumentEntry[]>);

    for (const [category, docs] of Object.entries(groupedByCategory)) {
      console.log(`\n${category}:`);
      docs.forEach((doc) => {
        console.log(`- ${doc.title} (${doc.path})`);
        if (doc.description) {
          console.log(`  Description: ${doc.description}`);
        }
      });
    }
  } catch (error) {
    console.error('Error checking documentation map:', error);
    process.exit(1);
  }
}

/**
 * Run the check
 */
checkDocumentationMap();

/**
 * Find all markdown documents in the docs directory
 */
export async function getAllDocuments(): Promise<string[]> {
  try {
    console.log(`Searching for markdown documents in ${PROJECT_ROOT}`);

    // First, get all directories
    const { stdout } = await execAsync(`find ${PROJECT_ROOT} -type d`);
    const dirs = stdout.split('\n').filter(Boolean);

    // Then, find all markdown files in each directory
    const allFiles: string[] = [];
    for (const dir of dirs) {
      if (fs.existsSync(dir)) {
        const files = await fs.promises.readdir(dir);
        const markdownFiles = files.filter((file) => file.endsWith('.md'));
        allFiles.push(...markdownFiles.map((file) => path.join(dir, file)));
      }
    }

    console.log(`Found ${allFiles.length} total markdown files`);
    return allFiles;
  } catch (error) {
    console.error('Error finding markdown documents:', error);
    return [];
  }
}

/**
 * Categorize documents by their directory
 */
export function categorizeDocuments(
  documents: string[]
): Record<string, string[]> {
  const categories: Record<string, string[]> = {};

  for (const document of documents) {
    // Split path to get category (first level directory)
    const parts = document.split('/');
    const dir = parts.length > 0 ? parts[0] : 'other';

    if (!categories[dir]) {
      categories[dir] = [];
    }
    categories[dir].push(document);
  }

  return categories;
}

/**
 * Find documents not present in the Documentation Map
 */
export function findMissingDocuments(
  allDocuments: string[],
  mapContent: string
): string[] {
  const missingDocuments: string[] = [];

  for (const document of allDocuments) {
    const basename = path.basename(document);
    // Skip the Documentation Map itself
    if (document === MAP_PATH) continue;

    // Check if the document is already referenced in the map
    // We look for markdown links to the file
    const escapedBasename = basename.replace(/\./g, '\\.');
    const linkPattern = new RegExp(`\\[.*\\]\\(.*${escapedBasename}\\)`);

    if (!linkPattern.test(mapContent)) {
      missingDocuments.push(document);
    }
  }

  return missingDocuments;
}

/**
 * Update the Documentation Map with missing documents
 */
export async function updateDocumentationMap(
  mapPath: string,
  missingDocuments: string[]
): Promise<boolean> {
  if (missingDocuments.length === 0) {
    console.log('No missing documents to add to the Documentation Map');
    return true;
  }

  if (DRY_RUN) {
    console.log(
      `[DRY RUN] Would add ${missingDocuments.length} missing documents to Documentation Map`
    );
    missingDocuments.forEach((doc) => console.log(`- ${doc}`));
    return true;
  }

  if (!fs.existsSync(mapPath)) {
    console.error(`Documentation Map not found at ${mapPath}`);
    return false;
  }

  try {
    let content = fs.readFileSync(mapPath, 'utf8');
    const categorizedDocs = categorizeDocuments(missingDocuments);

    // For each category of documents, find the corresponding section in the map
    // and add the missing documents
    for (const [category, docs] of Object.entries(categorizedDocs)) {
      // Skip empty categories
      if (docs.length === 0) continue;

      // Find a section that matches this category (e.g., "## Tasks" for "tasks")
      const sectionRegex = new RegExp(`## ${category}s?\\b`, 'i');
      const sectionMatch = content.match(sectionRegex);

      if (sectionMatch) {
        // Find the table in this section
        const tableStartPos = content.indexOf(
          '| Document | Description |',
          sectionMatch.index
        );
        if (tableStartPos > -1) {
          // Find the end of the table (next section or end of file)
          const nextSectionPos = content.indexOf('\n##', tableStartPos);
          const tableEndPos =
            nextSectionPos > -1 ? nextSectionPos : content.length;

          // Add each missing document to the table
          let newEntries = '';
          for (const doc of docs) {
            const basename = path.basename(doc, '.md');
            const relativePath = path.relative(path.dirname(mapPath), doc);

            // Try to extract a better title and description from the document
            const { title, description } = await extractTitleAndDescription(
              doc
            );
            const displayName = title || formatDisplayName(basename);

            newEntries += `| [${displayName}](${relativePath}) | ${
              description || `Description for ${displayName}`
            } |\n`;
          }

          // Insert the new entries at the end of the table
          const firstPart = content.substring(0, tableEndPos);
          const lastPart = content.substring(tableEndPos);
          content = firstPart + newEntries + lastPart;
        }
      } else {
        // If no section exists for this category, we could create one
        console.log(
          `No section found for category '${category}'. A new section may need to be created manually.`
        );
      }
    }

    // Write the updated content
    fs.writeFileSync(mapPath, content);
    console.log(
      `Updated Documentation Map with ${missingDocuments.length} missing documents`
    );
    return true;
  } catch (error) {
    console.error('Error updating Documentation Map:', error);
    return false;
  }
}

/**
 * Format display name from basename
 */
function formatDisplayName(basename: string): string {
  return basename
    .replace(/^task-\d{4}-\d{2}-/, '')
    .replace(/^analysis-/, '')
    .replace(/^proposal-/, '')
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Extract title and description from a document
 */
async function extractTitleAndDescription(
  docPath: string
): Promise<{ title: string; description: string }> {
  try {
    if (!fs.existsSync(docPath)) {
      return { title: '', description: '' };
    }

    const content = fs.readFileSync(docPath, 'utf8');

    // Extract title from first heading
    const titleMatch = content.match(/^# (.+)$/m);
    const title = titleMatch ? titleMatch[1].replace(/^ARCHIVED: /, '') : '';

    // Extract description from the first paragraph after "## Overview" or "## Context" or second paragraph
    let description = '';
    const overviewMatch = content.match(/## Overview\s+(.*?)(?=\n#|\n$)/s);
    const contextMatch = content.match(/## Context\s+(.*?)(?=\n#|\n$)/s);

    if (overviewMatch) {
      const paragraphs = overviewMatch[1]
        .split('\n\n')
        .filter((p) => p.trim() && !p.trim().startsWith('**'));
      if (paragraphs.length > 0) {
        description = paragraphs[0].replace(/\n/g, ' ').trim();
      }
    } else if (contextMatch) {
      const paragraphs = contextMatch[1]
        .split('\n\n')
        .filter((p) => p.trim() && !p.trim().startsWith('**'));
      if (paragraphs.length > 0) {
        description = paragraphs[0].replace(/\n/g, ' ').trim();
      }
    } else {
      // Try to get the second paragraph in the document (after the title)
      const paragraphs = content
        .split('\n\n')
        .filter(
          (p) =>
            p.trim() && !p.trim().startsWith('#') && !p.trim().startsWith('**')
        );
      if (paragraphs.length > 0) {
        description = paragraphs[0].replace(/\n/g, ' ').trim();
      }
    }

    // Limit description length
    if (description.length > 100) {
      description = description.substring(0, 97) + '...';
    }

    return { title, description };
  } catch (error) {
    console.error(
      `Error extracting title and description from ${docPath}:`,
      error
    );
    return { title: '', description: '' };
  }
}

/**
 * Update the Recently Added Documents section
 */
export async function updateRecentlyAddedDocuments(
  mapPath: string,
  recentDocuments: string[]
): Promise<boolean> {
  if (recentDocuments.length === 0) {
    console.log('No recent documents to add to the Documentation Map');
    return true;
  }

  if (DRY_RUN) {
    console.log(
      `[DRY RUN] Would update Recently Added Documents with ${recentDocuments.length} documents`
    );
    recentDocuments.forEach((doc) => console.log(`- ${doc}`));
    return true;
  }

  if (!fs.existsSync(mapPath)) {
    console.error(`Documentation Map not found at ${mapPath}`);
    return false;
  }

  try {
    let content = fs.readFileSync(mapPath, 'utf8');

    // Find the Recently Added Documents section
    const recentSectionRegex = /### Recently Added Documents/;
    const recentSectionMatch = content.match(recentSectionRegex);

    if (recentSectionMatch) {
      // Group recent documents by directory
      const recentByDir: Record<string, string[]> = {};
      for (const doc of recentDocuments) {
        const parts = doc.split('/');
        if (parts.length > 2) {
          const dirPath = `${parts[0]}/${parts[1]}`;
          if (!recentByDir[dirPath]) {
            recentByDir[dirPath] = [];
          }
          recentByDir[dirPath].push(doc);
        }
      }

      // Create content for each directory
      let newRecentContent = '';
      for (const [dir, docs] of Object.entries(recentByDir)) {
        newRecentContent += `\n#### ${dir}\n\n`;
        for (const doc of docs) {
          const { title } = await extractTitleAndDescription(doc);
          const basename = path.basename(doc);
          const relativePath = path.relative(path.dirname(mapPath), doc);
          newRecentContent += `- [${title || basename}](${relativePath})\n`;
        }
      }

      // Find where to insert the new content (after the section heading)
      const sectionEndPos = content.indexOf(
        '\n##',
        recentSectionMatch.index || 0
      );
      const insertPos = sectionEndPos > -1 ? sectionEndPos : content.length;

      // Insert the new content
      const firstPart = content.substring(
        0,
        (recentSectionMatch.index || 0) + recentSectionMatch[0].length
      );
      const lastPart = content.substring(insertPos);
      content = firstPart + newRecentContent + lastPart;

      // Write the updated content
      fs.writeFileSync(mapPath, content);
      console.log(
        `Updated Recently Added Documents section with ${recentDocuments.length} documents`
      );
      return true;
    } else {
      console.warn(
        'No Recently Added Documents section found in the Documentation Map'
      );
      return false;
    }
  } catch (error) {
    console.error('Error updating Recently Added Documents:', error);
    return false;
  }
}

/**
 * Update the last modified date in the Documentation Map
 */
export async function updateLastModifiedDate(
  mapPath: string
): Promise<boolean> {
  if (DRY_RUN) {
    console.log('[DRY RUN] Would update last modified date');
    return true;
  }

  if (!fs.existsSync(mapPath)) {
    console.error(`Documentation Map not found at ${mapPath}`);
    return false;
  }

  try {
    let content = fs.readFileSync(mapPath, 'utf8');

    // Find the last updated line
    const lastUpdatedRegex = /Last updated: .+/;
    const lastUpdatedMatch = content.match(lastUpdatedRegex);

    if (lastUpdatedMatch) {
      // Create new date string in format "Month Day, Year"
      const today = new Date();
      const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
      ];
      const newDateStr = `${
        months[today.getMonth()]
      } ${today.getDate()}, ${today.getFullYear()}`;

      // Replace the old date with the new date
      content = content.replace(
        lastUpdatedMatch[0],
        `Last updated: ${newDateStr}`
      );

      // Write the updated content
      fs.writeFileSync(mapPath, content);
      console.log(`Updated last modified date to ${newDateStr}`);
      return true;
    } else {
      console.warn('No last updated line found in the Documentation Map');
      return false;
    }
  } catch (error) {
    console.error('Error updating last modified date:', error);
    return false;
  }
}

/**
 * Run in interactive mode, prompting for each missing document
 */
async function runInteractiveMode(
  mapPath: string,
  missingDocuments: string[]
): Promise<void> {
  if (missingDocuments.length === 0) {
    console.log('No missing documents to add');
    return;
  }

  console.log(
    `Found ${missingDocuments.length} missing documents. Interactive mode enabled.`
  );

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const docsToAdd: string[] = [];

  for (const doc of missingDocuments) {
    const { title, description } = await extractTitleAndDescription(doc);
    console.log(`\nDocument: ${doc}`);
    if (title) console.log(`Title: ${title}`);
    if (description) console.log(`Description: ${description}`);

    const answer = await new Promise<string>((resolve) => {
      rl.question(`Add this document to Documentation Map? (y/n): `, resolve);
    });

    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      docsToAdd.push(doc);
    }
  }

  rl.close();

  if (docsToAdd.length > 0) {
    await updateDocumentationMap(mapPath, docsToAdd);
    console.log(`Added ${docsToAdd.length} documents to Documentation Map`);
  } else {
    console.log('No documents were selected to add');
  }
}

/**
 * Build metadata for all documents
 */
async function buildDocumentMetadata(documents: string[]): Promise<void> {
  console.log(`Building metadata for ${documents.length} documents...`);

  // First pass: Extract basic metadata and links
  for (const docPath of documents) {
    try {
      if (!fs.existsSync(docPath)) continue;

      const content = fs.readFileSync(docPath, 'utf8');
      const { title } = await extractTitleAndDescription(docPath);

      // Extract links to other documents
      const linkRegex = /\[.*?\]\((.*?\.md)\)/g;
      const links: string[] = [];
      let match;

      while ((match = linkRegex.exec(content)) !== null) {
        const linkPath = match[1];
        if (linkPath.startsWith('../')) {
          // Convert relative path to absolute
          const absolutePath = path.resolve(path.dirname(docPath), linkPath);
          // Make it relative to project root
          const normalizedPath = absolutePath.replace(process.cwd() + '/', '');
          links.push(normalizedPath);
        } else if (!linkPath.startsWith('http')) {
          // Handle paths that are already relative to some base dir
          links.push(linkPath);
        }
      }

      // Calculate word count and reading time
      const wordCount = content.split(/\s+/).filter(Boolean).length;
      const readingTime = Math.ceil(wordCount / 200); // Assuming 200 words per minute

      // Get category from path
      const category = docPath.split('/')[1];

      // Get last modified date
      let lastModified: Date;
      try {
        const { stdout } = await execAsync(
          `git log -1 --format="%ad" -- "${docPath}"`
        );
        lastModified = new Date(stdout);
      } catch (error) {
        // If git command fails, use file stats
        const stats = fs.statSync(docPath);
        lastModified = stats.mtime;
      }

      // Store metadata
      documentMetadataMap.set(docPath, {
        path: docPath,
        title: title || path.basename(docPath, '.md'),
        content,
        links,
        backlinks: [], // Will be populated in second pass
        category,
        lastModified,
        wordCount,
        readingTime
      });
    } catch (error) {
      console.error(`Error building metadata for ${docPath}:`, error);
    }
  }

  // Second pass: Build backlinks
  for (const [docPath, metadata] of documentMetadataMap.entries()) {
    for (const link of metadata.links) {
      const targetDoc = documentMetadataMap.get(link);
      if (targetDoc) {
        targetDoc.backlinks.push(docPath);
      }
    }
  }

  console.log(`Metadata built for ${documentMetadataMap.size} documents`);
}

/**
 * Analyze document relationships
 */
export async function analyzeDocumentRelationships(): Promise<void> {
  if (documentMetadataMap.size === 0) {
    console.log('No document metadata available. Build metadata first.');
    return;
  }

  console.log('\n======= Document Relationship Analysis =======');

  // Find documents with most links
  const documentsWithMostLinks = [...documentMetadataMap.entries()]
    .sort((a, b) => b[1].links.length - a[1].links.length)
    .slice(0, 10);

  console.log('\nTop 10 Documents with Most Outgoing Links:');
  documentsWithMostLinks.forEach(([path, metadata], index) => {
    console.log(
      `${index + 1}. ${metadata.title} (${path}): ${
        metadata.links.length
      } links`
    );
  });

  // Find documents with most backlinks
  const documentsWithMostBacklinks = [...documentMetadataMap.entries()]
    .sort((a, b) => b[1].backlinks.length - a[1].backlinks.length)
    .slice(0, 10);

  console.log('\nTop 10 Most Referenced Documents:');
  documentsWithMostBacklinks.forEach(([path, metadata], index) => {
    console.log(
      `${index + 1}. ${metadata.title} (${path}): ${
        metadata.backlinks.length
      } references`
    );
  });

  // Find orphaned documents (no backlinks)
  const orphanedDocuments = [...documentMetadataMap.entries()].filter(
    ([_, metadata]) => metadata.backlinks.length === 0
  );

  console.log(`\nOrphaned Documents (${orphanedDocuments.length}):`);
  orphanedDocuments.slice(0, 20).forEach(([path, metadata]) => {
    console.log(`- ${metadata.title} (${path})`);
  });

  if (orphanedDocuments.length > 20) {
    console.log(`... and ${orphanedDocuments.length - 20} more`);
  }

  // Find terminal documents (no outgoing links)
  const terminalDocuments = [...documentMetadataMap.entries()].filter(
    ([_, metadata]) => metadata.links.length === 0
  );

  console.log(`\nTerminal Documents (${terminalDocuments.length}):`);
  terminalDocuments.slice(0, 20).forEach(([path, metadata]) => {
    console.log(`- ${metadata.title} (${path})`);
  });

  if (terminalDocuments.length > 20) {
    console.log(`... and ${terminalDocuments.length - 20} more`);
  }

  // Find central documents (high number of both incoming and outgoing links)
  const centralityScore = (metadata: DocumentMetadata) =>
    metadata.links.length * 0.5 + metadata.backlinks.length;

  const centralDocuments = [...documentMetadataMap.entries()]
    .sort((a, b) => centralityScore(b[1]) - centralityScore(a[1]))
    .slice(0, 10);

  console.log('\nTop 10 Central Documents:');
  centralDocuments.forEach(([path, metadata], index) => {
    console.log(
      `${index + 1}. ${metadata.title} (${path}): ${
        metadata.links.length
      } outgoing, ${metadata.backlinks.length} incoming`
    );
  });

  console.log('\n=================================================');
}

/**
 * Generate a Mermaid diagram for document relationships
 */
export async function generateRelationshipDiagram(
  documents: string[] = []
): Promise<void> {
  if (documentMetadataMap.size === 0) {
    console.log('No document metadata available. Build metadata first.');
    return;
  }

  if (DRY_RUN) {
    console.log('[DRY RUN] Would generate relationship diagrams');
    return;
  }

  // Ensure the visualization directory exists
  if (!fs.existsSync(VISUALIZATION_DIR)) {
    fs.mkdirSync(VISUALIZATION_DIR, { recursive: true });
  }

  // If no specific documents are provided, use central documents
  if (documents.length === 0) {
    const centralityScore = (metadata: DocumentMetadata) =>
      metadata.links.length * 0.5 + metadata.backlinks.length;

    documents = [...documentMetadataMap.entries()]
      .sort((a, b) => centralityScore(b[1]) - centralityScore(a[1]))
      .slice(0, 10)
      .map(([path]) => path);
  }

  const docSet = new Set(documents);
  const relatedDocs = new Set<string>();

  // Add immediate neighbors (linked documents)
  for (const docPath of docSet) {
    const metadata = documentMetadataMap.get(docPath);
    if (metadata) {
      for (const link of metadata.links) {
        relatedDocs.add(link);
      }
      for (const backlink of metadata.backlinks) {
        relatedDocs.add(backlink);
      }
    }
  }

  // Combine the sets but prioritize the original documents
  const allRelevantDocs = [...docSet, ...relatedDocs].slice(0, 20); // Limit to prevent diagram explosion

  // Create a map of simplified names for the diagram
  const nameMap = new Map<string, string>();
  allRelevantDocs.forEach((docPath, index) => {
    const metadata = documentMetadataMap.get(docPath);
    const name = metadata
      ? metadata.title.replace(/[^a-zA-Z0-9]/g, '_')
      : `doc_${index}`;
    nameMap.set(docPath, name);
  });

  // Generate a graph diagram
  let mermaidCode = 'graph TD\n';

  // Add nodes
  allRelevantDocs.forEach((docPath) => {
    const metadata = documentMetadataMap.get(docPath);
    if (metadata) {
      const nodeName = nameMap.get(docPath) || 'unknown';
      const displayTitle =
        metadata.title.length > 20
          ? metadata.title.substring(0, 17) + '...'
          : metadata.title;

      // Original documents are highlighted
      if (docSet.has(docPath)) {
        mermaidCode += `    ${nodeName}["${displayTitle}":::focus]\n`;
      } else {
        mermaidCode += `    ${nodeName}["${displayTitle}"]\n`;
      }
    }
  });

  // Add edges
  allRelevantDocs.forEach((docPath) => {
    const metadata = documentMetadataMap.get(docPath);
    if (metadata) {
      const sourceName = nameMap.get(docPath) || 'unknown';

      // Add edges for links
      metadata.links.forEach((link) => {
        if (nameMap.has(link)) {
          const targetName = nameMap.get(link) || 'unknown';
          mermaidCode += `    ${sourceName} --> ${targetName}\n`;
        }
      });
    }
  });

  // Add styling
  mermaidCode += '    classDef focus fill:#f96,stroke:#333,stroke-width:2px;\n';

  // Write to a file
  const outputPath = path.join(VISUALIZATION_DIR, 'document-relationships.md');
  const outputContent = `# Document Relationship Diagram\n\nThis diagram shows the relationships between key documents in the documentation.\n\n\`\`\`mermaid\n${mermaidCode}\n\`\`\`\n\nGenerated on ${
    new Date().toISOString().split('T')[0]
  }\n`;

  fs.writeFileSync(outputPath, outputContent);
  console.log(`Generated document relationship diagram at ${outputPath}`);
}

/**
 * Generate keywords and terms from a document for better search
 */
function generateKeywords(content: string): string[] {
  // Remove markdown syntax
  const cleanContent = content
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/\[.*?\]\(.*?\)/g, '') // Remove links
    .replace(/\*\*|__|\*|_|~~|#|>|`/g, ''); // Remove formatting

  // Split into words and filter
  const words = cleanContent
    .toLowerCase()
    .split(/\s+/)
    .filter(
      (word) =>
        word.length > 3 && // Skip short words
        !['and', 'the', 'that', 'this', 'with', 'from', 'then'].includes(word) // Skip common words
    );

  // Count word frequency
  const wordCount = new Map<string, number>();
  for (const word of words) {
    wordCount.set(word, (wordCount.get(word) || 0) + 1);
  }

  // Extract top keywords
  const keywords = [...wordCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);

  return keywords;
}

/**
 * Semantic search across the documentation
 */
export async function semanticSearch(query: string): Promise<SearchResult[]> {
  if (documentMetadataMap.size === 0) {
    console.log('No document metadata available. Build metadata first.');
    return [];
  }

  console.log(`Performing semantic search for: "${query}"`);

  // Tokenize the query into keywords
  const queryWords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2);

  // Calculate relevance for each document
  const results: SearchResult[] = [];

  for (const [path, metadata] of documentMetadataMap.entries()) {
    // Generate document keywords if not already done
    const docKeywords = generateKeywords(metadata.content);

    // Calculate basic relevance based on keyword matches
    let relevance = 0;
    for (const word of queryWords) {
      // Check title
      if (metadata.title.toLowerCase().includes(word)) {
        relevance += 3; // Title matches are highly relevant
      }

      // Check content
      if (metadata.content.toLowerCase().includes(word)) {
        relevance += 1;

        // Check for exact phrase match (higher relevance)
        if (metadata.content.toLowerCase().includes(query.toLowerCase())) {
          relevance += 5;
        }
      }

      // Check keywords
      if (docKeywords.includes(word)) {
        relevance += 2;
      }
    }

    // Only include documents with some relevance
    if (relevance > 0) {
      // Extract a snippet containing the first match
      let snippet = '';
      const lowerContent = metadata.content.toLowerCase();
      for (const word of queryWords) {
        const index = lowerContent.indexOf(word);
        if (index !== -1) {
          // Get surrounding context
          const start = Math.max(0, index - 40);
          const end = Math.min(lowerContent.length, index + word.length + 60);
          snippet =
            '...' +
            metadata.content.substring(start, end).replace(/\n/g, ' ') +
            '...';
          break;
        }
      }

      results.push({
        path,
        title: metadata.title,
        relevance,
        snippet
      });
    }
  }

  // Sort by relevance
  results.sort((a, b) => b.relevance - a.relevance);

  // Return top results
  return results.slice(0, 10);
}

/**
 * Display search results
 */
function displaySearchResults(results: SearchResult[]): void {
  if (results.length === 0) {
    console.log('No matching documents found.');
    return;
  }

  console.log(`\nFound ${results.length} relevant documents:\n`);

  for (const [index, result] of results.entries()) {
    console.log(`${index + 1}. ${result.title} (${result.path})`);
    console.log(`   Relevance: ${result.relevance}`);
    if (result.snippet) {
      console.log(`   ${result.snippet}`);
    }
    console.log('');
  }
}

/**
 * Ensure cache directory exists
 */
function ensureCacheDir(): void {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

/**
 * Main function
 */
async function main() {
  try {
    // Ensure cache directory
    ensureCacheDir();

    // Find all markdown documents
    const allDocuments = await getAllDocuments();
    console.log(`Found ${allDocuments.length} total markdown documents`);

    // Build document metadata
    await buildDocumentMetadata(allDocuments);

    // Handle search if requested
    if (SEARCH_QUERY) {
      const results = await semanticSearch(SEARCH_QUERY);
      displaySearchResults(results);
      return;
    }

    // Handle link analysis if requested
    if (ANALYZE_LINKS) {
      await analyzeDocumentRelationships();

      if (VISUALIZE) {
        await generateRelationshipDiagram();
      }

      return;
    }

    // Continue with regular map update functionality

    // Read the Documentation Map
    if (!fs.existsSync(MAP_PATH)) {
      console.error(`Documentation Map not found at ${MAP_PATH}`);
      process.exit(1);
    }

    const mapContent = fs.readFileSync(MAP_PATH, 'utf8');

    // Find missing documents
    const missingDocuments = findMissingDocuments(allDocuments, mapContent);
    console.log(
      `Found ${missingDocuments.length} documents not in the Documentation Map`
    );

    // Handle missing documents based on mode
    if (INTERACTIVE) {
      await runInteractiveMode(MAP_PATH, missingDocuments);
    } else if (ADD_ALL) {
      await updateDocumentationMap(MAP_PATH, missingDocuments);
    } else if (missingDocuments.length > 0) {
      console.log(
        'Missing documents found. Use --add-all to add them or --interactive to add them selectively.'
      );
      missingDocuments.forEach((doc) => console.log(`- ${doc}`));
    }

    // Update recently added documents (use the missing documents as recent for this example)
    if ((ADD_ALL || INTERACTIVE) && missingDocuments.length > 0) {
      await updateRecentlyAddedDocuments(MAP_PATH, missingDocuments);
    }

    // Update the last modified date
    await updateLastModifiedDate(MAP_PATH);

    console.log('Documentation Map update complete');
  } catch (error) {
    console.error('Error during Documentation Map update:', error);
    process.exit(1);
  }
}

// Check if file is being run directly
const isMainModule = process.argv[1] === __filename;
if (isMainModule) {
  main().catch((error) => {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  });
}

// Export for testing
export default main;
