import compression from "compression";
import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { isDatabaseReady } from "./config/database.js";
import type { Environment } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { requestContext } from "./middleware/request-context.js";
import { createKanbanRouter } from "./routes/kanban.js";
import { createAuthRouter } from "./routes/auth.js";

// What: Express application factory function.
// Does: Composes security, parsing, observability, operational, and API middleware into one app.
// If removed: Tests and the HTTP server have no configured application to execute.
export function createApp(environment: Environment) {
  const app = express();
  // What: Array-mapping callback function.
  // Does: Trims each configured CORS origin before building the allowlist.
  // If removed: Whitespace in configuration can cause valid origins to be rejected.
  const origins = new Set(environment.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()));

  app.disable("x-powered-by");
  app.use(requestContext);
  app.use(pinoHttp({ level: environment.LOG_LEVEL, quietReqLogger: true }));
  app.use(helmet());
  // What: CORS origin-policy callback function.
  // Does: Allows non-browser requests and browser origins explicitly present in configuration.
  // If removed: Cross-origin access becomes either broken or dangerously unrestricted.
  app.use(cors({ origin: (origin, callback) => callback(null, !origin || origins.has(origin)), credentials: true }));
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: "100kb" }));
  app.use(rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: "draft-8", legacyHeaders: false }));

  // What: Express health-check route-handler function.
  // Does: Confirms that the HTTP process is alive without depending on MongoDB.
  // If removed: Process supervisors lose the lightweight liveness probe.
  app.get("/health", (_request, response) => {
    response.json({ status: "success", data: { service: "kanban-api", state: "healthy" } });
  });
  // What: Express readiness route-handler function.
  // Does: Reports whether the API has an active MongoDB connection and can serve data traffic.
  // If removed: Deployments may send traffic to a process that cannot access persistence.
  app.get("/ready", (_request, response) => {
    const ready = isDatabaseReady();
    response.status(ready ? 200 : 503).json({
      status: ready ? "success" : "error",
      ...(ready
        ? { data: { state: "ready" } }
        : { code: "NOT_READY", message: "Database is not ready", requestId: response.locals.requestId }),
    });
  });

  app.use("/api/v1/auth", createAuthRouter(environment));
  app.use("/api/v1", createKanbanRouter(environment));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
