import multer from 'multer';
import path from 'path';

// Set up storage
const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, 'pdfs/');
  },
  filename: function (_req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// Filter only PDFs
function fileFilter(_req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  }else if (file.size > 5 * 1024) {
  cb(new Error("file must not be greater than 5mb."))
  } else {
    cb(new Error('Only PDF files are allowed!'));
  }
}

export const multerUpload = multer({ storage, fileFilter });
