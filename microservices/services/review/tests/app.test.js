const request = require("supertest");

jest.mock("../src/routes", () => {
  const express = require("express");
  return express.Router();
});

jest.mock("@shopsphere/common", () => ({
  requestId: (req, res, next) => next(),
  notFound: (req, res) =>
    res.status(404).json({
      success: false,
      message: "Not found",
    }),
  errorHandler: (err, req, res, next) =>
    res.status(500).json({
      success: false,
      message: err.message,
    }),
}));

const app = require("../src/app");

describe("Review Service App", () => {
  describe("GET /health", () => {
    it("should return service health information", async () => {
      const response = await request(app).get("/health");

      expect(response.statusCode).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.service).toBe("shopsphere-review");
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe("404 handling", () => {
    it("should return 404 for an unknown route", async () => {
      const response = await request(app).get("/unknown-route");

      expect(response.statusCode).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe("Not found");
    });
  });
});

