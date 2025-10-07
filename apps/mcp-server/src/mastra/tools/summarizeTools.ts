import { createTool } from "@mastra/core/tools";
import {z} from "zod"

export  const summarizeResourceTool = createTool({
  id: 'summarize-resource',
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
  

    const result = await agent.generate(([
      {
        role: "user",
        content: `Summarize this study text:\n${resource.content.substring(0,4000)}`
      }
    ]))

    let parsed: {
      tl_dr: string;
      outline: string[];
      sections: string[];
    };


    try {
      parsed = JSON.parse(result.text);
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