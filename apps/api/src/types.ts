// Optional: Use Zod to validate the structured content format
import { z } from "zod";
export const OutputPayloadSchema = z.object({
    summary: z.string(),
    style: z.string(),
  });
  

export const summarizeInputSchema = z.object({
    style: z.enum(["concise", "detailed", "exam_prep", "beginner_friendly", "bullet_points"]),
    content: z.string().describe("The study text or content to summarize.").min(10).max(3000),//user content to summarize    
    sessionId: z.string().describe("The session id."),//uuid string
  });

export const chatInputSchema = z.object({
  message: z.string().min(1).max(4000),
  sessionId: z.string(),
});

export const flashcardInputSchema = z.object({
  content: z.string().min(10).max(4000),
  style: z.enum(["general", "exam", "definitions", "conceptual", "beginner","detailed"]).default("general"),
  sessionId: z.string(),
});

export const FlashcardsOutputSchema = z.object({
  flashcards: z.array(z.object({
    question: z.string(),
    answer: z.string(),
  })),
  style: z.string(),
});