import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth.middleware.js";
export declare class MessFeeController {
    getAmount(_req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    updateAmount(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    getMyStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    createOrder(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    verifyPayment(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
export declare const messFeeController: MessFeeController;
//# sourceMappingURL=mess-fee.controller.d.ts.map