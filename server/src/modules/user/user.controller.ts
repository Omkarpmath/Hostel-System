import { Request, Response, NextFunction } from "express";
import { userService } from "./user.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { AuthRequest } from "../../middleware/auth.middleware.js";

export class UserController {
  async getUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await userService.getUsers({
        role: String(req.query.role || ""),
        search: String(req.query.search || ""),
        page: parseInt(String(req.query.page)) || 1,
        limit: parseInt(String(req.query.limit)) || 20,
        isActive: req.query.isActive === "true" ? true : req.query.isActive === "false" ? false : undefined,
      });
      ApiResponse.success({ res, data: result.users, meta: result.meta });
    } catch (error) { next(error); }
  }

  async getUserById(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.getUserById(String(req.params.id));
      ApiResponse.success({ res, data: user });
    } catch (error) { next(error); }
  }

  async createUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.createUser(req.body);
      ApiResponse.created({ res, message: "User created successfully", data: user });
    } catch (error) { next(error); }
  }

  async updateUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = String(req.params.id || req.user?.userId || "");
      if (!userId) return ApiResponse.error(res, 400, "User ID required");
      const user = await userService.updateUser(userId, req.body);
      ApiResponse.success({ res, message: "User updated successfully", data: user });
    } catch (error) { next(error); }
  }

  async createStudentProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await userService.createStudentProfile(String(req.params.userId), req.body);
      ApiResponse.created({ res, message: "Student profile created", data: profile });
    } catch (error) { next(error); }
  }

  async getStudents(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await userService.getStudents({
        search: String(req.query.search || ""),
        department: String(req.query.department || ""),
        year: req.query.year ? parseInt(String(req.query.year)) : undefined,
        page: parseInt(String(req.query.page)) || 1,
        limit: parseInt(String(req.query.limit)) || 20,
      });
      ApiResponse.success({ res, data: result.students, meta: result.meta });
    } catch (error) { next(error); }
  }

  async getWardens(_req: Request, res: Response, next: NextFunction) {
    try {
      const wardens = await userService.getWardens();
      ApiResponse.success({ res, data: wardens });
    } catch (error) { next(error); }
  }
}

export const userController = new UserController();
