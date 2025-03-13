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
export const createFsMock = () => {
  return {
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
      readFile: vi.fn(),
      writeFile: vi.fn(),
      mkdir: vi.fn(),
      readdir: vi.fn().mockResolvedValue([]),
      stat: vi.fn().mockResolvedValue({
        isFile: () => true,
        isDirectory: () => false
      })
    }
  };
};

/**
 * Factory for creating path mock
 */
export const createPathMock = () => {
  return {
    resolve: vi.fn((...paths: string[]) => paths.join('/')),
    join: vi.fn((...paths: string[]) => paths.join('/')),
    dirname: vi.fn((p: string) => p.split('/').slice(0, -1).join('/')),
    basename: vi.fn((p: string, ext?: string) => {
      const base = p.split('/').pop() || '';
      if (!ext) return base;
      return base.endsWith(ext) ? base.slice(0, -ext.length) : base;
    }),
    extname: vi.fn((p: string) => {
      const parts = p.split('.');
      return parts.length > 1 ? `.${parts.pop()}` : '';
    }),
    relative: vi.fn((from: string, to: string) => {
      return to.replace(from + '/', '../');
    }),
    sep: '/'
  };
};

/**
 * Factory for creating child_process mock
 */
export const createChildProcessMock = () => {
  return {
    exec: vi.fn((cmd: string, options: any, callback?: any) => {
      if (callback) {
        callback(null, { stdout: 'mocked stdout', stderr: '' });
      }
      return {} as any;
    }),
    default: {
      exec: vi.fn((cmd: string, options: any, callback?: any) => {
        if (callback) {
          callback(null, { stdout: 'mocked stdout', stderr: '' });
        }
        return {} as any;
      })
    }
  };
};

/**
 * Factory for creating glob mock
 */
export const createGlobMock = () => {
  return {
    glob: vi.fn().mockResolvedValue(['doc1.md', 'doc2.md']),
    default: {
      glob: vi.fn().mockResolvedValue(['doc1.md', 'doc2.md'])
    }
  };
};

/**
 * Factory for creating gray-matter mock
 */
export const createMatterMock = () => {
  return {
    default: vi.fn().mockReturnValue({
      data: { title: 'Mock Title' },
      content: 'Mock content'
    })
  };
};

/**
 * Factory for creating lunr mock
 */
export const createLunrMock = () => {
  return {
    default: vi.fn((builder: any) => {
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
    })
  };
};

/**
 * Factory for creating natural mock
 */
export const createNaturalMock = () => {
  return {
    PorterStemmer: {
      stem: vi.fn((word) => word)
    },
    WordTokenizer: vi.fn().mockImplementation(() => ({
      tokenize: vi.fn().mockReturnValue(['word1', 'word2', 'word3'])
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
};

/**
 * Factory for creating mdast-util-to-string mock
 */
export const createMdastUtilMock = () => {
  return {
    toString: vi.fn().mockReturnValue('Mock plain text')
  };
};

/**
 * Factory for creating unified mock
 */
export const createUnifiedMock = () => {
  return {
    unified: vi.fn().mockReturnValue({
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
    })
  };
};

/**
 * Factory for creating util mock
 */
export const createUtilMock = () => {
  return {
    promisify: vi.fn().mockImplementation((fn) => {
      return async (...args: any[]) => ({
        stdout: 'mocked stdout',
        stderr: ''
      });
    })
  };
};
