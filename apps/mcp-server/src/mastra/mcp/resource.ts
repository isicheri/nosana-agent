import {
  type MCPServerResourceContent,
  type MCPServerResources,
  type Resource,
  type MCPRequestHandlerExtra,
} from "@mastra/mcp";
import { PrismaClient } from "@nosana-agent/db";

const prisma = new PrismaClient();

const resourceHandlers: MCPServerResources = {
  listResources: async ({ extra }: { extra: MCPRequestHandlerExtra }): Promise<Resource[]> => {
    // Extract sessionId from extra.context or extra.session or extra.user depending on how it's passed
    const sessionId = extra.sessionId; // adjust based on your MCP setup

    const whereClause = sessionId
      ? {
          sessions: {
            some: { id: sessionId },
          },
        }
      : {};

    const resources = await prisma.resource.findMany({
      where: whereClause,
      select: {
        id: true,
        filename: true,
        createdAt: true,
      },
    });

    return resources.map((r) => ({
      uri: r.id,
      name: r.filename,
      description: `Uploaded on ${r.createdAt.toISOString()}`,
      mimeType: "text/plain", // TODO: Add mime detection later
    }));
  },

  getResourceContent: async ({ uri }): Promise<MCPServerResourceContent> => {
    const resource = await prisma.resource.findUnique({
      where: { id: uri },
      select: {
        content: true,
        chunks: true,
      },
    });

    if (!resource) {
      throw new Error(`Resource not found: ${uri}`);
    }

    return {
      text: resource.content,
      // chunks: resource.chunks, // optional if needed
    };
  },
};

export default resourceHandlers;
