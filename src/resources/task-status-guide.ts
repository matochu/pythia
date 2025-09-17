import { MCPResource } from 'mcp-framework';
import { readFileSync } from 'fs';
import path from 'path';

class TaskStatusGuideResource extends MCPResource {
  uri = "resource://task-status-guide";
  name = "Task Status Guide";
  description = "Guide for understanding and managing task status transitions";

  async read() {
    try {
      const statusPath = path.join(__dirname, 'task-status-guide.md');
      const content = readFileSync(statusPath, 'utf-8');

      return [{
        uri: this.uri,
        mimeType: "text/markdown",
        text: content
      }];
    } catch (error) {
      return [{
        uri: this.uri,
        mimeType: "text/plain",
        text: `Error reading task status guide: ${error.message}`
      }];
    }
  }
}

export default TaskStatusGuideResource;