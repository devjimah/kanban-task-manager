import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";
import { loadEnvironment, type Environment } from "../src/config/env.js";

const cookieEnvironment = (crossSite: boolean): Environment => ({
  NODE_ENV: "production",
  PORT: 5000,
  MONGODB_URI: "unused",
  ALLOWED_ORIGINS: "https://client.example.com",
  CROSS_SITE_COOKIES: crossSite,
  LOG_LEVEL: "silent",
  JWT_ACCESS_SECRET: "test-access-secret-that-is-at-least-32-characters",
  JWT_REFRESH_SECRET: "test-refresh-secret-that-is-at-least-32-characters",
  ACCESS_TOKEN_TTL_MINUTES: 15,
  REFRESH_TOKEN_TTL_DAYS: 7,
  BCRYPT_ROUNDS: 10,
});

// What: Vitest environment-suite callback function.
// Does: Groups configuration parsing tests under one descriptive scope.
// If removed: Environment behavior loses its organized automated test suite.
describe("environment", () => {
  // What: Vitest test-case callback function.
  // Does: Verifies safe defaults are applied when optional environment values are absent.
  // If removed: Regressions in default configuration can pass unnoticed.
  it("applies safe development defaults", () => {
    const environment = loadEnvironment({});
    expect(environment.PORT).toBe(5000);
    expect(environment.ALLOWED_ORIGINS).toBe("http://localhost:5173");
  });

  // What: Vitest test-case callback function.
  // Does: Verifies out-of-range ports are rejected during configuration parsing.
  // If removed: Invalid-port validation can regress without detection.
  it("rejects an invalid port", () => {
    // What: Exception-assertion callback function.
    // Does: Defers invalid environment parsing so Vitest can assert that it throws.
    // If removed: The test executes too early and cannot use the `toThrow` assertion correctly.
    expect(() => loadEnvironment({ PORT: "70000" })).toThrow();
  });

  // What: Vitest test-case callback function.
  // Does: Verifies cross-site cookie support defaults to off for local development.
  // If removed: A default flip to SameSite=None could weaken local cookie scope unnoticed.
  it("keeps cross-site cookies disabled by default", () => {
    expect(loadEnvironment({}).CROSS_SITE_COOKIES).toBe(false);
  });

  // What: Vitest test-case callback function.
  // Does: Verifies the flag parses from its string environment representation.
  // If removed: A broken boolean coercion would silently disable cross-site sessions.
  it("enables cross-site cookies for https origins", () => {
    const environment = loadEnvironment({
      CROSS_SITE_COOKIES: "true",
      ALLOWED_ORIGINS: "https://client.example.com",
    });
    expect(environment.CROSS_SITE_COOKIES).toBe(true);
  });

  // What: Vitest test-case callback function.
  // Does: Verifies startup refuses SameSite=None cookies over insecure origins.
  // If removed: A misconfigured deployment would emit cookies browsers silently drop.
  it("rejects cross-site cookies with an insecure origin", () => {
    expect(() =>
      loadEnvironment({ CROSS_SITE_COOKIES: "true", ALLOWED_ORIGINS: "http://localhost:5173" }),
    ).toThrow(/HTTPS/);
  });

  // What: Vitest test-case callback function.
  // Does: Verifies a cross-site deployment boots before its client origin is known.
  // If removed: The localhost default could again turn an unset origin into a
  //             startup crash, which is how the first Render deploy failed.
  it("starts cross-site with no origins configured yet", () => {
    const environment = loadEnvironment({
      CROSS_SITE_COOKIES: "true",
      JWT_ACCESS_SECRET: "a".repeat(40),
      JWT_REFRESH_SECRET: "b".repeat(40),
    });
    // The insecure localhost default must not leak into a cross-site deployment.
    expect(environment.ALLOWED_ORIGINS).toBe("");
  });

  // What: Vitest test-case callback function.
  // Does: Verifies an explicitly blank origin list is also accepted.
  // If removed: Setting the variable to an empty string could crash startup.
  it("starts cross-site with a blank origin list", () => {
    expect(() =>
      loadEnvironment({ CROSS_SITE_COOKIES: "true", ALLOWED_ORIGINS: "" }),
    ).not.toThrow();
  });
});

// What: Vitest refresh-cookie-suite callback function.
// Does: Asserts the emitted cookie attributes for same-site and cross-site hosting.
// If removed: A cross-site deployment could ship cookies browsers silently discard.
describe("refresh cookie policy", () => {
  // What: Vitest test-case callback function.
  // Does: Verifies cross-site hosting emits SameSite=None with Secure.
  // If removed: Split client/API deployments would lose session refresh undetected.
  it("uses SameSite=None and Secure when cross-site", async () => {
    const response = await request(createApp(cookieEnvironment(true))).post("/api/v1/auth/logout");
    const header = String(response.headers["set-cookie"] ?? "");
    expect(header).toMatch(/SameSite=None/i);
    expect(header).toMatch(/Secure/i);
  });

  // What: Vitest test-case callback function.
  // Does: Verifies same-site hosting keeps the stricter SameSite=Strict policy.
  // If removed: A weaker default could ship for single-origin deployments.
  it("keeps SameSite=Strict when same-site", async () => {
    const response = await request(createApp(cookieEnvironment(false))).post("/api/v1/auth/logout");
    expect(String(response.headers["set-cookie"] ?? "")).toMatch(/SameSite=Strict/i);
  });
});
