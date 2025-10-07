import { Request,Response } from "express"
import {createStudyAssistantClient,agentSummarize} from "@nosana-agent/mastra-agent";

interface IsummaryRouterController { createSummary: (req:Request,res:Response) => Promise<void> }

export function summaryRouterController(): IsummaryRouterController {

    const client = createStudyAssistantClient();
    const agent = agentSummarize;


    return {
        createSummary: async(req,res) => { 
            const toolsets = await client.getToolsets();
            const agentResponse = await agentSummarize.generateVNext(  `Summarize the pdf content for me`,{toolsets})
           

            res.json(agentResponse)
        },
    }
}
