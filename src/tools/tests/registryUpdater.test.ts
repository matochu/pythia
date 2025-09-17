/**
 * Tests for Registry Updater Utility
 *
 * This test file verifies the functionality of the registryUpdater module which handles
 * updating the active work items registry when work item status changes.
 *
 * The tests use Vitest and mock all external dependencies to allow for isolated testing of
 * the registry updater functions. The mocks simulate file system operations for reading and
 * writing registry files.
 *
 * Test coverage includes:
 * - Updating existing work items in the registry
 * - Adding new work items to the registry
 * - Handling different status changes
 *
 * Running the tests:
 * npx vitest run scripts/tests/registryUpdater.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Import mock objects for top-level mocking
import { fsMock, pathMock } from './setup';

// Set up mocks at the top level
vi.mock('fs', () => fsMock);
vi.mock('path', () => pathMock);

// Import modules after setting up mocks
import fs from 'fs';
import { updateActiveWorkItemsRegistry } from '../registryUpdater';
import { createMockWorkItem } from './__mocks__';

describe('registryUpdater', () => {
  const mockContent = `# Active Work Items Registry

## Active Tasks
| ID | Title | Status | Priority | Owner | Last Updated |
|---|---|---|---|---|---|
| task-2025-03-test | Test Task | Not Started | High | John | 2025-03-13 |
`;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(fs.promises.readFile).mockResolvedValue(mockContent);
    vi.mocked(fs.promises.writeFile).mockResolvedValue(undefined);
  });

  it('should update registry with new status', async () => {
    const updatedItem = createMockWorkItem({
      status: 'In Progress'
    });

    await updateActiveWorkItemsRegistry(updatedItem);

    const writeCall = vi.mocked(fs.promises.writeFile).mock.calls[0];
    expect(writeCall).toBeDefined();
    expect(writeCall[1]).toContain('In Progress');
  });

  it('should handle new items', async () => {
    const newItem = createMockWorkItem({
      id: 'task-2025-03-new',
      title: 'New Task'
    });

    await updateActiveWorkItemsRegistry(newItem);

    const writeCall = vi.mocked(fs.promises.writeFile).mock.calls[0];
    expect(writeCall).toBeDefined();
    expect(writeCall[1]).toContain('task-2025-03-new');
  });
});
