describe("Environment Configuration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("should return environment variable value", () => {
    process.env.TEST_VALUE = "shopsphere";

    const { getEnv } = require("../../src/config/env");

    expect(getEnv("TEST_VALUE")).toBe("shopsphere");
  });

  test("should return fallback when environment variable is undefined", () => {
    delete process.env.TEST_VALUE;

    const { getEnv } = require("../../src/config/env");

    expect(getEnv("TEST_VALUE", "default-value")).toBe(
      "default-value"
    );
  });

  test("should return undefined when variable and fallback are not provided", () => {
    delete process.env.TEST_VALUE;

    const { getEnv } = require("../../src/config/env");

    expect(getEnv("TEST_VALUE")).toBeUndefined();
  });

  test("should return empty string when environment variable is explicitly empty", () => {
    process.env.TEST_VALUE = "";

    const { getEnv } = require("../../src/config/env");

    expect(getEnv("TEST_VALUE", "fallback")).toBe("");
  });
});