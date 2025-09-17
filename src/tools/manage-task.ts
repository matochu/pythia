import { MCPTool } from 'mcp-framework';
import { z } from 'zod';
import { spawn } from 'child_process';
import path from 'path';

class ManageTaskTool extends MCPTool {
  name = 'manage_task';
  description = 'Manage task lifecycle - update status, priority, and other metadata';

  schema = z.object({
    taskId: z.string().describe('Task ID to manage'),
    action: z.enum(['update-status', 'set-priority', 'add-note', 'assign']).describe('Management action'),
    value: z.string().describe('New value for the action'),
    note: z.string().optional().describe('Optional note for the change')
  });

  async execute(input: any) {
    const { taskId, action, value, note } = input;

    return new Promise((resolve, reject) => {
      const toolPath = path.join(process.cwd(), 'src/tools/updateWorkItemStatus.ts');
      const args = ['--transpile-only', toolPath];

      args.push('--task-id', taskId);
      args.push('--action', action);
      args.push('--value', value);
      if (note) args.push('--note', note);

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
                text: `Task management completed:\n\n${stdout}`
              }
            ]
          });
        } else {
          resolve({
            content: [
              {
                type: 'text',
                text: `Error managing task (exit code ${code}):\n\n${stderr || stdout}`
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

export default ManageTaskTool;