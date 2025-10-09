import { MCPResource } from 'mcp-framework';
import { readFileSync } from 'fs';
import path from 'path';

class TaskManagementWorkflowResource extends MCPResource {
  uri = "resource://task-management-workflow";
  name = "Task Management Workflow";
  description = "Complete workflow for managing tasks from creation to completion";

  async read() {
    try {
      const workflowPath = path.join(__dirname, 'task-management-workflow.md');
      const content = readFileSync(workflowPath, 'utf-8');

      return [{
        uri: this.uri,
        mimeType: "text/markdown",
        text: content
      }];
    } catch (error) {
      return [{
        uri: this.uri,
        mimeType: "text/plain",
        text: `Error reading task management workflow: ${error.message}`
      }];
    }
  }
}

export default TaskManagementWorkflowResource;