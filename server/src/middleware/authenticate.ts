import type { RequestHandler } from "express";
import type { Environment } from "../config/env.js";
import { ForbiddenError, UnauthorizedError } from "../lib/errors.js";
import { AuthService } from "../services/auth-service.js";

// What: Authentication middleware factory function.
// Does: Builds bearer-token verification middleware from validated security configuration.
// If removed: Protected routes cannot establish authenticated request identities.
export function createAuthenticate(environment: Environment): RequestHandler {
  const authService = new AuthService(environment);
  // What: Asynchronous Express authentication middleware function.
  // Does: Validates a Bearer access token and attaches its trusted identity to the request.
  // If removed: Requests can reach protected handlers without verified identity claims.
  return async (request, _response, next) => {
    try {
      const authorization = request.header("authorization");
      if (!authorization?.startsWith("Bearer ")) {
        throw new UnauthorizedError();
      }
      request.auth = await authService.verifyAccessToken(authorization.slice(7));
      next();
    } catch (error) {
      next(error);
    }
  };
}

// What: Global-role middleware factory function.
// Does: Builds a policy guard that accepts only configured application-wide roles.
// If removed: Admin-only routes cannot enforce global RBAC consistently.
export function requireGlobalRole(...roles: Array<"admin" | "user">): RequestHandler {
  // What: Express global-authorization middleware function.
  // Does: Compares the authenticated role with the route's accepted role set.
  // If removed: Authenticated users can bypass global role restrictions.
  return (request, _response, next) => {
    if (!request.auth) return next(new UnauthorizedError());
    if (!roles.includes(request.auth.role)) return next(new ForbiddenError());
    next();
  };
}
