#!/usr/bin/env node

import { MCPServer } from 'mcp-framework';

async function startServer() {
  try {
    const server = new MCPServer({
      name: 'pythia-mcp-server',
      version: '0.0.1',
      basePath: '/Users/Serhii/workspace/ai/pythia/dist',
      transport: {
        type: 'stdio'
      }
    });

    await server.start();
  } catch (error) {
    console.error('Failed to start Pythia MCP Server:', error);
    process.exit(1);
  }
}

startServer().catch(console.error);
