const { ok, fail } = require("../../src/utils/apiResponse");

function createResponse() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe("apiResponse", () => {
  describe("ok", () => {
    test("returns successful response with defaults", () => {
      const res = createResponse();

      const result = ok(res, { id: 1 });

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "OK",
        data: { id: 1 },
      });

      expect(result).toBe(res);
    });

    test("supports custom message and status", () => {
      const res = createResponse();

      ok(res, { id: 1 }, "Created", 201);

      expect(res.status).toHaveBeenCalledWith(201);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Created",
        data: { id: 1 },
      });
    });
  });

  describe("fail", () => {
    test("returns failed response with defaults", () => {
      const res = createResponse();

      fail(res, "Bad request");

      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Bad request",
      });
    });

    test("supports custom status", () => {
      const res = createResponse();

      fail(res, "Not found", 404);

      expect(res.status).toHaveBeenCalledWith(404);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Not found",
      });
    });

    test("includes details when provided", () => {
      const res = createResponse();

      const details = {
        field: "name",
        reason: "required",
      };

      fail(res, "Validation failed", 422, details);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Validation failed",
        details,
      });
    });
  });
});