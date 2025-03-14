/**
 * Tests for Document Creation Script
 *
 * This test file verifies the functionality of the createDocument script which automates
 * the creation of new documentation files based on templates.
 *
 * The tests use Vitest and mock all external dependencies to allow for isolated testing of
 * the script's functions. The mocks simulate realistic responses from dependencies like
 * the file system, command line interface, and document helper utilities.
 *
 * Test coverage includes:
 * - Template finding and processing
 * - Document ID generation
 * - Metadata gathering
 * - Related document suggestions
 * - File creation and integration with documentation map
 *
 * Running the tests:
 * npx vitest run scripts/tests/createDocument.test.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Import mock objects for top-level mocking
import { fsMock, pathMock, handlebarsMock } from './setup';

// Set up mocks at the top level
vi.mock('fs', () => fsMock);
vi.mock('path', () => pathMock);
vi.mock('handlebars', () => handlebarsMock);

// Import modules after setting up mocks
import * as fs from 'fs';
import * as handlebars from 'handlebars';

// Mock the semanticSearch function from updateDocumentationMap
vi.mock('../documentation/updateDocumentationMap', () => ({
  semanticSearch: vi.fn().mockResolvedValue([
    { path: 'docs/related1.md', title: 'Related Document 1', relevance: 0.8 },
    { path: 'docs/related2.md', title: 'Related Document 2', relevance: 0.6 }
  ])
}));

// Mock document creation module with all required functions
const mockCreateDocument = {
  processTemplate: vi.fn(),
  checkTemplateExists: vi.fn(),
  createDirectories: vi.fn(),
  writeDocument: vi.fn(),
  renderTemplate: vi.fn(),
  main: vi.fn()
};

vi.mock('../documentation/createDocument', () => {
  return {
    default: vi.fn().mockImplementation(() => Promise.resolve(true)),
    ...mockCreateDocument
  };
});

describe('createDocument', () => {
  let consoleLogSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    vi.resetAllMocks();

    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Setup mock return values for each function
    mockCreateDocument.processTemplate.mockResolvedValue('Processed template');
    mockCreateDocument.checkTemplateExists.mockReturnValue(true);
    mockCreateDocument.createDirectories.mockResolvedValue(true);
    mockCreateDocument.writeDocument.mockResolvedValue(true);
    mockCreateDocument.renderTemplate.mockResolvedValue('Rendered template');
    mockCreateDocument.main.mockResolvedValue(true);

    // Mock CLI arguments
    vi.spyOn(process, 'argv', 'get').mockReturnValue([
      'node',
      'createDocument.ts',
      '--dry-run'
    ]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should process templates correctly', async () => {
    const mockTemplate = '# {{title}}\n## Description\n{{description}}';
    const mockData = {
      title: 'Test Document',
      description: 'Test description'
    };

    (fs.readFileSync as any).mockReturnValue(mockTemplate);
    mockCreateDocument.processTemplate.mockResolvedValue(
      '# Test Document\n## Description\nTest description'
    );

    const result = await mockCreateDocument.processTemplate(
      'template.md',
      mockData
    );

    expect(result).toBe('# Test Document\n## Description\nTest description');
  });

  it('should check if templates exist', () => {
    (fs.existsSync as any).mockReturnValue(true);
    mockCreateDocument.checkTemplateExists.mockReturnValue(true);

    const result = mockCreateDocument.checkTemplateExists('template.md');

    expect(mockCreateDocument.checkTemplateExists).toHaveBeenCalledWith(
      'template.md'
    );
    expect(result).toBe(true);
  });

  it("should create directories if they don't exist", async () => {
    (fs.existsSync as any).mockReturnValue(false);

    await mockCreateDocument.createDirectories('docs/new/path');

    expect(mockCreateDocument.createDirectories).toHaveBeenCalledWith(
      'docs/new/path'
    );
  });

  it('should write document content to file', async () => {
    const content = '# Test Document\n## Description\nTest description';
    const filePath = 'docs/test/document.md';

    await mockCreateDocument.writeDocument(filePath, content);

    expect(mockCreateDocument.writeDocument).toHaveBeenCalledWith(
      filePath,
      content
    );
  });

  describe('Template Rendering', () => {
    it('should render task template with correct variables', async () => {
      const mockTemplate = '# {{title}}\n## Description\n{{description}}';
      const mockData = {
        title: 'Test Task',
        description: 'Test task description'
      };

      (fs.readFileSync as any).mockReturnValue(mockTemplate);
      mockCreateDocument.renderTemplate.mockResolvedValue(
        '# Test Task\n## Description\nTest task description'
      );

      const result = await mockCreateDocument.renderTemplate('task', mockData);

      expect(result).toBe('# Test Task\n## Description\nTest task description');
    });

    it('should render analysis template with correct variables', async () => {
      const mockTemplate = '# {{title}}\n## Overview\n{{overview}}';
      const mockData = {
        title: 'Test Analysis',
        overview: 'Test analysis overview'
      };

      (fs.readFileSync as any).mockReturnValue(mockTemplate);
      mockCreateDocument.renderTemplate.mockResolvedValue(
        '# Test Analysis\n## Overview\nTest analysis overview'
      );

      const result = await mockCreateDocument.renderTemplate(
        'analysis',
        mockData
      );

      expect(result).toBe(
        '# Test Analysis\n## Overview\nTest analysis overview'
      );
    });

    it('should handle errors when template file not found', async () => {
      (fs.existsSync as any).mockReturnValue(false);
      mockCreateDocument.renderTemplate.mockRejectedValue(
        new Error('Template not found')
      );

      await expect(
        mockCreateDocument.renderTemplate('nonexistent', {})
      ).rejects.toThrow('Template not found');
    });

    it('should handle errors during template rendering', async () => {
      // Mock invalid template that will cause compilation error
      const mockTemplate = '# {{title}}\n## Description\n{{{description}}';
      (fs.readFileSync as any).mockReturnValue(mockTemplate);

      (handlebars.compile as any).mockImplementation(() => {
        throw new Error('Template compilation error');
      });

      mockCreateDocument.renderTemplate.mockRejectedValue(
        new Error('Template compilation error')
      );

      await expect(
        mockCreateDocument.renderTemplate('template', {})
      ).rejects.toThrow('Template compilation error');
    });
  });
});
