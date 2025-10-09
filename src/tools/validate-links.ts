import { MCPTool } from 'mcp-framework';
import { z } from 'zod';
import { spawn } from 'child_process';
import path from 'path';

class ValidateLinksTask extends MCPTool {
  name = 'validate_links';
  description = 'Validate all links in documentation files';

  schema = z.object({
    fix: z.boolean().optional().default(false).describe('Automatically fix broken links'),
    path: z.string().optional().default('.').describe('Path to validate links')
  });

  async execute(input: any) {
    const { fix, path: checkPath } = input;

    return new Promise((resolve, reject) => {
      const toolPath = path.join(process.cwd(), 'src/tools/linkValidator.ts');
      const args = ['--transpile-only', toolPath];

      if (fix) args.push('--fix');
      if (checkPath !== '.') args.push('--path', checkPath);

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
                text: `Link validation completed:\n\n${stdout}`
              }
            ]
          });
        } else {
          resolve({
            content: [
              {
                type: 'text',
                text: `Error validating links (exit code ${code}):\n\n${stderr || stdout}`
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

export default ValidateLinksTask;