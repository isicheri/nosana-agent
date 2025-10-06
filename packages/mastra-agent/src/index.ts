import { Agent } from '@mastra/core/agent';
import { MCPClient } from '@mastra/mcp';
import { Ollama } from 'ollama';
import path from 'node:path';


const mcpClient = new MCPClient({
  id: "study-assistant",
  servers: {
  
  }
})