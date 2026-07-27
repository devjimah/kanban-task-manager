import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";

// What: Express request middleware function.
// Does: Accepts or generates a bounded request ID and returns it on every response.
// If removed: Logs and error responses cannot be correlated across a request lifecycle.
export const requestContext: RequestHandler = (request, response, next) => {
  const requestId = request.header("x-request-id")?.slice(0, 100) || randomUUID();
  response.locals.requestId = requestId;
  response.setHeader("x-request-id", requestId);
  next();
};
