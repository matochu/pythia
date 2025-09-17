import { MCPResource } from 'mcp-framework';
import { readFileSync } from 'fs';
import path from 'path';

class TaskTemplateResource extends MCPResource {
  uri = "resource://task-template";
  name = "Task Template";
  description = "Template for creating new task documents with proper structure";

  async read() {
    try {
      const templatePath = path.join(__dirname, 'task-template.md');
      const content = readFileSync(templatePath, 'utf-8');

      return [{
        uri: this.uri,
        mimeType: "text/markdown",
        text: content
      }];
    } catch (error) {
      return [{
        uri: this.uri,
        mimeType: "text/plain",
        text: `Error reading task template: ${error.message}`
      }];
    }
  }
}

export default TaskTemplateResource;