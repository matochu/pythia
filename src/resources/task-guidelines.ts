import { MCPResource } from 'mcp-framework';
import { readFileSync } from 'fs';
import path from 'path';

class TaskGuidelinesResource extends MCPResource {
  uri = "resource://task-guidelines";
  name = "Task Guidelines";
  description = "Guidelines for creating and managing tasks in Pythia";

  async read() {
    try {
      const guidelinesPath = path.join(__dirname, 'task-guidelines.md');
      const content = readFileSync(guidelinesPath, 'utf-8');

      return [{
        uri: this.uri,
        mimeType: "text/markdown",
        text: content
      }];
    } catch (error) {
      return [{
        uri: this.uri,
        mimeType: "text/plain",
        text: `Error reading task guidelines: ${error.message}`
      }];
    }
  }
}

export default TaskGuidelinesResource;