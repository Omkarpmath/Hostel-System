import { Response } from "express";
interface ApiResponseOptions<T> {
    res: Response;
    statusCode?: number;
    message?: string;
    data?: T;
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
    };
}
export declare class ApiResponse {
    static success<T>({ res, statusCode, message, data, meta, }: ApiResponseOptions<T>): Response<any, Record<string, any>>;
    static created<T>({ res, message, data, }: Omit<ApiResponseOptions<T>, "statusCode">): Response<any, Record<string, any>>;
    static error(res: Response, statusCode?: number, message?: string, errors?: unknown): Response<any, Record<string, any>>;
}
export {};
//# sourceMappingURL=ApiResponse.d.ts.map