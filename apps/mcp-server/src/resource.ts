import {
    MCPServerResourceContent,
    MCPServerResources,
    Resource,
  } from "@mastra/mcp";
  
  import { prisma } from "@nosana-agent/db";


  const resourceHandlers: MCPServerResources = {
    list: async () => {
      const resources = await prisma.resource.findMany({
          select: {
            id: true,
            filename: true,
            createdAt: true,
            _count: {
              select: {
                summaries: true,
                sessions: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        });
        
        return resources.map(r => ({
          uri: `study://resources/${r.id}`,
          name: r.filename,
          description: `Created ${r.createdAt.toISOString()} | ${r._count.summaries} summaries | ${r._count.sessions} sessions`,
          mimeType: "application/json"
        }));
      },
      
      read: async (uri: string) => {
        const id = uri.split('/').pop();
        if (!id) throw new Error('Invalid resource URI');
        
        const resource = await prisma.resource.findUnique({
          where: { id },
          include: {
            summaries: true,
            sessions: {
              select: { id: true, createdAt: true }
            }
          }
        });
        
        if (!resource) throw new Error('Resource not found');
        
        return {
          contents: [{
            uri,
            mimeType: "application/json",
            text: JSON.stringify({
              id: resource.id,
              filename: resource.filename,
              content: resource.content,
              chunks: resource.chunks,
              summaryCount: resource.summaries.length,
              sessionCount: resource.sessions.length,
              createdAt: resource.createdAt
            }, null, 2)
          }]
        };
      }
    },
    
    // AI-Generated Summaries
    summaries: {
      uri: "study://summaries",
      name: "Generated Summaries",
      description: "AI-generated summaries with outlines and key sections",
      mimeType: "application/json",
      
      list: async () => {
        const summaries = await prisma.summary.findMany({
          include: {
            resource: { select: { filename: true } },
            _count: { select: { flashcardSets: true } }
          },
          orderBy: { generatedAt: 'desc' }
        });
        
        return summaries.map(s => ({
          uri: `study://summaries/${s.id}`,
          name: `Summary: ${s.resource.filename}`,
          description: `Generated ${s.generatedAt.toISOString()} | ${s._count.flashcardSets} flashcard sets`,
          mimeType: "application/json"
        }));
      },
      
      read: async (uri: string) => {
        const id = uri.split('/').pop();
        if (!id) throw new Error('Invalid summary URI');
        
        const summary = await prisma.summary.findUnique({
          where: { id },
          include: {
            resource: { select: { filename: true } },
            flashcardSets: true
          }
        });
        
        if (!summary) throw new Error('Summary not found');
        
        return {
          contents: [{
            uri,
            mimeType: "application/json",
            text: JSON.stringify({
              id: summary.id,
              resourceId: summary.resourceId,
              resourceName: summary.resource.filename,
              outline: summary.outline,
              flashcardSets: summary.flashcardSets.map(fs => ({
                id: fs.id,
                generatedAt: fs.generatedAt
              })),
              generatedAt: summary.generatedAt
            }, null, 2)
          }]
        };
      }
    },
    
    // Flashcard Sets
    flashcards: {
      uri: "study://flashcards",
      name: "Flashcard Sets",
      description: "Generated flashcard sets for spaced repetition learning",
      mimeType: "application/json",
      
      list: async () => {
        const flashcardSets = await prisma.flashCardSet.findMany({
          include: {
            summary: {
              include: {
                resource: { select: { filename: true } }
              }
            }
          },
          orderBy: { generatedAt: 'desc' }
        });
        
        return flashcardSets.map(fs => ({
          uri: `study://flashcards/${fs.id}`,
          name: `Flashcards: ${fs.summary.resource.filename}`,
          description: `Generated ${fs.generatedAt.toISOString()}`,
          mimeType: "application/json"
        }));
      },
      
      read: async (uri: string) => {
        const id = uri.split('/').pop();
        if (!id) throw new Error('Invalid flashcard set URI');
        
        const flashcardSet = await prisma.flashCardSet.findUnique({
          where: { id },
          include: {
            summary: {
              include: {
                resource: { select: { filename: true } }
              }
            }
          }
        });
        
        if (!flashcardSet) throw new Error('Flashcard set not found');
        
        return {
          contents: [{
            uri,
            mimeType: "application/json",
            text: JSON.stringify({
              id: flashcardSet.id,
              summaryId: flashcardSet.summaryId,
              resourceName: flashcardSet.summary.resource.filename,
              cards: flashcardSet.cards,
              generatedAt: flashcardSet.generatedAt
            }, null, 2)
          }]
        };
      }
    },
    
    // Study Sessions (chat history)
    sessions: {
      uri: "study://sessions",
      name: "Study Sessions",
      description: "Interactive study sessions with chat history and connected resources",
      mimeType: "application/json",
      
      list: async () => {
        const sessions = await prisma.session.findMany({
          include: {
            _count: {
              select: {
                history: true,
                resources: true
              }
            },
            user: {
              select: {
                username: true,
                profile: { select: { fullname: true } }
              }
            }
          },
          orderBy: { updatedAt: 'desc' }
        });
        
        return sessions.map(s => ({
          uri: `study://sessions/${s.id}`,
          name: `Session by ${s.user?.profile?.fullname || s.user?.username || 'Anonymous'}`,
          description: `${s._count.history} messages | ${s._count.resources} resources | Updated ${s.updatedAt.toISOString()}`,
          mimeType: "application/json"
        }));
      },
      
      read: async (uri: string) => {
        const id = uri.split('/').pop();
        if (!id) throw new Error('Invalid session URI');
        
        const session = await prisma.session.findUnique({
          where: { id },
          include: {
            history: {
              orderBy: { createdAt: 'asc' }
            },
            resources: {
              select: { id: true, filename: true }
            },
            user: {
              select: {
                username: true,
                profile: { select: { fullname: true, email: true } }
              }
            }
          }
        });
        
        if (!session) throw new Error('Session not found');
        
        return {
          contents: [{
            uri,
            mimeType: "application/json",
            text: JSON.stringify({
              id: session.id,
              userId: session.userId,
              user: session.user,
              history: session.history,
              resources: session.resources,
              createdAt: session.createdAt,
              updatedAt: session.updatedAt
            }, null, 2)
          }]
        };
      }
  };
  
  export default resourceHandlers;