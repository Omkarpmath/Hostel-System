import { Request, Response, NextFunction } from "express";
export interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
        email: string;
    };
}
export declare function authenticate(req: AuthRequest, _res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.middleware.d.ts.map