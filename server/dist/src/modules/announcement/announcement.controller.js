import { ApiResponse } from "../../utils/ApiResponse.js";
import { announcementService } from "./announcement.service.js";
export class AnnouncementController {
    user(req) {
        if (!req.user)
            throw new Error("Unauthenticated request");
        return req.user;
    }
    async list(req, res, next) {
        try {
            const u = this.user(req);
            const filters = {
                status: req.query.status,
                priority: req.query.priority,
                hostelId: req.query.hostelId,
                search: req.query.search,
            };
            const data = await announcementService.listAnnouncements(u.userId, u.role, filters);
            ApiResponse.success({ res, data });
        }
        catch (e) {
            next(e);
        }
    }
    async my(req, res, next) {
        try {
            const u = this.user(req);
            const filters = {
                unreadOnly: req.query.unreadOnly === "true",
                priority: req.query.priority,
            };
            const data = await announcementService.getMyAnnouncements(u.userId, filters);
            ApiResponse.success({ res, data });
        }
        catch (e) {
            next(e);
        }
    }
    async stats(req, res, next) {
        try {
            const u = this.user(req);
            const data = await announcementService.getStats(u.userId, u.role);
            ApiResponse.success({ res, data });
        }
        catch (e) {
            next(e);
        }
    }
    async getById(req, res, next) {
        try {
            const u = this.user(req);
            const data = await announcementService.getAnnouncementById(String(req.params.id), u.userId, u.role);
            ApiResponse.success({ res, data });
        }
        catch (e) {
            next(e);
        }
    }
    async create(req, res, next) {
        try {
            const u = this.user(req);
            const data = await announcementService.createAnnouncement(u.userId, u.role, req.body);
            ApiResponse.created({ res, message: "Announcement published successfully", data });
        }
        catch (e) {
            next(e);
        }
    }
    async update(req, res, next) {
        try {
            const u = this.user(req);
            const data = await announcementService.updateAnnouncement(String(req.params.id), u.userId, u.role, req.body);
            ApiResponse.success({ res, message: "Announcement updated successfully", data });
        }
        catch (e) {
            next(e);
        }
    }
    async delete(req, res, next) {
        try {
            const u = this.user(req);
            const data = await announcementService.deleteAnnouncement(String(req.params.id), u.userId, u.role);
            ApiResponse.success({ res, message: "Announcement deleted successfully", data });
        }
        catch (e) {
            next(e);
        }
    }
    async markRead(req, res, next) {
        try {
            const u = this.user(req);
            const data = await announcementService.markAsRead(String(req.params.id), u.userId);
            ApiResponse.success({ res, message: "Marked as read", data });
        }
        catch (e) {
            next(e);
        }
    }
    async markAllRead(req, res, next) {
        try {
            const u = this.user(req);
            const data = await announcementService.markAllAsRead(u.userId);
            ApiResponse.success({ res, message: "All announcements marked as read", data });
        }
        catch (e) {
            next(e);
        }
    }
}
export const announcementController = new AnnouncementController();
//# sourceMappingURL=announcement.controller.js.map