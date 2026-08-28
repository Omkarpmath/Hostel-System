import { Response, NextFunction } from "express";
import { attendanceService } from "./attendance.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { AuthRequest } from "../../middleware/auth.middleware.js";

export class AttendanceController {
  async startSession(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const session = await attendanceService.startSession(req.user!.userId);
      ApiResponse.created({ res, message: "Attendance session started", data: session });
    } catch (error) { next(error); }
  }

  async getActiveSession(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const session = await attendanceService.getActiveSession(req.user!.userId);
      ApiResponse.success({ res, data: session });
    } catch (error) { next(error); }
  }

  async endSession(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await attendanceService.endSession(req.user!.userId);
      ApiResponse.success({ res, message: "Attendance session completed", data: result });
    } catch (error) { next(error); }
  }

  async scanStudent(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { qrToken } = req.body;
      if (!qrToken) return ApiResponse.error(res, 400, "QR token is required");
      const result = await attendanceService.scanStudent(req.user!.userId, qrToken);
      ApiResponse.success({ res, data: result });
    } catch (error) { next(error); }
  }

  async getRegister(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { hostelId, date } = req.query;
      if (!hostelId) return ApiResponse.error(res, 400, "hostelId is required");

      // Warden can only view their own hostel
      if (req.user!.role === "WARDEN") {
        const { prisma } = await import("../../config/db.js");
        const hostel = await prisma.hostel.findFirst({
          where: { id: String(hostelId), wardenId: req.user!.userId },
        });
        if (!hostel) return ApiResponse.error(res, 403, "You can only view your assigned hostel");
      }

      // Security can only view their assigned hostel
      if (req.user!.role === "SECURITY") {
        const { prisma } = await import("../../config/db.js");
        const user = await prisma.user.findUnique({
          where: { id: req.user!.userId },
          select: { assignedHostelId: true },
        });
        if (user?.assignedHostelId !== String(hostelId)) {
          return ApiResponse.error(res, 403, "You can only view your assigned hostel");
        }
      }

      const targetDate = date ? new Date(String(date)) : undefined;
      const data = await attendanceService.getRegister(String(hostelId), targetDate);
      ApiResponse.success({ res, data });
    } catch (error) { next(error); }
  }

  async exportRegisterCSV(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { hostelId, date } = req.query;
      if (!hostelId || !date) return ApiResponse.error(res, 400, "hostelId and date are required");

      const csv = await attendanceService.exportRegisterCSV(String(hostelId), String(date));
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="attendance_${date}.csv"`);
      res.send(csv);
    } catch (error) { next(error); }
  }

  // ─── ADMIN endpoints ─────────────────────────────────────

  async assignSecurity(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { securityUserId, hostelId } = req.body;
      if (!securityUserId || !hostelId) return ApiResponse.error(res, 400, "securityUserId and hostelId are required");
      const data = await attendanceService.assignSecurityToHostel(securityUserId, hostelId);
      ApiResponse.success({ res, message: "Security assigned to hostel", data });
    } catch (error) { next(error); }
  }

  async unassignSecurity(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { securityUserId } = req.body;
      if (!securityUserId) return ApiResponse.error(res, 400, "securityUserId is required");
      const data = await attendanceService.unassignSecurity(securityUserId);
      ApiResponse.success({ res, message: "Security unassigned from hostel", data });
    } catch (error) { next(error); }
  }

  async listSecurityUsers(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await attendanceService.listSecurityUsers();
      ApiResponse.success({ res, data });
    } catch (error) { next(error); }
  }

  async listSessions(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { hostelId, from, to } = req.query;
      const data = await attendanceService.listSessions({
        hostelId: hostelId ? String(hostelId) : undefined,
        from: from ? String(from) : undefined,
        to: to ? String(to) : undefined,
      });
      ApiResponse.success({ res, data });
    } catch (error) { next(error); }
  }

  async getMyHistory(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
      const data = await attendanceService.getStudentHistory(req.user!.userId, year, month);
      ApiResponse.success({ res, data });
    } catch (error) { next(error); }
  }
}

export const attendanceController = new AttendanceController();
