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
export declare function saveUploadedFile(file: Express.Multer.File): Promise<StoredFileResult>;
/**
 * Batch saves multiple uploaded files.
 */
export declare function saveUploadedFiles(files: Express.Multer.File[]): Promise<StoredFileResult[]>;
//# sourceMappingURL=storage.d.ts.map