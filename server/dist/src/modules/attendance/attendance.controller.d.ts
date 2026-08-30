import { Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth.middleware.js";
export declare class AttendanceController {
    startSession(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    getActiveSession(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    endSession(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    scanStudent(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    getRegister(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    exportRegisterCSV(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    assignSecurity(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    unassignSecurity(req: AuthRequest, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    listSecurityUsers(_req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    listSessions(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    getMyHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
}
export declare const attendanceController: AttendanceController;
//# sourceMappingURL=attendance.controller.d.ts.map