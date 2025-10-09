import { MCPTool } from 'mcp-framework';
import { z } from 'zod';
import { spawn } from 'child_process';
import path from 'path';

class LinkValidatorTool extends MCPTool {
  name = 'link_validator';
  description = 'Validate links in documentation and fix broken references';

  schema = z.object({
    path: z.string().optional().default('.').describe('Path to validate links'),
    fix: z.boolean().optional().default(false).describe('Automatically fix broken links'),
    verbose: z.boolean().optional().default(false).describe('Enable verbose output')
  });

  async execute(input: any) {
    const { path: checkPath, fix, verbose } = input;

    return new Promise((resolve, reject) => {
      const toolPath = path.join(process.cwd(), 'src/tools/linkValidator.ts');
      const args = ['--transpile-only', toolPath];

      if (checkPath !== '.') args.push('--path', checkPath);
      if (fix) args.push('--fix');
      if (verbose) args.push('--verbose');

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

export default LinkValidatorTool;