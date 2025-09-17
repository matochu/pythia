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
import { fsMock, pathMock } from './__mocks__/setup';

// Мокуємо модулі правильно, кожен з default export
vi.mock('fs', () => fsMock);
vi.mock('path', () => pathMock);

// Мокуємо залежні модулі
vi.mock('../validators/statusValidator', () => ({
  __esModule: true,
  validateWorkItemStatus: vi.fn().mockReturnValue({ isValid: true })
}));

vi.mock('../registryUpdater', () => ({
  __esModule: true,
  updateActiveWorkItemsRegistry: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('../graphUpdater', () => ({
  __esModule: true,
  updateDependenciesGraph: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('../statusLogger', () => ({
  __esModule: true,
  logStatusChange: vi.fn().mockResolvedValue(undefined)
}));

// Імпорт модулів після мокування
import fs from 'fs';
import path from 'path';
import { updateWorkItemStatusCore } from '../updateWorkItemStatus';
import { validateWorkItemStatus } from '../validators/statusValidator';
import { updateActiveWorkItemsRegistry } from '../registryUpdater';
import { updateDependenciesGraph } from '../graphUpdater';
import { WorkItemStatus } from '../types/workItem';

describe('updateWorkItemStatus', () => {
  const mockWorkItem = {
    id: 'task-123',
    title: 'Test Task',
    type: 'task',
    status: 'Not Started',
    lastUpdated: '2023-01-01',
    createdAt: '2023-01-01'
  };

  const mockFileContent = `# Test Task
Type: task
Status: Not Started
Last Updated: 2023-01-01
Created: 2023-01-01
`;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.clearAllMocks();

    // Повторне налаштування моків для кожного тесту
    (fs.existsSync as any).mockReturnValue(true);
    (fs.readFileSync as any).mockReturnValue(mockFileContent);
    (validateWorkItemStatus as any).mockReturnValue({ isValid: true });
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
    const newStatus = 'In Progress' as WorkItemStatus;
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
    (validateWorkItemStatus as any).mockReturnValue({ isValid: true });
    const newStatus = 'In Progress' as WorkItemStatus;
    await updateWorkItemStatusCore(mockWorkItem.id, newStatus);

    expect(validateWorkItemStatus).toHaveBeenCalled();
    expect(updateActiveWorkItemsRegistry).toHaveBeenCalled();
    expect(updateDependenciesGraph).toHaveBeenCalled();
  });

  it('should fail on invalid status transition', async () => {
    (validateWorkItemStatus as any).mockReturnValue({
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
    (fs.existsSync as any).mockReturnValue(false);
    const newStatus = 'In Progress' as WorkItemStatus;

    await expect(
      updateWorkItemStatusCore(mockWorkItem.id, newStatus)
    ).rejects.toThrow('Work item not found');

    expect(updateActiveWorkItemsRegistry).not.toHaveBeenCalled();
    expect(updateDependenciesGraph).not.toHaveBeenCalled();
  });
});
