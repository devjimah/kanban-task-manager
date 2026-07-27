import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { AppError } from "../lib/errors.js";

// What: Express middleware factory function.
// Does: Builds request-body validation middleware from a supplied Zod schema.
// If removed: Routes cannot share strict boundary validation behavior.
export function validateBody(schema: ZodType): RequestHandler {
  // What: Express request-validation function.
  // Does: Replaces the request body with parsed data or forwards structured field errors.
  // If removed: Malformed and unknown request fields could reach service and database code.
  return (request, _response, next) => {
    const result = schema.safeParse(request.body);
    if (!result.success) {
      return next(
        new AppError(
          400,
          "VALIDATION_ERROR",
          "Request validation failed",
          // What: Zod-issue mapping function.
          // Does: Converts library-specific issues into the public field-error contract.
          // If removed: Validation responses lose actionable field names and messages.
          result.error.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        ),
      );
    }
    request.body = result.data;
    next();
  };
}
