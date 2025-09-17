import { WorkItem, WorkItemStatus, StatusTransition } from '../types/workItem';

const VALID_TRANSITIONS: StatusTransition[] = [
  { from: 'Not Started', to: 'In Progress' },
  { from: 'In Progress', to: 'Under Review' },
  { from: 'In Progress', to: 'Blocked', requiresReason: true },
  { from: 'Blocked', to: 'In Progress' },
  { from: 'Under Review', to: 'In Progress' },
  { from: 'Under Review', to: 'Completed', requiresApproval: true },
  { from: 'Completed', to: 'Archived' }
];

export function validateWorkItemStatus(
  workItem: WorkItem,
  newStatus: WorkItemStatus,
  reason?: string
): { isValid: boolean; error?: string } {
  // 1. Check if status is valid
  const validStatuses: WorkItemStatus[] = [
    'Not Started',
    'In Progress',
    'Under Review',
    'Blocked',
    'Completed',
    'Archived'
  ];

  if (!validStatuses.includes(newStatus)) {
    return {
      isValid: false,
      error: `Invalid status: ${newStatus}`
    };
  }

  // 2. Check if transition is valid
  const transition = VALID_TRANSITIONS.find(
    (t) => t.from === workItem.status && t.to === newStatus
  );

  if (!transition) {
    return {
      isValid: false,
      error: `Invalid transition from ${workItem.status} to ${newStatus}`
    };
  }

  // 3. Check if reason is required
  if (transition.requiresReason && !reason) {
    return {
      isValid: false,
      error: `Status transition to ${newStatus} requires a reason`
    };
  }

  // 4. Check dependencies for blocking status
  if (newStatus === 'Blocked' && !workItem.blockedBy?.length) {
    return {
      isValid: false,
      error: 'Blocked status requires at least one blocking item'
    };
  }

  // 5. Check completion requirements
  if (newStatus === 'Completed') {
    if (workItem.blockedBy?.length) {
      return {
        isValid: false,
        error: 'Cannot complete item with blocking dependencies'
      };
    }
  }

  // 6. Check archiving requirements
  if (newStatus === 'Archived') {
    if (workItem.blocks?.length) {
      return {
        isValid: false,
        error: 'Cannot archive item that blocks other items'
      };
    }
  }

  return { isValid: true };
}

export function validateStatusTransitionRules(
  workItem: WorkItem,
  newStatus: WorkItemStatus
): { isValid: boolean; error?: string } {
  // Additional business rules for status transitions
  switch (newStatus) {
    case 'In Progress':
      // Check if all dependencies are completed or in progress
      if (workItem.dependencies?.length) {
        // Implementation of dependency validation
      }
      break;

    case 'Under Review':
      // Check if all required fields are filled
      if (!workItem.owner) {
        return {
          isValid: false,
          error: 'Owner must be assigned before review'
        };
      }
      break;

    case 'Completed':
      // Check completion criteria
      if (!workItem.owner || !workItem.priority) {
        return {
          isValid: false,
          error: 'Owner and priority must be set before completion'
        };
      }
      break;

    default:
      break;
  }

  return { isValid: true };
}
