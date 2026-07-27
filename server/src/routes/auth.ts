import { Router } from "express";
import rateLimit from "express-rate-limit";
import type { Environment } from "../config/env.js";
import { loginSchema, registerSchema } from "../../../shared/contracts/auth.js";
import { createAuthenticate } from "../middleware/authenticate.js";
import { asyncHandler } from "../middleware/async-handler.js";
import { validateBody } from "../middleware/validate.js";
import { AuthController } from "../controllers/auth-controller.js";

// What: Authentication-router factory function.
// Does: Maps registration, login, refresh, logout, and current-user routes onto controller actions.
// If removed: The API exposes no HTTP entry points for secure session lifecycle operations.
export function createAuthRouter(environment: Environment) {
  const router = Router();
  const auth = new AuthController(environment);
  const authenticate = createAuthenticate(environment);
  // Brute-force protection on credential endpoints; successful calls are not counted.
  const authLimiter = rateLimit({
    windowMs: 15 * 60_000,
    limit: 10,
    skipSuccessfulRequests: true,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  });

  router.post("/register", authLimiter, validateBody(registerSchema), asyncHandler(auth.register));
  router.post("/login", authLimiter, validateBody(loginSchema), asyncHandler(auth.login));
  router.post("/refresh", asyncHandler(auth.refresh));
  router.post("/logout", asyncHandler(auth.logout));
  router.get("/me", authenticate, asyncHandler(auth.me));

  return router;
}
