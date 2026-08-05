import { userService } from "./user.service.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
export class UserController {
    async getUsers(req, res, next) {
        try {
            const result = await userService.getUsers({
                role: String(req.query.role || ""),
                search: String(req.query.search || ""),
                page: parseInt(String(req.query.page)) || 1,
                limit: parseInt(String(req.query.limit)) || 20,
                isActive: req.query.isActive === "true" ? true : req.query.isActive === "false" ? false : undefined,
            });
            ApiResponse.success({ res, data: result.users, meta: result.meta });
        }
        catch (error) {
            next(error);
        }
    }
    async getUserById(req, res, next) {
        try {
            const user = await userService.getUserById(String(req.params.id));
            ApiResponse.success({ res, data: user });
        }
        catch (error) {
            next(error);
        }
    }
    async createUser(req, res, next) {
        try {
            const user = await userService.createUser(req.body);
            ApiResponse.created({ res, message: "User created successfully", data: user });
        }
        catch (error) {
            next(error);
        }
    }
    async updateUser(req, res, next) {
        try {
            const userId = String(req.params.id || req.user?.userId || "");
            if (!userId)
                return ApiResponse.error(res, 400, "User ID required");
            const user = await userService.updateUser(userId, req.body);
            ApiResponse.success({ res, message: "User updated successfully", data: user });
        }
        catch (error) {
            next(error);
        }
    }
    async createStudentProfile(req, res, next) {
        try {
            const profile = await userService.createStudentProfile(String(req.params.userId), req.body);
            ApiResponse.created({ res, message: "Student profile created", data: profile });
        }
        catch (error) {
            next(error);
        }
    }
    async getStudents(req, res, next) {
        try {
            const result = await userService.getStudents({
                search: String(req.query.search || ""),
                department: String(req.query.department || ""),
                year: req.query.year ? parseInt(String(req.query.year)) : undefined,
                page: parseInt(String(req.query.page)) || 1,
                limit: parseInt(String(req.query.limit)) || 20,
            });
            ApiResponse.success({ res, data: result.students, meta: result.meta });
        }
        catch (error) {
            next(error);
        }
    }
    async getWardens(_req, res, next) {
        try {
            const wardens = await userService.getWardens();
            ApiResponse.success({ res, data: wardens });
        }
        catch (error) {
            next(error);
        }
    }
}
export const userController = new UserController();
//# sourceMappingURL=user.controller.js.map