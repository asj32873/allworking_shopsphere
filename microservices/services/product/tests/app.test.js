const request = require("supertest");

const mockRequestId = jest.fn((req, res, next) => next());

const mockNotFound = jest.fn((req, res, next) => {
  res.status(404).json({
    success: false,
    message: "Not found",
  });
});

const mockErrorHandler = jest.fn((err, req, res, next) => {
  res.status(500).json({
    success: false,
    message: err.message,
  });
});

jest.mock("@shopsphere/common", () => ({
  requestId: mockRequestId,
  notFound: mockNotFound,
  errorHandler: mockErrorHandler,
}));

jest.mock("../src/routes", () => {
  const express = require("express");
  const router = express.Router();

  router.get("/test-route", (req, res) => {
    res.json({
      success: true,
      message: "test route",
    });
  });

  return router;
});

describe("Product app", () => {
  let app;

  beforeAll(() => {
    app = require("../src/app");
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /health", () => {
    test("should return product service health information", async () => {
      const response = await request(app).get("/health");

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.service).toBe("shopsphere-product");
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe("Middleware", () => {
    test("should execute requestId middleware", async () => {
      await request(app).get("/health");

      expect(mockRequestId).toHaveBeenCalled();
    });
  });

  describe("Routes", () => {
    test("should mount product routes", async () => {
      const response = await request(app).get("/test-route");

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: "test route",
      });
    });
  });

  describe("404 handling", () => {
    test("should use notFound middleware for unknown routes", async () => {
      const response = await request(app).get("/does-not-exist");

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Not found");
      expect(mockNotFound).toHaveBeenCalled();
    });
  });
});