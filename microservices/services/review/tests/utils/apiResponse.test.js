const { ok, fail } = require("../../src/utils/apiResponse");

describe("API Response Utils", () => {
  let res;

  beforeEach(() => {
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe("ok", () => {
    test("returns successful response with default values", () => {
      const data = {
        id: "123",
        name: "Test",
      };

      ok(res, data);

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "OK",
        data,
      });
    });

    test("returns successful response with custom message", () => {
      const data = {
        id: "123",
      };

      ok(res, data, "User fetched successfully.");

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "User fetched successfully.",
        data,
      });
    });

    test("returns successful response with custom status", () => {
      const data = {
        id: "123",
      };

      ok(
        res,
        data,
        "Created successfully.",
        201
      );

      expect(res.status).toHaveBeenCalledWith(201);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Created successfully.",
        data,
      });
    });

    test("supports null data", () => {
      ok(res, null);

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "OK",
        data: null,
      });
    });

    test("supports array data", () => {
      const data = [
        { id: "1" },
        { id: "2" },
      ];

      ok(res, data);

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "OK",
        data,
      });
    });
  });

  describe("fail", () => {
    test("returns failed response with default status", () => {
      fail(res, "Something went wrong.");

      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Something went wrong.",
      });
    });

    test("returns failed response with custom status", () => {
      fail(
        res,
        "Authentication required.",
        401
      );

      expect(res.status).toHaveBeenCalledWith(401);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Authentication required.",
      });
    });

    test("includes details when details are provided", () => {
      const details = {
        field: "rating",
        reason: "Rating must be between 1 and 5.",
      };

      fail(
        res,
        "Validation failed.",
        400,
        details
      );

      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Validation failed.",
        details,
      });
    });

    test("does not include details when details are undefined", () => {
      fail(
        res,
        "Not found.",
        404,
        undefined
      );

      expect(res.status).toHaveBeenCalledWith(404);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Not found.",
      });
    });

    test("supports null details without adding details property", () => {
      fail(
        res,
        "Bad request.",
        400,
        null
      );

      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Bad request.",
      });
    });
  });
});