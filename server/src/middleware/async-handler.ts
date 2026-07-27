import type { RequestHandler } from "express";

// What: Higher-order Express middleware function.
// Does: Converts rejected route-handler promises into calls to the global error pipeline.
// If removed: Asynchronous route failures may bypass standardized error handling.
export const asyncHandler = (handler: RequestHandler): RequestHandler =>
  // What: Express request-handler function.
  // Does: Executes one supplied handler and forwards any promise rejection to Express.
  // If removed: The higher-order wrapper would return no usable middleware.
  (request, response, next) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
