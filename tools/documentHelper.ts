/**
 * Documentation Helper Utility
 *
 * A comprehensive utility for managing, analyzing, and manipulating markdown documentation.
 * This tool provides a universal API for common document operations and leverages powerful
 * third-party libraries to enable advanced document processing capabilities.
 *
 * Features:
 * - Document search and retrieval with semantic capabilities
 * - Content analysis and insights
 * - Document creation from templates
 * - Metadata extraction and manipulation
 * - Document transformation and conversion
 * - Relationship mapping between documents
 *
 * Installation:
 * npm install -D unified remark remark-parse remark-stringify mdast-util-to-string
 * npm install -D gray-matter lunr natural handlebars chalk commander glob cosmiconfig
 * npm install -D remark-frontmatter remark-gfm remark-toc
 * npm install -D @types/lunr @types/natural @types/glob
 *
 * Potential Third-Party Library Improvements:
 * - Replace custom document search with full-text search libraries like FlexSearch or Fuse.js
 * - Use rehype and rehype-stringify for HTML output instead of custom nodesToString
 * - Consider using fp-ts for functional programming patterns to simplify error handling
 * - Use Cheerio or JSDOM for more complex HTML/markdown manipulations
 * - Replace natural.js tokenization with simpler libraries like Compromise.js
 * - Use date-fns for date formatting instead of custom solutions
 * - Consider replacing custom CLI with Yargs for more advanced command-line features
 *
 * Usage:
 * ts-node scripts/documentation/documentHelper.ts [command] [options]
 *
 * Available commands:
 * - search <query>           Search for documents
 * - create <template> <path> Create a document from a template
 * - templates                List available templates
 * - analyze <path>           Analyze document content
 * - similar <path>           Find similar documents
 * - diagram [output]         Generate a relationship diagram
 * - build-index [output]     Build and save the search index
 *
 * Example usage:
 *
 * Search for documents:
 * ts-node scripts/documentation/documentHelper.ts search "authentication" --limit 5 --fuzzy
 *
 * Create a document from a template:
 * ts-node scripts/documentation/documentHelper.ts create task workflows/tasks/new-task.md --values '{"title":"New Task"}'
 *
 * Analyze a document:
 * ts-node scripts/documentation/documentHelper.ts analyze guides/api-integration.md
 *
 * Generate a relationship diagram:
 * ts-node scripts/documentation/documentHelper.ts diagram diagrams/relation.mmd
 *
 * API Overview:
 *
 * The main class is DocumentHelper which provides methods for working with
 * markdown documentation. Key interfaces include Document, Section, Link,
 * Template, and SearchResult.
 *
 * Configuration is managed through cosmiconfig, supporting .dochelperrc.json files
 * or dochelper field in package.json.
 *
 * @module documentHelper
 * @author Team
 * @license MIT
 *
 * @todo Potential Third-Party Library Improvements:
 *
 * 1. Content Analysis Improvement with compromise.js
 *    - Install: npm install compromise
 *    - Benefits:
 *      - Better natural language processing
 *      - Topic extraction and entity recognition
 *      - Sentiment analysis with higher accuracy
 *      - Part-of-speech tagging for better content understanding
 *    - Example usage in analyzeContent():
 *      ```typescript
 *      import nlp from 'compromise';
 *
 *      // Process document text
 *      const doc = nlp(text);
 *
 *      // Get topics (nouns)
 *      const topics = doc.nouns().out('array');
 *
 *      // Get actions (verbs)
 *      const actions = doc.verbs().out('array');
 *
 *      // Get named entities
 *      const entities = doc.people().concat(doc.organizations()).out('array');
 *
 *      // Get text statistics
 *      const sentences = doc.sentences().length;
 *      ```
 *
 * 2. Search Improvement with Fuse.js
 *    - Install: npm install fuse.js
 *    - Benefits:
 *      - Fuzzy searching with configurable threshold
 *      - Weighted search across multiple fields
 *      - Better ranking and scoring of results
 *      - Faster performance for large document sets
 *    - Example usage in searchDocuments():
 *      ```typescript
 *      import Fuse from 'fuse.js';
 *
 *      const options = {
 *        keys: [
 *          { name: 'title', weight: 0.7 },
 *          { name: 'content', weight: 0.5 },
 *          { name: 'tags', weight: 0.3 }
 *        ],
 *        includeScore: true,
 *        threshold: 0.4
 *      };
 *
 *      const fuse = new Fuse(documents, options);
 *      const results = fuse.search(query);
 *      ```
 */

import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';
import { glob } from 'glob';
import { program } from 'commander';
import chalk from 'chalk';
import matter from 'gray-matter';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkStringify from 'remark-stringify';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import { toString } from 'mdast-util-to-string';
import lunr from 'lunr';
import * as natural from 'natural';
import Handlebars from 'handlebars';
import { cosmiconfig } from 'cosmiconfig';
import { visit } from 'unist-util-visit';

