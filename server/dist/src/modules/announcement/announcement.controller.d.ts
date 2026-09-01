import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware.js";
export declare class AnnouncementController {
    private user;
    list(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    my(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    stats(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    create(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    update(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    markRead(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    markAllRead(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
export declare const announcementController: AnnouncementController;
//# sourceMappingURL=announcement.controller.d.ts.map