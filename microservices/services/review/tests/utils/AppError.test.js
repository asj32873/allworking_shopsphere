const AppError = require("../../src/utils/AppError");

describe("AppError", () => {
  test("creates an error with the provided message", () => {
    const error = new AppError("Something went wrong.");

    expect(error.message).toBe("Something went wrong.");
  });

  test("is an instance of Error", () => {
    const error = new AppError("Test error");

    expect(error).toBeInstanceOf(Error);
  });

  test("uses default status code 500", () => {
    const error = new AppError("Test error");

    expect(error.statusCode).toBe(500);
  });

  test("uses the provided status code", () => {
    const error = new AppError("Not found", 404);

    expect(error.statusCode).toBe(404);
  });

  test("sets the name to AppError", () => {
    const error = new AppError("Test error");

    expect(error.name).toBe("AppError");
  });

  test("sets default code for server errors", () => {
    const error = new AppError("Server error", 500);

    expect(error.code).toBe("INTERNAL_SERVER_ERROR");
  });

  test("sets default code for client errors", () => {
    const error = new AppError("Bad request", 400);

    expect(error.code).toBe("BAD_REQUEST");
  });

  test("uses a custom error code", () => {
    const error = new AppError("Not found", 404, {
      code: "NOT_FOUND",
    });

    expect(error.code).toBe("NOT_FOUND");
  });

  test("stores details when passed through options", () => {
    const details = {
      field: "rating",
      reason: "Invalid rating",
    };

    const error = new AppError("Validation failed", 400, {
      details,
    });

    expect(error.details).toEqual(details);
  });

  test("details are undefined when not provided", () => {
    const error = new AppError("Test error", 400);

    expect(error.details).toBeUndefined();
  });

  test("is operational by default", () => {
    const error = new AppError("Test error");

    expect(error.isOperational).toBe(true);
  });

  test("can mark error as non-operational", () => {
    const error = new AppError("Critical error", 500, {
      isOperational: false,
    });

    expect(error.isOperational).toBe(false);
  });

  describe("static badRequest", () => {
    test("creates a 400 Bad Request error", () => {
      const error = AppError.badRequest("Invalid input");

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe("BAD_REQUEST");
      expect(error.message).toBe("Invalid input");
    });

    test("stores details", () => {
      const details = {
        field: "email",
      };

      const error = AppError.badRequest("Validation failed", details);

      expect(error.details).toEqual(details);
    });
  });

  describe("static unauthorized", () => {
    test("creates a 401 error", () => {
      const error = AppError.unauthorized();

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe("UNAUTHORIZED");
      expect(error.message).toBe("Unauthorized");
    });

    test("supports a custom message", () => {
      const error = AppError.unauthorized("Authentication required.");

      expect(error.message).toBe("Authentication required.");
      expect(error.statusCode).toBe(401);
      expect(error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("static forbidden", () => {
    test("creates a 403 error", () => {
      const error = AppError.forbidden();

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(403);
      expect(error.code).toBe("FORBIDDEN");
      expect(error.message).toBe("Forbidden");
    });
  });

  describe("static notFound", () => {
    test("creates a 404 error", () => {
      const error = AppError.notFound();

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe("NOT_FOUND");
      expect(error.message).toBe("Resource not found");
    });

    test("supports a custom message", () => {
      const error = AppError.notFound("Review not found");

      expect(error.message).toBe("Review not found");
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe("NOT_FOUND");
    });
  });

  describe("static conflict", () => {
    test("creates a 409 error", () => {
      const details = {
        productId: "123",
      };

      const error = AppError.conflict(
        "Review already exists",
        details
      );

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(409);
      expect(error.code).toBe("CONFLICT");
      expect(error.message).toBe("Review already exists");
      expect(error.details).toEqual(details);
    });
  });

  describe("static serviceUnavailable", () => {
    test("creates a 503 error", () => {
      const error = AppError.serviceUnavailable();

      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(503);
      expect(error.code).toBe("SERVICE_UNAVAILABLE");
      expect(error.message).toBe(
        "Service temporarily unavailable"
      );
    });

    test("supports a custom message", () => {
      const error = AppError.serviceUnavailable(
        "Review service is unavailable"
      );

      expect(error.message).toBe(
        "Review service is unavailable"
      );
      expect(error.statusCode).toBe(503);
      expect(error.code).toBe("SERVICE_UNAVAILABLE");
    });
  });
});