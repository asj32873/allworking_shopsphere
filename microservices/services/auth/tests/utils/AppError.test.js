const AppError = require("../../src/utils/AppError");

describe("AppError", () => {
  test("creates an internal server error by default", () => {
    const error = new AppError("Something failed");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);

    expect(error.message).toBe("Something failed");
    expect(error.name).toBe("AppError");
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe("INTERNAL_SERVER_ERROR");
    expect(error.isOperational).toBe(true);
    expect(error.details).toBeUndefined();
  });

  test("uses BAD_REQUEST for status codes below 500", () => {
    const error = new AppError("Invalid input", 400);

    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("BAD_REQUEST");
  });

  test("accepts custom code and details", () => {
    const error = new AppError("Validation failed", 422, {
      code: "VALIDATION_ERROR",
      details: {
        field: "email",
      },
    });

    expect(error.statusCode).toBe(422);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.details).toEqual({
      field: "email",
    });
  });

  test("can mark an error as non-operational", () => {
    const error = new AppError("Fatal error", 500, {
      isOperational: false,
    });

    expect(error.isOperational).toBe(false);
  });

  describe("badRequest", () => {
    test("creates a 400 error", () => {
      const error = AppError.badRequest("Invalid request", {
        field: "email",
      });

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe("BAD_REQUEST");
      expect(error.message).toBe("Invalid request");
      expect(error.details).toEqual({
        field: "email",
      });
    });
  });

  describe("unauthorized", () => {
    test("creates a 401 error with default message", () => {
      const error = AppError.unauthorized();

      expect(error.statusCode).toBe(401);
      expect(error.code).toBe("UNAUTHORIZED");
      expect(error.message).toBe("Unauthorized");
    });

    test("accepts a custom message", () => {
      const error = AppError.unauthorized("Invalid token");

      expect(error.message).toBe("Invalid token");
    });
  });

  describe("forbidden", () => {
    test("creates a 403 error", () => {
      const error = AppError.forbidden("Access denied");

      expect(error.statusCode).toBe(403);
      expect(error.code).toBe("FORBIDDEN");
      expect(error.message).toBe("Access denied");
    });
  });

  describe("notFound", () => {
    test("creates a 404 error with default message", () => {
      const error = AppError.notFound();

      expect(error.statusCode).toBe(404);
      expect(error.code).toBe("NOT_FOUND");
      expect(error.message).toBe("Resource not found");
    });

    test("accepts a custom message", () => {
      const error = AppError.notFound("User not found");

      expect(error.message).toBe("User not found");
    });
  });

  describe("conflict", () => {
    test("creates a 409 error", () => {
      const error = AppError.conflict("Email already exists", {
        email: "test@example.com",
      });

      expect(error.statusCode).toBe(409);
      expect(error.code).toBe("CONFLICT");
      expect(error.message).toBe("Email already exists");
      expect(error.details).toEqual({
        email: "test@example.com",
      });
    });
  });

  describe("serviceUnavailable", () => {
    test("creates a 503 error with default message", () => {
      const error = AppError.serviceUnavailable();

      expect(error.statusCode).toBe(503);
      expect(error.code).toBe("SERVICE_UNAVAILABLE");
      expect(error.message).toBe("Service temporarily unavailable");
    });

    test("accepts a custom message", () => {
      const error = AppError.serviceUnavailable("Vendor service is down");

      expect(error.message).toBe("Vendor service is down");
    });
  });
});
