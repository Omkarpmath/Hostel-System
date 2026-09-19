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
export const uploadCsv = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype === "text/csv" ||
            file.mimetype === "application/vnd.ms-excel" ||
            file.mimetype === "text/plain" ||
            file.originalname.toLowerCase().endsWith(".csv")) {
            cb(null, true);
        }
        else {
            cb(new Error("Invalid file type. Only CSV files (.csv) are allowed."));
        }
    },
});
//# sourceMappingURL=upload.middleware.js.map