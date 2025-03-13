import fs from 'fs';
import path from 'path';
import { program } from 'commander';
import chalk from 'chalk';
import { validateWorkItemStatus } from './validators/statusValidator';
import { updateActiveWorkItemsRegistry } from './registryUpdater';
import { updateDependenciesGraph } from './graphUpdater';
import { logStatusChange } from './statusLogger';
import { WorkItemStatus, WorkItem, StatusTransition } from './types/workItem';

const VALID_STATUSES = [
  'Not Started',
  'In Progress',
  'Under Review',
  'Blocked',
  'Completed',
  'Archived'
] as const;

const VALID_TRANSITIONS: StatusTransition[] = [
  { from: 'Not Started', to: 'In Progress' },
  { from: 'In Progress', to: 'Under Review' },
  { from: 'In Progress', to: 'Blocked' },
  { from: 'Blocked', to: 'In Progress' },
  { from: 'Under Review', to: 'In Progress' },
  { from: 'Under Review', to: 'Completed' },
  { from: 'Completed', to: 'Archived' }
];

// Core function for updating work item status
async function updateWorkItemStatusCore(
  itemId: string,
  newStatus: WorkItemStatus,
  reason?: string
): Promise<void> {
  // 1. Validate input
  if (!VALID_STATUSES.includes(newStatus)) {
    throw new Error(`Invalid status: ${newStatus}`);
  }

  // 2. Load work item
  const workItem = await loadWorkItem(itemId);
  if (!workItem) {
    throw new Error(`Work item not found: ${itemId}`);
  }

  // 3. Validate status transition
  const validationResult = validateWorkItemStatus(workItem, newStatus, reason);
  if (!validationResult.isValid) {
    throw new Error(validationResult.error || 'Invalid transition');
  }

  // 4. Update work item status
  const oldStatus = workItem.status;
  const updatedWorkItem = {
    ...workItem,
    status: newStatus,
    lastUpdated: new Date().toISOString().split('T')[0]
  };
  if (reason) {
    updatedWorkItem.statusReason = reason;
  }

  // 5. Save work item
  await saveWorkItem(updatedWorkItem);

  // 6. Update registry and dependencies
  await updateActiveWorkItemsRegistry(updatedWorkItem);
  await updateDependenciesGraph();

  // 7. Log status change
  await logStatusChange(itemId, oldStatus, newStatus, reason);

  return;
}

// CLI wrapper function
async function updateWorkItemStatus(): Promise<void> {
  try {
    program
      .name('update-status')
      .description('Update the status of a work item')
      .requiredOption('-i, --id <id>', 'Work item ID')
      .requiredOption('-s, --status <status>', 'New status')
      .option('-r, --reason <reason>', 'Reason for status change')
      .parse();

    const options = program.opts();

    await updateWorkItemStatusCore(
      options.id,
      options.status as WorkItemStatus,
      options.reason
    );

    console.log(
      chalk.green(
        `✓ Successfully updated status of ${options.id} to ${options.status}`
      )
    );
  } catch (error) {
    console.error(
      chalk.red(`✗ Failed to update status: ${(error as Error).message}`)
    );
    process.exit(1);
  }
}

async function loadWorkItem(itemId: string): Promise<WorkItem | null> {
  const itemPath = path.resolve(process.cwd(), 'docs', getWorkItemPath(itemId));

  if (!fs.existsSync(itemPath)) {
    return null;
  }

  const content = fs.readFileSync(itemPath, 'utf-8');
  return parseWorkItemContent(content, itemId);
}

async function saveWorkItem(workItem: WorkItem): Promise<void> {
  const itemPath = path.resolve(
    process.cwd(),
    'docs',
    getWorkItemPath(workItem.id)
  );

  const content = formatWorkItemContent(workItem);
  fs.writeFileSync(itemPath, content, 'utf-8');
}

function getWorkItemPath(itemId: string): string {
  const [type] = itemId.split('-');

  const typeToPath: Record<string, string> = {
    task: 'tasks',
    proposal: 'proposals',
    exploration: 'explorations',
    idea: 'ideas'
  };

  const folder = typeToPath[type] || 'other';
  return path.join(folder, `${itemId}.md`);
}

function parseWorkItemContent(content: string, itemId: string): WorkItem {
  // Basic metadata extraction
  const titleMatch = content.match(/^# (.+)$/m);
  const statusMatch = content.match(/Status: (.+)$/m);
  const typeMatch = content.match(/Type: (.+)$/m);
  const lastUpdatedMatch = content.match(/Last Updated: (.+)$/m);
  const createdAtMatch = content.match(/Created: (.+)$/m);
  const priorityMatch = content.match(/Priority: (.+)$/m);
  const ownerMatch = content.match(/Owner: (.+)$/m);

  if (!titleMatch || !statusMatch || !typeMatch) {
    throw new Error('Invalid work item format: missing required fields');
  }

  const workItem: WorkItem = {
    id: itemId,
    title: titleMatch[1],
    type: typeMatch[1] as WorkItem['type'],
    status: statusMatch[1] as WorkItem['status'],
    lastUpdated:
      lastUpdatedMatch?.[1] || new Date().toISOString().split('T')[0],
    createdAt: createdAtMatch?.[1] || new Date().toISOString().split('T')[0]
  };

  if (priorityMatch) {
    workItem.priority = priorityMatch[1] as WorkItem['priority'];
  }

  if (ownerMatch) {
    workItem.owner = ownerMatch[1];
  }

  return workItem;
}

function formatWorkItemContent(workItem: WorkItem): string {
  return `# ${workItem.title}

Type: ${workItem.type}
Status: ${workItem.status}
Last Updated: ${workItem.lastUpdated}
Created: ${workItem.createdAt}
${workItem.priority ? `Priority: ${workItem.priority}\n` : ''}${
    workItem.owner ? `Owner: ${workItem.owner}\n` : ''
  }${workItem.statusReason ? `Status Reason: ${workItem.statusReason}\n` : ''}`;
}

// Run CLI if this is the main module
if (require.main === module) {
  updateWorkItemStatus();
}

export { updateWorkItemStatus, updateWorkItemStatusCore };
