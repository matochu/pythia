import { MCPTool } from 'mcp-framework';
import { z } from 'zod';
import { spawn } from 'child_process';
import path from 'path';

class CoverageCheckerTool extends MCPTool {
  name = 'coverage_checker';
  description = 'Check documentation coverage and generate coverage reports';

  schema = z.object({
    path: z.string().optional().default('.').describe('Path to check documentation coverage'),
    outputFile: z.string().optional().describe('Output file for coverage report'),
    fix: z.boolean().optional().default(false).describe('Automatically fix coverage issues'),
    threshold: z.number().optional().default(80).describe('Coverage threshold percentage')
  });

  async execute(input: any) {
    const { path: checkPath, outputFile, fix, threshold } = input;

    return new Promise((resolve, reject) => {
      const toolPath = path.join(process.cwd(), 'src/tools/coverageChecker.ts');
      const args = ['--transpile-only', toolPath];

      if (checkPath !== '.') args.push('--path', checkPath);
      if (outputFile) args.push('--output', outputFile);
      if (fix) args.push('--fix');
      if (threshold !== 80) args.push('--threshold', threshold.toString());

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
                text: `Coverage check completed:\n\n${stdout}`
              }
            ]
          });
        } else {
          resolve({
            content: [
              {
                type: 'text',
                text: `Error checking coverage (exit code ${code}):\n\n${stderr || stdout}`
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

export default CoverageCheckerTool;