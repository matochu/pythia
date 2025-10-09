import { MCPTool } from 'mcp-framework';
import { z } from 'zod';
import { spawn } from 'child_process';
import path from 'path';

class ArchiveTasksTask extends MCPTool {
  name = 'archive_tasks';
  description = 'Archive completed tasks and update documentation references';

  schema = z.object({
    dryRun: z.boolean().optional().default(false).describe('Preview changes without executing'),
    force: z.boolean().optional().default(false).describe('Force archive even if tasks are not completed'),
    taskId: z.string().optional().describe('Specific task ID to archive')
  });

  async execute(input: any) {
    const { dryRun, force, taskId } = input;

    return new Promise((resolve, reject) => {
      const toolPath = path.join(process.cwd(), 'src/tools/archiveTasks.ts');
      const args = ['--transpile-only', toolPath];

      if (dryRun) args.push('--dry-run');
      if (force) args.push('--force');
      if (taskId) args.push('--task-id', taskId);

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
                text: `Archive tasks completed:\n\n${stdout}`
              }
            ]
          });
        } else {
          resolve({
            content: [
              {
                type: 'text',
                text: `Error archiving tasks (exit code ${code}):\n\n${stderr || stdout}`
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

export default ArchiveTasksTask;