// Add declarations for modules that don't have TypeScript types
declare module 'mdast-util-to-string' {
  export function toString(node: any, options?: any): string;
}

// Types for natural.js
interface StemmerInterface {
  stem(token: string): string;
}

interface TokenizerInterface {
  tokenize(text: string): string[];
}

// Type for lunr search result
interface LunrSearchResult {
  ref: string;
  score: number;
  matchData: {
    metadata: {
      [term: string]: {
        [field: string]: {
          position: Array<[number, number]>;
        };
      };
    };
  };
}

// Promisify exec for async/await usage
const execAsync = promisify(exec);

// Configuration constants
const DOCS_DIR = 'docs';
const TEMPLATE_DIR = path.join(DOCS_DIR, 'templates');
const CONFIG_MODULE_NAME = 'dochelper';
const DEFAULT_CONFIG: DocumentHelperConfig = {
  docsDir: DOCS_DIR,
  templateDir: TEMPLATE_DIR,
  searchIndexPath: path.join(DOCS_DIR, 'search-index.json'),
  defaultLanguage: 'english',
  dateFormat: 'YYYY-MM-DD',
  templateExtension: '.hbs'
};

/**
 * Document interface represents a parsed markdown document
 */
interface Document {
  path: string;
  relativePath: string;
  content: string;
  rawContent: string;
  frontmatter: Record<string, any>;
  title: string;
  type: string;
  ast: any; // mdast node
  plainText: string;
  createdDate?: Date;
  modifiedDate?: Date;
  sections: Section[];
  tokens: string[];
  links: Link[];
}

/**
 * Section interface represents a section of a document
 */
interface Section {
  title: string;
  level: number;
  content: string;
  plainText: string;
  position: {
    start: { line: number; column: number; offset: number };
    end: { line: number; column: number; offset: number };
  };
}

/**
 * Link interface represents a link within a document
 */
interface Link {
  text: string;
  url: string;
  position: {
    start: { line: number; column: number; offset: number };
    end: { line: number; column: number; offset: number };
  };
  type: 'internal' | 'external' | 'anchor';
  targetDocument?: string;
}

/**
 * Template interface represents a document template
 */
interface Template {
  name: string;
  path: string;
  content: string;
  compiledTemplate: Handlebars.TemplateDelegate;
  placeholders: string[];
  description?: string;
  defaultValues?: Record<string, any>;
}

/**
 * SearchResult interface represents a search result
 */
interface SearchResult {
  document: Document;
  score: number;
  matches: Array<[number, number]>;
}

/**
 * SearchOptions interface for configuring search operations
 */
interface SearchOptions {
  limit?: number;
  threshold?: number;
  fields?: string[];
  fuzzy?: boolean;
  includeContent?: boolean;
}

/**
 * DocumentHelperConfig interface for configuration options
 */
interface DocumentHelperConfig {
  docsDir: string;
  templateDir: string;
  searchIndexPath: string;
  defaultLanguage: string;
  dateFormat: string;
  templateExtension: string;
  exclude?: string[];
  include?: string[];
  customTemplates?: Record<string, string>;
  metadata?: Record<string, any>;
}

/**
 * Core class providing document utilities
 */
class DocumentHelper {
  private config: DocumentHelperConfig = DEFAULT_CONFIG;
  private documents: Map<string, Document> = new Map();
  private templates: Map<string, Template> = new Map();
  private searchIndex: lunr.Index | null = null;
  private stemmer: StemmerInterface;
  private tokenizer: TokenizerInterface;

  constructor(config: Partial<DocumentHelperConfig> = {}) {
    // Setup default config
    this.config = { ...DEFAULT_CONFIG };

    // Load configuration from cosmiconfig or use defaults
    this.loadConfig(config);

    // Setup NLP tools
    this.stemmer = natural.PorterStemmer;
    this.tokenizer = new natural.WordTokenizer();
  }

  /**
   * Load configuration from cosmiconfig or use defaults
   */
  private async loadConfig(
    overrides: Partial<DocumentHelperConfig> = {}
  ): Promise<void> {
    try {
      const explorer = cosmiconfig(CONFIG_MODULE_NAME);
      const result = await explorer.search();

      this.config = {
        ...DEFAULT_CONFIG,
        ...(result?.config || {}),
        ...overrides
      };
    } catch (error) {
      console.error(
        chalk.yellow('Error loading configuration, using defaults')
      );
      this.config = { ...DEFAULT_CONFIG, ...overrides };
    }
  }

