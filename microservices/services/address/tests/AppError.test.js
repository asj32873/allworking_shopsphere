// tests/AppError.test.js

const AppError = require("../src/utils/AppError");

describe("AppError", () => {
  describe("constructor", () => {
    test("creates an internal server error by default", () => {
      const error = new AppError("Something went wrong");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe("AppError");
      expect(error.message).toBe("Something went wrong");
      expect(error.statusCode).toBe(500);
      expect(error.code).toBe("INTERNAL_SERVER_ERROR");
      expect(error.details).toBeUndefined();
      expect(error.isOperational).toBe(true);
      expect(error.stack).toBeDefined();
    });

    test("uses BAD_REQUEST for status below 500", () => {
      const error = new AppError("Invalid input", 400);

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe("BAD_REQUEST");
      expect(error.isOperational).toBe(true);
    });

    test("uses custom error code", () => {
      const error = new AppError("Custom error", 422, {
        code: "VALIDATION_ERROR",
      });

      expect(error.statusCode).toBe(422);
      expect(error.code).toBe("VALIDATION_ERROR");
    });

    test("stores details", () => {
      const details = {
        field: "email",
        reason: "Invalid",
      };

      const error = new AppError("Validation failed", 400, {
        details,
      });

      expect(error.details).toEqual(details);
    });

    test("can be marked non-operational", () => {
      const error = new AppError("Fatal error", 500, {
        isOperational: false,
      });

      expect(error.isOperational).toBe(false);
    });

    test("keeps isOperational true when explicitly true", () => {
      const error = new AppError("Expected error", 400, {
        isOperational: true,
      });

      expect(error.isOperational).toBe(true);
    });
  });

  describe("badRequest", () => {
    test("creates 400 BAD_REQUEST error", () => {
      const details = {
        field: "name",
      };

      const error = AppError.badRequest("Invalid request", details);

      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe("Invalid request");
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe("BAD_REQUEST");
      expect(error.details).toEqual(details);
    });
  });

  describe("unauthorized", () => {
    test("uses default message", () => {
      const error = AppError.unauthorized();

      expect(error.statusCode).toBe(401);
      expect(error.code).toBe("UNAUTHORIZED");
      expect(error.message).toBe("Unauthorized");
    });

    test("uses custom message", () => {
      const error = AppError.unauthorized("Login required");

      expect(error.statusCode).toBe(401);
      expect(error.code).toBe("UNAUTHORIZED");
      expect(error.message).toBe("Login required");
    });
  });

  describe("forbidden", () => {
    test("uses default message", () => {
      const error = AppError.forbidden();

      expect(error.statusCode).toBe(403);
      expect(error.code).toBe("FORBIDDEN");
      expect(error.message).toBe("Forbidden");
    });

    test("uses custom message", () => {
      const error = AppError.forbidden("Access denied");

      expect(error.statusCode).toBe(403);
      expect(error.code).toBe("FORBIDDEN");
      expect(error.message).toBe("Access denied");
    });
  });

  describe("notFound", () => {
    test("uses default message", () => {
      const error = AppError.notFound();

      expect(error.statusCode).toBe(404);
      expect(error.code).toBe("NOT_FOUND");
      expect(error.message).toBe("Resource not found");
    });

    test("uses custom message", () => {
      const error = AppError.notFound("Address not found");

      expect(error.statusCode).toBe(404);
      expect(error.code).toBe("NOT_FOUND");
      expect(error.message).toBe("Address not found");
    });
  });

  describe("conflict", () => {
    test("creates 409 CONFLICT error with details", () => {
      const details = {
        field: "address",
        reason: "Already exists",
      };

      const error = AppError.conflict("Address already exists", details);

      expect(error.statusCode).toBe(409);
      expect(error.code).toBe("CONFLICT");
      expect(error.message).toBe("Address already exists");
      expect(error.details).toEqual(details);
    });
  });

  describe("serviceUnavailable", () => {
    test("uses default message", () => {
      const error = AppError.serviceUnavailable();

      expect(error.statusCode).toBe(503);
      expect(error.code).toBe("SERVICE_UNAVAILABLE");
      expect(error.message).toBe("Service temporarily unavailable");
    });

    test("uses custom message", () => {
      const error = AppError.serviceUnavailable("Auth service unavailable");

      expect(error.statusCode).toBe(503);
      expect(error.code).toBe("SERVICE_UNAVAILABLE");
      expect(error.message).toBe("Auth service unavailable");
    });
  });
});
