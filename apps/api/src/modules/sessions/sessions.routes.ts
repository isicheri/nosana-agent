import { Router } from "express";
import {sessionsRouterController} from "./sessions.controller";
const sessionsRouter:Router  = Router();
const {
    createGuestSession
} = sessionsRouterController();
sessionsRouter.post("/guest",createGuestSession);

export default sessionsRouter;