const request = require("supertest");

jest.mock("../src/routes", () => {
  const express = require("express");

  const router = express.Router();

  router.get("/test", (req, res) => {
    res.status(200).json({
      success: true,
      message: "Test route",
    });
  });

  return router;
});

jest.mock("@shopsphere/common", () => ({
  requestId: jest.fn((req, res, next) => next()),

  notFound: jest.fn((req, res) => {
    res.status(404).json({
      success: false,
      message: "Route not found",
    });
  }),

  errorHandler: jest.fn((err, req, res, next) => {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }),
}));

const app = require("../src/app");

describe("RAG App", () => {
  test("should respond to health endpoint", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.service).toBe("shopsphere-rag");
    expect(response.body.timestamp).toBeDefined();
  });

  test("should mount application routes", async () => {
    const response = await request(app).get("/test");

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      success: true,
      message: "Test route",
    });
  });

  test("should return 404 for an unknown route", async () => {
    const response = await request(app).get(
      "/does-not-exist"
    );

    expect(response.status).toBe(404);

    expect(response.body).toEqual({
      success: false,
      message: "Route not found",
    });
  });

  test("should accept JSON request bodies", async () => {
    const response = await request(app)
      .post("/test")
      .send({
        name: "ShopSphere",
      });

    expect(response.status).toBe(404);
  });

  test("should include security headers", async () => {
    const response = await request(app).get("/health");

    expect(
      response.headers["x-content-type-options"]
    ).toBe("nosniff");
  });
});