const { getEnv } = require("../../src/config/env");

describe("order env", () => {
  afterEach(() => {
    delete process.env.TEST_ENV_VALUE;
  });

  test("returns environment variable", () => {
    process.env.TEST_ENV_VALUE = "hello";

    expect(
      getEnv("TEST_ENV_VALUE"),
    ).toBe("hello");
  });

  test("returns fallback when variable is undefined", () => {
    expect(
      getEnv("TEST_ENV_VALUE", "default-value"),
    ).toBe("default-value");
  });

  test("returns undefined when variable and fallback are missing", () => {
    expect(
      getEnv("TEST_ENV_VALUE"),
    ).toBeUndefined();
  });

  test("supports empty string environment variable", () => {
    process.env.TEST_ENV_VALUE = "";

    expect(
      getEnv("TEST_ENV_VALUE", "fallback"),
    ).toBe("");
  });
});