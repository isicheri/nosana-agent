import { Agent } from "@mastra/core";
import {Ollama} from "ollama"

const textSummarizeAgent = new Agent({
    id:"textSummarizeAgent",
    name: "Text Summarization Agent",
    description:  "Summa"
    instructions: "",
    model: [
        {
            model: "",
            maxRetries: 5
        }
    ]
})