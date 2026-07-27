import type { ErrorRequestHandler, RequestHandler } from "express";
import { AppError } from "../lib/errors.js";

// What: Express terminal middleware function.
// Does: Converts unmatched URLs into the standard route-not-found application error.
// If removed: Unknown routes fall through without the documented JSON error envelope.
export const notFoundHandler: RequestHandler = (_request, _response, next) => {
  next(new AppError(404, "ROUTE_NOT_FOUND", "Route was not found"));
};

// What: Express global error-handler function.
// Does: Maps operational, duplicate-index, and unexpected failures to safe JSON responses.
// If removed: Errors can leak implementation details or return inconsistent status codes and bodies.
export const errorHandler: ErrorRequestHandler = (error, _request, response, next) => {
  void next;
  const structural = error as { statusCode?: number; code?: unknown; codeName?: string; message?: string; errors?: Array<{ field: string; message: string }>; name?: string; keyPattern?: Record<string, unknown> };
  if (
    structural.name === "MongoServerError" &&
    (structural.code === 20 || structural.codeName === "IllegalOperation")
  ) {
    return response.status(503).json({
      status: "error",
      code: "DATABASE_TRANSACTIONS_UNAVAILABLE",
      message: "The database is not configured for transactional operations",
      requestId: response.locals.requestId,
    });
  }
  if (structural.name === "MongoServerError" && structural.code === 11000) {
    return response.status(409).json({
      status: "error",
      code: "DUPLICATE_RESOURCE",
      message: "A resource already uses a unique value from this request",
      requestId: response.locals.requestId,
    });
  }
  const known = error instanceof AppError || (typeof structural.statusCode === "number" && typeof structural.code === "string");
  const statusCode = known ? error.statusCode : 500;
  response.status(statusCode).json({
    status: "error",
    code: known ? String(structural.code) : "INTERNAL_ERROR",
    message: known ? error.message : "An unexpected error occurred",
    requestId: response.locals.requestId,
    ...(known && structural.errors ? { errors: structural.errors } : {}),
  });
};
