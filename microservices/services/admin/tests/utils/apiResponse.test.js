const { ok, fail } = require("../../src/utils/apiResponse");

describe("apiResponse", () => {
  function createResponse() {
    return {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  }

  describe("ok", () => {
    test("returns 200 with default message", () => {
      const res = createResponse();

      const result = ok(res, {
        id: 1,
      });

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "OK",
        data: {
          id: 1,
        },
      });

      expect(result).toBe(res);
    });

    test("uses custom message and status", () => {
      const res = createResponse();

      ok(res, { id: 1 }, "Created successfully", 201);

      expect(res.status).toHaveBeenCalledWith(201);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Created successfully",
        data: {
          id: 1,
        },
      });
    });
  });

  describe("fail", () => {
    test("defaults status to 400", () => {
      const res = createResponse();

      fail(res, "Bad request");

      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Bad request",
      });
    });

    test("uses provided status", () => {
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
        field: "status",
        reason: "Invalid value",
      };

      fail(res, "Validation failed", 400, details);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Validation failed",
        details,
      });
    });

    test("does not include details when undefined", () => {
      const res = createResponse();

      fail(res, "Validation failed", 400, undefined);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Validation failed",
      });
    });
  });
});
