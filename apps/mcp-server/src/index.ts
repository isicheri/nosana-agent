import { Mastra } from "@mastra/core";
import { PinoLogger } from "@mastra/loggers";
import { server } from "./mastra/mcp/server";

export const  mastra = new Mastra({
    logger: new PinoLogger({
        name: "Mastra",
        level: "info"
    }),
    mcpServers: {
    studyAssistant: server
    },
    agents: {}
})