  /**
   * Find all markdown documents in the docs directory
   */
  async findDocuments(pattern: string = '**/*.md'): Promise<string[]> {
    try {
      const options = {
        cwd: this.config.docsDir,
        ignore: this.config.exclude || [
          '**/node_modules/**',
          '**/templates/**'
        ],
        nodir: true
      };

      // Use include patterns if provided
      if (this.config.include && this.config.include.length > 0) {
        // Add include patterns, which are specified in the configuration
        const includePatterns = this.config.include.map(
          (pattern) => `!${pattern}`
        );
        if (Array.isArray(options.ignore)) {
          options.ignore = [...options.ignore, ...includePatterns];
        } else {
          options.ignore = includePatterns;
        }
      }

      const files = await glob(pattern, options);
      return files.map((file) => path.join(this.config.docsDir, file));
    } catch (error) {
      console.error(chalk.red(`Error finding documents: ${error}`));
      return [];
    }
  }

  /**
   * Load a document from its file path
   *
   * This method reads and parses a markdown document, extracting its contents, frontmatter,
   * sections, links, and other metadata. The document is cached for future access.
   *
   * @param filePath - The path to the markdown document
   * @returns A Promise resolving to the Document object or null if loading fails
   * @example
   * const doc = await documentHelper.loadDocument('guides/introduction.md');
   * if (doc) {
   *   console.log(`Title: ${doc.title}`);
   *   console.log(`Sections: ${doc.sections.length}`);
   * }
   */
  async loadDocument(filePath: string): Promise<Document | null> {
    try {
      // Check if document is already loaded
      if (this.documents.has(filePath)) {
        return this.documents.get(filePath)!;
      }

      // Read file and parse content
      const rawContent = fs.readFileSync(filePath, 'utf8');

      // Parse frontmatter
      const { data: frontmatter, content } = matter(rawContent);

      // Parse markdown to AST
      const processor = unified()
        .use(remarkParse)
        .use(remarkFrontmatter)
        .use(remarkGfm);

      const ast = processor.parse(content);

      // Get plain text content
      const plainText = toString(ast);

      // Extract document title (from frontmatter or first heading)
      const title =
        frontmatter.title ||
        this.extractTitleFromAST(ast) ||
        path.basename(filePath, '.md');

      // Determine document type from path
      const relativePath = path.relative(this.config.docsDir, filePath);
      const type = relativePath.split(path.sep)[0] || 'unknown';

      // Get file metadata
      const stats = fs.statSync(filePath);

      // Extract sections and links
      const sections = this.extractSections(ast);
      const links = this.extractLinks(ast);

      // Tokenize content for search
      const tokens = this.tokenizer.tokenize(plainText) || [];

      // Create document object
      const document: Document = {
        path: filePath,
        relativePath,
        content,
        rawContent,
        frontmatter,
        title,
        type,
        ast,
        plainText,
        createdDate: stats.birthtime,
        modifiedDate: stats.mtime,
        sections,
        tokens,
        links
      };

      // Cache document
      this.documents.set(filePath, document);

      return document;
    } catch (error) {
      console.error(chalk.red(`Error loading document ${filePath}: ${error}`));
      return null;
    }
  }

  /**
   * Extract title from the AST (first heading)
   */
  private extractTitleFromAST(ast: any): string | null {
    // Find the first heading node
    for (const node of ast.children || []) {
      if (node.type === 'heading' && node.depth === 1) {
        return toString(node);
      }
    }
    return null;
  }

  /**
   * Extract sections from the AST
   */
  private extractSections(ast: any): Section[] {
    const sections: Section[] = [];

    // Process heading nodes to create sections
    for (let i = 0; i < (ast.children || []).length; i++) {
      const node = ast.children[i];
      if (node.type === 'heading') {
        const title = toString(node);
        const level = node.depth;

        // Find content until next heading of same or higher level
        let contentNodes = [];
        let j = i + 1;
        while (
          j < ast.children.length &&
          (ast.children[j].type !== 'heading' || ast.children[j].depth > level)
        ) {
          contentNodes.push(ast.children[j]);
          j++;
        }

        // Create section object
        sections.push({
          title,
          level,
          content: this.nodesToString(contentNodes),
          plainText: contentNodes.map((n: any) => toString(n)).join('\n'),
          position: node.position
        });
      }
    }

    return sections;
  }

  /**
   * Convert AST nodes back to markdown
   */
  private nodesToString(nodes: any[]): string {
    if (!nodes.length) return '';

    const processor = unified().use(remarkStringify);

    // Create a new root node with the content nodes
    const root = { type: 'root' as const, children: nodes };

    return processor.stringify(root);
  }

  /**
   * Extract links from the AST
   *
   * Uses unist-util-visit to efficiently traverse and extract links from the AST.
   * This is much more efficient than recursively traversing the tree manually.
   */
  private extractLinks(ast: any): Link[] {
    const links: Link[] = [];

    visit(ast, 'link', (node: any) => {
      const url = node.url;
      const text = toString(node);
      const position = node.position;

      // Determine link type
      let type: 'internal' | 'external' | 'anchor' = 'external';
      let targetDocument: string | undefined = undefined;

      if (url.startsWith('#')) {
        type = 'anchor';
      } else if (!url.startsWith('http') && !url.startsWith('mailto:')) {
        type = 'internal';
        // Extract target document path
        const urlPath = url.split('#')[0];
        targetDocument = urlPath;
      }

      links.push({
        text,
        url,
        position,
        type,
        targetDocument
      });
    });

    return links;
  }

