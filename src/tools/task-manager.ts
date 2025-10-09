import { MCPTool } from 'mcp-framework';
import { z } from 'zod';
import { spawn } from 'child_process';
import path from 'path';

class TaskManagerTool extends MCPTool {
  name = 'task_manager';
  description = 'Manage task documents - create, update, list, and archive tasks';

  schema = z.object({
    action: z
      .enum(['create', 'update', 'list', 'archive', 'status'])
      .describe('Action to perform'),
    taskName: z
      .string()
      .optional()
      .describe('Name of the task (for create/update)'),
    taskId: z
      .string()
      .optional()
      .describe('Task ID (for update/archive/status)'),
    status: z
      .enum([
        'not-started',
        'in-progress',
        'under-review',
        'blocked',
        'completed'
      ])
      .optional()
      .describe('New status (for update)'),
    priority: z
      .enum(['low', 'medium', 'high', 'critical'])
      .optional()
      .describe('Priority level'),
    complexity: z
      .enum(['low', 'medium', 'high'])
      .optional()
      .describe('Complexity level'),
    description: z.string().optional().describe('Task description'),
    category: z.string().optional().describe('Task category'),
    projectPath: z
      .string()
      .optional()
      .describe('Project path where task should be created')
  });

  async execute(input: any) {
    const {
      action,
      taskName,
      taskId,
      status,
      priority,
      complexity,
      description,
      category,
      projectPath
    } = input;

    return new Promise((resolve, reject) => {
      const toolPath = path.join(process.cwd(), 'src/tools/createDocument.ts');
      const args = ['--transpile-only', toolPath];

      // Add action-specific arguments based on createDocument.ts interface
      if (action === 'create') {
        args.push('--type', 'task');
        if (taskName) args.push('--title', taskName);
        if (projectPath) {
          const taskPath = path.join(projectPath, 'tasks', `${taskName?.replace(/\s+/g, '-').toLowerCase()}.md`);
          args.push('--path', taskPath);
        }
      } else {
        // For other actions, fall back to updateWorkItemStatus
        const updateToolPath = path.join(process.cwd(), 'src/tools/updateWorkItemStatus.ts');
        const updateArgs = ['--transpile-only', updateToolPath];

        if (taskId) updateArgs.push('--id', taskId);
        if (status) updateArgs.push('--status', status);
        if (action) updateArgs.push('--action', action);

        return new Promise((resolve, reject) => {
          const child = spawn('ts-node', updateArgs, {
            stdio: ['pipe', 'pipe', 'pipe'],
            cwd: process.cwd()
          });

          let stdout = '';
          let stderr = '';

          child.stdout.on('data', (data) => {
            stdout += data.toString();
          });

          child.stderr.on('data', (data) => {
            stderr += data.toString();
          });

          child.on('close', (code) => {
            if (code === 0) {
              resolve({
                content: [{
                  type: 'text',
                  text: `Task management ${action} completed:\n\n${stdout}`
                }]
              });
            } else {
              resolve({
                content: [{
                  type: 'text',
                  text: `Error in task management (exit code ${code}):\n\n${stderr || stdout}`
                }]
              });
            }
          });

          child.on('error', (error) => {
            reject(error);
          });
        });
      }

      const child = spawn('ts-node', args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd()
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({
            content: [
              {
                type: 'text',
                text: `Task management ${action} completed:\n\n${stdout}`
              }
            ]
          });
        } else {
          resolve({
            content: [
              {
                type: 'text',
                text: `Error in task management (exit code ${code}):\n\n${
                  stderr || stdout
                }`
              }
            ]
          });
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }
}

export default TaskManagerTool;