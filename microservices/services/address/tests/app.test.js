const request = require("supertest");

jest.mock("../src/models/Address", () => ({
  find: jest.fn(),
  exists: jest.fn(),
  create: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findOneAndDelete: jest.fn(),
  findOne: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  updateMany: jest.fn(),
}));

jest.mock("../src/middleware/auth", () => ({
  authenticate: jest.fn((req, res, next) => {
    req.user = {
      _id: "user-123",
      role: "USER",
    };

    next();
  }),

  authorize: jest.fn(() => (req, res, next) => {
    next();
  }),
}));

jest.mock("@shopsphere/common", () => ({
  requestId: jest.fn((req, res, next) => {
    req.requestId = "test-request-id";
    next();
  }),

  notFound: jest.fn((req, res) => {
    res.status(404).json({
      success: false,
      message: "Route not found.",
    });
  }),

  errorHandler: jest.fn((err, req, res, next) => {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || "Internal server error.",
    });
  }),

  internal: jest.fn(() => (req, res, next) => {
    next();
  }),

  ok: jest.fn((res, data, message, status = 200) => {
    return res.status(status).json({
      success: true,
      data,
      message,
    });
  }),

  fail: jest.fn((res, message, status = 400) => {
    return res.status(status).json({
      success: false,
      message,
    });
  }),
}));

const app = require("../src/app");

describe("address app", () => {
  test("GET /health returns service health", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);
    expect(response.body.service).toBe("shopsphere-address");
    expect(response.body.timestamp).toBeDefined();
  });

  test("returns 404 for unknown route", async () => {
    const response = await request(app).get("/this-route-does-not-exist");

    expect(response.status).toBe(404);

    expect(response.body.success).toBe(false);
  });
});
