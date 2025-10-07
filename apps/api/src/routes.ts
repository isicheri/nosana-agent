import { Router } from "express";
import sessionsRouter from "./modules/sessions/sessions.routes";
import uploadRouter from "./modules/upload/upload.routes";

const indexRouter:Router = Router();

indexRouter.use("/sessions",sessionsRouter);
indexRouter.use("/uploads",uploadRouter);

export default indexRouter;