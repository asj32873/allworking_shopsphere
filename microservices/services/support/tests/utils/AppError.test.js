const AppError = require("../../src/utils/AppError");

describe("AppError", () => {
  test("constructs a server error with defaults", () => {
    const err = new AppError("boom");
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("AppError");
    expect(err.message).toBe("boom");
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe("INTERNAL_SERVER_ERROR");
    expect(err.isOperational).toBe(true);
    expect(err.details).toBeUndefined();
    expect(err.stack).toBeDefined();
  });

  test("uses BAD_REQUEST for non-5xx status by default", () => {
    const err = new AppError("bad", 400);
    expect(err.code).toBe("BAD_REQUEST");
  });

  test("honors custom code, details and operational flag", () => {
    const err = new AppError("x", 422, {
      code: "CUSTOM",
      details: { a: 1 },
      isOperational: false,
    });
    expect(err.code).toBe("CUSTOM");
    expect(err.details).toEqual({ a: 1 });
    expect(err.isOperational).toBe(false);
  });

  test("badRequest creates correct error", () => {
    const err = AppError.badRequest("bad", { field: "x" });
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("BAD_REQUEST");
    expect(err.details).toEqual({ field: "x" });
  });

  test("unauthorized uses defaults", () => {
    const err = AppError.unauthorized();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe("UNAUTHORIZED");
    expect(err.message).toBe("Unauthorized");
  });

  test("forbidden uses custom message", () => {
    const err = AppError.forbidden("no");
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe("FORBIDDEN");
    expect(err.message).toBe("no");
  });

  test("notFound uses default message", () => {
    const err = AppError.notFound();
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
  });

  test("conflict supports details", () => {
    const err = AppError.conflict("duplicate", { key: "email" });
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe("CONFLICT");
    expect(err.details).toEqual({ key: "email" });
  });

  test("serviceUnavailable uses defaults", () => {
    const err = AppError.serviceUnavailable();
    expect(err.statusCode).toBe(503);
    expect(err.code).toBe("SERVICE_UNAVAILABLE");
  });
});

