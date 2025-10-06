import type { Request, Response } from "express";
import { extractTextFromPDF } from "src/lib/extractpdftotext";


interface IuploadRouterController {
    uploadResource: (req:Request,res:Response) => Promise<void>
}

function uploadRouterController(): IuploadRouterController {
// resourceService.create()
return {
    uploadResource: async (req,res) => {
     const file = req.file;
    // const sessionId = req.body.sessionId || generateSessionId();
    if (!file) {
      res.status(400).json({ error: 'No file uploaded' });
      return
    }
    // const content = extractTextFromPDF(file)

    }
}
}