import { Request, Response, NextFunction, CookieOptions } from "express";
import { authService } from "./auth.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { AuthRequest } from "../../middleware/auth.middleware.js";

const getRefreshTokenCookieOptions = (): CookieOptions => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/",
});

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);

      // Set refresh token in persistent httpOnly cookie (7 days)
      res.cookie("refreshToken", result.refreshToken, getRefreshTokenCookieOptions());

      ApiResponse.success({
        res,
        message: "Login successful",
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.register(req.body);
      ApiResponse.created({
        res,
        message: "Account created successfully",
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!token) {
        return ApiResponse.error(res, 401, "Refresh token is required");
      }

      const result = await authService.refreshToken(token);

      // Rotate refresh token cookie
      res.cookie("refreshToken", result.refreshToken, getRefreshTokenCookieOptions());

      ApiResponse.success({
        res,
        message: "Token refreshed successfully",
        data: { accessToken: result.accessToken },
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.refreshToken;
      if (token) {
        await authService.logout(token);
      }

      // Clear the refresh token cookie with matching options
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        path: "/",
      });

      ApiResponse.success({
        res,
        message: "Logged out successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.resetPassword(req.body);
      ApiResponse.success({
        res,
        message: result.message,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProfile(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ApiResponse.error(res, 401, "Authentication required");
      }
      const profile = await authService.getProfile(req.user.userId);
      ApiResponse.success({
        res,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  async getDynamicQr(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return ApiResponse.error(res, 401, "Authentication required");
      }
      const data = await authService.getDynamicQr(req.user.userId);
      ApiResponse.success({
        res,
        message: "Dynamic QR generated",
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