  /**
   * Load all documents matching a pattern
   */
  async loadDocuments(pattern: string = '**/*.md'): Promise<Document[]> {
    const filePaths = await this.findDocuments(pattern);
    const documents: Document[] = [];

    for (const filePath of filePaths) {
      const doc = await this.loadDocument(filePath);
      if (doc) {
        documents.push(doc);
      }
    }

    return documents;
  }

  /**
   * Build a search index from all documents
   */
  async buildSearchIndex(): Promise<lunr.Index> {
    // Load all documents if not already loaded
    if (this.documents.size === 0) {
      await this.loadDocuments();
    }

    interface LunrBuilder {
      ref(field: string): void;
      field(fieldName: string, options?: { boost?: number }): void;
      add(doc: { [key: string]: any }): void;
    }

    // Cast this to any to access documents inside the lunr builder function
    const self = this as any;

    // Build Lunr index
    this.searchIndex = lunr(function (this: LunrBuilder) {
      this.ref('path');
      this.field('title', { boost: 10 });
      this.field('plainText');
      this.field('sections');

      // Add each document to the index
      for (const doc of Array.from(self.documents.values()) as Document[]) {
        this.add({
          path: doc.path,
          title: doc.title,
          plainText: doc.plainText,
          sections: doc.sections
            .map((s: Section) => s.title + ' ' + s.plainText)
            .join(' ')
        });
      }
    });

    return this.searchIndex;
  }

  /**
   * Search for documents based on a query
   *
   * @param query - The search query
   * @param options - Search options like limit, threshold, etc.
   * @returns Array of search results
   *
   * @todo Improve search with Fuse.js:
   * This search implementation could be significantly simplified and improved by using Fuse.js:
   * ```typescript
   * import Fuse from 'fuse.js';
   *
   * // Configure Fuse with the list of documents
   * const fuse = new Fuse(documents, {
   *   keys: ['title', 'plainText', 'frontmatter.tags'],
   *   includeScore: true,
   *   threshold: 0.3, // Configurable fuzzy threshold
   *   isCaseSensitive: false
   * });
   *
   * // Perform search
   * const results = fuse.search(query);
   * ```
   *
   * Benefits of Fuse.js:
   * - Built-in fuzzy searching
   * - No need to maintain a separate search index
   * - Better control over search precision
   * - Simpler API and reduced code complexity
   * - More maintainable solution
   */
  async search(
    query: string,
    options: SearchOptions = {}
  ): Promise<SearchResult[]> {
    // Ensure index is built
    if (!this.searchIndex) {
      await this.buildSearchIndex();
    }

    // Configure search options
    const {
      limit = 10,
      threshold = 0.1,
      fuzzy = true,
      includeContent = false
    } = options;

    // Perform search
    const results = this.searchIndex!.search(
      fuzzy ? query + '~2' : query
    ) as LunrSearchResult[];

    // Convert results to SearchResult objects
    const searchResults: SearchResult[] = [];

    for (const result of results) {
      if (result.score < threshold) continue;

      const document = this.documents.get(result.ref);
      if (!document) continue;

      // Знаходимо перший ключ метаданих
      const metadataKey = Object.keys(result.matchData.metadata)[0];

      // Отримуємо співпадіння позицій або повертаємо порожній масив
      const matches =
        metadataKey && result.matchData.metadata[metadataKey].plainText
          ? result.matchData.metadata[metadataKey].plainText.position || []
          : [];

      searchResults.push({
        document: includeContent ? document : this.stripContent(document),
        score: result.score,
        matches
      });

      if (searchResults.length >= limit) break;
    }

    return searchResults;
  }

  /**
   * Remove content-heavy fields from document for lighter results
   */
  private stripContent(document: Document): Document {
    const { ast, content, rawContent, plainText, tokens, ...rest } = document;
    return {
      ...rest,
      ast: null as any,
      content: '',
      rawContent: '',
      plainText: '',
      tokens: []
    };
  }

  /**
   * Find all available templates
   */
  async findTemplates(): Promise<string[]> {
    try {
      const files = await glob(`*${this.config.templateExtension}`, {
        cwd: this.config.templateDir,
        nodir: true
      });
      return files.map((file) => path.join(this.config.templateDir, file));
    } catch (error) {
      console.error(chalk.red(`Error finding templates: ${error}`));
      return [];
    }
  }

