"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSummarizeAgent = createSummarizeAgent;
const core_1 = require("@mastra/core");
function createSummarizeAgent() {
    return new core_1.Agent({
        name: "PDF Summarizer Agent",
        description: "An agent specialized in summarizing PDF content. It can extract key points, outlines, and sections from study materials. This agent also has access to the database for enhanced context and reference.",
        instructions: `
      You are a helpful assistant for summarizing PDF study resources.
      Use the available MCP tools to analyze and summarize content.
      You have access to a database for additional context and information.
      Always return concise summaries, outlines, and key sections.
    `,
        model: "llama2",
    });
}
//# sourceMappingURL=SummarizeAgent.js.map