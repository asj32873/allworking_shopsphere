const request = require("supertest");

jest.mock("../src/middleware/auth", () => ({
  authenticate: jest.fn((req, res, next) => {
    req.user = {
      id: "user-123",
      role: "USER",
    };

    next();
  }),

  authorize: jest.fn(() => {
    return (req, res, next) => next();
  }),
}));

jest.mock("../src/controllers/order.controller", () => ({
  createOrder: jest.fn(),
  listMyOrders: jest.fn(),
  getById: jest.fn(),
  tracking: jest.fn(),
  vendorList: jest.fn(),
  vendorUpdateStatus: jest.fn(),
  adminList: jest.fn(),
  adminUpdateStatus: jest.fn(),
  internalCreatePaid: jest.fn(),
  internalReviewEligibility: jest.fn(),
  internalVendorOrders: jest.fn(),
  internalVendorItems: jest.fn(),
}));

jest.mock("@shopsphere/common", () => ({
  requestId: jest.fn((req, res, next) => {
    req.requestId = "test-request-id";
    next();
  }),

  validate: jest.fn(() => {
    return (req, res, next) => next();
  }),

  internal: jest.fn((req, res, next) => {
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
}));

const app = require("../src/app");

describe("order app", () => {
  test("GET /health returns order service health", async () => {
    const response = await request(app)
      .get("/health");

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.service).toBe(
      "shopsphere-order",
    );

    expect(response.body.timestamp).toBeDefined();
  });

  test("returns 404 for unknown route", async () => {
    const response = await request(app)
      .get("/this-route-does-not-exist");

    expect(response.status).toBe(404);

    expect(response.body.success).toBe(false);
  });
});