  /**
   * Load a template from its file path
   */
  async loadTemplate(filePath: string): Promise<Template | null> {
    try {
      // Check if template is already loaded
      if (this.templates.has(filePath)) {
        return this.templates.get(filePath)!;
      }

      // Read and parse template
      const content = fs.readFileSync(filePath, 'utf8');
      const name = path.basename(filePath, this.config.templateExtension);

      // Compile template with Handlebars
      const compiledTemplate = Handlebars.compile(content);

      // Find placeholders in the template
      const placeholderRegex = /{{([^}]+)}}/g;
      const placeholders: string[] = [];
      let match;
      while ((match = placeholderRegex.exec(content)) !== null) {
        const placeholder = match[1].trim();
        if (!placeholders.includes(placeholder)) {
          placeholders.push(placeholder);
        }
      }

      // Extract description and default values from frontmatter
      let description: string | undefined;
      let defaultValues: Record<string, any> = {};

      try {
        const { data } = matter(content);
        description = data.description;
        defaultValues = data.defaults || {};
      } catch (error) {
        // Ignore frontmatter parsing errors
      }

      // Create template object
      const template: Template = {
        name,
        path: filePath,
        content,
        compiledTemplate,
        placeholders,
        description,
        defaultValues
      };

      // Cache template
      this.templates.set(filePath, template);

      return template;
    } catch (error) {
      console.error(chalk.red(`Error loading template ${filePath}: ${error}`));
      return null;
    }
  }

  /**
   * Load all templates
   */
  async loadTemplates(): Promise<Template[]> {
    const filePaths = await this.findTemplates();
    const templates: Template[] = [];

    for (const filePath of filePaths) {
      const template = await this.loadTemplate(filePath);
      if (template) {
        templates.push(template);
      }
    }

    return templates;
  }

  /**
   * Create a document from a template
   *
   * Generates a new document based on a template and provided values. The template
   * is processed using Handlebars for variable substitution. The new document is written
   * to the specified path and then loaded into the document cache.
   *
   * @param templateName - The name of the template to use
   * @param targetPath - The path where the new document should be saved
   * @param values - Values to substitute in the template
   * @returns A Promise resolving to the created Document or null if creation fails
   * @example
   * const doc = await documentHelper.createDocument(
   *   'task-template',
   *   'workflows/tasks/new-feature.md',
   *   {
   *     title: 'Implement New Feature',
   *     description: 'Add support for...',
   *     assignee: 'developer1'
   *   }
   * );
   */
  async createDocument(
    templateName: string,
    targetPath: string,
    values: Record<string, any>
  ): Promise<Document | null> {
    try {
      // Load all templates if not already loaded
      if (this.templates.size === 0) {
        await this.loadTemplates();
      }

      // Find template by name
      const template = Array.from(this.templates.values()).find(
        (t) => t.name === templateName
      );
      if (!template) {
        console.error(chalk.red(`Template '${templateName}' not found`));
        return null;
      }

      // Merge default values with provided values
      const mergedValues = {
        ...template.defaultValues,
        ...values,
        date: new Date().toISOString().split('T')[0] // Current date in YYYY-MM-DD format
      };

      // Generate document content from template
      const content = template.compiledTemplate(mergedValues);

      // Ensure target directory exists
      const targetDir = path.dirname(targetPath);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // Write document to file
      fs.writeFileSync(targetPath, content);

      // Load the newly created document
      return await this.loadDocument(targetPath);
    } catch (error) {
      console.error(chalk.red(`Error creating document: ${error}`));
      return null;
    }
  }

  /**
   * Analyze the relationships between documents
   *
   * Examines all documents to identify and map internal links between them.
   * This analysis helps understand document connections and dependencies.
   *
   * @returns A Promise resolving to a Map where keys are document paths and values are arrays of linked document paths
   * @example
   * const relationships = await documentHelper.analyzeRelationships();
   *
   * // Find all documents that link to a specific document
   * const targetDoc = 'guides/getting-started.md';
   * for (const [source, targets] of relationships.entries()) {
   *   if (targets.includes(targetDoc)) {
   *     console.log(`${source} links to the getting started guide`);
   *   }
   * }
   */
  async analyzeRelationships(): Promise<Map<string, string[]>> {
    // Load all documents if not already loaded
    if (this.documents.size === 0) {
      await this.loadDocuments();
    }

    const relationships = new Map<string, string[]>();

    // Process each document
    for (const [docPath, document] of this.documents.entries()) {
      // Find all internal links in the document
      const internalLinks = document.links.filter(
        (link) => link.type === 'internal'
      );

      // Resolve target paths
      const targetPaths = internalLinks
        .map((link) => {
          if (!link.targetDocument) return null;

          // Handle relative paths
          let targetPath = link.targetDocument;

          // Використовуємо функції з модуля path, а не зі змінної path
          if (!targetPath.startsWith('/')) {
            targetPath = path.resolve(path.dirname(document.path), targetPath);
          }

          // Ensure .md extension
          if (!targetPath.endsWith('.md')) {
            targetPath += '.md';
          }

          return targetPath;
        })
        .filter(Boolean) as string[];

      // Store relationships
      relationships.set(docPath, targetPaths);
    }

    return relationships;
  }

  /**
   * Generate a relationship diagram in Mermaid format
   *
   * Creates a graph diagram showing relationships between documents using the Mermaid syntax.
   * This can be embedded in markdown or rendered as an image.
   *
   * @returns A Promise resolving to a string containing the Mermaid diagram
   * @example
   * const diagram = await documentHelper.generateRelationshipDiagram();
   * console.log(diagram);
   *
   * // Output example:
   * // graph TD;
   * //   doc_docs_guide_md["guide"] --> doc_docs_api_md;
   * //   doc_docs_api_md["api"] --> doc_docs_authentication_md;
   */
  async generateRelationshipDiagram(): Promise<string> {
    const relationships = await this.analyzeRelationships();

    // Start Mermaid diagram
    let diagram = 'graph TD;\n';

    // Add nodes and edges
    for (const [source, targets] of relationships.entries()) {
      const sourceId = this.pathToId(source);
      diagram += `  ${sourceId}["${path.basename(source, '.md')}"];\n`;

      for (const target of targets) {
        const targetId = this.pathToId(target);
        diagram += `  ${sourceId} --> ${targetId};\n`;
      }
    }

    return diagram;
  }

  /**
   * Convert a file path to a valid Mermaid node ID
   */
  private pathToId(filePath: string): string {
    return 'doc_' + filePath.replace(/[^\w]/g, '_').replace(/__+/g, '_');
  }

  /**
   * Save the search index to a file
   */
  async saveSearchIndex(outputPath?: string): Promise<void> {
    // Build the index if not already built
    if (!this.searchIndex) {
      await this.buildSearchIndex();
    }

    const output = outputPath || this.config.searchIndexPath;

    // Create directory if it doesn't exist
    const dir = path.dirname(output);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Serialize and save the index
    const serialized = JSON.stringify(this.searchIndex);
    fs.writeFileSync(output, serialized);

    console.log(chalk.green(`Search index saved to ${output}`));
  }

  /**
   * Load the search index from a file
   */
  async loadSearchIndex(inputPath?: string): Promise<void> {
    const input = inputPath || this.config.searchIndexPath;

    if (!fs.existsSync(input)) {
      console.error(chalk.yellow(`Search index file ${input} not found`));
      return;
    }

    try {
      const serialized = fs.readFileSync(input, 'utf8');
      this.searchIndex = lunr.Index.load(JSON.parse(serialized));
      console.log(chalk.green(`Search index loaded from ${input}`));
    } catch (error) {
      console.error(chalk.red(`Error loading search index: ${error}`));
    }
  }

  /**
   * Analyze the content of a document
   *
   * @param doc - The document or document path to analyze
   * @returns Content analysis result
   *
   * @todo Improve content analysis with Compromise.js:
   * Content analysis could be significantly enhanced using Compromise.js, a lightweight NLP library:
   * ```typescript
   * import nlp from 'compromise';
   *
   * // Process the document text
   * const doc = nlp(document.plainText);
   *
   * // Extract topics (nouns)
   * const topics = doc.nouns().out('array');
   *
   * // Extract key actions (verbs)
   * const actions = doc.verbs().out('array');
   *
   * // Find people, organizations, and places
   * const people = doc.people().out('array');
   * const orgs = doc.organizations().out('array');
   * const places = doc.places().out('array');
   *
   * // Get statistics about the text
   * const sentences = doc.sentences().length;
   * const wordCount = doc.wordCount();
   *
   * // Detect questions
   * const questions = doc.questions().out('array');
   * ```
   *
   * Benefits of Compromise.js:
   * - Very lightweight (~260kb) compared to natural.js
   * - Faster processing
   * - More accurate entity recognition
   * - Better handling of technical terminology
   * - No dependencies
   */
  async analyzeContent(docOrPath: Document | string): Promise<any> {
    // Load document if it's a path
    let document: Document | null;

    if (typeof docOrPath === 'string') {
      document = await this.loadDocument(docOrPath);
      if (!document) {
        console.error(chalk.red(`Document not found: ${docOrPath}`));
        return null;
      }
    } else {
      document = docOrPath;
    }

    // Calculate term frequency
    const tokens = document.tokens;
    const termFrequency: Record<string, number> = {};

    for (const token of tokens) {
      // Stem the token
      const stemmed = this.stemmer.stem(token);
      termFrequency[stemmed] = (termFrequency[stemmed] || 0) + 1;
    }

    // Sort terms by frequency
    const sortedTerms = Object.entries(termFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);

    // Calculate readability metrics
    const sentences = document.plainText.split(/[.!?]+/).filter(Boolean);
    const avgSentenceLength =
      sentences.length > 0 ? tokens.length / sentences.length : 0;

    // Estimate reading time (words per minute)
    const wpm = 200; // Average reading speed
    const readingTimeMinutes = tokens.length / wpm;

    // Analyze sentiment (basic implementation)
    const Analyzer = natural.SentimentAnalyzer;
    const stemmer = natural.PorterStemmer;
    const analyzer = new Analyzer('English', stemmer, 'afinn');
    const sentiment = analyzer.getSentiment(tokens);

    return {
      documentTitle: document.title,
      wordCount: tokens.length,
      sentenceCount: sentences.length,
      avgSentenceLength,
      readingTimeMinutes,
      topTerms: sortedTerms,
      sentiment: sentiment,
      complexity: avgSentenceLength * 0.5 // Simple complexity metric
    };
  }

  /**
   * Find similar documents based on content
   *
   * Uses TF-IDF and cosine similarity to identify documents with similar content
   * to the specified document. Useful for suggesting related reading or identifying
   * potential duplication.
   *
   * @param documentPath - The path to the reference document
   * @param limit - Maximum number of similar documents to return
   * @returns A Promise resolving to an array of documents with similarity scores
   * @example
   * const similar = await documentHelper.findSimilarDocuments('guides/authentication.md', 3);
   * for (const { document, similarity } of similar) {
   *   console.log(`${document.title}: ${(similarity * 100).toFixed(1)}% similar`);
   * }
   */
  async findSimilarDocuments(
    documentPath: string,
    limit: number = 5
  ): Promise<{ document: Document; similarity: number }[]> {
    // Load document if not already loaded
    const document = await this.loadDocument(documentPath);
    if (!document) {
      console.error(chalk.red(`Document not found: ${documentPath}`));
      return [];
    }

    // Load all documents if not already loaded
    if (this.documents.size <= 1) {
      await this.loadDocuments();
    }

    // Calculate TF-IDF vectors
    const tfidf = new natural.TfIdf();

    // Add the target document
    tfidf.addDocument(document.plainText);

    // Add all other documents
    const otherDocs: Document[] = [];
    for (const [path, doc] of this.documents.entries()) {
      if (path !== documentPath) {
        tfidf.addDocument(doc.plainText);
        otherDocs.push(doc);
      }
    }

    // Calculate similarity with other documents
    const similarities: { document: Document; similarity: number }[] = [];

    // Get terms from the target document
    const terms: string[] = [];
    tfidf.listTerms(0).forEach((item: { term: string }) => {
      terms.push(item.term);
    });

    // Calculate cosine similarity
    for (let i = 0; i < otherDocs.length; i++) {
      let dotProduct = 0;
      let magnitude1 = 0;
      let magnitude2 = 0;

      // Calculate dot product and magnitudes
      for (const term of terms) {
        const weight1 = tfidf.tfidf(term, 0);
        const weight2 = tfidf.tfidf(term, i + 1);

        dotProduct += weight1 * weight2;
        magnitude1 += weight1 * weight1;
        magnitude2 += weight2 * weight2;
      }

      // Calculate cosine similarity
      const similarity =
        magnitude1 > 0 && magnitude2 > 0
          ? dotProduct / (Math.sqrt(magnitude1) * Math.sqrt(magnitude2))
          : 0;

      similarities.push({
        document: otherDocs[i],
        similarity
      });
    }

    // Sort by similarity (descending) and limit results
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }
}

