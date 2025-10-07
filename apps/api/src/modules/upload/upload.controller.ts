import type {Request,Response} from "express"
import { extractTextFromPDF } from "../../lib/extractpdftotext";
import { UploadService } from "./upload.service";
import { sendEventToSession } from "../../ws/webSocket"
import fs from "fs";

interface IuploadRouterController { uploadResource: (req:Request,res:Response) => Promise<void> }

export function uploadRouterController(): IuploadRouterController {

function chunkText(text: string, maxLength = 1000): string[] {
  const paragraphs = text.split(/\n\s*\n/); // split by double newline (paragraphs)
  const chunks: string[] = [];
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    if ((currentChunk + paragraph).length > maxLength) {
      chunks.push(currentChunk.trim());
      currentChunk = '';
    }
    currentChunk += paragraph + '\n\n';
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

  return {
    uploadResource: async (req, res) => {
      const file = req.file;
      const sessionId = req.body.sessionId;

      if (!file || !sessionId) {
        res.status(400).json({ error: 'Missing file or sessionId' });
        return;
      }

      let content = "";
      try {
        if (file.mimetype === "application/pdf") {
         const buffer = fs.readFileSync(file.path); // ✅ Read from disk
    content = (await extractTextFromPDF(buffer)).extractedText;
        }  else {
            res.status(400).json({ error: "Unsupported file type..we support only pdf for now" });
            return
        }
      } catch (err) {
          res.status(500).json({ error: "Failed to extract text",err:err });
        return 
      }

      const chunks = chunkText(content);
      const filename = file.originalname.toString();

      // Save to DB using UploadService
      const uploadService = UploadService.default();
      const resource = await uploadService.upload(
        filename,
        content,
        sessionId,
        chunks
      )

      // Emit real-time event
      sendEventToSession(sessionId, "resource:uploaded", {
        resourceId: resource.id,
        filename: file.originalname,
      });

      // Respond
      res.status(201).json({
        sessionId,
        resourceId: resource.id,
      });
    },
  };
}
