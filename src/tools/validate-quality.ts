import { MCPTool } from 'mcp-framework';
import { z } from 'zod';
import { spawn } from 'child_process';
import path from 'path';

class ValidateQualityTool extends MCPTool {
  name = 'validate_quality';
  description = 'Validate documentation quality standards and generate reports';

  schema = z.object({
    path: z.string().optional().default('.').describe('Path to validate quality'),
    fix: z.boolean().optional().default(false).describe('Automatically fix quality issues'),
    standard: z.enum(['basic', 'strict', 'minimal']).optional().default('basic').describe('Quality standard level'),
    outputFormat: z.enum(['text', 'json', 'markdown']).optional().default('text').describe('Output format')
  });

  async execute(input: any) {
    const { path: checkPath, fix, standard, outputFormat } = input;

    return new Promise((resolve, reject) => {
      const toolPath = path.join(process.cwd(), 'src/tools/validateDocumentQuality.ts');
      const args = ['--transpile-only', toolPath];

      if (checkPath !== '.') args.push('--path', checkPath);
      if (fix) args.push('--fix');
      if (standard !== 'basic') args.push('--standard', standard);
      if (outputFormat !== 'text') args.push('--format', outputFormat);

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
                text: `Quality validation completed:\n\n${stdout}`
              }
            ]
          });
        } else {
          resolve({
            content: [
              {
                type: 'text',
                text: `Error validating quality (exit code ${code}):\n\n${stderr || stdout}`
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

export default ValidateQualityTool;