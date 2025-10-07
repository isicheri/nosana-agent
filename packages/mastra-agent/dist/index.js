"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentSummarize = void 0;
exports.createStudyAssistantClient = createStudyAssistantClient;
const mcp_1 = require("@mastra/mcp");
const node_path_1 = __importDefault(require("node:path"));
const SummarizeAgent_1 = require("./agents/SummarizeAgent");
function createStudyAssistantClient() {
    const client = new mcp_1.MCPClient({
        id: "study-assistant-client",
        servers: {
            studyAssistant: {
                command: "npx",
                args: [
                    "ts-node",
                    node_path_1.default.resolve(__dirname, "../../../apps/mcp-server/src/index.ts")
                ]
            }
        }
    });
    return client;
}
exports.agentSummarize = (0, SummarizeAgent_1.createSummarizeAgent)();
//# sourceMappingURL=index.js.map