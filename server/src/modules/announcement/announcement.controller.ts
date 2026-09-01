import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { announcementService } from "./announcement.service.js";

export class AnnouncementController {
  private user(req: AuthRequest) {
    if (!req.user) throw new Error("Unauthenticated request");
    return req.user;
  }

  async list(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const u = this.user(req);
      const filters = {
        status: req.query.status as string | undefined,
        priority: req.query.priority as string | undefined,
        hostelId: req.query.hostelId as string | undefined,
        search: req.query.search as string | undefined,
      };
      const data = await announcementService.listAnnouncements(u.userId, u.role, filters);
      ApiResponse.success({ res, data });
    } catch (e) {
      next(e);
    }
  }

  async my(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const u = this.user(req);
      const filters = {
        unreadOnly: req.query.unreadOnly === "true",
        priority: req.query.priority as string | undefined,
      };
      const data = await announcementService.getMyAnnouncements(u.userId, filters);
      ApiResponse.success({ res, data });
    } catch (e) {
      next(e);
    }
  }

  async stats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const u = this.user(req);
      const data = await announcementService.getStats(u.userId, u.role);
      ApiResponse.success({ res, data });
    } catch (e) {
      next(e);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const u = this.user(req);
      const data = await announcementService.getAnnouncementById(String(req.params.id), u.userId, u.role);
      ApiResponse.success({ res, data });
    } catch (e) {
      next(e);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const u = this.user(req);
      const data = await announcementService.createAnnouncement(u.userId, u.role, req.body);
      ApiResponse.created({ res, message: "Announcement published successfully", data });
    } catch (e) {
      next(e);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const u = this.user(req);
      const data = await announcementService.updateAnnouncement(String(req.params.id), u.userId, u.role, req.body);
      ApiResponse.success({ res, message: "Announcement updated successfully", data });
    } catch (e) {
      next(e);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const u = this.user(req);
      const data = await announcementService.deleteAnnouncement(String(req.params.id), u.userId, u.role);
      ApiResponse.success({ res, message: "Announcement deleted successfully", data });
    } catch (e) {
      next(e);
    }
  }

  async markRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const u = this.user(req);
      const data = await announcementService.markAsRead(String(req.params.id), u.userId);
      ApiResponse.success({ res, message: "Marked as read", data });
    } catch (e) {
      next(e);
    }
  }

  async markAllRead(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const u = this.user(req);
      const data = await announcementService.markAllAsRead(u.userId);
      ApiResponse.success({ res, message: "All announcements marked as read", data });
    } catch (e) {
      next(e);
    }
  }
}

export const announcementController = new AnnouncementController();
