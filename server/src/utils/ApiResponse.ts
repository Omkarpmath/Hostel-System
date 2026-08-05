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

export class ApiResponse {
  static success<T>({
    res,
    statusCode = 200,
    message = "Success",
    data,
    meta,
  }: ApiResponseOptions<T>) {
    const response: Record<string, unknown> = {
      success: true,
      message,
      data,
    };
    if (meta) {
      response.meta = meta;
    }
    return res.status(statusCode).json(response);
  }

  static created<T>({
    res,
    message = "Created successfully",
    data,
  }: Omit<ApiResponseOptions<T>, "statusCode">) {
    return res.status(201).json({
      success: true,
      message,
      data,
    });
  }

  static error(
    res: Response,
    statusCode = 500,
    message = "Internal server error",
    errors?: unknown
  ) {
    const response: Record<string, unknown> = {
      success: false,
      message,
    };
    if (errors) {
      response.errors = errors;
    }
    return res.status(statusCode).json(response);
  }
}
