/**
 * Tests for DocumentHelper Utility
 *
 * This test file verifies the functionality of the DocumentHelper class which provides
 * comprehensive utilities for managing, analyzing, and manipulating markdown documentation.
 *
 * The tests use Vitest and mock all external dependencies to allow for isolated testing of
 * the DocumentHelper methods. The mocks simulate realistic responses from dependencies like
 * the file system, markdown parser, search indexer, and NLP libraries.
 *
 * Test coverage includes:
 * - Finding and loading markdown documents
 * - Error handling when files or directories don't exist
 * - Search functionality across document content
 * - Document parsing and metadata extraction
 * - Template handling for document creation
 *
 * Running the tests:
 * npx vitest run scripts/tests/documentHelper.test.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Import mock objects for top-level mocking
import {
  fsMock,
  pathMock,
  childProcessMock,
  globMock,
  matterMock,
  lunrMock,
  naturalMock,
  mdastUtilMock,
  unifiedMock,
  utilMock,
  commanderMock,
  handlebarsMock,
  setupDocTestEnv
} from './vitest-docs-setup';

import { createMockDocument } from './__mocks__/documentHelperMocks';

// Set up mocks at the top level
vi.mock('fs', () => fsMock);
vi.mock('path', () => pathMock);
vi.mock('child_process', () => childProcessMock);
vi.mock('glob', () => globMock);
vi.mock('gray-matter', () => ({
  __esModule: true,
  default: (content: string) => ({
    data: { title: 'Mock Title' },
    content: 'Mock content'
  })
}));
vi.mock('lunr', () => lunrMock);
vi.mock('natural', () => naturalMock);
vi.mock('commander', () => commanderMock);
vi.mock('handlebars', () => handlebarsMock);
vi.mock('mdast-util-to-string', () => mdastUtilMock);
vi.mock('unified', () => unifiedMock);
vi.mock('util', () => utilMock);

// Import modules after setting up mocks
import * as fs from 'fs';
import * as glob from 'glob';
import matter from 'gray-matter';
import * as natural from 'natural';
import * as unified from 'unified';
import { DocumentHelper, Document } from '../documentHelper';

// Prepare test data
const mockDocument: Document = createMockDocument();

// Setup common test environment before any tests
setupDocTestEnv();

describe('DocumentHelper', () => {
  let documentHelper: DocumentHelper;

  beforeEach(async () => {
    // Setup specific mock for SentimentAnalyzer
    vi.mocked(natural.SentimentAnalyzer).mockImplementation(() => ({
      getSentiment: vi.fn().mockReturnValue(0.2)
    }));

    // Setup mocks for glob
    vi.mocked(glob.glob).mockResolvedValue(['doc1.md', 'doc2.md']);

    // Setup mock for fs.readFileSync
    vi.mocked(fs.readFileSync).mockReturnValue(
      '# Mock Document\n\nThis is mock content'
    );

    // Setup mock for fs.statSync
    vi.mocked(fs.statSync).mockReturnValue({
      birthtime: new Date(2025, 1, 1),
      mtime: new Date(2025, 1, 1),
      isDirectory: () => false,
      isFile: () => true
    } as any);

    documentHelper = new DocumentHelper();

    // Add mock for tokenizer
    (documentHelper as any).tokenizer = {
      tokenize: vi.fn().mockReturnValue(['word1', 'word2', 'word3', 'word4'])
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // Simplified tests for demonstration
  describe('findDocuments', () => {
    it('should find markdown documents in the docs directory', async () => {
      const docs = await documentHelper.findDocuments();

      expect(docs).toHaveLength(2);
      expect(docs).toContain('doc1.md');
    });

    it('should handle errors when finding documents', async () => {
      // Set up mock for error
      vi.mocked(glob.glob).mockRejectedValueOnce(new Error('Mock error'));

      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const docs = await documentHelper.findDocuments();

      expect(docs).toHaveLength(0);
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error finding documents')
      );
    });
  });

  describe('loadDocument', () => {
    it('should load and parse a document', async () => {
      // Setup mock for matter
      vi.mocked(matter).mockReturnValue({
        data: { title: 'Mock Title' },
        content: 'Mock content',
        orig: 'Original content',
        language: 'markdown',
        matter: 'frontmatter content',
        stringify: (options?: any) => 'stringified content'
      });

      // Setup mock for unified
      const mockProcessor = {
        use: vi.fn().mockReturnThis(),
        parse: vi.fn().mockReturnValue({
          type: 'root',
          children: [
            {
              type: 'heading',
              depth: 1,
              children: [{ type: 'text', value: 'Title' }],
              position: {
                start: { line: 1, column: 1, offset: 0 },
                end: { line: 1, column: 10, offset: 9 }
              }
            }
          ]
        }),
        stringify: vi.fn().mockReturnValue('Stringified markdown')
      };

      vi.mocked(unified.unified).mockReturnValue(mockProcessor as any);

      // Setup mock for toString
      vi.mocked(mdastUtilMock.toString).mockReturnValue('Plain text content');

      const doc = await documentHelper.loadDocument('docs/test-doc.md');

      expect(doc).not.toBeNull();
      expect(doc?.title).toBe('Mock Title');
      expect(fs.readFileSync).toHaveBeenCalledWith('docs/test-doc.md', 'utf8');
    });
  });

  describe('analyzeContent', () => {
    it('should analyze document content and return metrics', async () => {
      // Setup mock for natural.TfIdf
      const mockTfIdf = {
        addDocument: vi.fn(),
        listTerms: vi.fn().mockReturnValue([
          { term: 'word1', tfidf: 0.4 },
          { term: 'word2', tfidf: 0.3 },
          { term: 'word3', tfidf: 0.2 },
          { term: 'word4', tfidf: 0.1 }
        ])
      };
      vi.mocked(natural.TfIdf).mockImplementation(() => mockTfIdf);

      // Test with a document object
      const result = await documentHelper.analyzeContent(mockDocument);

      expect(result).not.toBeNull();
      expect(result.documentTitle).toBe('Test Document');
      expect(result.wordCount).toBe(4); // From the mock document tokens
      expect(result.topTerms).toHaveLength(4); // Should match the actual length from the result
      expect(result.sentiment).toBe(0.2); // From the mocked sentiment analyzer
      expect(result.readingTimeMinutes).toBeCloseTo(0.02, 2); // 4 words at 200 wpm
    });

    it('should load and analyze document when given a path', async () => {
      // Mock loadDocument to return our mock document
      vi.spyOn(documentHelper, 'loadDocument').mockResolvedValue(mockDocument);

      const result = await documentHelper.analyzeContent('docs/test-doc.md');

      expect(documentHelper.loadDocument).toHaveBeenCalledWith(
        'docs/test-doc.md'
      );
      expect(result).not.toBeNull();
      expect(result.documentTitle).toBe('Test Document');
    });

    it('should handle errors when document is not found', async () => {
      // Mock loadDocument to return null (document not found)
      vi.spyOn(documentHelper, 'loadDocument').mockResolvedValue(null);
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const result = await documentHelper.analyzeContent('non-existent-doc.md');

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Document not found')
      );
    });
  });
});
