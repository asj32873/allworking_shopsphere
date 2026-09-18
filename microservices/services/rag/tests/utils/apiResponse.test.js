const { ok, fail } = require("../../src/utils/apiResponse");

describe("apiResponse", () => {
  const createRes = () => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  });

  describe("ok", () => {
    test("returns success response with data", () => {
      const res = createRes();

      ok(res, { id: "123" });

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          id: "123",
        },
        message: "OK",
      });
    });

    test("returns success response with custom message", () => {
      const res = createRes();

      ok(res, { id: "123" }, "Product fetched successfully.");

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          id: "123",
        },
        message: "Product fetched successfully.",
      });
    });

    test("handles null data", () => {
      const res = createRes();

      ok(res, null);

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: null,
        message: "OK",
      });
    });

    test("handles undefined data", () => {
      const res = createRes();

      ok(res);

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: undefined,
        message: "OK",
      });
    });
  });

  describe("fail", () => {
    test("returns failure response with default status", () => {
      const res = createRes();

      fail(res, "Something went wrong.");

      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Something went wrong.",
      });
    });

    test("returns failure response with custom status", () => {
      const res = createRes();

      fail(res, "Unauthorized.", 401);

      expect(res.status).toHaveBeenCalledWith(401);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Unauthorized.",
      });
    });

    test("handles 403 status", () => {
      const res = createRes();

      fail(res, "Forbidden.", 403);

      expect(res.status).toHaveBeenCalledWith(403);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Forbidden.",
      });
    });

    test("handles 404 status", () => {
      const res = createRes();

      fail(res, "Product not found.", 404);

      expect(res.status).toHaveBeenCalledWith(404);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Product not found.",
      });
    });

    test("handles 500 status", () => {
      const res = createRes();

      fail(res, "Internal server error.", 500);

      expect(res.status).toHaveBeenCalledWith(500);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Internal server error.",
      });
    });
  });
});