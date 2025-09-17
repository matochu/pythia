import { MCPTool } from 'mcp-framework';
import { z } from 'zod';
import { spawn } from 'child_process';
import path from 'path';

class CreateDocumentTask extends MCPTool {
  name = 'create_document';
  description = 'Create new documentation documents with proper templates and structure';

  schema = z.object({
    type: z.enum(['task', 'guide', 'analysis', 'command']).describe('Type of document to create'),
    name: z.string().describe('Name of the document'),
    path: z.string().optional().describe('Custom path for the document'),
    template: z.string().optional().describe('Template to use for the document')
  });

  async execute(input: any) {
    const { type, name, path: docPath, template } = input;

    return new Promise((resolve, reject) => {
      const toolPath = path.join(process.cwd(), 'src/tools/createDocument.ts');
      const args = ['--transpile-only', toolPath];

      args.push('--type', type);
      args.push('--name', name);
      if (docPath) args.push('--path', docPath);
      if (template) args.push('--template', template);

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
                text: `Document creation completed:\n\n${stdout}`
              }
            ]
          });
        } else {
          resolve({
            content: [
              {
                type: 'text',
                text: `Error creating document (exit code ${code}):\n\n${stderr || stdout}`
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

export default CreateDocumentTask;