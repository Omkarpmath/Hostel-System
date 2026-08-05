export class ApiResponse {
    static success({ res, statusCode = 200, message = "Success", data, meta, }) {
        const response = {
            success: true,
            message,
            data,
        };
        if (meta) {
            response.meta = meta;
        }
        return res.status(statusCode).json(response);
    }
    static created({ res, message = "Created successfully", data, }) {
        return res.status(201).json({
            success: true,
            message,
            data,
        });
    }
    static error(res, statusCode = 500, message = "Internal server error", errors) {
        const response = {
            success: false,
            message,
        };
        if (errors) {
            response.errors = errors;
        }
        return res.status(statusCode).json(response);
    }
}
//# sourceMappingURL=ApiResponse.js.map