import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth.middleware.js";
export declare class MessEntryController {
    /**
     * Verify dynamic QR token and record entry.
     */
    verify(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Get current security guard's assigned mess and today's entry statistics.
     */
    getStats(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * List available messes for assignment/selection dropdown.
     */
    listMesses(_req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    /**
     * Get mess entries (Admin / Reporting).
     */
    getEntries(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
}
export declare const messEntryController: MessEntryController;
//# sourceMappingURL=mess-entry.controller.d.ts.map