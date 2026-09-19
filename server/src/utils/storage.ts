import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { env } from "../config/env.js";

const UPLOAD_ROOT = path.resolve(env.UPLOAD_DIR || "uploads");

// Ensure upload directory exists synchronously on module init
if (!fs.existsSync(UPLOAD_ROOT)) {
  fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
}

export interface StoredFileResult {
  filename: string;
  url: string;
  sizeBytes: number;
  mimetype: string;
}

/**
 * Persists an in-memory multer file buffer to disk under the configured uploads directory.
 * Returns a clean static web URL path (/uploads/...) to prevent database bloat.
 */
export async function saveUploadedFile(file: Express.Multer.File): Promise<StoredFileResult> {
  const extension = path.extname(file.originalname || "").toLowerCase() || ".jpg";
  const uniqueName = `${uuidv4()}${extension}`;
  const targetPath = path.join(UPLOAD_ROOT, uniqueName);

  await fs.promises.writeFile(targetPath, file.buffer);

  return {
    filename: uniqueName,
    url: `/uploads/${uniqueName}`,
    sizeBytes: file.size || file.buffer.length,
    mimetype: file.mimetype,
  };
}

/**
 * Batch saves multiple uploaded files.
 */
export async function saveUploadedFiles(files: Express.Multer.File[]): Promise<StoredFileResult[]> {
  if (!files || files.length === 0) return [];
  return Promise.all(files.map((f) => saveUploadedFile(f)));
}
