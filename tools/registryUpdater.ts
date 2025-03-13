import fs from 'fs';
import path from 'path';
import { WorkItem, WorkItemMetrics } from './types/workItem';

const REGISTRY_PATH = path.resolve(process.cwd(), 'workflows/status.md');

export async function updateActiveWorkItemsRegistry(
  updatedItem: WorkItem
): Promise<void> {
  try {
    // 1. Read current registry
    const content = await fs.promises.readFile(REGISTRY_PATH, 'utf-8');

    // 2. Parse registry content
    const sections = parseRegistrySections(content);

    // 3. Update relevant section
    updateItemInSection(sections, updatedItem);

    // 4. Update metrics
    const metrics = calculateMetrics(sections);
    updateMetricsSection(sections, metrics);

    // 5. Save updated registry
    const updatedContent = formatRegistryContent(sections, metrics);
    await fs.promises.writeFile(REGISTRY_PATH, updatedContent, 'utf-8');
  } catch (error) {
    throw new Error(
      `Failed to update Active Work Items Registry: ${(error as Error).message}`
    );
  }
}

function parseRegistrySections(content: string): Record<string, string> {
  const sections: Record<string, string> = {};
  let currentSection = '';
  let sectionContent = '';

  const lines = content.split('\n');

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentSection) {
        sections[currentSection] = sectionContent.trim();
      }
      currentSection = line.replace('## ', '').trim();
      sectionContent = line + '\n';
    } else {
      sectionContent += line + '\n';
    }
  }

  if (currentSection) {
    sections[currentSection] = sectionContent.trim();
  }

  return sections;
}

function updateItemInSection(
  sections: Record<string, string>,
  item: WorkItem
): void {
  const sectionMap: Record<string, string> = {
    task: 'Active Tasks',
    proposal: 'Active Proposals',
    exploration: 'Active Explorations',
    idea: 'New Ideas'
  };

  const section = sectionMap[item.type];
  if (!section || !sections[section]) {
    throw new Error(`Invalid section for item type: ${item.type}`);
  }

  const lines = sections[section].split('\n');
  const tableStart = lines.findIndex((line) => line.includes('| ID | Title |'));

  if (tableStart === -1) {
    throw new Error(`Table not found in section: ${section}`);
  }

  // Update or add item in table
  const itemIndex = lines.findIndex((line) => line.includes(`| ${item.id} |`));
  const itemLine = formatTableRow(item);

  if (itemIndex > tableStart) {
    lines[itemIndex] = itemLine;
  } else {
    lines.splice(tableStart + 2, 0, itemLine);
  }

  sections[section] = lines.join('\n');
}

function formatTableRow(item: WorkItem): string {
  return `| ${item.id} | ${item.title} | ${item.status} | ${
    item.priority || '-'
  } | ${item.owner || '-'} | ${item.lastUpdated} |`;
}

function calculateMetrics(sections: Record<string, string>): WorkItemMetrics {
  const metrics: WorkItemMetrics = {
    totalItems: 0,
    statusDistribution: {
      'Not Started': 0,
      'In Progress': 0,
      'Under Review': 0,
      Blocked: 0,
      Completed: 0,
      Archived: 0
    },
    priorityDistribution: {
      Low: 0,
      Medium: 0,
      High: 0
    },
    teamDistribution: {},
    averageCompletionTime: 0,
    blockedItems: 0
  };

  // Implementation of metrics calculation
  // This would parse the sections and count items by status, priority, etc.

  return metrics;
}

function updateMetricsSection(
  sections: Record<string, string>,
  metrics: WorkItemMetrics
): void {
  const metricsContent = formatMetricsContent(metrics);
  sections['Work Item Metrics'] = metricsContent;
}

function formatMetricsContent(metrics: WorkItemMetrics): string {
  return `## Work Item Metrics

### Status Distribution
${Object.entries(metrics.statusDistribution)
  .map(([status, count]) => `- ${status}: ${count}`)
  .join('\n')}

### Priority Distribution
${Object.entries(metrics.priorityDistribution)
  .map(([priority, count]) => `- ${priority}: ${count}`)
  .join('\n')}

### Team Distribution
${Object.entries(metrics.teamDistribution)
  .map(([team, count]) => `- ${team}: ${count}`)
  .join('\n')}

### Other Metrics
- Total Items: ${metrics.totalItems}
- Blocked Items: ${metrics.blockedItems}
- Average Completion Time: ${metrics.averageCompletionTime} days`;
}

function formatRegistryContent(
  sections: Record<string, string>,
  metrics: WorkItemMetrics
): string {
  const orderedSections = [
    'Active Tasks',
    'Active Proposals',
    'Active Explorations',
    'New Ideas',
    'Work Item Metrics',
    'Dependencies Graph',
    'Next Actions'
  ];

  return (
    orderedSections
      .map((section) => sections[section] || '')
      .filter(Boolean)
      .join('\n\n') + '\n'
  );
}
