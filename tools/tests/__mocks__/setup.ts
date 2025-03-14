/**
 * Functions for creating common mocks for test files.
 *
 * This file contains functions that return mocks for various modules used in tests.
 * They are designed to be used in vi.mock() at the top level of test files.
 *
 * Example usage:
 * ```
 * // At the top of the test file
 * import { createFsMock, createPathMock } from './__mocks__/setup';
 *
 * vi.mock('fs', createFsMock);
 * vi.mock('path', createPathMock);
 * ```
 */

import { vi } from 'vitest';

/**
 * Factory for creating fs mock
 */
export function createFsMock() {
  const promises = {
    readFile: vi.fn().mockResolvedValue('Mock content'),
    writeFile: vi.fn().mockResolvedValue(undefined),
    mkdir: vi.fn().mockResolvedValue(undefined),
    readdir: vi.fn().mockResolvedValue(['doc1.md', 'doc2.md']),
    stat: vi.fn().mockResolvedValue({
      isFile: () => true,
      isDirectory: () => false,
      mtime: new Date(),
      birthtime: new Date()
    })
  };

  const fsModule = {
    existsSync: vi.fn().mockReturnValue(true),
    readFileSync: vi.fn().mockReturnValue('Mock content'),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
    renameSync: vi.fn(),
    statSync: vi.fn().mockReturnValue({
      isFile: () => true,
      isDirectory: () => false,
      mtime: new Date(),
      birthtime: new Date()
    }),
    promises
  };

  return {
    __esModule: true,
    ...fsModule,
    default: fsModule
  };
}

/**
 * Factory for creating path mock
 */
export function createPathMock() {
  const pathFns = {
    resolve: vi.fn((...args) => args.join('/')),
    join: vi.fn((...args) => args.join('/')),
    dirname: vi.fn((p) => p.split('/').slice(0, -1).join('/')),
    basename: vi.fn((p, ext) => {
      const base = p.split('/').pop() || '';
      if (!ext) return base;
      return base.endsWith(ext) ? base.slice(0, -ext.length) : base;
    }),
    extname: vi.fn((p) => {
      const parts = p.split('.');
      return parts.length > 1 ? `.${parts.pop() || ''}` : '';
    }),
    relative: vi.fn((from, to) => {
      return to.replace(from + '/', '../');
    }),
    sep: '/'
  };

  return {
    __esModule: true,
    ...pathFns,
    default: pathFns
  };
}

/**
 * Factory for creating child_process mock
 */
export function createChildProcessMock() {
  const execFn = vi.fn((cmd, options, callback) => {
    if (callback) {
      callback(null, { stdout: 'mocked stdout', stderr: '' });
    }
    return {};
  });

  return {
    __esModule: true,
    exec: execFn,
    default: {
      exec: execFn
    }
  };
}

/**
 * Factory for creating glob mock
 */
export function createGlobMock() {
  const globFn = vi.fn().mockResolvedValue(['doc1.md', 'doc2.md']);

  return {
    __esModule: true,
    glob: globFn,
    globSync: vi.fn().mockReturnValue(['doc1.md', 'doc2.md']),
    default: {
      glob: globFn,
      globSync: vi.fn().mockReturnValue(['doc1.md', 'doc2.md'])
    }
  };
}

/**
 * Factory for creating gray-matter mock
 */
export function createMatterMock() {
  const matterFn = vi.fn().mockReturnValue({
    data: { title: 'Test Document' },
    content: 'Mock content',
    orig: 'Original content',
    language: 'markdown',
    matter: 'frontmatter content',
    excerpt: '',
    isEmpty: false,
    stringify: () => 'stringified content'
  });

  return {
    __esModule: true,
    default: matterFn
  };
}

/**
 * Factory for creating lunr mock
 */
export function createLunrMock() {
  const lunrFn = vi.fn((builder) => {
    builder && builder();
    return {
      search: vi.fn().mockReturnValue([
        {
          ref: 'doc1.md',
          score: 0.8,
          matchData: {
            metadata: {
              term1: {
                plainText: {
                  position: [
                    [0, 10],
                    [20, 30]
                  ]
                }
              }
            }
          }
        }
      ]),
      Index: {
        load: vi.fn()
      }
    };
  });

  return {
    __esModule: true,
    default: lunrFn
  };
}

/**
 * Factory for creating natural mock
 */
export function createNaturalMock() {
  const naturalModule = {
    PorterStemmer: {
      stem: vi.fn((word) => word)
    },
    WordTokenizer: vi.fn().mockImplementation(() => ({
      tokenize: vi.fn().mockReturnValue(['word1', 'word2', 'word3', 'word4'])
    })),
    TfIdf: vi.fn().mockImplementation(() => ({
      addDocument: vi.fn(),
      listTerms: vi.fn().mockReturnValue([
        { term: 'term1', tfidf: 0.5 },
        { term: 'term2', tfidf: 0.3 }
      ]),
      tfidf: vi.fn().mockReturnValue(0.5)
    })),
    SentimentAnalyzer: vi.fn().mockImplementation(() => ({
      getSentiment: vi.fn().mockReturnValue(0.2)
    }))
  };

  return {
    __esModule: true,
    ...naturalModule,
    default: naturalModule
  };
}

/**
 * Factory for creating mdast-util-to-string mock
 */
export function createMdastUtilMock() {
  const toStringFn = vi.fn().mockReturnValue('Mock plain text');

  return {
    __esModule: true,
    toString: toStringFn,
    default: toStringFn
  };
}

/**
 * Factory for creating unified mock
 */
export function createUnifiedMock() {
  const unifiedFn = vi.fn().mockReturnValue({
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
  });

  return {
    __esModule: true,
    unified: unifiedFn,
    default: {
      unified: unifiedFn
    }
  };
}

/**
 * Factory for creating util mock
 */
export function createUtilMock() {
  const promisifyFn = vi.fn((fn) => {
    return async (...args: any[]) => ({
      stdout: 'mocked stdout',
      stderr: ''
    });
  });

  return {
    __esModule: true,
    promisify: promisifyFn,
    default: {
      promisify: promisifyFn
    }
  };
}

// Pre-created mock instances for direct importing in test files
export const fsMock = createFsMock();
export const pathMock = createPathMock();
export const childProcessMock = createChildProcessMock();
export const globMock = createGlobMock();
export const matterMock = createMatterMock();
export const lunrMock = createLunrMock();
export const naturalMock = createNaturalMock();
export const mdastUtilMock = createMdastUtilMock();
export const unifiedMock = createUnifiedMock();
export const utilMock = createUtilMock();
