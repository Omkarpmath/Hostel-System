import { ZodError } from "zod";
import { ApiResponse } from "../utils/ApiResponse.js";
export function validate(schema) {
    return (req, res, next) => {
        try {
            const parsed = schema.parse({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            // Zod coercions (notably date strings) are part of the contract.  Use the
            // parsed result instead of leaving the raw request values for Prisma.
            if (parsed && typeof parsed === "object") {
                const value = parsed;
                if (value.body !== undefined)
                    req.body = value.body;
                if (value.query !== undefined)
                    req.query = value.query;
                if (value.params !== undefined)
                    req.params = value.params;
            }
            next();
        }
        catch (error) {
            if (error instanceof ZodError) {
                const formattedErrors = error.errors.map((err) => ({
                    field: err.path.join("."),
                    message: err.message,
                }));
                ApiResponse.error(res, 400, "Validation failed", formattedErrors);
            }
            else {
                next(error);
            }
        }
    };
}
//# sourceMappingURL=validate.middleware.js.map