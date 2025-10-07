import { MCPClient } from '@mastra/mcp';
import path from 'node:path';
import { createSummarizeAgent } from './agents/SummarizeAgent';

export function createStudyAssistantClient() {
  const client =  new MCPClient({
    id: "study-assistant-client",
    servers: {
      studyAssistant: {
        command: "npx",
        args: [
          "ts-node",
          path.resolve(__dirname, "../../../apps/mcp-server/src/index.ts")
        ],
      }
    }
  });
  return client;
}

export const agentSummarize = createSummarizeAgent();