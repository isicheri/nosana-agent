import type { Session } from "@nosana-agent/db";
import { type Request, type Response } from "express";
import { SessionsService } from "./sessions.service"
import uuid from "uuid";


interface IsessionsRouterController {
    createSession: (req:Request,res:Response) => Promise<void>,
    createGuestSession: (req:Request,res:Response) => Promise<void>
}

export function sessionsRouterController(): IsessionsRouterController {

    const sessionsService = SessionsService.default();

return {
    createSession: async (req,res) => {
      let id = uuid.v4();
        let userId = `${req.body.userId}-${id}`;
        //Todo: pass proper validatin here
        if(!userId) {
          return;
        }
        try {
      let session =   await sessionsService.create(userId)
      res.status(200).json({
        success: true,
        data: {
            session
        },
        message: "session successfully created"
      })
        } catch (error) {
            res.status(400).json({
        success: false,
        data: error,
        message: "something went wrong"
      }) 
        }
    },
     createGuestSession: async (_req: Request, res: Response) => {
    try {
      const session = await sessionsService.createGuestSession();
      res.status(201).json({
        success: true,
        sessionId: session.id,
        createdAt: session.createdAt,
      });
      return;
    } catch (error) {
      console.error("Failed to create session:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create guest session",
      });
      return;
    }
  },
}
}