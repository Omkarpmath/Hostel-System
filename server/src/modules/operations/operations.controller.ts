import { NextFunction, Response } from "express";
import { AuthRequest } from "../../middleware/auth.middleware.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { operationsService } from "./operations.service.js";

import { receiptService } from "../receipt/receipt.service.js";

export class OperationsController {
  private user(req: AuthRequest) { if (!req.user) throw new Error("Unauthenticated request"); return req.user; }
  async mine(req: AuthRequest, res: Response, next: NextFunction) { try { const user = this.user(req); ApiResponse.success({ res, data: await operationsService.getMyOverview(user.userId) }); } catch (e) { next(e); } }
  async allocations(_req: AuthRequest, res: Response, next: NextFunction) { try { ApiResponse.success({ res, data: await operationsService.listAllocations() }); } catch (e) { next(e); } }
  async allocate(req: AuthRequest, res: Response, next: NextFunction) { try { const a = await operationsService.allocate(req.body.studentId, req.body.roomId, req.body.bedNumber); ApiResponse.created({ res, message: "Student allocated successfully", data: a }); } catch (e) { next(e); } }
  async vacate(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const u = this.user(req);
      const result = await operationsService.vacate(String(req.params.id), u.userId, u.role);
      ApiResponse.success({ res, message: "Bed vacated successfully", data: result });
    } catch (e) { next(e); }
  }
  async academicRollover(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const u = this.user(req);
      const result = await operationsService.academicRollover(u.userId, u.role);
      ApiResponse.success({
        res,
        message: `Rollover complete: ${result.graduatedCount} students graduated, ${result.promotedCount} students promoted.`,
        data: result,
      });
    } catch (e) { next(e); }
  }
  async reportFeeDefaulters(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const csv = await operationsService.exportFeeDefaultersCsv();
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="fee_defaulters_${new Date().toISOString().split("T")[0]}.csv"`);
      return res.status(200).send(csv);
    } catch (e) { next(e); }
  }
  async reportAttendanceShortage(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const csv = await operationsService.exportAttendanceShortageCsv();
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="attendance_shortage_${new Date().toISOString().split("T")[0]}.csv"`);
      return res.status(200).send(csv);
    } catch (e) { next(e); }
  }
  async reportMessHeadcount(_req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const csv = await operationsService.exportMessHeadcountCsv();
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="mess_headcount_${new Date().toISOString().split("T")[0]}.csv"`);
      return res.status(200).send(csv);
    } catch (e) { next(e); }
  }
  async leaves(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const u = this.user(req);
      const filters = { hostelId: req.query.hostelId as string | undefined };
      ApiResponse.success({ res, data: await operationsService.listLeaves(u.userId, u.role, filters) });
    } catch (e) { next(e); }
  }
  async createLeave(req: AuthRequest, res: Response, next: NextFunction) { try { const u = this.user(req); ApiResponse.created({ res, message: "Leave request submitted", data: await operationsService.createLeave(u.userId, req.body) }); } catch (e) { next(e); } }
  async decideLeave(req: AuthRequest, res: Response, next: NextFunction) { try { const u = this.user(req); ApiResponse.success({ res, message: "Leave request updated", data: await operationsService.decideLeave(String(req.params.id), u.userId, u.role, req.body) }); } catch (e) { next(e); } }
  async complaints(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const u = this.user(req);
      const filters = { hostelId: req.query.hostelId as string | undefined };
      ApiResponse.success({ res, data: await operationsService.listComplaints(u.userId, u.role, filters) });
    } catch (e) { next(e); }
  }
  async createComplaint(req: AuthRequest, res: Response, next: NextFunction) { try { const u = this.user(req); const files = req.files as Express.Multer.File[] | undefined; ApiResponse.created({ res, message: "Complaint submitted", data: await operationsService.createComplaint(u.userId, req.body, files) }); } catch (e) { next(e); } }
  async updateComplaint(req: AuthRequest, res: Response, next: NextFunction) { try { const u = this.user(req); ApiResponse.success({ res, message: "Complaint updated", data: await operationsService.updateComplaint(String(req.params.id), u.userId, u.role, req.body) }); } catch (e) { next(e); } }
  async visitors(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const u = this.user(req);
      const filters = {
        hostelId: req.query.hostelId as string | undefined,
        date: req.query.date as string | undefined,
      };
      ApiResponse.success({ res, data: await operationsService.listVisitors(u.userId, u.role, filters) });
    } catch (e) { next(e); }
  }
  async createVisitor(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const u = this.user(req);
      ApiResponse.created({ res, message: "Visitor registered successfully", data: await operationsService.createVisitor(u.userId, u.role, req.body) });
    } catch (e) { next(e); }
  }
  async hostelStudents(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const u = this.user(req);
      ApiResponse.success({ res, data: await operationsService.listHostelStudents(u.userId, u.role, req.query.hostelId as string | undefined) });
    } catch (e) { next(e); }
  }
  async fees(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const u = this.user(req);
      const filters = { hostelId: req.query.hostelId as string | undefined };
      ApiResponse.success({ res, data: await operationsService.listFees(u.userId, u.role, filters) });
    } catch (e) { next(e); }
  }
  async downloadReceipt(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const u = this.user(req);
      const feeId = String(req.params.id);
      const { buffer, filename } = await receiptService.getReceiptPdfByFeeId(feeId, u.userId, u.role);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
      res.setHeader("Content-Length", buffer.length);
      res.send(buffer);
    } catch (e: any) { next(e); }
  }
  async approveOfflineFee(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const u = this.user(req);
      const feeId = String(req.params.id);
      const data = await operationsService.approveOfflinePayment(feeId, u.userId, u.role, req.body);
      ApiResponse.success({
        res,
        message: "Offline payment approved and official receipt generated successfully",
        data,
      });
    } catch (e) { next(e); }
  }
}
export const operationsController = new OperationsController();
