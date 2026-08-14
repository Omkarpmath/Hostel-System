import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";
import { ApiResponse } from "../utils/ApiResponse.js";

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      // Zod coercions (notably date strings) are part of the contract.  Use the
      // parsed result instead of leaving the raw request values for Prisma.
      if (parsed && typeof parsed === "object") {
        const value = parsed as { body?: unknown; query?: unknown; params?: unknown };
        if (value.body !== undefined) req.body = value.body;
        if (value.query !== undefined) req.query = value.query as Request["query"];
        if (value.params !== undefined) req.params = value.params as Request["params"];
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));
        ApiResponse.error(res, 400, "Validation failed", formattedErrors);
      } else {
        next(error);
      }
    }
  };
}
