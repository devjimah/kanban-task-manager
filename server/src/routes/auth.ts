import { Router, type Response } from "express";
import rateLimit from "express-rate-limit";
import type { Environment } from "../config/env.js";
import { loginSchema, registerSchema } from "../../../shared/contracts/auth.js";
import { UnauthorizedError } from "../lib/errors.js";
import { createAuthenticate } from "../middleware/authenticate.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { validateBody } from "../middleware/validate.js";
import { UserModel } from "../models/user.js";
import { AuthService, type AuthTokens } from "../services/auth-service.js";

const REFRESH_COOKIE = "kanban_refresh";

// What: Refresh-cookie response helper function.
// Does: Stores a refresh JWT in a scoped HTTP-only cookie with environment-aware transport security.
// If removed: Browsers cannot retain refresh credentials without exposing them to JavaScript.
function setRefreshCookie(response: Response, tokens: AuthTokens, environment: Environment) {
  response.cookie(REFRESH_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    secure: environment.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/v1/auth",
    expires: tokens.refreshExpiresAt,
  });
}

// What: Refresh-cookie clearing helper function.
// Does: Removes the browser refresh credential using the same security scope used at issuance.
// If removed: Logout can revoke the server session but leave a stale cookie in the browser.
function clearRefreshCookie(response: Response, environment: Environment) {
  response.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: environment.NODE_ENV === "production",
    sameSite: "strict",
    path: "/api/v1/auth",
  });
}

// What: Authentication-router factory function.
// Does: Creates registration, login, refresh, logout, and current-user routes for one environment.
// If removed: The API exposes no HTTP entry points for secure session lifecycle operations.
export function createAuthRouter(environment: Environment) {
  const router = Router();
  const service = new AuthService(environment);
  const authenticate = createAuthenticate(environment);
  const authLimiter = rateLimit({
    windowMs: 15 * 60_000,
    limit: 10,
    skipSuccessfulRequests: true,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  });

  // What: Asynchronous registration route-handler function.
  // Does: Creates a user, starts a refresh session, and returns public identity plus access token.
  // If removed: `POST /auth/register` no longer supports account creation.
  router.post("/register", authLimiter, validateBody(registerSchema), asyncHandler(async (request, response) => {
    const result = await service.register(request.body);
    setRefreshCookie(response, result.tokens, environment);
    response.status(201).json({ status: "success", data: { user: result.user, accessToken: result.tokens.accessToken } });
  }));

  // What: Asynchronous login route-handler function.
  // Does: Verifies credentials, starts a refresh session, and returns identity plus access token.
  // If removed: `POST /auth/login` no longer authenticates existing users.
  router.post("/login", authLimiter, validateBody(loginSchema), asyncHandler(async (request, response) => {
    const result = await service.login(request.body);
    setRefreshCookie(response, result.tokens, environment);
    response.json({ status: "success", data: { user: result.user, accessToken: result.tokens.accessToken } });
  }));

  // What: Asynchronous token-refresh route-handler function.
  // Does: Rotates the HTTP-only refresh credential and returns a new short-lived access token.
  // If removed: Users must log in again whenever an access token expires.
  router.post("/refresh", asyncHandler(async (request, response) => {
    const token = request.cookies?.[REFRESH_COOKIE] as string | undefined;
    if (!token) throw new UnauthorizedError("Refresh token is required");
    const result = await service.refresh(token);
    setRefreshCookie(response, result.tokens, environment);
    response.json({ status: "success", data: { user: result.user, accessToken: result.tokens.accessToken } });
  }));

  // What: Asynchronous logout route-handler function.
  // Does: Revokes the current refresh session, clears its cookie, and returns HTTP 204.
  // If removed: `POST /auth/logout` cannot explicitly terminate the current session.
  router.post("/logout", asyncHandler(async (request, response) => {
    await service.logout(request.cookies?.[REFRESH_COOKIE] as string | undefined);
    clearRefreshCookie(response, environment);
    response.status(204).send();
  }));

  // What: Asynchronous current-user route-handler function.
  // Does: Returns the latest public user record for the authenticated access token subject.
  // If removed: Clients cannot restore or verify the current authenticated profile.
  router.get("/me", authenticate, asyncHandler(async (request, response) => {
    const user = await UserModel.findById(request.auth?.userId);
    if (!user) throw new UnauthorizedError();
    response.json({ status: "success", data: {
      user: { id: user.id, name: user.name, email: user.email, role: user.role, themePreference: user.themePreference },
    } });
  }));

  return router;
}
