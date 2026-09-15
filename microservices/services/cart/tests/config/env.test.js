describe("getEnv", () => {
  let getEnv;

  beforeEach(() => {
    jest.resetModules();

    process.env.TEST_ENV_VALUE = "hello";

    ({ getEnv } = require("../../src/config/env"));
  });

  afterEach(() => {
    delete process.env.TEST_ENV_VALUE;
    delete process.env.TEST_MISSING_VALUE;
  });

  test("returns environment variable when it exists", () => {
    expect(getEnv("TEST_ENV_VALUE")).toBe("hello");
  });

  test("returns undefined when variable does not exist and no fallback is provided", () => {
    delete process.env.TEST_MISSING_VALUE;

    expect(getEnv("TEST_MISSING_VALUE")).toBeUndefined();
  });

  test("returns fallback when environment variable does not exist", () => {
    delete process.env.TEST_MISSING_VALUE;

    expect(getEnv("TEST_MISSING_VALUE", "default-value")).toBe("default-value");
  });

  test("prefers environment variable over fallback", () => {
    process.env.TEST_ENV_VALUE = "actual-value";

    expect(getEnv("TEST_ENV_VALUE", "fallback-value")).toBe("actual-value");
  });

  test("supports an empty string environment variable", () => {
    process.env.TEST_ENV_VALUE = "";

    expect(getEnv("TEST_ENV_VALUE", "fallback-value")).toBe("");
  });
});
