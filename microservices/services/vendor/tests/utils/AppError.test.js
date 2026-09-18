const AppError = require("../../src/utils/AppError");

describe("AppError", () => {
  test("constructs defaults for a server error", () => {
    const err = new AppError("boom");
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe("AppError");
    expect(err.message).toBe("boom");
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe("INTERNAL_SERVER_ERROR");
    expect(err.details).toBeUndefined();
    expect(err.isOperational).toBe(true);
    expect(err.stack).toEqual(expect.any(String));
  });

  test("uses BAD_REQUEST code for non-5xx errors when no code is supplied", () => {
    const err = new AppError("bad", 400);
    expect(err.code).toBe("BAD_REQUEST");
  });

  test("honors custom code, details and isOperational", () => {
    const err = new AppError("bad", 422, {
      code: "CUSTOM",
      details: { field: "x" },
      isOperational: false,
    });
    expect(err.code).toBe("CUSTOM");
    expect(err.details).toEqual({ field: "x" });
    expect(err.isOperational).toBe(false);
  });

  test("static factories create expected errors", () => {
    expect(AppError.badRequest("x", { a: 1 })).toMatchObject({
      message: "x", statusCode: 400, code: "BAD_REQUEST", details: { a: 1 }
    });
    expect(AppError.unauthorized()).toMatchObject({
      message: "Unauthorized", statusCode: 401, code: "UNAUTHORIZED"
    });
    expect(AppError.forbidden()).toMatchObject({
      message: "Forbidden", statusCode: 403, code: "FORBIDDEN"
    });
    expect(AppError.notFound()).toMatchObject({
      message: "Resource not found", statusCode: 404, code: "NOT_FOUND"
    });
    expect(AppError.conflict("duplicate", { key: "email" })).toMatchObject({
      message: "duplicate", statusCode: 409, code: "CONFLICT", details: { key: "email" }
    });
    expect(AppError.serviceUnavailable()).toMatchObject({
      message: "Service temporarily unavailable", statusCode: 503, code: "SERVICE_UNAVAILABLE"
    });
  });

  test("static factories accept custom messages", () => {
    expect(AppError.unauthorized("no")).toMatchObject({ message: "no" });
    expect(AppError.forbidden("no")).toMatchObject({ message: "no" });
    expect(AppError.notFound("missing")).toMatchObject({ message: "missing" });
    expect(AppError.serviceUnavailable("down")).toMatchObject({ message: "down" });
  });
});

