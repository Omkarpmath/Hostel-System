import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth.middleware.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { messEntryService } from "./mess-entry.service.js";

export class MessEntryController {
  /**
   * Verify dynamic QR token and record entry.
   */
  async verify(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const securityUserId = req.user!.userId;
      const { qrToken } = req.body;

      if (!qrToken) {
        return ApiResponse.error(res, 400, "QR code token is required");
      }

      const result = await messEntryService.verifyMessEntry(securityUserId, qrToken);
      return ApiResponse.success({
        res,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current security guard's assigned mess and today's entry statistics.
   */
  async getStats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const securityUserId = req.user!.userId;
      const data = await messEntryService.getTodayStats(securityUserId);
      return ApiResponse.success({ res, data });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List available messes for assignment/selection dropdown.
   */
  async listMesses(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await messEntryService.listMesses();
      return ApiResponse.success({ res, data });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get mess entries (Admin / Reporting).
   */
  async getEntries(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { messId, date, limit } = req.query;
      let targetMessId = messId as string | undefined;

      if (req.user?.role === "SECURITY") {
        const securityMess = await messEntryService.getSecurityMess(req.user.userId);
        targetMessId = securityMess.messId;
      }

      const data = await messEntryService.getEntries({
        messId: targetMessId,
        date: date as string,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });
      return ApiResponse.success({ res, data });
    } catch (error) {
      next(error);
    }
  }
}

export const messEntryController = new MessEntryController();
