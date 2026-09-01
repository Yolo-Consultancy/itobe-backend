import multer from "multer";
import { AppError } from "../utils/api-error.js";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "audio/mpeg",
    "audio/mp3",
    "audio/wav",
    "application/pdf",
    "application/epub+zip",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(`Type de fichier non supporté: ${file.mimetype}`, 400), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 Mo max
  },
});
