export type WorkItemStatus =
  | 'Not Started'
  | 'In Progress'
  | 'Under Review'
  | 'Blocked'
  | 'Completed'
  | 'Archived';

export type WorkItemType = 'task' | 'proposal' | 'exploration' | 'idea';

export interface WorkItem {
  id: string;
  title: string;
  type: WorkItemType;
  status: WorkItemStatus;
  priority?: 'Low' | 'Medium' | 'High';
  complexity?: 'Low' | 'Medium' | 'High';
  owner?: string;
  dependencies?: string[];
  blockedBy?: string[];
  blocks?: string[];
  lastUpdated: string;
  statusReason?: string;
  createdAt: string;
  completedAt?: string;
  archivedAt?: string;
}

export interface StatusTransition {
  from: WorkItemStatus;
  to: WorkItemStatus;
  requiresReason?: boolean;
  requiresApproval?: boolean;
}

export interface WorkItemMetrics {
  totalItems: number;
  statusDistribution: Record<WorkItemStatus, number>;
  priorityDistribution: Record<string, number>;
  teamDistribution: Record<string, number>;
  averageCompletionTime: number;
  blockedItems: number;
}
