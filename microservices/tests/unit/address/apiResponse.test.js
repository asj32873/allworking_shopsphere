const {
  ok,
  fail,
} = require("../../../services/address/src/utils/apiResponse");

describe("Address apiResponse utilities", () => {
  function createResponse() {
    return {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("ok", () => {
    test("returns a successful response with default status and message", () => {
      const res = createResponse();

      ok(res, {
        id: "address-123",
        city: "Bengaluru",
      });

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "OK",
        data: {
          id: "address-123",
          city: "Bengaluru",
        },
      });
    });

    test("returns a successful response with a custom message and status", () => {
      const res = createResponse();

      ok(
        res,
        {
          id: "address-123",
        },
        "Address created.",
        201,
      );

      expect(res.status).toHaveBeenCalledWith(201);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Address created.",
        data: {
          id: "address-123",
        },
      });
    });

    test("supports null data", () => {
      const res = createResponse();

      ok(res, null, "Address deleted.");

      expect(res.status).toHaveBeenCalledWith(200);

      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: "Address deleted.",
        data: null,
      });
    });
  });

  describe("fail", () => {
    test("returns an error response without details", () => {
      const res = createResponse();

      fail(res, "Address not found.", 404);

      expect(res.status).toHaveBeenCalledWith(404);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Address not found.",
      });
    });

    test("returns an error response with details", () => {
      const res = createResponse();

      fail(
        res,
        "Invalid request.",
        400,
        [
          {
            path: ["pincode"],
            message: "Invalid pincode",
          },
        ],
      );

      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid request.",
        details: [
          {
            path: ["pincode"],
            message: "Invalid pincode",
          },
        ],
      });
    });

    test("uses status 400 by default", () => {
      const res = createResponse();

      fail(res, "Something went wrong.");

      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Something went wrong.",
      });
    });
  });
});