// CLI commands

/**
 * Set up the CLI commands
 */
async function setupCLI() {
  const helper = new DocumentHelper();

  program
    .name('documentHelper')
    .description(
      'A comprehensive utility for managing, analyzing, and manipulating markdown documentation'
    )
    .version('1.0.0');

  // Search command
  program
    .command('search <query>')
    .description('Search for documents')
    .option('-l, --limit <number>', 'Limit the number of results', '10')
    .option('-f, --fuzzy', 'Enable fuzzy search', true)
    .option('-t, --threshold <number>', 'Minimum score threshold', '0.1')
    .option('-c, --content', 'Include document content in results', false)
    .action(async (query, options) => {
      try {
        const results = await helper.search(query, {
          limit: parseInt(options.limit),
          fuzzy: options.fuzzy,
          threshold: parseFloat(options.threshold),
          includeContent: options.content
        });

        if (results.length === 0) {
          console.log(chalk.yellow('No results found.'));
          return;
        }

        console.log(chalk.green(`Found ${results.length} results:`));

        for (const [index, result] of results.entries()) {
          const { document, score } = result;
          console.log(
            `\n${index + 1}. ${chalk.blue(document.title)} (${chalk.green(
              score.toFixed(2)
            )})`
          );
          console.log(`   ${chalk.gray(document.path)}`);

          // Show snippets if content is included
          if (options.content) {
            console.log(
              `\n   ${document.sections[0]?.plainText.substring(0, 100)}...`
            );
          }
        }
      } catch (error) {
        console.error(chalk.red(`Error searching documents: ${error}`));
      }
    });

  // Create command
  program
    .command('create <template> <targetPath>')
    .description('Create a document from a template')
    .option('-v, --values <json>', 'JSON string of values for the template')
    .action(async (template, targetPath, options) => {
      try {
        const values = options.values ? JSON.parse(options.values) : {};

        const document = await helper.createDocument(
          template,
          targetPath,
          values
        );

        if (document) {
          console.log(
            chalk.green(`Document created successfully: ${document.path}`)
          );
        } else {
          console.error(chalk.red('Failed to create document'));
        }
      } catch (error) {
        console.error(chalk.red(`Error creating document: ${error}`));
      }
    });

  // List templates command
  program
    .command('templates')
    .description('List available templates')
    .action(async () => {
      try {
        const templates = await helper.loadTemplates();

        if (templates.length === 0) {
          console.log(chalk.yellow('No templates found.'));
          return;
        }

        console.log(chalk.green(`Found ${templates.length} templates:`));

        for (const [index, template] of templates.entries()) {
          console.log(`\n${index + 1}. ${chalk.blue(template.name)}`);

          if (template.description) {
            console.log(`   ${template.description}`);
          }

          console.log(
            `   Placeholders: ${chalk.yellow(template.placeholders.join(', '))}`
          );
        }
      } catch (error) {
        console.error(chalk.red(`Error listing templates: ${error}`));
      }
    });

  // Analyze command
  program
    .command('analyze <filePath>')
    .description('Analyze document content')
    .action(async (filePath) => {
      try {
        const analysis = await helper.analyzeContent(filePath);

        if (!analysis) {
          return;
        }

        console.log(
          chalk.green(`Analysis of ${chalk.blue(analysis.documentTitle)}:`)
        );
        console.log(`\n${chalk.yellow('Basic Metrics:')}`);
        console.log(`Word Count: ${analysis.wordCount}`);
        console.log(`Sentence Count: ${analysis.sentenceCount}`);
        console.log(
          `Average Sentence Length: ${analysis.avgSentenceLength.toFixed(
            2
          )} words`
        );
        console.log(
          `Reading Time: ${analysis.readingTimeMinutes.toFixed(2)} minutes`
        );
        console.log(`Complexity: ${analysis.complexity.toFixed(2)}`);
        console.log(`Sentiment: ${analysis.sentiment.toFixed(2)} (-1 to 1)`);

        console.log(`\n${chalk.yellow('Top Terms:')}`);
        for (const [term, frequency] of analysis.topTerms) {
          console.log(`${term}: ${frequency}`);
        }
      } catch (error) {
        console.error(chalk.red(`Error analyzing document: ${error}`));
      }
    });

  // Find similar documents command
  program
    .command('similar <filePath>')
    .description('Find similar documents')
    .option('-l, --limit <number>', 'Limit the number of results', '5')
    .action(async (filePath, options) => {
      try {
        const similar = await helper.findSimilarDocuments(
          filePath,
          parseInt(options.limit)
        );

        if (similar.length === 0) {
          console.log(chalk.yellow('No similar documents found.'));
          return;
        }

        const doc = await helper.loadDocument(filePath);
        console.log(
          chalk.green(
            `Documents similar to ${chalk.blue(doc?.title || filePath)}:`
          )
        );

        for (const [index, { document, similarity }] of similar.entries()) {
          console.log(
            `\n${index + 1}. ${chalk.blue(document.title)} (${chalk.green(
              (similarity * 100).toFixed(2)
            )}% similarity)`
          );
          console.log(`   ${chalk.gray(document.path)}`);
        }
      } catch (error) {
        console.error(chalk.red(`Error finding similar documents: ${error}`));
      }
    });

  // Generate relationship diagram command
  program
    .command('diagram [outputPath]')
    .description('Generate a relationship diagram in Mermaid format')
    .action(async (outputPath) => {
      try {
        const diagram = await helper.generateRelationshipDiagram();

        if (outputPath) {
          fs.writeFileSync(outputPath, diagram);
          console.log(chalk.green(`Diagram saved to ${outputPath}`));
        } else {
          console.log(chalk.green('Relationship Diagram (Mermaid format):'));
          console.log('\n' + diagram);
        }
      } catch (error) {
        console.error(chalk.red(`Error generating diagram: ${error}`));
      }
    });

  // Build search index command
  program
    .command('build-index [outputPath]')
    .description('Build and save the search index')
    .action(async (outputPath) => {
      try {
        await helper.saveSearchIndex(outputPath);
      } catch (error) {
        console.error(chalk.red(`Error building search index: ${error}`));
      }
    });

  // Parse arguments
  program.parse();
}

// If run directly (not imported as a module)
if (require.main === module) {
  setupCLI().catch((error) => {
    console.error(chalk.red(`Error running documentHelper: ${error}`));
    process.exit(1);
  });
}

// Export the DocumentHelper class and types
export {
  DocumentHelper,
  Document,
  Section,
  Link,
  Template,
  SearchResult,
  SearchOptions,
  DocumentHelperConfig
};
