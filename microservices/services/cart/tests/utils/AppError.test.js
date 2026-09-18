const AppError = require("../../src/utils/AppError");

describe("AppError", () => {
  test("creates a default internal server error", () => {
    const error = new AppError("Something went wrong");

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error.name).toBe("AppError");
    expect(error.message).toBe("Something went wrong");
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe("INTERNAL_SERVER_ERROR");
    expect(error.isOperational).toBe(true);
  });

  test("supports badRequest", () => {
    const details = { field: "quantity" };
    const error = AppError.badRequest("Invalid quantity", details);

    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("BAD_REQUEST");
    expect(error.details).toEqual(details);
  });

  test("supports unauthorized", () => {
    const error = AppError.unauthorized("Login required");

    expect(error.statusCode).toBe(401);
    expect(error.code).toBe("UNAUTHORIZED");
    expect(error.message).toBe("Login required");
  });

  test("supports forbidden", () => {
    const error = AppError.forbidden("Access denied");

    expect(error.statusCode).toBe(403);
    expect(error.code).toBe("FORBIDDEN");
    expect(error.message).toBe("Access denied");
  });

  test("supports notFound", () => {
    const error = AppError.notFound("Cart item not found");

    expect(error.statusCode).toBe(404);
    expect(error.code).toBe("NOT_FOUND");
    expect(error.message).toBe("Cart item not found");
  });

  test("supports conflict", () => {
    const details = { productId: "product-1" };
    const error = AppError.conflict("Stock conflict", details);

    expect(error.statusCode).toBe(409);
    expect(error.code).toBe("CONFLICT");
    expect(error.details).toEqual(details);
  });

  test("supports serviceUnavailable", () => {
    const error = AppError.serviceUnavailable("Product service unavailable");

    expect(error.statusCode).toBe(503);
    expect(error.code).toBe("SERVICE_UNAVAILABLE");
    expect(error.message).toBe("Product service unavailable");
  });
});
