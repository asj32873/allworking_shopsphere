const AppError = require("../../src/utils/AppError");

describe("AppError", () => {
  test("creates default AppError", () => {
    const error = new AppError("Something failed");

    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("AppError");
    expect(error.message).toBe("Something failed");
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe("INTERNAL_SERVER_ERROR");
    expect(error.isOperational).toBe(true);
  });

  test("supports custom status and options", () => {
    const error = new AppError("Validation failed", 422, {
      code: "VALIDATION_ERROR",
      details: { field: "name" },
      isOperational: false,
    });

    expect(error.statusCode).toBe(422);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.details).toEqual({
      field: "name",
    });
    expect(error.isOperational).toBe(false);
  });

  test("badRequest creates 400 error", () => {
    const error = AppError.badRequest("Invalid data", {
      field: "name",
    });

    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("BAD_REQUEST");
    expect(error.details).toEqual({
      field: "name",
    });
  });

  test("unauthorized creates 401 error", () => {
    const error = AppError.unauthorized();

    expect(error.statusCode).toBe(401);
    expect(error.code).toBe("UNAUTHORIZED");
  });

  test("forbidden creates 403 error", () => {
    const error = AppError.forbidden();

    expect(error.statusCode).toBe(403);
    expect(error.code).toBe("FORBIDDEN");
  });

  test("notFound creates 404 error", () => {
    const error = AppError.notFound();

    expect(error.statusCode).toBe(404);
    expect(error.code).toBe("NOT_FOUND");
  });

  test("conflict creates 409 error", () => {
    const error = AppError.conflict("Already exists", {
      id: "123",
    });

    expect(error.statusCode).toBe(409);
    expect(error.code).toBe("CONFLICT");
    expect(error.details).toEqual({
      id: "123",
    });
  });

  test("serviceUnavailable creates 503 error", () => {
    const error = AppError.serviceUnavailable();

    expect(error.statusCode).toBe(503);
    expect(error.code).toBe("SERVICE_UNAVAILABLE");
  });

  test("custom message works for static helpers", () => {
    expect(AppError.unauthorized("No token").message).toBe("No token");
    expect(AppError.forbidden("Forbidden resource").message).toBe(
      "Forbidden resource"
    );
    expect(AppError.notFound("Missing product").message).toBe(
      "Missing product"
    );
    expect(AppError.serviceUnavailable("RAG unavailable").message).toBe(
      "RAG unavailable"
    );
  });
});