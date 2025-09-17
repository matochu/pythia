import * as fs from 'fs';
import * as path from 'path';
import { WorkItem } from './types/workItem';
import { execSync } from 'child_process';

const REGISTRY_PATH = path.resolve(process.cwd(), 'workflows/report.md');

export async function updateDependenciesGraph(): Promise<void> {
  try {
    // 1. Read registry content
    const content = await fs.promises.readFile(REGISTRY_PATH, 'utf-8');

    // 2. Extract work items
    const workItems = await extractWorkItems();

    // 3. Generate graph
    const graph = generateDependenciesGraph(workItems);

    // 4. Update graph section in registry
    await updateGraphSection(content, graph);
  } catch (error) {
    throw new Error(
      `Failed to update dependencies graph: ${(error as Error).message}`
    );
  }
}

async function extractWorkItems(): Promise<WorkItem[]> {
  const items: WorkItem[] = [];
  const docsPath = path.resolve(process.cwd());

  // Scan directories for work items
  const directories = [
    'workflows/tasks',
    'workflows/proposals',
    'workflows/explorations',
    'workflows/ideas'
  ];

  for (const dir of directories) {
    const dirPath = path.join(docsPath, dir);
    if (!fs.existsSync(dirPath)) continue;

    const files = await fs.promises.readdir(dirPath);

    for (const file of files) {
      if (!file.endsWith('.md')) continue;

      const content = await fs.promises.readFile(
        path.join(dirPath, file),
        'utf-8'
      );

      const item = parseWorkItem(content, file, dir);
      if (item) {
        items.push(item);
      }
    }
  }

  return items;
}

function parseWorkItem(
  content: string,
  filename: string,
  directory: string
): WorkItem | null {
  // Basic metadata extraction
  const id = filename.replace('.md', '');
  const titleMatch = content.match(/^# (.+)$/m);
  const statusMatch = content.match(/Status: (.+)$/m);
  const typeMatch = content.match(/Type: (.+)$/m);

  if (!titleMatch || !statusMatch || !typeMatch) return null;

  // Extract the actual type from the directory path
  // For paths like 'workflows/tasks', we want 'task'
  const dirType = directory.split('/').pop() || '';
  // Convert plural to singular (tasks -> task, ideas -> idea, etc.)
  const type = dirType.endsWith('s') ? dirType.slice(0, -1) : dirType;

  const dependencies = extractDependencies(content);
  const blocks = extractBlocks(content);

  return {
    id,
    title: titleMatch[1],
    type: type as WorkItem['type'],
    status: statusMatch[1] as WorkItem['status'],
    dependencies,
    blocks,
    lastUpdated: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString().split('T')[0]
  };
}

function extractDependencies(content: string): string[] {
  const dependenciesMatch = content.match(/Dependencies:\s*\n((?:- .+\n?)+)/m);
  if (!dependenciesMatch) return [];

  return dependenciesMatch[1]
    .split('\n')
    .filter((line) => line.startsWith('- '))
    .map((line) => line.replace('- ', '').trim());
}

function extractBlocks(content: string): string[] {
  const blocksMatch = content.match(/Blocks:\s*\n((?:- .+\n?)+)/m);
  if (!blocksMatch) return [];

  return blocksMatch[1]
    .split('\n')
    .filter((line) => line.startsWith('- '))
    .map((line) => line.replace('- ', '').trim());
}

function generateDependenciesGraph(workItems: WorkItem[]): string {
  let graph = '```mermaid\ngraph TD\n';

  // Add nodes
  for (const item of workItems) {
    graph += `  ${item.id}["${item.title}"]\n`;
  }

  // Add edges
  for (const item of workItems) {
    if (item.dependencies) {
      for (const dep of item.dependencies) {
        graph += `  ${dep} --> ${item.id}\n`;
      }
    }
    if (item.blocks) {
      for (const blocked of item.blocks) {
        graph += `  ${item.id} -.-> ${blocked}\n`;
      }
    }
  }

  graph += '```\n';
  return graph;
}

async function updateGraphSection(
  content: string,
  graph: string
): Promise<void> {
  const sections = content.split(/^## /m);
  const graphSectionIndex = sections.findIndex((s) =>
    s.startsWith('Dependencies Graph')
  );

  if (graphSectionIndex === -1) {
    // Add new section if it doesn't exist
    sections.push(`Dependencies Graph\n\n${graph}`);
  } else {
    // Update existing section
    sections[graphSectionIndex] = `Dependencies Graph\n\n${graph}`;
  }

  const updatedContent = sections.join('## ');
  await fs.promises.writeFile(REGISTRY_PATH, updatedContent, 'utf-8');
}
