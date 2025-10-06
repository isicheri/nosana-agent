// study-assistant-mcp-server.ts

import { MCPServer } from "@mastra/mcp";
import resourceHandlers from "./resource"; // your PDF/text parsers
import {summarizeResourceTool} from "../tools/index"; 
import { readFileSync } from "fs";
import path from "node:path";

// Read version from package.json
const version = JSON.parse(
  readFileSync(path.resolve(process.cwd(), "package.json"), "utf8")
).version;

// --- Create and configure the MCP server ---
const server = new MCPServer({
  name: "study-assistant",
  version,
  description:
    "MCP Server for AI Study Assistant: Provides summarization, context-aware QA, and flashcard generation tools.",
  tools: {
    summarize: summarizeResourceTool,
    // qa: qaTool,
    // flashcards: flashcardsTool,
  },
  resources: resourceHandlers, 
});

// --- Start server based on transport type ---
const main = async () => {
  const transport = process.env.MCP_TRANSPORT || "stdio";

  console.error(`Starting Study Assistant MCP Server v${version} via ${transport}`);
  console.error("Tools: summarize, qa, flashcards");
  console.error("Resources: pdf, txt");
  console.error("Use: Upload → Summarize → Flashcards → QA");

  if (transport === "stdio") {
    await server.startStdio();
  } else if (transport === "http") {
    console.error("HTTP transport: Use http-server.ts if implemented.");
    process.exit(1);
  } else {
    console.error(`Unsupported transport: ${transport}`);
    process.exit(1);
  }
};

// Graceful shutdown
process.on("SIGINT", async () => {
  console.error("Shutting down Study Assistant MCP Server...");
  await server.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.error("Shutting down Study Assistant MCP Server...");
  await server.close();
  process.exit(0);
});

// Entry point
main().catch((error) => {
  console.error("MCP Server error:", error);
  process.exit(1);
});

export { server };
