import { NextFunction, Response } from "express";
import { NotificationType } from "@prisma/client";
import { AuthRequest } from "../../middleware/auth.middleware.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { notificationService } from "./notification.service.js";

export class NotificationController {
  private user(req: AuthRequest) {
    if (!req.user) throw new Error("Unauthenticated request");
    return req.user;
  }

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const u = this.user(req);
      const query = {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 15,
        unreadOnly: req.query.unreadOnly === "true",
        type: req.query.type as NotificationType | undefined,
      };

      const result = await notificationService.listNotifications(u.userId, query);
      ApiResponse.success({ res, data: result });
    } catch (e) {
      next(e);
    }
  }

  async unreadCount(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const u = this.user(req);
      const count = await notificationService.getUnreadCount(u.userId);
      ApiResponse.success({ res, data: { count } });
    } catch (e) {
      next(e);
    }
  }

  async markRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const u = this.user(req);
      const result = await notificationService.markAsRead(u.userId, String(req.params.id));
      ApiResponse.success({ res, data: result, message: "Notification marked as read" });
    } catch (e) {
      next(e);
    }
  }

  async markAllRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const u = this.user(req);
      const result = await notificationService.markAllAsRead(u.userId);
      ApiResponse.success({ res, data: result, message: "All notifications marked as read" });
    } catch (e) {
      next(e);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const u = this.user(req);
      const result = await notificationService.deleteNotification(u.userId, String(req.params.id));
      ApiResponse.success({ res, data: result, message: "Notification deleted" });
    } catch (e) {
      next(e);
    }
  }
}

export const notificationController = new NotificationController();
