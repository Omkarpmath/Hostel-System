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
            const auth = req;
            if (auth.user?.userId !== String(req.params.id) && !["ADMIN", "WARDEN"].includes(auth.user?.role || "")) {
                return ApiResponse.error(res, 403, "You do not have permission to view this user");
            }
            const user = await userService.getUserById(String(req.params.id));
            ApiResponse.success({ res, data: user });
        }
        catch (error) {
            next(error);
        }
    }
    async getCurrentStudent(req, res, next) {
        try {
            if (!req.user)
                return ApiResponse.error(res, 401, "Authentication required");
            const student = await userService.getCurrentStudent(req.user.userId);
            ApiResponse.success({ res, data: student });
        }
        catch (error) {
            next(error);
        }
    }
    async updateCurrentStudent(req, res, next) {
        try {
            if (!req.user)
                return ApiResponse.error(res, 401, "Authentication required");
            const student = await userService.updateCurrentStudent(req.user.userId, req.body);
            ApiResponse.success({ res, message: "Profile updated successfully", data: student });
        }
        catch (error) {
            next(error);
        }
    }
    async createCurrentStudentProfile(req, res, next) {
        try {
            if (!req.user)
                return ApiResponse.error(res, 401, "Authentication required");
            const profile = await userService.createStudentProfile(req.user.userId, req.body);
            ApiResponse.created({ res, message: "Student profile created", data: profile });
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
            if (!req.user)
                return ApiResponse.error(res, 401, "Authentication required");
            const isManager = ["ADMIN", "WARDEN"].includes(req.user.role);
            if (!isManager && req.user.userId !== userId) {
                return ApiResponse.error(res, 403, "You do not have permission to update this user");
            }
            // A user may maintain their contact details, but account activation is an
            // administrator-controlled setting.
            const data = isManager
                ? req.body
                : { firstName: req.body.firstName, lastName: req.body.lastName, phone: req.body.phone, avatarUrl: req.body.avatarUrl };
            const user = await userService.updateUser(userId, data);
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
    async createStudent(req, res, next) {
        try {
            const student = await userService.createStudent(req.body);
            ApiResponse.created({ res, message: "Student created successfully", data: student });
        }
        catch (error) {
            next(error);
        }
    }
    async getStudents(req, res, next) {
        try {
            const auth = req;
            const result = await userService.getStudents({
                search: String(req.query.search || ""),
                department: String(req.query.department || ""),
                year: req.query.year ? parseInt(String(req.query.year)) : undefined,
                page: parseInt(String(req.query.page)) || 1,
                limit: Math.min(parseInt(String(req.query.limit)) || 20, 1000),
            }, auth.user?.role === "WARDEN" ? auth.user.userId : undefined);
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