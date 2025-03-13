/**
 * Tests for Work Item Status Update Utility
 *
 * This test file verifies the functionality of the updateWorkItemStatus module which handles
 * updating the status of work items in the documentation system.
 *
 * The tests use Vitest and mock all external dependencies to allow for isolated testing of
 * the status update functions. The mocks simulate file system operations and validation.
 *
 * Test coverage includes:
 * - Status transitions validation
 * - Update of work item content
 * - Registry updates
 * - Dependency graph updates
 * - Error handling for invalid status changes
 *
 * Running the tests:
 * npx vitest run scripts/tests/updateWorkItemStatus.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Import mock objects for top-level mocking
import { fsMock, pathMock } from './vitest-docs-setup';

// Set up mocks at the top level
vi.mock('fs', () => fsMock);
vi.mock('path', () => pathMock);

// Mock dependent modules
vi.mock('../documentation/validators/statusValidator', () => ({
  validateWorkItemStatus: vi.fn()
}));

vi.mock('../documentation/registryUpdater', () => ({
  updateActiveWorkItemsRegistry: vi.fn()
}));

vi.mock('../documentation/graphUpdater', () => ({
  updateDependenciesGraph: vi.fn()
}));

vi.mock('../documentation/statusLogger', () => ({
  logStatusChange: vi.fn()
}));

// Import modules after setting up mocks
import fs from 'fs';
import { updateWorkItemStatusCore } from '../updateWorkItemStatus';
import { validateWorkItemStatus } from '../validators/statusValidator';
import { updateActiveWorkItemsRegistry } from '../registryUpdater';
import { updateDependenciesGraph } from '../graphUpdater';
import { WorkItemStatus } from '../types/workItem';
import { logStatusChange } from '../statusLogger';
import { createMockWorkItem, createMockWorkItemContent } from './__mocks__';

describe('updateWorkItemStatus', () => {
  const mockWorkItem = createMockWorkItem();

  beforeEach(() => {
    vi.resetAllMocks();

    // Setup mocks for fs module
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(
      createMockWorkItemContent(mockWorkItem)
    );
    vi.mocked(fs.promises.readFile).mockResolvedValue('{}');
    vi.mocked(fs.promises.writeFile).mockResolvedValue(undefined);
    vi.mocked(fs.promises.mkdir).mockResolvedValue(undefined);

    // Setup mocks for document functions
    vi.mocked(validateWorkItemStatus).mockReturnValue({ isValid: true });
    vi.mocked(updateActiveWorkItemsRegistry).mockResolvedValue(undefined);
    vi.mocked(updateDependenciesGraph).mockResolvedValue(undefined);
    vi.mocked(logStatusChange).mockResolvedValue(undefined);
  });

  it('should update work item status', async () => {
    const newStatus = 'In Progress' as WorkItemStatus;
    await updateWorkItemStatusCore(mockWorkItem.id, newStatus);

    expect(validateWorkItemStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        id: mockWorkItem.id,
        title: mockWorkItem.title,
        type: mockWorkItem.type,
        status: mockWorkItem.status
      }),
      newStatus,
      undefined
    );
    expect(updateActiveWorkItemsRegistry).toHaveBeenCalled();
    expect(updateDependenciesGraph).toHaveBeenCalled();
  });

  it('should handle status update with reason', async () => {
    const newStatus = 'Blocked' as WorkItemStatus;
    const reason = 'Waiting for dependency';
    await updateWorkItemStatusCore(mockWorkItem.id, newStatus, reason);

    expect(validateWorkItemStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        id: mockWorkItem.id,
        title: mockWorkItem.title,
        type: mockWorkItem.type,
        status: mockWorkItem.status
      }),
      newStatus,
      reason
    );
    expect(updateActiveWorkItemsRegistry).toHaveBeenCalled();
    expect(updateDependenciesGraph).toHaveBeenCalled();
  });

  it('should validate work item status transitions', async () => {
    vi.mocked(validateWorkItemStatus).mockReturnValue({ isValid: true });
    const newStatus = 'In Progress' as WorkItemStatus;
    await updateWorkItemStatusCore(mockWorkItem.id, newStatus);

    expect(validateWorkItemStatus).toHaveBeenCalled();
    expect(updateActiveWorkItemsRegistry).toHaveBeenCalled();
    expect(updateDependenciesGraph).toHaveBeenCalled();
  });

  it('should fail on invalid status transition', async () => {
    vi.mocked(validateWorkItemStatus).mockReturnValue({
      isValid: false,
      error: 'Invalid transition'
    });
    const newStatus = 'In Progress' as WorkItemStatus;

    await expect(
      updateWorkItemStatusCore(mockWorkItem.id, newStatus)
    ).rejects.toThrow('Invalid transition');

    expect(updateActiveWorkItemsRegistry).not.toHaveBeenCalled();
    expect(updateDependenciesGraph).not.toHaveBeenCalled();
  });

  it('should fail when work item does not exist', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const newStatus = 'In Progress' as WorkItemStatus;

    await expect(
      updateWorkItemStatusCore(mockWorkItem.id, newStatus)
    ).rejects.toThrow('Work item not found');

    expect(updateActiveWorkItemsRegistry).not.toHaveBeenCalled();
    expect(updateDependenciesGraph).not.toHaveBeenCalled();
  });
});
