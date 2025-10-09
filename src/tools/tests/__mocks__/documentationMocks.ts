import { vi } from 'vitest';
import { WorkItem, WorkItemStatus } from '../../types/workItem';

// Mock for validation functions
export const mockValidateWorkItemStatus = vi.fn();

// Setup validator mocks
export const setupValidatorMocks = () => {
  mockValidateWorkItemStatus.mockReturnValue({ isValid: true });
};

// Mock for registry updater
export const mockUpdateActiveWorkItemsRegistry = vi.fn();

// Mock for graph updater
export const mockUpdateDependenciesGraph = vi.fn();

// Mock for status logger
export const mockLogStatusChange = vi.fn();

// Setup documentation mocks
export const setupDocumentationMocks = () => {
  mockUpdateActiveWorkItemsRegistry.mockResolvedValue(undefined);
  mockUpdateDependenciesGraph.mockResolvedValue(undefined);
  mockLogStatusChange.mockResolvedValue(undefined);
};

// Create a mock work item for testing
export const createMockWorkItem = (
  customProps: Partial<WorkItem> = {}
): WorkItem => {
  return {
    id: 'task-2025-03-test',
    title: 'Test Task',
    type: 'task',
    status: 'Not Started' as WorkItemStatus,
    priority: 'High',
    owner: 'John',
    lastUpdated: '2025-03-13',
    createdAt: '2025-03-13',
    ...customProps
  };
};

// Setup mock content for a work item file
export const createMockWorkItemContent = (workItem: WorkItem): string => {
  return `# ${workItem.title}
      
Type: ${workItem.type}
Status: ${workItem.status}
Last Updated: ${workItem.lastUpdated}
Created: ${workItem.createdAt}`;
};

// Mock for document quality validation
export const mockValidateDocumentQuality = {
  findMarkdownDocuments: vi.fn().mockResolvedValue(['doc1.md', 'doc2.md']),
  loadDocumentContent: vi.fn().mockReturnValue('# Test Document\n\nContent'),
  checkRequiredSections: vi.fn().mockReturnValue([]),
  generateValidationReport: vi.fn().mockResolvedValue(true),
  calculateReadabilityMetrics: vi.fn().mockReturnValue({
    readingTime: 2,
    wordCount: 100,
    fleschScore: 70
  }),
  checkMarkdownStructure: vi.fn().mockReturnValue([]),
  checkConsistency: vi.fn().mockReturnValue([]),
  calculateQualityScore: vi.fn().mockReturnValue(85)
};

// Mock for link validator
export const mockLinkValidator = {
  findLinks: vi.fn().mockResolvedValue([]),
  validateLinks: vi.fn().mockResolvedValue({
    brokenLinks: [],
    missingReciprocal: [],
    documents: {}
  }),
  fixMissingReciprocalLinks: vi.fn().mockResolvedValue(true)
};

// Mock for document helper
export const mockDocumentHelper = {
  findDocuments: vi.fn().mockResolvedValue(['doc1.md', 'doc2.md']),
  loadDocument: vi.fn().mockResolvedValue({
    path: '.pythia/test-doc.md',
    title: 'Test Document',
    content: 'Test content'
  }),
  analyzeContent: vi.fn().mockResolvedValue({
    documentTitle: 'Test Document',
    wordCount: 100,
    readingTimeMinutes: 0.5,
    sentiment: 0.2,
    topTerms: ['term1', 'term2']
  })
};

// Mock for archive tasks
export const mockArchiveTasks = {
  findCompletedTasks: vi.fn().mockResolvedValue([]),
  hasNoArchiveTag: vi.fn().mockReturnValue(false),
  updateDocumentationMap: vi.fn().mockResolvedValue(true),
  archiveTask: vi.fn().mockResolvedValue(true),
  main: vi.fn().mockResolvedValue(true)
};

// Mock for document map updater
export const mockUpdateMap = {
  getAllDocuments: vi.fn().mockResolvedValue([]),
  categorizeDocuments: vi.fn().mockReturnValue({}),
  findMissingDocuments: vi.fn().mockReturnValue([]),
  updateDocumentationMap: vi.fn().mockResolvedValue(true),
  updateRecentlyAddedDocuments: vi.fn().mockResolvedValue(true),
  updateLastModifiedDate: vi.fn().mockResolvedValue(true),
  buildDocumentMetadata: vi.fn().mockResolvedValue(true),
  analyzeDocumentRelationships: vi.fn().mockResolvedValue(true),
  generateRelationshipDiagram: vi.fn().mockResolvedValue(true),
  semanticSearch: vi.fn().mockResolvedValue([])
};
