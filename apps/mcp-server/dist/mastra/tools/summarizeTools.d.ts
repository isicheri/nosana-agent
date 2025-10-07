import { z } from "zod";
export declare const summarizeResourceTool: import("@mastra/core/tools").Tool<z.ZodObject<{
    resourceId: z.ZodString;
}, z.core.$strip>, z.ZodObject<{
    summaryId: z.ZodString;
    outline: z.ZodArray<z.ZodAny>;
    tl_dr: z.ZodString;
    sections: z.ZodArray<z.ZodAny>;
}, z.core.$strip>, any, any, import("@mastra/core/tools").ToolExecutionContext<z.ZodObject<{
    resourceId: z.ZodString;
}, z.core.$strip>, any, any>> & {
    inputSchema: z.ZodObject<{
        resourceId: z.ZodString;
    }, z.core.$strip>;
    outputSchema: z.ZodObject<{
        summaryId: z.ZodString;
        outline: z.ZodArray<z.ZodAny>;
        tl_dr: z.ZodString;
        sections: z.ZodArray<z.ZodAny>;
    }, z.core.$strip>;
    execute: (context: import("@mastra/core/tools").ToolExecutionContext<z.ZodObject<{
        resourceId: z.ZodString;
    }, z.core.$strip>, any, any>, options: import("@mastra/core/tools").ToolInvocationOptions) => Promise<any>;
};
//# sourceMappingURL=summarizeTools.d.ts.map