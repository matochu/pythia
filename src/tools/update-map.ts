import { MCPTool } from 'mcp-framework';
import { z } from 'zod';
import { spawn } from 'child_process';
import path from 'path';

class UpdateMapTask extends MCPTool {
  name = 'update_map';
  description = 'Update documentation map with new files and structure';

  schema = z.object({
    addAll: z.boolean().optional().default(false).describe('Add all new files to the map'),
    interactive: z.boolean().optional().default(false).describe('Interactive mode for selecting files'),
    path: z.string().optional().describe('Specific path to update in the map')
  });

  async execute(input: any) {
    const { addAll, interactive, path: updatePath } = input;

    return new Promise((resolve, reject) => {
      const toolPath = path.join(process.cwd(), 'src/tools/updateDocumentationMap.ts');
      const args = ['--transpile-only', toolPath];

      if (addAll) args.push('--add-all');
      if (interactive) args.push('--interactive');
      if (updatePath) args.push('--path', updatePath);

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
                text: `Documentation map update completed:\n\n${stdout}`
              }
            ]
          });
        } else {
          resolve({
            content: [
              {
                type: 'text',
                text: `Error updating map (exit code ${code}):\n\n${stderr || stdout}`
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

export default UpdateMapTask;