/**
 * Global setup for documentation tests
 *
 * This file provides ready-to-use mock objects and configurations for documentation script tests.
 * Since vi.mock() must be used at the top level, this file provides mock objects that can be
 * imported and used in individual vi.mock() calls within test files.
 *
 * Example usage:
 *
 * ```ts
 * // First import mock objects
 * import { fsMock, pathMock } from './vitest-docs-setup';
 *
 * // Then use them at the top level
 * vi.mock('fs', () => fsMock);
 * vi.mock('path', () => pathMock);
 *
 * // Later in the file
 * setupDocTestEnv();
 * ```
 */

import { vi, beforeEach } from 'vitest';

// Export mock objects created by the factory functions
import {
  createFsMock,
  createPathMock,
  createChildProcessMock,
  createGlobMock,
  createMatterMock,
  createLunrMock,
  createNaturalMock,
  createMdastUtilMock,
  createUnifiedMock,
  createUtilMock
} from './__mocks__/setup';

// Import and re-export for convenience
import { createMockDocument } from './__mocks__/documentHelperMocks';
export { createMockDocument };

// Create and export ready-to-use mock objects
export const fsMock = {
  existsSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  renameSync: vi.fn(),
  statSync: vi.fn().mockReturnValue({
    isFile: () => true,
    isDirectory: () => false,
    mtime: new Date(),
    birthtime: new Date()
  }),
  promises: {
    readdir: vi.fn().mockResolvedValue([]),
    readFile: vi.fn().mockResolvedValue(''),
    writeFile: vi.fn().mockResolvedValue(undefined),
    mkdir: vi.fn().mockResolvedValue(undefined),
    stat: vi.fn().mockResolvedValue({
      isFile: () => true,
      isDirectory: () => false,
      mtime: new Date(),
      birthtime: new Date()
    })
  },
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
    renameSync: vi.fn(),
    statSync: vi.fn().mockReturnValue({
      isFile: () => true,
      isDirectory: () => false,
      mtime: new Date(),
      birthtime: new Date()
    }),
    promises: {
      readdir: vi.fn().mockResolvedValue([]),
      readFile: vi.fn().mockResolvedValue(''),
      writeFile: vi.fn().mockResolvedValue(undefined),
      mkdir: vi.fn().mockResolvedValue(undefined),
      stat: vi.fn().mockResolvedValue({
        isFile: () => true,
        isDirectory: () => false,
        mtime: new Date(),
        birthtime: new Date()
      })
    }
  }
};

export const pathMock = {
  join: vi.fn((...parts) => parts.join('/')),
  basename: vi.fn((p) => p.split('/').pop()),
  dirname: vi.fn(),
  extname: vi.fn((p) => {
    const parts = p.split('.');
    return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
  }),
  relative: vi.fn((from, to) => to.replace(from, '').replace(/^\//, '../')),
  resolve: vi.fn(),
  sep: '/',
  default: {
    join: vi.fn((...parts) => parts.join('/')),
    basename: vi.fn((p) => p.split('/').pop()),
    dirname: vi.fn(),
    extname: vi.fn((p) => {
      const parts = p.split('.');
      return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
    }),
    relative: vi.fn((from, to) => to.replace(from, '').replace(/^\//, '../')),
    resolve: vi.fn(),
    sep: '/'
  }
};

export const childProcessMock = {
  exec: vi.fn((cmd, callback) => callback(null, { stdout: '' })),
  default: {
    exec: vi.fn((cmd, callback) => callback(null, { stdout: '' }))
  }
};

export const globMock = createGlobMock();
export const matterMock = Object.assign(
  (content: string) => ({
    data: { title: 'Mock Title' },
    content: 'Mock content'
  }),
  {
    default: (content: string) => ({
      data: { title: 'Mock Title' },
      content: 'Mock content'
    })
  }
);
export const lunrMock = createLunrMock();
export const naturalMock = createNaturalMock();
export const mdastUtilMock = createMdastUtilMock();
export const unifiedMock = createUnifiedMock();
export const utilMock = {
  promisify: vi.fn().mockReturnValue(() => Promise.resolve({ stdout: '' }))
};

// Add chalk mock
export const chalkMock = {
  default: {
    green: (text: string) => text,
    red: (text: string) => text,
    yellow: (text: string) => text,
    blue: (text: string) => text,
    gray: (text: string) => text
  }
};

// Ready-to-use mock objects for direct assignment
export const commanderMock = {
  program: {
    command: vi.fn().mockReturnThis(),
    description: vi.fn().mockReturnThis(),
    option: vi.fn().mockReturnThis(),
    action: vi.fn().mockReturnThis(),
    parse: vi.fn()
  }
};

export const handlebarsMock = {
  compile: vi.fn().mockReturnValue((data: any) => 'Compiled template'),
  registerHelper: vi.fn()
};

/**
 * Setup common test environment for documentation tests
 * Sets up common beforeEach hooks and other test environment settings
 */
export function setupDocTestEnv() {
  // Global beforeEach for all tests
  beforeEach(() => {
    vi.resetAllMocks();

    // Setup common mock configurations
    vi.mocked(fsMock.existsSync).mockReturnValue(true);
    vi.mocked(fsMock.readFileSync).mockReturnValue('Mock content');
    vi.mocked(fsMock.statSync).mockReturnValue({
      birthtime: new Date(2025, 2, 1),
      mtime: new Date(2025, 2, 10),
      isDirectory: () => false,
      isFile: () => true
    });

    // Other common setups can be added here
  });
}

// Export all factory functions for flexible configuration
export * from './__mocks__/setup';
