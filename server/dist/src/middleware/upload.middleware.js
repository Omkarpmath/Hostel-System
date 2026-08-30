import multer from "multer";
import { env } from "../config/env.js";
const storage = multer.memoryStorage();
const fileFilter = (_req, file, cb) => {
    const allowedMimeTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "application/pdf",
        "video/mp4",
        "video/quicktime",
        "video/webm",
    ];
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error("Invalid file type. Only images, videos, and PDFs are allowed."));
    }
};
export const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: env.MAX_FILE_SIZE,
    },
});
//# sourceMappingURL=upload.middleware.js.map