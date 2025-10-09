import { MCPServer } from "@mastra/mcp";
import { config } from 'dotenv';
import { summarizeContentTool, generateFlashcardsTool,chatWithResourceTool } from "./tools";
import { textSummarizeAgent } from "./agents/textSummarizeAgent";
config();


const mcpServer = new MCPServer({
    name: "Study assistant MCP server",
    version: "1.0.0",
    description: "AI-powered study assistant MCP server providing summarization, Q&A, and flashcard generation tools for educational content.",
    tools: {
    summarizeContentTool,
    generateFlashcardsTool,
    chatWithResourceTool
    },
    agents: {
      textSummarizeAgent
    }
})


//function to start the the server via HTTP/SSE
// Function to start the server via HTTP/SSE
export async function startHttpServer(port: number = 4111) {
  const { createServer } = await import('http');

  const baseUrl = process.env.SERVER_BASE_URL || `http://localhost:${port}`;

  const httpServer = createServer(async (req, res) => {
    try {
      const url = new URL(req.url || '', baseUrl);

      // Handle CORS for web clients
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

      // Health check endpoint
      if (url.pathname === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
          status: 'healthy', 
          server: 'Study assistant MCP server',
          version: '1.0.0',
          timestamp: new Date().toISOString()
        }));
        return;
      }

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      await mcpServer.startSSE({
        url,
        ssePath: '/mcp',
        messagePath: '/mcp/message',
        req,
        res,
      });
    } catch (error) {
      console.error('Server error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  });

  httpServer.listen(port, () => {
    console.log(`🚀 MCP server running on ${baseUrl}/mcp`);
    console.log(`📊 Health check available at ${baseUrl}/health`);
    console.log(`🔧 Available tools: summarizeContentTool`);
    console.log(`🤖 Available agents: textSummarizeAgent`);
  });

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('Shutting down MCP server...');
    await mcpServer.close();
    httpServer.close(() => {
      console.log('MCP server shut down complete');
      process.exit(0);
    });
  });

  return httpServer;
}

// If this file is run directly, start the HTTP server
if (require.main === module) {
  const port = parseInt(process.env.MCP_PORT || '4111', 10);
  startHttpServer(port).catch(console.error);
}