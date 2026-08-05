import { authService } from "./auth.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
export class AuthController {
    async login(req, res, next) {
        try {
            const result = await authService.login(req.body);
            // Set refresh token in httpOnly cookie
            res.cookie("refreshToken", result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });
            ApiResponse.success({
                res,
                message: "Login successful",
                data: {
                    user: result.user,
                    accessToken: result.accessToken,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async register(req, res, next) {
        try {
            const user = await authService.register(req.body);
            ApiResponse.created({
                res,
                message: "Account created successfully",
                data: user,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async refresh(req, res, next) {
        try {
            const token = req.cookies?.refreshToken || req.body?.refreshToken;
            if (!token) {
                return ApiResponse.error(res, 401, "Refresh token is required");
            }
            const result = await authService.refreshToken(token);
            res.cookie("refreshToken", result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "strict",
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            ApiResponse.success({
                res,
                message: "Token refreshed successfully",
                data: { accessToken: result.accessToken },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async logout(req, res, next) {
        try {
            const token = req.cookies?.refreshToken;
            if (token) {
                await authService.logout(token);
            }
            res.clearCookie("refreshToken");
            ApiResponse.success({
                res,
                message: "Logged out successfully",
            });
        }
        catch (error) {
            next(error);
        }
    }
    async resetPassword(req, res, next) {
        try {
            const result = await authService.resetPassword(req.body);
            ApiResponse.success({
                res,
                message: result.message,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async getProfile(req, res, next) {
        try {
            if (!req.user) {
                return ApiResponse.error(res, 401, "Authentication required");
            }
            const profile = await authService.getProfile(req.user.userId);
            ApiResponse.success({
                res,
                data: profile,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
export const authController = new AuthController();
//# sourceMappingURL=auth.controller.js.map