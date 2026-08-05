import { ZodError } from "zod";
import { ApiResponse } from "../utils/ApiResponse.js";
export function validate(schema) {
    return (req, res, next) => {
        try {
            schema.parse({
                body: req.body,
                query: req.query,
                params: req.params,
            });
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