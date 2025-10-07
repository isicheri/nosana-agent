import { Agent } from "@mastra/core";

export const textSummarizeAgent = new Agent({
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