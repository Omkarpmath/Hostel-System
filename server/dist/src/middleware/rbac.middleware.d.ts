import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware.js";
import { Role } from "@prisma/client";
export declare function authorize(...allowedRoles: Role[]): (req: AuthRequest, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=rbac.middleware.d.ts.map