"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = void 0;
const mcp_1 = require("@mastra/mcp");
const resource_1 = __importDefault(require("./resource"));
const index_1 = require("../tools/index");
const fs_1 = require("fs");
const node_path_1 = __importDefault(require("node:path"));
const textSummarizeAgent_1 = require("../agents/textSummarizeAgent");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: "." });
// Read version from package.json
const version = JSON.parse((0, fs_1.readFileSync)(node_path_1.default.resolve(process.cwd(), "package.json"), "utf8")).version;
// --- Create and configure the MCP server ---
const server = new mcp_1.MCPServer({
    name: "study-assistant",
    version,
    description: "MCP Server for AI Study Assistant: Provides summarization, context-aware QA, and flashcard generation tools.",
    tools: {
        summarize: index_1.summarizeResourceTool,
        // qa: qaTool,
        // flashcards: flashcardsTool,
    },
    resources: resource_1.default,
    agents: {
        textSummarizeAgent: textSummarizeAgent_1.textSummarizeAgent
    }
});
exports.server = server;
// --- Start server based on transport type ---
const main = async () => {
    const transport = process.env.MCP_TRANSPORT || "stdio";
    console.error(`Starting Study Assistant MCP Server v${version} via ${transport}`);
    console.error("Tools: summarize, qa, flashcards");
    console.error("Resources: pdf, txt");
    console.error("Use: Upload → Summarize → Flashcards → QA");
    if (transport === "stdio") {
        await server.startStdio();
    }
    else if (transport === "http") {
        console.error("HTTP transport: Use http-server.ts if implemented.");
        process.exit(1);
    }
    else {
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
//# sourceMappingURL=server.js.map