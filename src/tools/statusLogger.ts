import fs from 'fs';
import path from 'path';
import { WorkItemStatus } from './types/workItem';

const LOG_DIR = path.resolve(process.cwd(), 'logs/status-changes');
const CHANGELOG_PATH = path.resolve(process.cwd(), 'CHANGELOG.md');

export async function logStatusChange(
  itemId: string,
  oldStatus: WorkItemStatus,
  newStatus: WorkItemStatus,
  reason?: string
): Promise<void> {
  try {
    // 1. Ensure log directory exists
    await fs.promises.mkdir(LOG_DIR, { recursive: true });

    // 2. Create log entry
    const timestamp = new Date().toISOString();
    const logEntry = formatLogEntry(
      itemId,
      oldStatus,
      newStatus,
      timestamp,
      reason
    );

    // 3. Append to status log file
    const logFile = path.join(LOG_DIR, `${itemId}.log`);
    await fs.promises.appendFile(logFile, logEntry);

    // 4. Update changelog
    await updateChangelog(itemId, oldStatus, newStatus, timestamp, reason);
  } catch (error) {
    throw new Error(`Failed to log status change: ${(error as Error).message}`);
  }
}

function formatLogEntry(
  itemId: string,
  oldStatus: WorkItemStatus,
  newStatus: WorkItemStatus,
  timestamp: string,
  reason?: string
): string {
  return `[${timestamp}] ${itemId}: ${oldStatus} -> ${newStatus}${
    reason ? ` (Reason: ${reason})` : ''
  }\n`;
}

async function updateChangelog(
  itemId: string,
  oldStatus: WorkItemStatus,
  newStatus: WorkItemStatus,
  timestamp: string,
  reason?: string
): Promise<void> {
  try {
    // 1. Read current changelog
    let content = '';
    if (fs.existsSync(CHANGELOG_PATH)) {
      content = await fs.promises.readFile(CHANGELOG_PATH, 'utf-8');
    }

    // 2. Format new entry
    const date = timestamp.split('T')[0];
    const entry = formatChangelogEntry(itemId, oldStatus, newStatus, reason);

    // 3. Add entry under current date section
    const updatedContent = updateChangelogContent(content, date, entry);

    // 4. Write updated changelog
    await fs.promises.writeFile(CHANGELOG_PATH, updatedContent, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to update changelog: ${(error as Error).message}`);
  }
}

function formatChangelogEntry(
  itemId: string,
  oldStatus: WorkItemStatus,
  newStatus: WorkItemStatus,
  reason?: string
): string {
  return `- [${itemId}] Status changed from ${oldStatus} to ${newStatus}${
    reason ? ` (${reason})` : ''
  }`;
}

function updateChangelogContent(
  content: string,
  date: string,
  entry: string
): string {
  const lines = content.split('\n');
  const dateHeader = `## [${date}]`;
  const dateIndex = lines.findIndex((line) => line.startsWith(dateHeader));

  if (dateIndex === -1) {
    // Add new date section
    return `${dateHeader}\n\n${entry}\n\n${content}`;
  } else {
    // Add entry under existing date
    lines.splice(dateIndex + 2, 0, entry);
    return lines.join('\n');
  }
}
