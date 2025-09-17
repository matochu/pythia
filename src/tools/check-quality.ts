import { MCPTool } from 'mcp-framework';
import { z } from 'zod';
import { spawn } from 'child_process';
import path from 'path';

class CheckQualityTool extends MCPTool {
  name = 'check_quality';
  description = 'Check documentation quality and generate quality reports';

  schema = z.object({
    path: z.string().optional().default('.').describe('Path to check documentation quality'),
    outputFile: z.string().optional().describe('Output file for quality report'),
    fix: z.boolean().optional().default(false).describe('Automatically fix quality issues'),
    verbose: z.boolean().optional().default(false).describe('Enable verbose output')
  });

  async execute(input: any) {
    const { path: checkPath, outputFile, fix, verbose } = input;

    return new Promise((resolve, reject) => {
      const toolPath = path.join(process.cwd(), 'src/tools/checkDocQuality.ts');
      const args = ['--transpile-only', toolPath];

      if (checkPath !== '.') args.push('--path', checkPath);
      if (outputFile) args.push('--output', outputFile);
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
                text: `Quality check completed:\n\n${stdout}`
              }
            ]
          });
        } else {
          resolve({
            content: [
              {
                type: 'text',
                text: `Error checking quality (exit code ${code}):\n\n${stderr || stdout}`
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

export default CheckQualityTool;