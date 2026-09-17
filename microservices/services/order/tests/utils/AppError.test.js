const AppError = require("../../src/utils/AppError");

describe("AppError", () => {
  test("creates error with status code", () => {
    const error = new AppError(
      "Something failed",
      500,
    );

    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Something failed");
    expect(error.statusCode).toBe(500);
  });

  test("badRequest creates 400 error", () => {
    const error = AppError.badRequest(
      "Invalid request",
    );

    expect(error.message).toBe("Invalid request");
    expect(error.statusCode).toBe(400);
  });

  test("unauthorized creates 401 error", () => {
    const error = AppError.unauthorized(
      "Authentication required",
    );

    expect(error.statusCode).toBe(401);
  });

  test("forbidden creates 403 error", () => {
    const error = AppError.forbidden(
      "Forbidden",
    );

    expect(error.statusCode).toBe(403);
  });

  test("notFound creates 404 error", () => {
    const error = AppError.notFound(
      "Order not found",
    );

    expect(error.statusCode).toBe(404);
  });

  test("conflict creates 409 error", () => {
    const error = AppError.conflict(
      "Conflict",
    );

    expect(error.statusCode).toBe(409);
  });

  test("serviceUnavailable creates 503 error", () => {
    const error = AppError.serviceUnavailable(
      "Service unavailable",
    );

    expect(error.statusCode).toBe(503);
  });
});