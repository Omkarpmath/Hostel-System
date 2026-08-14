import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../../middleware/auth.middleware.js";
export declare class HostelController {
    createHostel(req: Request, res: Response, next: NextFunction): Promise<void>;
    getHostels(req: Request, res: Response, next: NextFunction): Promise<void>;
    getHostelById(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateHostel(req: Request, res: Response, next: NextFunction): Promise<void>;
    deleteHostel(req: Request, res: Response, next: NextFunction): Promise<void>;
    createBlock(req: Request, res: Response, next: NextFunction): Promise<void>;
    getBlocks(req: Request, res: Response, next: NextFunction): Promise<void>;
    createFloor(req: Request, res: Response, next: NextFunction): Promise<void>;
    getFloors(req: Request, res: Response, next: NextFunction): Promise<void>;
    createRoom(req: Request, res: Response, next: NextFunction): Promise<void>;
    getRooms(req: Request, res: Response, next: NextFunction): Promise<void>;
    getAvailableRooms(req: AuthRequest, res: Response, next: NextFunction): Promise<void>;
    getRoomById(req: Request, res: Response, next: NextFunction): Promise<void>;
    updateRoom(req: Request, res: Response, next: NextFunction): Promise<void>;
    getDashboardStats(_req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const hostelController: HostelController;
//# sourceMappingURL=hostel.controller.d.ts.map