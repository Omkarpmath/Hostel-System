import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware.js";
export declare class OperationsController {
    private user;
    mine(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    allocations(_req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    allocate(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    leaves(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    createLeave(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    decideLeave(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    complaints(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    createComplaint(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    updateComplaint(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    visitors(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    createVisitor(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    hostelStudents(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    fees(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    downloadReceipt(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
export declare const operationsController: OperationsController;
//# sourceMappingURL=operations.controller.d.ts.map