import { vi } from 'vitest';
import { Document } from '../../documentHelper';

// Mock for glob module
export const mockGlob = {
  glob: vi.fn().mockResolvedValue(['doc1.md', 'doc2.md'])
};

// Mock for commander
export const mockCommander = {
  program: {
    command: vi.fn().mockReturnThis(),
    description: vi.fn().mockReturnThis(),
    option: vi.fn().mockReturnThis(),
    action: vi.fn().mockReturnThis(),
    parse: vi.fn()
  }
};

// Mock for gray-matter
export const mockMatter = {
  default: vi.fn().mockReturnValue({
    data: { title: 'Mock Title' },
    content: 'Mock content'
  })
};

// Mock for lunr
export const mockLunr = {
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

// Mock for natural
export const mockNatural = {
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

// Mock for handlebars
export const mockHandlebars = {
  compile: vi.fn().mockReturnValue((data: any) => 'Compiled template'),
  registerHelper: vi.fn()
};

// Mock for mdast-util-to-string
export const mockMdastUtil = {
  toString: vi.fn().mockReturnValue('Mock plain text')
};

// Mock for unified
export const mockUnified = {
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

// Create a mock Document for testing
export const createMockDocument = (
  customProps: Partial<Document> = {}
): Document => {
  return {
    path: 'docs/test-doc.md',
    relativePath: 'test-doc.md',
    content: 'Test content',
    rawContent: 'Test content with frontmatter',
    frontmatter: { title: 'Test Document' },
    title: 'Test Document',
    type: 'test',
    ast: { type: 'root', children: [] },
    plainText: 'Test content plain text',
    sections: [
      {
        title: 'Section 1',
        level: 2,
        content: 'Section 1 content',
        plainText: 'Section 1 content plain',
        position: {
          start: { line: 5, column: 1, offset: 50 },
          end: { line: 10, column: 1, offset: 100 }
        }
      }
    ],
    tokens: ['test', 'content', 'plain', 'text'],
    links: [
      {
        text: 'Link text',
        url: '../another-doc.md',
        position: {
          start: { line: 7, column: 1, offset: 70 },
          end: { line: 7, column: 20, offset: 89 }
        },
        type: 'internal',
        targetDocument: '../another-doc.md'
      }
    ],
    ...customProps
  };
};

// Setup all document helper mocks
export const setupDocumentHelperMocks = () => {
  vi.mock('glob', () => mockGlob);
  vi.mock('commander', () => mockCommander);
  vi.mock('gray-matter', () => mockMatter);
  vi.mock('lunr', () => mockLunr);
  vi.mock('natural', () => mockNatural);
  vi.mock('handlebars', () => mockHandlebars);
  vi.mock('mdast-util-to-string', () => mockMdastUtil);
  vi.mock('unified', () => mockUnified);
};

// Mock workItem for testing
export const createMockWorkItem = (customProps: any = {}) => {
  return {
    id: 'task-2025-03-test',
    title: 'Test Task',
    type: 'task',
    status: 'Not Started',
    priority: 'High',
    owner: 'John',
    lastUpdated: '2025-03-13',
    createdDate: '2025-03-10',
    ...customProps
  };
};

// Mock workItem content for testing
export const createMockWorkItemContent = (
  workItem: any = createMockWorkItem()
) => {
  return `---
id: ${workItem.id}
title: ${workItem.title}
type: ${workItem.type}
status: ${workItem.status}
priority: ${workItem.priority}
owner: ${workItem.owner}
createdDate: ${workItem.createdDate}
lastUpdated: ${workItem.lastUpdated}
---

# ${workItem.title}

This is a test task.

## Status: ${workItem.status}

## Priority: ${workItem.priority}

## Owner: ${workItem.owner}
`;
};
