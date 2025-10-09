import { Request,Response } from "express"


interface IsummaryRouterController { createSummary: (req:Request,res:Response) => Promise<void> }

export function summaryRouterController(): IsummaryRouterController {


    return {
        createSummary: async(req,res) => { 
        },
    }
}
