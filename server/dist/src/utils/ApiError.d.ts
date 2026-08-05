export declare class ApiError extends Error {
    statusCode: number;
    isOperational: boolean;
    constructor(statusCode: number, message: string, isOperational?: boolean);
    static badRequest(message?: string): ApiError;
    static unauthorized(message?: string): ApiError;
    static forbidden(message?: string): ApiError;
    static notFound(message?: string): ApiError;
    static conflict(message?: string): ApiError;
    static internal(message?: string): ApiError;
}
//# sourceMappingURL=ApiError.d.ts.map