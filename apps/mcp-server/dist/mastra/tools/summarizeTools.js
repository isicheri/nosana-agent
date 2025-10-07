"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.summarizeResourceTool = void 0;
const tools_1 = require("@mastra/core/tools");
const zod_1 = require("zod");
exports.summarizeResourceTool = (0, tools_1.createTool)({
    id: 'summarize-resource',
    description: 'Generates a structured summary (outline, TL;DR, sections) from a text resource.',
    inputSchema: zod_1.z.object({
        resourceId: zod_1.z.string().describe('The ID of the resource to summarize.'),
    }),
    outputSchema: zod_1.z.object({
        summaryId: zod_1.z.string(),
        outline: zod_1.z.array(zod_1.z.any()),
        tl_dr: zod_1.z.string(),
        sections: zod_1.z.array(zod_1.z.any()),
    }),
    // @ts-expect-error TODO MCPTool type is not compatible with createTool
    execute: async ({ context, mastra, prisma }) => {
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
                content: `Summarize this study text:\n${resource.content.substring(0, 4000)}`
            }
        ]));
        let parsed;
        try {
            parsed = JSON.parse(result.text);
        }
        catch (err) {
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
//# sourceMappingURL=summarizeTools.js.map