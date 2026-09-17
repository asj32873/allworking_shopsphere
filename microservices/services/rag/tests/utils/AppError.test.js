const AppError = require("../../src/utils/AppError");

describe("AppError", () => {
  test("creates an error with the provided message", () => {
    const error = new AppError("Something went wrong.");

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Something went wrong.");
  });

  test("uses the provided status code", () => {
    const error = new AppError("Not found", 404);

    expect(error.statusCode).toBe(404);
  });

  test("uses default status code when one is not provided", () => {
    const error = new AppError("Something went wrong.");

    expect(error.statusCode).toBeDefined();
  });

  test("sets the error name", () => {
    const error = new AppError("Test error");

    expect(error.name).toBeDefined();
  });

  test("supports custom error properties", () => {
    const error = new AppError("Forbidden", 403);

    expect(error.message).toBe("Forbidden");
    expect(error.statusCode).toBe(403);
  });
});