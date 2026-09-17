const { ok, fail } = require("../../src/utils/apiResponse");

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe("apiResponse", () => {
  describe("ok", () => {
    test("returns a successful response with defaults", () => {
      const res = createResponse();

      ok(res, { id: "123" });

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "OK",
        data: { id: "123" },
      });
    });

    test("uses custom message and status", () => {
      const res = createResponse();

      ok(res, { id: "123" }, "Created", 201);

      expect(res.status).toHaveBeenCalledWith(201);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Created",
        data: { id: "123" },
      });
    });
  });

  describe("fail", () => {
    test("returns an error response with default status", () => {
      const res = createResponse();

      fail(res, "Something went wrong");

      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Something went wrong",
      });
    });

    test("uses custom status", () => {
      const res = createResponse();

      fail(res, "Not found", 404);

      expect(res.status).toHaveBeenCalledWith(404);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Not found",
      });
    });

    test("includes details when supplied", () => {
      const res = createResponse();

      fail(res, "Validation failed", 422, {
        field: "email",
      });

      expect(res.status).toHaveBeenCalledWith(422);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Validation failed",
        details: {
          field: "email",
        },
      });
    });

    test("does not include details when omitted", () => {
      const res = createResponse();

      fail(res, "Unauthorized", 401);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Unauthorized",
      });
    });
  });
});
