import { createTool } from "@mastra/core";
import { z } from "zod";
import { PrismaClient } from "@nosana-agent/db";

const prisma = new PrismaClient();

async function getById(resourceId: string) {
  return await prisma.resource.findUnique({ where: { id: resourceId } });
}

// Helper function to clean JSON string from agent response
function cleanJsonResponse(text: string): string {
  // Remove markdown code blocks
  let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
  
  // Remove leading/trailing whitespace
  cleaned = cleaned.trim();
  
  // If there are multiple JSON objects, take the first one
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  
  return cleaned;
}

export const summarizeContentTool = createTool({
  id: "summarize-content-tool",
  description: "Generates a structured summary (outline, TL;DR, sections) from a database resource schema content field.",
  inputSchema: z.object({
    resourceId: z.string().describe('The ID of the resource to summarize.'),
  }),
  outputSchema: z.object({
    summaryId: z.string(),
    outline: z.array(z.string()),
    tl_dr: z.string(),
    sections: z.array(z.string()),
  }),
  execute: async ({ context }) => {
    const { resourceId } = context;

    console.log(`📄 Summarize Tool: Fetching resource ${resourceId}...`);

    const resource = await getById(resourceId);
    if (!resource || !resource.content) {
      throw new Error('❌ Resource not found or has no content.');
    }

    // Dynamic content length handling
    const maxLength = 4000;
    const content = resource.content.length > maxLength
      ? resource.content.substring(0, maxLength) + "..."
      : resource.content;

    // Import the agent dynamically to avoid circular dependencies
    const { textSummarizeAgent } = await import("../agents/textSummarizeAgent");

    const result = await textSummarizeAgent.generate([
      {
        role: "user",
        content: `Summarize this study text:\n${content}`
      }
    ]);

    console.log('🤖 Agent Response:', result.text);

    // Clean the response
    const cleanedText = cleanJsonResponse(result.text);
    console.log('🔍 Cleaned JSON Text:', cleanedText);

    let parsed: {
      tl_dr: string;
      outline: string[];
      sections: string[];
    };

    try {
      parsed = JSON.parse(cleanedText);
    } catch (err) {
      console.error('JSON Parse Error:', err);
      console.error('Agent Response:', result.text);
      console.error('Attempted to parse:', cleanedText);
      
      // Fallback: Try to extract information manually
      throw new Error(
        `Failed to parse summary JSON: ${err instanceof Error ? err.message : 'Unknown error'}. ` +
        `Agent returned invalid JSON. This usually means the AI model needs clearer instructions.`
      );
    }

    // Validate the parsed structure
    if (!parsed.tl_dr || !Array.isArray(parsed.outline) || !Array.isArray(parsed.sections)) {
      console.error('Invalid structure:', parsed);
      throw new Error(
        'Invalid summary structure returned by agent - missing required fields. ' +
        `Got: ${JSON.stringify(Object.keys(parsed))}`
      );
    }

    // Ensure arrays contain strings
    if (parsed.outline.some(item => typeof item !== 'string')) {
      console.error('Invalid outline items:', parsed.outline);
      throw new Error('Outline must be an array of strings');
    }

    if (parsed.sections.some(item => typeof item !== 'string')) {
      console.error('Invalid section items:', parsed.sections);
      throw new Error('Sections must be an array of strings');
    }

    // Save to database
    const summary = await prisma.summary.create({
      data: {
        resourceId,
        outline: parsed, // Store the entire parsed object as JSON
        generatedAt: new Date()
      },
    });

    console.log(`✅ Summary created successfully (ID: ${summary.id})`);

    return {
      summaryId: summary.id,
      outline: parsed.outline,
      tl_dr: parsed.tl_dr,
      sections: parsed.sections,
    };
  }
});