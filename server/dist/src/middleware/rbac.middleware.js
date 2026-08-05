import { ApiError } from "../utils/ApiError.js";
export function authorize(...allowedRoles) {
    return (req, _res, next) => {
        if (!req.user) {
            return next(ApiError.unauthorized("Authentication required"));
        }
        if (!allowedRoles.includes(req.user.role)) {
            return next(ApiError.forbidden("You do not have permission to access this resource"));
        }
        next();
    };
}
//# sourceMappingURL=rbac.middleware.js.map