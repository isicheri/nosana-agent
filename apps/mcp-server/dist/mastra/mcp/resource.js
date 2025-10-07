"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("@nosana-agent/db");
const prisma = new db_1.PrismaClient();
const resourceHandlers = {
    listResources: async ({ extra }) => {
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
    getResourceContent: async ({ uri }) => {
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
exports.default = resourceHandlers;
//# sourceMappingURL=resource.js.map