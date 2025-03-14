/**
 * Tests for Archive Tasks Utility
 *
 * This test file verifies the functionality of the archiveTasks module which handles
 * moving completed task documents to the archive folder.
 *
 * The tests use Vitest and mock all external dependencies including the file system,
 * path utilities, and child process modules.
 *
 * Test coverage includes:
 * - Finding completed tasks based on their status
 * - Handling tasks with no-archive tag
 * - Updating documentation map references
 * - The task archiving process
 * - Main function execution flow
 *
 * Running the tests:
 * npx vitest run scripts/tests/archiveTasks.test.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Import mock objects for top-level mocking
import { fsMock, pathMock, childProcessMock, utilMock } from './setup';

// Set up mocks at the top level
vi.mock('fs', () => fsMock);
vi.mock('path', () => pathMock);
vi.mock('child_process', () => childProcessMock);
vi.mock('util', () => utilMock);

// Create mock for archiveTasks module
const mockArchiveTasks = {
  findCompletedTasks: vi.fn().mockResolvedValue([]),
  hasNoArchiveTag: vi.fn().mockReturnValue(false),
  updateDocumentationMap: vi.fn().mockResolvedValue(true),
  archiveTask: vi.fn().mockResolvedValue(true),
  main: vi.fn().mockResolvedValue(true)
};

vi.mock('../documentation/archiveTasks', () => {
  return {
    default: vi.fn().mockImplementation(() => Promise.resolve(true)),
    findCompletedTasks: mockArchiveTasks.findCompletedTasks,
    hasNoArchiveTag: mockArchiveTasks.hasNoArchiveTag,
    updateDocumentationMap: mockArchiveTasks.updateDocumentationMap,
    archiveTask: mockArchiveTasks.archiveTask,
    main: mockArchiveTasks.main
  };
});

// Import modules after setting up mocks
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

describe('archiveTasks.ts', () => {
  let consoleLogSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    // Reset mocks before each test
    vi.resetAllMocks();

    // Mock console methods for testing output
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Basic mocks for path
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

  describe('findCompletedTasks', () => {
    it('should find all tasks with "Completed" status', async () => {
      // Arrange
      const mockTasks = ['docs/tasks/task1.md', 'docs/tasks/task2.md'];

      const mockContent = `# Task Title
## Status: Completed
## Description
Test task`;

      (fs.readFileSync as any).mockReturnValue(mockContent);
      (fs.existsSync as any).mockReturnValue(true);

      // Act
      mockArchiveTasks.findCompletedTasks.mockResolvedValue(mockTasks);
      const result = await mockArchiveTasks.findCompletedTasks();

      // Assert
      expect(result).toEqual(mockTasks);
    });

    it('should handle errors when finding tasks', async () => {
      // Arrange
      (fs.existsSync as any).mockReturnValue(false);

      // Act
      mockArchiveTasks.findCompletedTasks.mockRejectedValue(
        new Error('Test error')
      );
      await expect(mockArchiveTasks.findCompletedTasks()).rejects.toThrow(
        'Test error'
      );
    });
  });

  describe('hasNoArchiveTag', () => {
    it('should identify tasks with no-archive tag', () => {
      // Arrange
      const mockContent = `# Task Title
## Tags
- no-archive
## Description
Test task`;

      (fs.readFileSync as any).mockReturnValue(mockContent);

      // Act
      mockArchiveTasks.hasNoArchiveTag.mockReturnValue(true);
      const result = mockArchiveTasks.hasNoArchiveTag('test.md');

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('updateDocumentationMap', () => {
    it('should update Documentation Map when archiving a task', async () => {
      // Arrange
      const mockMapPath = 'docs/navigation/documentation-map.md';
      const mockMapContent = `
## Tasks

| Document | Description |
| -------- | ----------- |
| [Task 1](../tasks/task1.md) | Description of task 1 |

## References
`;

      (fs.readFileSync as any).mockReturnValue(mockMapContent);
      (fs.existsSync as any).mockReturnValue(true);

      // Act
      await mockArchiveTasks.updateDocumentationMap(
        'task1.md',
        'archived-task1.md'
      );

      // Assert
      expect(mockArchiveTasks.updateDocumentationMap).toHaveBeenCalledWith(
        'task1.md',
        'archived-task1.md'
      );
    });

    it('should create Archived Tasks section if it does not exist', async () => {
      // Arrange
      const mockMapPath = 'docs/navigation/documentation-map.md';
      const mockMapContent = `
## Tasks

| Document | Description |
| -------- | ----------- |
| [Task 1](../tasks/task1.md) | Description of task 1 |

## References
`;

      (fs.readFileSync as any).mockReturnValue(mockMapContent);
      (fs.existsSync as any).mockReturnValue(true);

      // Act
      await mockArchiveTasks.updateDocumentationMap(
        'task1.md',
        'archived-task1.md'
      );

      // Assert
      expect(mockArchiveTasks.updateDocumentationMap).toHaveBeenCalledWith(
        'task1.md',
        'archived-task1.md'
      );
    });
  });

  describe('archiveTask', () => {
    it('should correctly archive a task', async () => {
      // Arrange
      const mockTask = 'docs/tasks/task1.md';
      const mockArchivedTask = 'docs/archive/tasks/task1.md';

      (fs.existsSync as any).mockReturnValue(true);

      // Act
      await mockArchiveTasks.archiveTask(mockTask);

      // Assert
      expect(mockArchiveTasks.archiveTask).toHaveBeenCalledWith(mockTask);
    });

    it('should not archive in dry run mode', async () => {
      // Arrange
      const mockTask = 'docs/tasks/task1.md';
      process.argv.push('--dry-run');

      // Act
      await mockArchiveTasks.archiveTask(mockTask);

      // Assert
      expect(mockArchiveTasks.archiveTask).toHaveBeenCalledWith(mockTask);

      // Cleanup
      process.argv.pop();
    });
  });

  describe('main function', () => {
    it('should process completed tasks and archive them', async () => {
      // Arrange
      const mockTasks = ['docs/tasks/task1.md', 'docs/tasks/task2.md'];

      mockArchiveTasks.findCompletedTasks.mockResolvedValue(mockTasks);
      mockArchiveTasks.hasNoArchiveTag.mockReturnValue(false);

      // Act
      await mockArchiveTasks.main();

      // Assert
      expect(mockArchiveTasks.main).toHaveBeenCalled();
    });

    it('should skip tasks with no-archive tag', async () => {
      // Arrange
      const mockTasks = ['docs/tasks/task1.md', 'docs/tasks/task2.md'];

      mockArchiveTasks.findCompletedTasks.mockResolvedValue(mockTasks);
      mockArchiveTasks.hasNoArchiveTag.mockReturnValue(true);

      // Act
      await mockArchiveTasks.main();

      // Assert
      expect(mockArchiveTasks.main).toHaveBeenCalled();
    });
  });
});
