import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth.middleware.js";
export declare class UserController {
    getUsers(req: Request, res: Response, next: NextFunction): Promise<void>;
    getUserById(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    getCurrentStudent(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    createCurrentStudentProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    createUser(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateUser(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    createStudentProfile(req: Request, res: Response, next: NextFunction): Promise<void>;
    createStudent(req: Request, res: Response, next: NextFunction): Promise<void>;
    getStudents(req: Request, res: Response, next: NextFunction): Promise<void>;
    getWardens(_req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const userController: UserController;
//# sourceMappingURL=user.controller.d.ts.map