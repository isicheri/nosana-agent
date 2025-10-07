"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.textSummarizeAgent = void 0;
const core_1 = require("@mastra/core");
exports.textSummarizeAgent = new core_1.Agent({
    name: "textSummarizeAgent",
    description: "Summarize study resources into concise outlines and key sections.",
    model: [
        {
            maxRetries: 5,
            model: "llama2"
        }
    ],
    instructions: `
    You are a helpful academic summarization assistant.
    summarize long study materials into Tl;DRs, outlines, and key
    sections.
    Return output strictly in JSON: {
    "tl_dr": "..",
    "outline": ["point 1","point 2","..."],
    "sections": ["Section 1 text..","Section 2"]
    }
    `
});
//# sourceMappingURL=textSummarizeAgent.js.map