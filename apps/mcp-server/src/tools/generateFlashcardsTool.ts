import { createTool } from "@mastra/core";
import { z } from "zod";
import { PrismaClient } from "@nosana-agent/db";
import { textSummarizeAgent } from "../agents/textSummarizeAgent";

const prisma = new PrismaClient();

export const generateFlashcardsTool = createTool({
  id: "generate-flashcards-tool",
  description: "Generates study flashcards from an existing summary for spaced repetition learning",
  
  inputSchema: z.object({
    summaryId: z.string().describe('The ID of the summary to generate flashcards from'),
    count: z.number().optional().default(10).describe('Number of flashcards to generate'),
    difficulty: z.enum(['easy', 'medium', 'hard', 'mixed']).optional().default('mixed').describe('Target difficulty level')
  }),
  
  outputSchema: z.object({
    flashcardSetId: z.string(),
    cards: z.array(z.object({
      question: z.string(),
      answer: z.string(),
      difficulty: z.enum(['easy', 'medium', 'hard'])
    })),
    count: z.number()
  }),
  
  execute: async ({ context }) => {
    const { summaryId, count, difficulty } = context;

    console.log(`🃏 Flashcards Tool: Generating ${count} flashcards (${difficulty}) for summary ${summaryId}...`);

    // Fetch the summary with its resource content
    const summary = await prisma.summary.findUnique({
      where: { id: summaryId },
      include: {
        resource: { select: { content: true, filename: true } }
      }
    });

    if (!summary) {
      throw new Error('❌ Summary not found');
    }

    // Prepare content for flashcard generation
    const summaryContent = typeof summary.outline === 'string' 
      ? summary.outline 
      : JSON.stringify(summary.outline);
    
    // Use a portion of original content for better context
    const maxContentLength = 2000;
    const resourceContent = summary.resource.content.length > maxContentLength
      ? summary.resource.content.substring(0, maxContentLength) + "..."
      : summary.resource.content;

    const prompt = `Create ${count} study flashcards from this material.

SUMMARY OUTLINE:
${summaryContent}

ORIGINAL CONTENT:
${resourceContent}

Requirements:
- Generate exactly ${count} flashcards
- Difficulty level: ${difficulty === 'mixed' ? 'mix of easy, medium, and hard' : difficulty}
- Focus on key concepts, definitions, and important facts
- Questions should test understanding, not just memorization
- Answers should be concise but complete

Return ONLY valid JSON array (no markdown, no additional text):
[
  {
    "question": "Question text here",
    "answer": "Answer text here",
    "difficulty": "easy|medium|hard"
  }
]`;

    const result = await textSummarizeAgent.generate([
      {
        role: "user",
        content: prompt
      }
    ]);

    // Parse the flashcards
    let cards: Array<{ question: string; answer: string; difficulty: 'easy' | 'medium' | 'hard' }>;
    
    try {
      const parsed = JSON.parse(result.text);
      cards = Array.isArray(parsed) ? parsed : parsed.cards || [];
      
      // Validate structure
      if (!Array.isArray(cards) || cards.length === 0) {
        throw new Error('No valid flashcards generated');
      }

      // Ensure each card has required fields
      cards = cards.map((card, idx) => ({
        question: card.question || `Question ${idx + 1}`,
        answer: card.answer || 'No answer provided',
        difficulty: ['easy', 'medium', 'hard'].includes(card.difficulty) 
          ? card.difficulty 
          : 'medium'
      }));

    } catch (err) {
      console.error('Flashcard Parse Error:', err);
      console.error('Agent Response:', result.text);
      throw new Error(`Failed to parse flashcards JSON: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }

    // Save to database
    const flashcardSet = await prisma.flashCardSet.create({
      data: {
        summaryId,
        cards: cards, // Stored as JSON
        generatedAt: new Date()
      }
    });

    console.log(`✅ Generated ${cards.length} flashcards (Set ID: ${flashcardSet.id})`);

    return {
      flashcardSetId: flashcardSet.id,
      cards,
      count: cards.length
    };
  }
});