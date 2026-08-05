import { verifyAccessToken } from "../utils/jwt.js";
import { ApiError } from "../utils/ApiError.js";
export function authenticate(req, _res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw ApiError.unauthorized("Access token is required");
        }
        const token = authHeader.split(" ")[1];
        if (!token) {
            throw ApiError.unauthorized("Access token is required");
        }
        const decoded = verifyAccessToken(token);
        req.user = decoded;
        next();
    }
    catch (error) {
        if (error instanceof ApiError) {
            next(error);
        }
        else {
            next(ApiError.unauthorized("Invalid or expired access token"));
        }
    }
}
//# sourceMappingURL=auth.middleware.js.map