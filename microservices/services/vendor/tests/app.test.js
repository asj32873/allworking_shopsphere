jest.mock("@shopsphere/common", () => ({
  requestId: jest.fn((req, res, next) => next()),
  notFound: jest.fn((req, res) => res.status(404).json({ success: false })),
  errorHandler: jest.fn((err, req, res, next) => res.status(500).json({ success: false })),
}));
jest.mock("../src/routes", () => {
  const express = require("express");
  return express.Router();
});
const app = require("../src/app");

describe("vendor app", () => {
  test("exports an Express app with health endpoint", async () => {
    const res = await require("supertest")(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.service).toBe("shopsphere-vendor");
    expect(res.body.timestamp).toEqual(expect.any(String));
  });

  test("handles unknown routes through the common notFound middleware", async () => {
    const res = await require("supertest")(app).get("/does-not-exist");
    expect(res.status).toBe(404);
  });
});

