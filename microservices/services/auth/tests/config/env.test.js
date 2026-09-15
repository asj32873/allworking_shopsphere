const { getEnv } = require("../../src/config/env");

describe("getEnv", () => {
  const originalValue = process.env.TEST_ENV_VALUE;

  afterEach(() => {
    if (originalValue === undefined) {
      delete process.env.TEST_ENV_VALUE;
    } else {
      process.env.TEST_ENV_VALUE = originalValue;
    }
  });

  test("returns environment variable when present", () => {
    process.env.TEST_ENV_VALUE = "hello";

    expect(getEnv("TEST_ENV_VALUE")).toBe("hello");
  });

  test("returns fallback when variable is missing", () => {
    delete process.env.TEST_ENV_VALUE;

    expect(getEnv("TEST_ENV_VALUE", "fallback")).toBe("fallback");
  });

  test("returns undefined when variable and fallback are missing", () => {
    delete process.env.TEST_ENV_VALUE;

    expect(getEnv("TEST_ENV_VALUE")).toBeUndefined();
  });
});
