const AppError = require("../../src/utils/AppError");

describe("AppError", () => {
  describe("constructor", () => {
    test("creates internal server error by default", () => {
      const error = new AppError("Something went wrong");

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);

      expect(error.name).toBe("AppError");
      expect(error.message).toBe("Something went wrong");

      expect(error.statusCode).toBe(500);

      expect(error.code).toBe("INTERNAL_SERVER_ERROR");

      expect(error.isOperational).toBe(true);
      expect(error.stack).toBeDefined();
    });

    test("uses BAD_REQUEST below 500", () => {
      const error = new AppError("Invalid input", 400);

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe("BAD_REQUEST");
    });

    test("uses custom error code", () => {
      const error = new AppError("Validation failed", 422, {
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
  });

  describe("factory methods", () => {
    test("badRequest creates 400 error", () => {
      const error = AppError.badRequest("Invalid request");

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe("BAD_REQUEST");
      expect(error.message).toBe("Invalid request");
    });

    test("unauthorized creates 401 error", () => {
      const error = AppError.unauthorized();

      expect(error.statusCode).toBe(401);
      expect(error.code).toBe("UNAUTHORIZED");
      expect(error.message).toBe("Unauthorized");
    });

    test("forbidden creates 403 error", () => {
      const error = AppError.forbidden();

      expect(error.statusCode).toBe(403);
      expect(error.code).toBe("FORBIDDEN");
      expect(error.message).toBe("Forbidden");
    });

    test("notFound creates 404 error", () => {
      const error = AppError.notFound();

      expect(error.statusCode).toBe(404);
      expect(error.code).toBe("NOT_FOUND");
      expect(error.message).toBe("Resource not found");
    });

    test("conflict creates 409 error", () => {
      const error = AppError.conflict("Already exists");

      expect(error.statusCode).toBe(409);
      expect(error.code).toBe("CONFLICT");
      expect(error.message).toBe("Already exists");
    });

    test("serviceUnavailable creates 503 error", () => {
      const error = AppError.serviceUnavailable();

      expect(error.statusCode).toBe(503);
      expect(error.code).toBe("SERVICE_UNAVAILABLE");
    });
  });
});
