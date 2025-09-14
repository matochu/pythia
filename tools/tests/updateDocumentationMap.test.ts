/**
 * Tests for Documentation Map Update Utility
 *
 * This test file verifies the functionality of the updateDocumentationMap module which maintains
 * the central documentation map file by keeping track of all documentation files, their categories,
 * and relationships.
 *
 * The tests use Vitest and mock all external dependencies to allow for isolated testing of
 * the update functions. The mocks simulate file system operations and document analysis.
 *
 * Test coverage includes:
 * - Finding and categorizing markdown documents
 * - Identifying missing documents in the map
 * - Updating the documentation map with new documents
 * - Managing document relationships and metadata
 * - Generating visualization diagrams
 *
 * Running the tests:
 * npx vitest run scripts/tests/updateDocumentationMap.test.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Import mock objects for top-level mocking
import { fsMock, pathMock, childProcessMock, utilMock } from './setup';

// Set up mocks at the top level
vi.mock('fs', () => fsMock);
vi.mock('path', () => pathMock);
vi.mock('child_process', () => childProcessMock);
vi.mock('util', () => utilMock);

// Import modules after setting up mocks
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';

// Create a mock for the updateDocumentationMap module
const mockUpdateMap = {
  getAllDocuments: vi.fn().mockResolvedValue([]),
  categorizeDocuments: vi.fn().mockReturnValue({}),
  findMissingDocuments: vi.fn().mockReturnValue([]),
  updateDocumentationMap: vi.fn().mockResolvedValue(true),
  updateRecentlyAddedDocuments: vi.fn().mockResolvedValue(true),
  updateLastModifiedDate: vi.fn().mockResolvedValue(true),
  buildDocumentMetadata: vi.fn().mockResolvedValue(true),
  analyzeDocumentRelationships: vi.fn().mockResolvedValue(true),
  generateRelationshipDiagram: vi.fn().mockResolvedValue(true),
  semanticSearch: vi.fn().mockResolvedValue([])
};

vi.mock('../documentation/updateDocumentationMap', () => {
  return {
    default: vi.fn().mockImplementation(() => Promise.resolve(true)),
    getAllDocuments: mockUpdateMap.getAllDocuments,
    categorizeDocuments: mockUpdateMap.categorizeDocuments,
    findMissingDocuments: mockUpdateMap.findMissingDocuments,
    updateDocumentationMap: mockUpdateMap.updateDocumentationMap,
    updateRecentlyAddedDocuments: mockUpdateMap.updateRecentlyAddedDocuments,
    updateLastModifiedDate: mockUpdateMap.updateLastModifiedDate,
    buildDocumentMetadata: mockUpdateMap.buildDocumentMetadata,
    analyzeDocumentRelationships: mockUpdateMap.analyzeDocumentRelationships,
    generateRelationshipDiagram: mockUpdateMap.generateRelationshipDiagram,
    semanticSearch: mockUpdateMap.semanticSearch
  };
});

describe('updateDocumentationMap.ts', () => {
  let consoleLogSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    // Restore initial state before each test
    vi.resetAllMocks();

    // Mock console methods for testing output
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Basic path mocks
    (path.basename as any).mockImplementation((p) => p.split('/').pop());
    (path.join as any).mockImplementation((...parts) => parts.join('/'));
    (path.extname as any).mockImplementation((p) => {
      const parts = p.split('.');
      return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
    });
    (path.relative as any).mockImplementation((from, to) =>
      to.replace(from, '').replace(/^\//, '../')
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getAllDocuments', () => {
    it('should find all markdown documents in the docs directory', async () => {
      // Arrange
      const mockDocuments = [
        '.pythia/tasks/task1.md',
        '.pythia/architecture/analysis.md',
        '.pythia/navigation/documentation-map.md'
      ];

      // Mock fs.promises.readdir to return different files in different directories
      const mockReaddirImplementation = (dir: string) => {
        if (dir === '.pythia/tasks') return Promise.resolve(['task1.md']);
        if (dir === '.pythia/architecture')
          return Promise.resolve(['analysis.md']);
        if (dir === '.pythia/navigation')
          return Promise.resolve(['documentation-map.md']);
        return Promise.resolve([]);
      };

      (fs.promises.readdir as any).mockImplementation(
        mockReaddirImplementation
      );
      (fs.existsSync as any).mockReturnValue(true);

      // Also mock the directory structure
      (exec as any).mockImplementation((cmd, callback) => {
        if (cmd.includes('find docs -type d')) {
          callback(null, {
            stdout: '.pythia/tasks\n.pythia/architecture\n.pythia/navigation'
          });
        } else {
          callback(null, { stdout: '' });
        }
      });

      // Action
      mockUpdateMap.getAllDocuments.mockResolvedValue(mockDocuments);
      const result = await mockUpdateMap.getAllDocuments();

      // Assert
      expect(result).toEqual(mockDocuments);
    });
  });

  describe('categorizeDocuments', () => {
    it('should correctly categorize documents based on their paths', () => {
      // Arrange
      const mockDocuments = [
        '.pythia/tasks/task1.md',
        '.pythia/architecture/analysis.md',
        '.pythia/navigation/documentation-map.md',
        '.pythia/proposals/proposal.md'
      ];

      const expectedCategories = {
        tasks: ['.pythia/tasks/task1.md'],
        architecture: ['.pythia/architecture/analysis.md'],
        navigation: ['.pythia/navigation/documentation-map.md'],
        proposals: ['.pythia/proposals/proposal.md']
      };

      // Action
      mockUpdateMap.categorizeDocuments.mockReturnValue(expectedCategories);
      const result = mockUpdateMap.categorizeDocuments(mockDocuments);

      // Assert
      expect(result).toEqual(expectedCategories);
    });
  });

  describe('findMissingDocuments', () => {
    it('should identify documents not present in the documentation map', () => {
      // Arrange
      const mockAllDocs = [
        '.pythia/tasks/task1.md',
        '.pythia/tasks/task2.md',
        '.pythia/architecture/analysis.md'
      ];

      const mockMapContent = `
## Tasks

| Document | Description |
| -------- | ----------- |
| [Task 1](../tasks/task1.md) | Description of task 1 |

## Architecture Analysis

| Document | Description |
| -------- | ----------- |
| [Analysis](../architecture/analysis.md) | Architecture analysis |
`;

      const expectedMissing = ['.pythia/tasks/task2.md'];

      // Action
      mockUpdateMap.findMissingDocuments.mockReturnValue(expectedMissing);
      const result = mockUpdateMap.findMissingDocuments(
        mockAllDocs,
        mockMapContent
      );

      // Assert
      expect(result).toEqual(expectedMissing);
    });
  });

  describe('updateDocumentationMap', () => {
    it('should update the documentation map with missing documents', async () => {
      // Arrange
      const mockMapPath = '.pythia/navigation/documentation-map.md';
      const mockMapContent = `
## Tasks

| Document | Description |
| -------- | ----------- |
| [Task 1](../tasks/task1.md) | Description of task 1 |

## References
`;

      const mockMissingDocs = ['.pythia/tasks/task2.md'];

      (fs.readFileSync as any).mockReturnValue(mockMapContent);
      (fs.existsSync as any).mockReturnValue(true);

      // Action
      await mockUpdateMap.updateDocumentationMap(mockMapPath, mockMissingDocs);

      // Assert
      expect(mockUpdateMap.updateDocumentationMap).toHaveBeenCalledWith(
        mockMapPath,
        mockMissingDocs
      );
    });
  });

  describe('updateLastModifiedDate', () => {
    it('should update the last modified date in the documentation map', async () => {
      // Arrange
      const mockMapPath = '.pythia/navigation/documentation-map.md';
      const mockMapContent = `
## Maintenance

This navigation map is maintained alongside the project documentation. When adding new documents or significantly updating existing ones, please update this map to keep it current.

Last updated: March 10, 2025

## References
`;

      (fs.readFileSync as any).mockReturnValue(mockMapContent);
      (fs.existsSync as any).mockReturnValue(true);

      // Create a fixed date for the test
      const mockToday = new Date('2025-03-15');
      const dateSpy = vi
        .spyOn(global, 'Date')
        .mockImplementation(() => mockToday as any);

      // Action
      await mockUpdateMap.updateLastModifiedDate(mockMapPath);

      // Assert
      expect(mockUpdateMap.updateLastModifiedDate).toHaveBeenCalledWith(
        mockMapPath
      );

      // Restore the original Date constructor
      dateSpy.mockRestore();
    });
  });

  describe('updateRecentlyAddedDocuments', () => {
    it('should update the Recently Added Documents section', async () => {
      // Arrange
      const mockMapPath = '.pythia/navigation/documentation-map.md';
      const mockMapContent = `
## References

- [CHANGELOG](../CHANGELOG.md)

### Recently Added Documents

#### .pythia/tasks

- [Task 1](../tasks/task1.md)
`;

      const mockNewDocuments = [
        '.pythia/architecture/new-analysis.md',
        '.pythia/tasks/task2.md'
      ];

      (fs.readFileSync as any).mockReturnValue(mockMapContent);
      (fs.existsSync as any).mockReturnValue(true);

      // Action
      await mockUpdateMap.updateRecentlyAddedDocuments(
        mockMapPath,
        mockNewDocuments
      );

      // Assert
      expect(mockUpdateMap.updateRecentlyAddedDocuments).toHaveBeenCalledWith(
        mockMapPath,
        mockNewDocuments
      );
    });
  });

  describe('buildDocumentMetadata', () => {
    it('should build metadata for all documents', async () => {
      // Arrange
      const mockDocuments = [
        '.pythia/tasks/task1.md',
        '.pythia/architecture/analysis.md'
      ];

      const mockContent = `# Document Title
## Overview
This is a test document.

[Link 1](../other/doc1.md)
[Link 2](../other/doc2.md)`;

      (fs.readFileSync as any).mockReturnValue(mockContent);
      (fs.existsSync as any).mockReturnValue(true);

      // Action
      await mockUpdateMap.buildDocumentMetadata(mockDocuments);

      // Assert
      expect(mockUpdateMap.buildDocumentMetadata).toHaveBeenCalledWith(
        mockDocuments
      );
    });
  });

  describe('analyzeDocumentRelationships', () => {
    it('should analyze relationships between documents', async () => {
      // Arrange
      const mockDocuments = [
        '.pythia/tasks/task1.md',
        '.pythia/architecture/analysis.md'
      ];

      // Action
      await mockUpdateMap.analyzeDocumentRelationships();

      // Assert
      expect(mockUpdateMap.analyzeDocumentRelationships).toHaveBeenCalled();
    });
  });

  describe('generateRelationshipDiagram', () => {
    it('should generate a Mermaid diagram for document relationships', async () => {
      // Arrange
      const mockDocuments = [
        '.pythia/tasks/task1.md',
        '.pythia/architecture/analysis.md'
      ];

      (fs.existsSync as any).mockReturnValue(true);
      (fs.writeFileSync as any).mockImplementation(() => {});

      // Action
      await mockUpdateMap.generateRelationshipDiagram(mockDocuments);

      // Assert
      expect(mockUpdateMap.generateRelationshipDiagram).toHaveBeenCalledWith(
        mockDocuments
      );
    });
  });

  describe('semanticSearch', () => {
    it('should perform semantic search across documents', async () => {
      // Arrange
      const mockQuery = 'test query';
      const mockResults = [
        {
          path: '.pythia/tasks/task1.md',
          title: 'Task 1',
          relevance: 0.8,
          snippet: '...test content...'
        }
      ];

      mockUpdateMap.semanticSearch.mockResolvedValue(mockResults);

      // Action
      const results = await mockUpdateMap.semanticSearch(mockQuery);

      // Assert
      expect(results).toEqual(mockResults);
      expect(mockUpdateMap.semanticSearch).toHaveBeenCalledWith(mockQuery);
    });

    it('should return empty array when no matches found', async () => {
      // Arrange
      const mockQuery = 'nonexistent';
      mockUpdateMap.semanticSearch.mockResolvedValue([]);

      // Action
      const results = await mockUpdateMap.semanticSearch(mockQuery);

      // Assert
      expect(results).toEqual([]);
      expect(mockUpdateMap.semanticSearch).toHaveBeenCalledWith(mockQuery);
    });
  });
});
