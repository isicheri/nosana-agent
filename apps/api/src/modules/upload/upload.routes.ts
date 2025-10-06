import { Router } from "express";
import { multerUpload } from "src/lib/multer";

const uploadRouter:Router = Router();

uploadRouter.post("/upload",multerUpload.single("pdf"))

export default uploadRouter;