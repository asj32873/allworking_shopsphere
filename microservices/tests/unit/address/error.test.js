const {
  notFound,
  errorHandler,
} = require("../../../services/address/src/middleware/error");

describe("Address error middleware", () => {
  function createResponse() {
    return {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  }

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("notFound", () => {
    test("returns 404 with the requested method and URL", () => {
      const req = {
        method: "GET",
        originalUrl: "/api/addresses/unknown",
      };

      const res = createResponse();

      notFound(req, res);

      expect(res.status).toHaveBeenCalledWith(404);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Route not found: GET /api/addresses/unknown",
      });
    });
  });

  describe("errorHandler", () => {
    test("handles Mongoose validation errors with 400", () => {
      const error = {
        name: "ValidationError",
        errors: {
          addressLine: {
            message: "Address line is required",
          },
          city: {
            message: "City is required",
          },
        },
      };

      const req = {};
      const res = createResponse();
      const next = jest.fn();

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Validation error.",
        details: [
          "Address line is required",
          "City is required",
        ],
      });

      expect(next).not.toHaveBeenCalled();
    });

    test("handles duplicate key errors with 409", () => {
      const error = {
        code: 11000,
        keyValue: {
          addressLine: "123 Main Street",
        },
      };

      const req = {};
      const res = createResponse();
      const next = jest.fn();

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "A record with a unique field already exists.",
        details: {
          addressLine: "123 Main Street",
        },
      });

      expect(next).not.toHaveBeenCalled();
    });

    test("handles invalid resource IDs with 400", () => {
      const error = {
        name: "CastError",
      };

      const req = {};
      const res = createResponse();
      const next = jest.fn();

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Invalid resource ID.",
      });

      expect(next).not.toHaveBeenCalled();
    });

    test("handles errors with a custom status and message", () => {
      const error = {
        status: 403,
        message: "Access denied.",
      };

      const req = {};
      const res = createResponse();
      const next = jest.fn();

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Access denied.",
      });

      expect(next).not.toHaveBeenCalled();
    });

    test("handles unknown errors with 500", () => {
      const error = {
        name: "UnexpectedError",
        message: "Something went wrong internally.",
      };

      const req = {};
      const res = createResponse();
      const next = jest.fn();

      errorHandler(error, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);

      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Internal server error.",
      });

      expect(next).not.toHaveBeenCalled();
    });
  });
});