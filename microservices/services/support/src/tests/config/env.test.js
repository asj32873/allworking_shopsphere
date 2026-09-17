describe("env config", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  test("returns an existing environment variable", () => {
    process.env.SUPPORT_TEST_ENV = "hello";
    const { getEnv } = require("../../config/env");
    expect(getEnv("SUPPORT_TEST_ENV")).toBe("hello");
    delete process.env.SUPPORT_TEST_ENV;
  });

  test("returns fallback when variable is undefined", () => {
    delete process.env.SUPPORT_MISSING_ENV;
    const { getEnv } = require("../../config/env");
    expect(getEnv("SUPPORT_MISSING_ENV", "fallback")).toBe("fallback");
  });

  test("returns undefined when variable and fallback are absent", () => {
    delete process.env.SUPPORT_MISSING_ENV;
    const { getEnv } = require("../../config/env");
    expect(getEnv("SUPPORT_MISSING_ENV")).toBeUndefined();
  });

  test("returns null unchanged because nullish coalescing only falls back for null", () => {
    process.env.SUPPORT_NULLISH = "";
    const { getEnv } = require("../../config/env");
    expect(getEnv("SUPPORT_NULLISH", "fallback")).toBe("");
    delete process.env.SUPPORT_NULLISH;
  });
});
