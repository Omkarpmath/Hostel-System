import { Request, Response, NextFunction } from "express";
import { hostelService } from "./hostel.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { AuthRequest } from "../../middleware/auth.middleware.js";
import { prisma } from "../../config/db.js";

export class HostelController {
  // ============ HOSTEL ============

  async createHostel(req: Request, res: Response, next: NextFunction) {
    try {
      const hostel = await hostelService.createHostel(req.body);
      ApiResponse.created({ res, message: "Hostel created successfully", data: hostel });
    } catch (error) { next(error); }
  }

  async getHostels(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        type: String(req.query.type || ""),
        isActive: req.query.isActive === "true" ? true : req.query.isActive === "false" ? false : undefined,
      };
      const hostels = await hostelService.getHostels(filters);
      ApiResponse.success({ res, data: hostels });
    } catch (error) { next(error); }
  }

  async getHostelById(req: Request, res: Response, next: NextFunction) {
    try {
      const hostel = await hostelService.getHostelById(String(req.params.id));
      ApiResponse.success({ res, data: hostel });
    } catch (error) { next(error); }
  }

  async updateHostel(req: Request, res: Response, next: NextFunction) {
    try {
      const hostel = await hostelService.updateHostel(String(req.params.id), req.body);
      ApiResponse.success({ res, message: "Hostel updated successfully", data: hostel });
    } catch (error) { next(error); }
  }

  async deleteHostel(req: Request, res: Response, next: NextFunction) {
    try {
      await hostelService.deleteHostel(String(req.params.id));
      ApiResponse.success({ res, message: "Hostel deleted successfully" });
    } catch (error) { next(error); }
  }

  // ============ BLOCK ============

  async createBlock(req: Request, res: Response, next: NextFunction) {
    try {
      const block = await hostelService.createBlock(String(req.params.hostelId), req.body);
      ApiResponse.created({ res, message: "Block created successfully", data: block });
    } catch (error) { next(error); }
  }

  async getBlocks(req: Request, res: Response, next: NextFunction) {
    try {
      const blocks = await hostelService.getBlocks(String(req.params.hostelId));
      ApiResponse.success({ res, data: blocks });
    } catch (error) { next(error); }
  }

  // ============ FLOOR ============

  async createFloor(req: Request, res: Response, next: NextFunction) {
    try {
      const floor = await hostelService.createFloor(String(req.params.blockId), req.body);
      ApiResponse.created({ res, message: "Floor created successfully", data: floor });
    } catch (error) { next(error); }
  }

  async getFloors(req: Request, res: Response, next: NextFunction) {
    try {
      const floors = await hostelService.getFloors(String(req.params.blockId));
      ApiResponse.success({ res, data: floors });
    } catch (error) { next(error); }
  }

  // ============ ROOM ============

  async createRoom(req: Request, res: Response, next: NextFunction) {
    try {
      const room = await hostelService.createRoom(String(req.params.floorId), req.body);
      ApiResponse.created({ res, message: "Room created successfully", data: room });
    } catch (error) { next(error); }
  }

  async getRooms(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        status: String(req.query.status || ""),
        type: String(req.query.type || ""),
        floorId: String(req.query.floorId || ""),
        hostelId: String(req.query.hostelId || ""),
        page: parseInt(String(req.query.page)) || 1,
        limit: parseInt(String(req.query.limit)) || 20,
        search: String(req.query.search || ""),
      };
      const result = await hostelService.getRooms(filters);
      ApiResponse.success({ res, data: result.rooms, meta: result.meta });
    } catch (error) { next(error); }
  }

  async getAvailableRooms(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      let eligibility: { year: number; gender: "MALE" | "FEMALE" | "OTHER" } | undefined;
      if (req.user?.role === "STUDENT") {
        const student = await prisma.studentProfile.findUnique({ where: { userId: req.user.userId }, select: { year: true, gender: true } });
        // Accounts awaiting profile completion may still browse real availability;
        // eligibility filtering is applied as soon as their profile exists.
        if (student) eligibility = student;
      }
      const rooms = await hostelService.getAvailableRooms(String(req.query.hostelId || ""), eligibility);
      ApiResponse.success({ res, data: rooms });
    } catch (error) { next(error); }
  }

  async getRoomById(req: Request, res: Response, next: NextFunction) {
    try {
      const room = await hostelService.getRoomById(String(req.params.id));
      ApiResponse.success({ res, data: room });
    } catch (error) { next(error); }
  }

  async updateRoom(req: Request, res: Response, next: NextFunction) {
    try {
      const room = await hostelService.updateRoom(String(req.params.id), req.body);
      ApiResponse.success({ res, message: "Room updated successfully", data: room });
    } catch (error) { next(error); }
  }

  // ============ DASHBOARD ============

  async getDashboardStats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await hostelService.getDashboardStats();
      ApiResponse.success({ res, data: stats });
    } catch (error) { next(error); }
  }
}

export const hostelController = new HostelController();
