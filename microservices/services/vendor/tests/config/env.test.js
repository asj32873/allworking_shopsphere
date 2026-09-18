jest.mock("dotenv", () => ({ config: jest.fn() }));
const dotenv = require("dotenv");
const { getEnv } = require("../../src/config/env");

describe("env config", () => {
  test("loads dotenv from the repository .env path", () => {
    expect(dotenv.config).toHaveBeenCalledWith(expect.objectContaining({ path: expect.stringContaining(".env") }));
  });
  test("returns environment value", () => {
    process.env.TEST_VENDOR_VALUE = "hello";
    expect(getEnv("TEST_VENDOR_VALUE")).toBe("hello");
  });
  test("returns fallback for an unset variable", () => {
    delete process.env.TEST_VENDOR_MISSING;
    expect(getEnv("TEST_VENDOR_MISSING", "fallback")).toBe("fallback");
  });
  test("returns undefined when unset and no fallback is given", () => {
    delete process.env.TEST_VENDOR_MISSING;
    expect(getEnv("TEST_VENDOR_MISSING")).toBeUndefined();
  });
});

