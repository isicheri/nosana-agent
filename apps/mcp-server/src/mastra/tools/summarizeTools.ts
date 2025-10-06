import { createTool } from "@mastra/core/tools";
import {z} from "zod"

export  const summarizeResourceTool = createTool({
  id: 'summarize-resourse',
  description: 'Generates a structured summary (outline, TL;DR, sections) from a text resource.',
  inputSchema: z.object({
    resourceId: z.string().describe('The ID of the resource to summarize.'),
  }),
  outputSchema: z.object({
    summaryId: z.string(),
    outline: z.array(z.any()),
    tl_dr: z.string(),
    sections: z.array(z.any()),
  }),
  // @ts-expect-error TODO MCPTool type is not compatible with createTool
  execute: async ({ context, mastra,prisma }) => {
    const { resourceId } = context;

     if (!mastra) {
      throw new Error('Mastra context is not available.');
    }

    console.log(`📄 Summarize Tool: Fetching resource ${resourceId}...`);
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
    });
 if (!resource || !resource.content) {
    throw new Error('❌ Resource not found or has no content.');
  }

  
    const agent = mastra.getAgent('textSummarizeAgent');

 if (!agent) {
      throw new Error('Summarization agent "textSummarizeAgent" not found.');
    }

    const prompt = `
Please summarize the following text.

- First, generate a TL;DR (max 3 sentences).
- Then provide a high-level outline using bullet points.
- Finally, break it into 2–3 detailed sections for study.

Format the output as JSON like:
{
  "tl_dr": "...",
  "outline": ["point 1", "point 2", "..."],
  "sections": ["Section 1 text...", "Section 2 text..."]
}

Text:
${resource.content.substring(0, 4000)}
`;

const response = await agent.generate(prompt);

    let parsed: {
      tl_dr: string;
      outline: string[];
      sections: string[];
    };

    try {
      parsed = JSON.parse(response.text);
    } catch (err) {
      throw new Error('Failed to parse summary JSON from agent response.');
    }

  const summary = await prisma.summary.create({
    data: {
      resourceId,
      outline: parsed.outline,
      generatedAt: new Date()
    },
  });

  return {
    summaryId: summary.id,
    outline: parsed.outline,
    tl_dr: parsed.tl_dr,
    sections: parsed.sections,
  };
  },
});