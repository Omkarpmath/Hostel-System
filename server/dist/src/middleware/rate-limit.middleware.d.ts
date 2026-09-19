import { Request, Response, NextFunction } from "express";
interface RateLimitOptions {
    windowMs: number;
    max: number;
    message?: string;
}
/**
 * High-performance, in-memory rate limiter middleware.
 * Tracks requests per authenticated user ID (or client IP for unauthenticated routes).
 */
export declare function createRateLimiter(options: RateLimitOptions): (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const bookingActionRateLimiter: (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const browseRoomsRateLimiter: (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const authRateLimiter: (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const qrScanRateLimiter: (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export declare const apiGlobalRateLimiter: (req: Request, res: Response, next: NextFunction) => void | Response<any, Record<string, any>>;
export {};
//# sourceMappingURL=rate-limit.middleware.d.ts.map