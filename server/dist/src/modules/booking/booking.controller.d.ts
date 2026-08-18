import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware.js";
export declare class BookingController {
    private userId;
    reserve(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    active(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    order(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    verify(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    cancel(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
export declare const bookingController: BookingController;
//# sourceMappingURL=booking.controller.d.ts.map