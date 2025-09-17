import { MCPResource } from 'mcp-framework';
import { readFileSync } from 'fs';
import path from 'path';

class TaskExamplesResource extends MCPResource {
  uri = "resource://task-examples";
  name = "Task Examples";
  description = "Examples of well-structured task documents for reference";

  async read() {
    try {
      const examplesPath = path.join(__dirname, 'task-examples.md');
      const content = readFileSync(examplesPath, 'utf-8');

      return [{
        uri: this.uri,
        mimeType: "text/markdown",
        text: content
      }];
    } catch (error) {
      return [{
        uri: this.uri,
        mimeType: "text/plain",
        text: `Error reading task examples: ${error.message}`
      }];
    }
  }
}

export default TaskExamplesResource;