import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware.js";
import { ApiError } from "../utils/ApiError.js";
import { Role } from "@prisma/client";

export function authorize(...allowedRoles: Role[]) {
  return (req: AuthRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized("Authentication required"));
    }

    if (!allowedRoles.includes(req.user.role as Role)) {
      return next(
        ApiError.forbidden("You do not have permission to access this resource")
      );
    }

    next();
  };
}
