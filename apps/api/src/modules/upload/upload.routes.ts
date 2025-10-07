import { Router } from "express";
import multer from "multer";
import { multerUpload } from "../../lib/multer";
import { uploadRouterController } from "./upload.controller";

const uploadRouter:Router = Router();
const {uploadResource} = uploadRouterController();

uploadRouter.post("/upload",
    (req, res, next) => {
  multerUpload.single("pdf")(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        // Multer-specific errors (e.g. file too large)
        return res.status(400).json({ error: err.message });
      }
      // Unknown error
      return res.status(500).json({ error: err.message });
    }
    next();
  });
}
    ,uploadResource);

export default uploadRouter;