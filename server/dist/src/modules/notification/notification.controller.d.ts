import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware.js";
export declare class NotificationController {
    private user;
    list(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    unreadCount(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    markRead(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    markAllRead(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
export declare const notificationController: NotificationController;
//# sourceMappingURL=notification.controller.d.ts.map