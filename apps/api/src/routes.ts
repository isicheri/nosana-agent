import { Router } from "express";
import sessionsRouter from "./modules/sessions/sessions.routes";
import uploadRouter from "./modules/upload/upload.routes";
import summaryRouter from "./modules/summary/summary.routes";

const indexRouter:Router = Router();

indexRouter.use("/sessions",sessionsRouter);
indexRouter.use("/uploads",uploadRouter);
indexRouter.use("/summary",summaryRouter);

export default indexRouter;