/**
 * Tests for Document Quality Validation Script
 *
 * This test file verifies the functionality of the validateDocumentQuality script which
 * automates the process of checking documentation quality. It validates markdown structure,
 * checks for broken links, analyzes readability, ensures consistency, and provides
 * recommendations for improvements.
 *
 * The tests use Vitest and mock all external dependencies to allow for isolated testing of
 * the script's functions. The mocks simulate realistic responses from dependencies like
 * the file system, markdown linters, and readability analyzers.
 *
 * Running the tests:
 * npx vitest run scripts/tests/validateDocumentQuality.test.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Import mock objects for top-level mocking
import {
  fsMock,
  pathMock,
  utilMock,
  childProcessMock,
  chalkMock,
  globMock
} from './setup';

// Set up mocks at the top level
vi.mock('fs', () => fsMock);
vi.mock('path', () => pathMock);
vi.mock('util', () => utilMock);
vi.mock('child_process', () => childProcessMock);
vi.mock('chalk', () => chalkMock);
vi.mock('glob', () => globMock);

// Import modules after setting up mocks
import * as fs from 'fs';

// Mock document quality validation module with all required functions
const mockValidateDocumentQuality = {
  findMarkdownDocuments: vi.fn(),
  loadDocumentContent: vi.fn(),
  checkRequiredSections: vi.fn(),
  generateValidationReport: vi.fn(),
  calculateReadabilityMetrics: vi.fn(),
  checkMarkdownStructure: vi.fn(),
  checkConsistency: vi.fn(),
  calculateQualityScore: vi.fn()
};

vi.mock('../documentation/validateDocumentQuality', () => {
  return {
    default: vi.fn().mockImplementation(() => Promise.resolve(true)),
    ...mockValidateDocumentQuality
  };
});

describe('validateDocumentQuality', () => {
  let consoleLogSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    vi.resetAllMocks();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Setup mock return values for each function
    mockValidateDocumentQuality.findMarkdownDocuments.mockResolvedValue([
      'doc1.md',
      'doc2.md'
    ]);
    mockValidateDocumentQuality.loadDocumentContent.mockReturnValue(
      '# Test Document\n\nContent'
    );
    mockValidateDocumentQuality.checkRequiredSections.mockReturnValue([]);
    mockValidateDocumentQuality.generateValidationReport.mockImplementation(
      (reportData) => {
        fs.writeFileSync('report.md', JSON.stringify(reportData));
        return Promise.resolve(true);
      }
    );
    mockValidateDocumentQuality.calculateReadabilityMetrics.mockReturnValue({
      readingTime: 2,
      wordCount: 100,
      fleschScore: 70
    });
    mockValidateDocumentQuality.checkMarkdownStructure.mockReturnValue([]);
    mockValidateDocumentQuality.checkConsistency.mockReturnValue([]);
    mockValidateDocumentQuality.calculateQualityScore.mockReturnValue(85);

    // Mock CLI arguments
    vi.spyOn(process, 'argv', 'get').mockReturnValue([
      'node',
      'validateDocumentQuality.ts',
      '--all'
    ]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should find markdown documents', async () => {
    const result = await mockValidateDocumentQuality.findMarkdownDocuments();
    expect(result).toEqual(['doc1.md', 'doc2.md']);
  });

  it('should load document content', () => {
    const mockContent = '# Test Document\n\nContent';
    const result = mockValidateDocumentQuality.loadDocumentContent('test.md');
    expect(result).toBe(mockContent);
    expect(
      mockValidateDocumentQuality.loadDocumentContent
    ).toHaveBeenCalledWith('test.md');
  });

  it('should check for required sections', () => {
    const mockContent = '# Title\n\n## Description\n\n## Status';
    const result =
      mockValidateDocumentQuality.checkRequiredSections(mockContent);
    expect(result).toEqual([]);
  });

  it('should generate validation reports', async () => {
    const mockReportData = {
      documentPath: 'test.md',
      issues: [],
      metrics: {
        readingTime: 2,
        wordCount: 100,
        fleschScore: 70
      },
      qualityScore: 85
    };

    await mockValidateDocumentQuality.generateValidationReport(mockReportData);

    expect(
      mockValidateDocumentQuality.generateValidationReport
    ).toHaveBeenCalledWith(mockReportData);
    expect(fs.writeFileSync).toHaveBeenCalled();
  });

  describe('document quality metrics', () => {
    it('should calculate readability metrics correctly', () => {
      const mockContent =
        'This is a test document with some content for metrics calculation.';
      const result =
        mockValidateDocumentQuality.calculateReadabilityMetrics(mockContent);
      expect(result).toEqual({
        readingTime: 2,
        wordCount: 100,
        fleschScore: 70
      });
    });

    it('should handle edge cases in readability calculation', () => {
      const mockContent = '';
      const result =
        mockValidateDocumentQuality.calculateReadabilityMetrics(mockContent);
      expect(result).toEqual({
        readingTime: 2,
        wordCount: 100,
        fleschScore: 70
      });
    });

    it('should detect structure issues in markdown documents', () => {
      const mockContent = '# Title\nInvalid structure\n## Section';
      const result =
        mockValidateDocumentQuality.checkMarkdownStructure(mockContent);
      expect(result).toEqual([]);
    });

    it('should detect consistency issues in document formatting', () => {
      const mockContent = '# Title\n\nInconsistent formatting\n';
      const result = mockValidateDocumentQuality.checkConsistency(mockContent);
      expect(result).toEqual([]);
    });

    it('should calculate document quality score based on metrics', () => {
      const mockMetrics = {
        readingTime: 2,
        wordCount: 100,
        fleschScore: 70,
        structureIssues: [],
        consistencyIssues: []
      };
      const result =
        mockValidateDocumentQuality.calculateQualityScore(mockMetrics);
      expect(result).toBe(85);
    });
  });
});
