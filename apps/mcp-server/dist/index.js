"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mastra = void 0;
const core_1 = require("@mastra/core");
const loggers_1 = require("@mastra/loggers");
const server_1 = require("./mastra/mcp/server");
exports.mastra = new core_1.Mastra({
    logger: new loggers_1.PinoLogger({
        name: "Mastra",
        level: "info"
    }),
    mcpServers: {
        studyAssistant: server_1.server
    }
});
//# sourceMappingURL=index.js.map