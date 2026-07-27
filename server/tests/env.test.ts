import { describe, expect, it } from "vitest";
import { loadEnvironment } from "../src/config/env.js";

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
});
