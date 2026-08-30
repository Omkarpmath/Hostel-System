import { ApiResponse } from "../../utils/ApiResponse.js";
import { operationsService } from "./operations.service.js";
export class OperationsController {
    user(req) { if (!req.user)
        throw new Error("Unauthenticated request"); return req.user; }
    async mine(req, res, next) { try {
        const user = this.user(req);
        ApiResponse.success({ res, data: await operationsService.getMyOverview(user.userId) });
    }
    catch (e) {
        next(e);
    } }
    async allocations(_req, res, next) { try {
        ApiResponse.success({ res, data: await operationsService.listAllocations() });
    }
    catch (e) {
        next(e);
    } }
    async allocate(req, res, next) { try {
        const a = await operationsService.allocate(req.body.studentId, req.body.roomId, req.body.bedNumber);
        ApiResponse.created({ res, message: "Student allocated successfully", data: a });
    }
    catch (e) {
        next(e);
    } }
    async leaves(req, res, next) { try {
        const u = this.user(req);
        ApiResponse.success({ res, data: await operationsService.listLeaves(u.userId, u.role) });
    }
    catch (e) {
        next(e);
    } }
    async createLeave(req, res, next) { try {
        const u = this.user(req);
        ApiResponse.created({ res, message: "Leave request submitted", data: await operationsService.createLeave(u.userId, req.body) });
    }
    catch (e) {
        next(e);
    } }
    async decideLeave(req, res, next) { try {
        const u = this.user(req);
        ApiResponse.success({ res, message: "Leave request updated", data: await operationsService.decideLeave(String(req.params.id), u.userId, req.body) });
    }
    catch (e) {
        next(e);
    } }
    async complaints(req, res, next) { try {
        const u = this.user(req);
        ApiResponse.success({ res, data: await operationsService.listComplaints(u.userId, u.role) });
    }
    catch (e) {
        next(e);
    } }
    async createComplaint(req, res, next) { try {
        const u = this.user(req);
        const files = req.files;
        ApiResponse.created({ res, message: "Complaint submitted", data: await operationsService.createComplaint(u.userId, req.body, files) });
    }
    catch (e) {
        next(e);
    } }
    async updateComplaint(req, res, next) { try {
        const u = this.user(req);
        ApiResponse.success({ res, message: "Complaint updated", data: await operationsService.updateComplaint(String(req.params.id), u.userId, req.body) });
    }
    catch (e) {
        next(e);
    } }
    async visitors(req, res, next) { try {
        const u = this.user(req);
        ApiResponse.success({ res, data: await operationsService.listVisitors(u.userId, u.role) });
    }
    catch (e) {
        next(e);
    } }
    async createVisitor(req, res, next) { try {
        const u = this.user(req);
        ApiResponse.created({ res, message: "Visitor submitted", data: await operationsService.createVisitor(u.userId, req.body) });
    }
    catch (e) {
        next(e);
    } }
    async fees(req, res, next) { try {
        const u = this.user(req);
        ApiResponse.success({ res, data: await operationsService.listFees(u.userId, u.role) });
    }
    catch (e) {
        next(e);
    } }
}
export const operationsController = new OperationsController();
//# sourceMappingURL=operations.controller.js.map