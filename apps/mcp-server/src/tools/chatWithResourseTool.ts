import { createTool } from "@mastra/core";
import { z } from "zod";
import { PrismaClient } from "@nosana-agent/db";
import { textSummarizeAgent } from "../agents/textSummarizeAgent";

const prisma = new PrismaClient();

export const chatWithResourceTool = createTool({
  id: "chat-with-resource-tool",
  description: "Answer questions about study materials using ALL available resources, summaries, and conversation history as context. Provides intelligent, contextual responses based on the student's complete learning history.",
  
  inputSchema: z.object({
    sessionId: z.string().describe('The ID of the study session'),
    question: z.string().describe('The question to answer about the study material'),
    resourceIds: z.array(z.string()).optional().describe('Specific resource IDs to focus on (optional - if not provided, uses all session resources)')
  }),
  
  outputSchema: z.object({
    messageId: z.string(),
    answer: z.string(),
    resourcesUsed: z.array(z.object({
      id: z.string(),
      filename: z.string(),
      hasSummary: z.boolean()
    })),
    relatedConcepts: z.array(z.string()).optional().describe('Related topics from other materials'),
    conversationContext: z.string().optional().describe('Recent conversation summary')
  }),
  
  execute: async ({ context }) => {
    const { sessionId, question, resourceIds } = context;

    console.log(`💬 Chat Tool: Answering question in session ${sessionId}...`);

    // Fetch the session with FULL context
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        resources: {
          include: {
            summaries: {
              orderBy: { generatedAt: 'desc' },
              take: 1 // Most recent summary for each resource
            }
          }
        },
        history: {
          orderBy: { createdAt: 'asc' }, // Chronological order for context
          take: 20 // Last 20 messages for full conversation context
        },
        user: {
          select: {
            username: true,
            profile: { select: { fullname: true } }
          }
        }
      }
    });

    if (!session) {
      throw new Error('❌ Session not found');
    }

    // Filter resources if specific IDs provided, otherwise use ALL session resources
    let relevantResources = session.resources;
    if (resourceIds && resourceIds.length > 0) {
      relevantResources = relevantResources.filter(r => resourceIds.includes(r.id));
    }

    if (relevantResources.length === 0) {
      throw new Error('❌ No resources available in this session. Please upload study materials first.');
    }

    // ========== BUILD COMPREHENSIVE CONTEXT ==========
    
    // 1. Conversation History Context
    const conversationHistory = session.history
      .map(msg => `${msg.role.toUpperCase()}: ${msg.text}`)
      .join('\n');

    const recentContext = session.history.length > 0
      ? `\n--- RECENT CONVERSATION (Last ${session.history.length} messages) ---\n${conversationHistory}\n`
      : '';

    // 2. Resource Context with Summaries AND Content
    const resourceContexts: string[] = [];
    const resourceMetadata: Array<{ id: string; filename: string; hasSummary: boolean }> = [];
    const allConcepts = new Set<string>();

    for (const resource of relevantResources) {
      const hasSummary = resource.summaries.length > 0;
      resourceMetadata.push({
        id: resource.id,
        filename: resource.filename,
        hasSummary
      });

      let resourceContext = `\n========== RESOURCE: ${resource.filename} ==========\n`;

      // Add summary first (if available) - more structured
      console.log('🔍 Summary:', resource.summaries);
      

      if (hasSummary) {
        const summary = resource.summaries[0];
        console.log('🔍 Summary:', summary);
        if (!summary) {
          throw new Error('❌ Summary not found');
        }

        const outline = typeof summary.outline === 'string'
          ? summary.outline
          : JSON.stringify(summary.outline, null, 2);
        console.log('🔍 Outline:', outline);
        resourceContext += `\n--- SUMMARY ---\n${outline}\n`;

        // Extract concepts from outline for cross-referencing
        if (Array.isArray(summary.outline)) {
          summary.outline.forEach((item: any) => {
            if (typeof item === 'string') {
              allConcepts.add(item);
            }
          });
        }
      }

      // Add relevant content chunks for detailed context
      if (resource.chunks && resource.chunks.length > 0) {
        // Use more chunks for better context (up to 5)
        const relevantChunks = resource.chunks.slice(0, 5);
        resourceContext += `\n--- DETAILED CONTENT ---\n${relevantChunks.join('\n\n...\n\n')}`;
      } else if (resource.content) {
        // Fallback to raw content (truncated)
        const maxLength = 3000;
        const truncatedContent = resource.content.length > maxLength
          ? resource.content.substring(0, maxLength) + '\n\n[Content truncated for length...]'
          : resource.content;
        resourceContext += `\n--- CONTENT ---\n${truncatedContent}`;
      }

      resourceContexts.push(resourceContext);
    }

    const fullContext = resourceContexts.join('\n\n');

    // 3. Cross-Reference Related Concepts
    const relatedConcepts = Array.from(allConcepts).filter(concept => 
      question.toLowerCase().includes(concept.toLowerCase())
    );

    // ========== GENERATE INTELLIGENT RESPONSE ==========

    const userName = session.user?.profile?.fullname || session.user?.username || 'Student';

    const prompt = `You are a knowledgeable study assistant helping ${userName}.

${recentContext}

CURRENT QUESTION: "${question}"

AVAILABLE STUDY MATERIALS:
${fullContext}

${relatedConcepts.length > 0 ? `\nRELATED CONCEPTS ACROSS MATERIALS:\n${relatedConcepts.join(', ')}\n` : ''}

INSTRUCTIONS:
1. Answer the question using the study materials provided
2. If the answer spans multiple resources, connect the concepts
3. Reference specific materials when relevant: "According to [filename]..."
4. If information is in the conversation history, acknowledge it: "As we discussed earlier..."
5. If the question relates to previous topics, make connections: "This relates to [previous topic]..."
6. If the answer isn't in the materials, say so clearly but offer related information
7. Be conversational, clear, and encouraging
8. Use examples or analogies when helpful
9. End with a follow-up question or offer to explain more

Provide a comprehensive, helpful answer that demonstrates understanding of their complete learning context.`;

    const result = await textSummarizeAgent.generate([
      {
        role: "user",
        content: prompt
      }
    ]);

    const answer = result.text;

    // ========== SAVE TO CONVERSATION HISTORY ==========

    // Save user question
    await prisma.message.create({
      data: {
        sessionId,
        role: 'user',
        text: question,
        createdAt: new Date()
      }
    });

    // Save agent answer
    const agentMessage = await prisma.message.create({
      data: {
        sessionId,
        role: 'agent',
        text: answer,
        createdAt: new Date()
      }
    });

    // Update session timestamp
    await prisma.session.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() }
    });

    // Create conversation context summary for agent
    const contextSummary = session.history.length > 0
      ? `Previous conversation covered: ${session.history.slice(-3).map(m => 
          m.role === 'user' ? `Q: ${m.text.substring(0, 50)}...` : `A: ${m.text.substring(0, 50)}...`
        ).join(' | ')}`
      : 'First question in this session';

    console.log(`✅ Answered question using ${resourceMetadata.length} resources`);
    console.log(`📚 Resources used: ${resourceMetadata.map(r => r.filename).join(', ')}`);

    return {
      messageId: agentMessage.id,
      answer,
      resourcesUsed: resourceMetadata,
      relatedConcepts: relatedConcepts.length > 0 ? relatedConcepts : undefined,
      conversationContext: contextSummary
    };
  }
});